from fastapi import APIRouter, HTTPException, Query
from app.services.amazon_service  import search_amazon
from app.services.serpapi_service import search_google_shopping
from app.services.gemini_service  import get_ai_advice, get_product_details
from app.db import get_connection
from app.models.schemas import SearchResponse, HistoryResponse
import asyncio
from datetime import datetime

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def upsert_product(conn, query: str) -> int:
    cur = conn.cursor()
    cur.execute("SELECT id FROM products WHERE query = %s", (query.lower(),))
    row = cur.fetchone()
    if row:
        product_id = row["id"]
    else:
        cur.execute(
            "INSERT INTO products (name, query) VALUES (%s, %s) RETURNING id",
            (query, query.lower()),
        )
        product_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    return product_id


def save_price_history(conn, product_id: int, results: list):
    cur = conn.cursor()
    for r in results:
        if not r.get("price"):
            continue
        cur.execute(
            """
            INSERT INTO price_history
                (product_id, platform, price, original_price, discount_pct,
                 url, title, image_url, rating, in_stock)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                product_id,
                r.get("platform"),
                r.get("price"),
                r.get("original_price"),
                r.get("discount_pct"),
                r.get("url"),
                r.get("title"),
                r.get("image_url"),
                r.get("rating"),
                r.get("in_stock", True),
            ),
        )
    conn.commit()
    cur.close()


def pick_best_deal(results: list) -> dict | None:
    priced = [r for r in results if r.get("price") and r.get("url")]
    return min(priced, key=lambda r: r["price"]) if priced else None


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/search", response_model=SearchResponse)
async def search_products(q: str = Query(..., min_length=1)):
    # Fetch from Amazon and Google Shopping (multi-retailer) in parallel
    amazon_res, serp_res = await asyncio.gather(
        search_amazon(q),
        search_google_shopping(q),
        return_exceptions=True,
    )

    all_results: list[dict] = []
    for chunk in [amazon_res, serp_res]:
        if isinstance(chunk, list):
            all_results.extend(chunk)

    if not all_results:
        raise HTTPException(status_code=404, detail="No products found")

    # Persist to DB
    conn = get_connection()
    try:
        product_id = upsert_product(conn, q)
        save_price_history(conn, product_id, all_results)
    finally:
        conn.close()

    best_deal = pick_best_deal(all_results)

    try:
        ai_raw = await get_ai_advice(q, all_results)
    except Exception:
        ai_raw = {}

    fake_warnings = ai_raw.get("fake_discount_warnings") or []

    return SearchResponse(
        query=q,
        product_id=product_id,
        results=all_results,
        best_deal=best_deal,
        ai_advice=ai_raw.get("buy_advice"),
        fake_discount_warnings=fake_warnings,
        price_trend=ai_raw.get("price_trend"),
        best_time_to_buy=ai_raw.get("best_time_to_buy"),
        tip=ai_raw.get("tip"),
        better_alternative=ai_raw.get("better_alternative"),
        user_reviews_summary=ai_raw.get("user_reviews_summary"),
    )


@router.get("/details")
async def product_details(
    q: str = Query(...),
    title: str = Query(default=""),
):
    try:
        details = await get_product_details(q, title)
        return details
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{product_id}", response_model=HistoryResponse)
def price_history(product_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT name, query FROM products WHERE id = %s", (product_id,))
        product = cur.fetchone()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")

        cur.execute(
            """
            SELECT platform, price, fetched_at
            FROM price_history
            WHERE product_id = %s
            ORDER BY fetched_at ASC
            """,
            (product_id,),
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    history = [
        {"platform": r["platform"], "price": float(r["price"]) if r["price"] else None,
         "fetched_at": r["fetched_at"]}
        for r in rows
    ]

    return HistoryResponse(
        product_id=product_id,
        query=product["query"],
        history=history,
    )


@router.get("/recent")
def recent_searches(limit: int = Query(default=10, le=50)):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            SELECT
                p.id,
                p.name,
                p.query,
                p.created_at,
                (
                    SELECT json_agg(latest)
                    FROM (
                        SELECT DISTINCT ON (ph2.platform)
                            ph2.platform,
                            ph2.price,
                            ph2.image_url,
                            ph2.title,
                            ph2.url,
                            ph2.discount_pct,
                            ph2.fetched_at
                        FROM price_history ph2
                        WHERE ph2.product_id = p.id AND ph2.price IS NOT NULL
                        ORDER BY ph2.platform, ph2.fetched_at DESC
                    ) latest
                ) AS platforms
            FROM products p
            ORDER BY p.created_at DESC
            LIMIT %s
            """,
            (limit,),
        )
        rows = cur.fetchall()
        cur.close()
    finally:
        conn.close()

    results = []
    for r in rows:
        platforms = r["platforms"] or []
        priced = [p for p in platforms if p.get("price")]
        best = min(priced, key=lambda x: x["price"]) if priced else None
        image_url = next((p["image_url"] for p in platforms if p.get("image_url")), "")

        results.append({
            "product_id":    r["id"],
            "name":          r["name"],
            "query":         r["query"],
            "searched_at":   r["created_at"].isoformat(),
            "best_price":    best["price"] if best else None,
            "best_platform": best["platform"] if best else None,
            "image_url":     image_url,
            "platforms":     [p["platform"] for p in platforms],
        })

    return {"recent": results}
