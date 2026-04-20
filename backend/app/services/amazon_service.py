import httpx
import os
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")

# Words that indicate an accessory — skip these results
ACCESSORY_KEYWORDS = [
    "case", "cover", "charger", "cable", "adapter", "screen protector",
    "tempered glass", "skin", "pouch", "sleeve", "holder", "stand",
    "mount", "strap", "band", "dock", "hub", "earphone", "earbud",
    "headphone", "wire", "plug", "power bank", "battery pack", "folio",
    "wallet case", "bumper", "guard", "film", "wrap", "sticker",
    "cleaning", "dust", "stylus", "pen", "keyboard", "mouse",
    "protector", "armor", "shell", "flip cover", "back cover",
    "back case", "tpu", "silicone case", "leather case", "hard case",
    "spigen", "otterbox", "ringke", "tozo", "anker", "baseus",
    "ugreen", "ambrane", "boat accessory",
]


def safe_float(value, fallback=None):
    try:
        cleaned = str(value or "").replace("₹", "").replace(",", "").strip()
        return float(cleaned) if cleaned else fallback
    except Exception:
        return fallback


def is_accessory(title: str) -> bool:
    """Return True if the title looks like an accessory, not a main product."""
    t = title.lower()
    return any(kw in t for kw in ACCESSORY_KEYWORDS)


def matches_query(title: str, query: str) -> bool:
    if not title:
        return False
    words = query.lower().split()
    product_title = title.lower()
    # All meaningful words (3+ chars) must appear in the title
    meaningful = [w for w in words if len(w) >= 3]
    if not meaningful:
        return False
    return all(w in product_title for w in meaningful)


async def search_amazon(query: str) -> list:
    url = "https://real-time-amazon-data.p.rapidapi.com/search"
    headers = {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "real-time-amazon-data.p.rapidapi.com"
    }
    params = {
        "query": query,
        "page": "1",
        "country": "IN",
        "sort_by": "RELEVANCE",
        "product_condition": "ALL"
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(url, headers=headers, params=params)
            data = response.json()

        products = data.get("data", {}).get("products", [])
        results = []

        for p in products[:20]:  # scan more, filter strictly
            title = p.get("product_title") or ""

            # Skip if title doesn't match query
            if not matches_query(title, query):
                continue

            # Skip accessories
            if is_accessory(title):
                continue

            price          = safe_float(p.get("product_price"))
            original_price = safe_float(p.get("product_original_price"), fallback=price)

            # Skip suspiciously cheap results (likely accessories priced under ₹1000
            # when the query is clearly a phone/laptop)
            if price and price < 1000:
                continue

            discount_pct = None
            if price and original_price and original_price > price:
                discount_pct = round(((original_price - price) / original_price) * 100, 1)

            results.append({
                "platform":       "Amazon",
                "title":          title,
                "price":          price,
                "original_price": original_price,
                "discount_pct":   discount_pct,
                "url":            p.get("product_url") or "",
                "image_url":      p.get("product_photo") or "",
                "rating":         safe_float(p.get("product_star_rating"), fallback=0.0),
                "in_stock":       p.get("product_availability", "") != "Currently unavailable",
            })

            if len(results) >= 5:
                break

        return results

    except Exception as e:
        print(f"Amazon fetch error: {e}")
        return []
