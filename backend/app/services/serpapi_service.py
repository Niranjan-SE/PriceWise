import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SERPAPI_KEY = os.getenv("SERPAPI_KEY")

ACCESSORY_KEYWORDS = [
    "case", "cover", "charger", "cable", "adapter", "screen protector",
    "tempered glass", "skin", "pouch", "sleeve", "holder", "stand",
    "mount", "strap", "band", "dock", "hub", "earphone", "earbud",
    "headphone", "wire", "plug", "power bank", "battery pack", "folio",
    "bumper", "guard", "film", "wrap", "sticker", "cleaning", "stylus",
    "keyboard", "mouse", "protector", "armor", "shell", "flip cover",
    "back cover", "back case", "tpu", "silicone", "spigen", "otterbox",
]

# Titles containing these words are likely secondhand/scam listings
SKIP_TITLE_KEYWORDS = [
    "sell ", "selling", "used", "refurbished", "renewed", "second hand",
    "secondhand", "open box", "pre-owned", "preowned", "exchange",
]

# Sketchy or irrelevant sources to skip
SKIP_SOURCES = {
    "amazon", "amazon.in",  # already handled by amazon_service
    "gameloot", "olx", "quikr", "cashify", "budli",
    "togofogo", "dorabjees", "swappa", "backmarket",
}

# Only trust results from known legitimate Indian retailers
TRUSTED_SOURCES = {
    "croma", "reliance digital", "reliancedigital", "tata cliq", "tatacliq",
    "vijay sales", "vijaysales", "flipkart", "poorvika", "sangeetha",
    "jiomart", "meesho", "snapdeal", "shopclues", "invent",
    "apple", "samsung", "oneplus", "mi.com", "xiaomi",
}

SOURCE_MAP = {
    "croma": "Croma",
    "reliance digital": "Reliance",
    "reliancedigital": "Reliance",
    "tata cliq": "Tata CLiQ",
    "tatacliq": "Tata CLiQ",
    "vijay sales": "Vijay Sales",
    "vijaysales": "Vijay Sales",
    "flipkart": "Flipkart",
    "poorvika": "Poorvika",
    "sangeetha": "Sangeetha",
    "jiomart": "JioMart",
    "snapdeal": "Snapdeal",
    "invent": "Invent",
    "apple": "Apple Store",
    "mi.com": "Mi Store",
    "xiaomi": "Mi Store",
}

# Minimum realistic prices for product categories (in INR)
# If a result is below this, it's likely scam/secondhand
CATEGORY_MIN_PRICES = {
    "iphone": 40000,
    "samsung galaxy s": 25000,
    "macbook": 70000,
    "ipad": 30000,
    "oneplus": 15000,
    "pixel": 30000,
}

def get_min_price(query: str) -> int:
    q = query.lower()
    for keyword, min_price in CATEGORY_MIN_PRICES.items():
        if keyword in q:
            return min_price
    return 1000  # default minimum


def safe_float(value, fallback=None):
    try:
        cleaned = str(value or "").replace("₹", "").replace(",", "").replace("$", "").strip()
        cleaned = "".join(c for c in cleaned if c.isdigit() or c == ".")
        return float(cleaned) if cleaned else fallback
    except Exception:
        return fallback


def is_accessory(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in ACCESSORY_KEYWORDS)


def is_suspicious_listing(title: str) -> bool:
    t = title.lower()
    return any(kw in t for kw in SKIP_TITLE_KEYWORDS)


def is_trusted_source(source: str) -> bool:
    s = source.lower().strip()
    return any(trusted in s for trusted in TRUSTED_SOURCES)


def matches_query(title: str, query: str) -> bool:
    if not title:
        return False
    words = query.lower().split()
    product_title = title.lower()
    meaningful = [w for w in words if len(w) >= 3]
    if not meaningful:
        return False
    return all(w in product_title for w in meaningful)


def clean_source(source: str) -> str:
    s = source.lower().strip()
    for key, display in SOURCE_MAP.items():
        if key in s:
            return display
    return source.title()


async def search_google_shopping(query: str) -> list:
    if not SERPAPI_KEY:
        print("SerpAPI key not set")
        return []

    min_price = get_min_price(query)

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(
                "https://serpapi.com/search",
                params={
                    "engine":  "google_shopping",
                    "q":       query,
                    "gl":      "in",
                    "hl":      "en",
                    "num":     "20",
                    "api_key": SERPAPI_KEY,
                },
            )

        if response.status_code != 200:
            print(f"SerpAPI error: {response.status_code} {response.text[:200]}")
            return []

        data = response.json()
        shopping_results = data.get("shopping_results") or []

        results = []

        for p in shopping_results:
            title  = p.get("title") or ""
            source = p.get("source") or ""

            # Skip Amazon (handled separately)
            if any(skip in source.lower() for skip in SKIP_SOURCES):
                continue

            # Only allow trusted retailers
            if not is_trusted_source(source):
                continue

            # Skip accessories
            if is_accessory(title):
                continue

            # Skip suspicious/secondhand listings
            if is_suspicious_listing(title):
                continue

            # Skip if doesn't match query
            if not matches_query(title, query):
                continue

            price = safe_float(p.get("price"))
            if not price or price < min_price:
                continue

            platform = clean_source(source)

            # Max 2 results per retailer
            source_count = sum(1 for r in results if r["platform"].lower() == platform.lower())
            if source_count >= 2:
                continue

            results.append({
                "platform":       platform,
                "title":          title,
                "price":          price,
                "original_price": price,
                "discount_pct":   None,
                "url":            p.get("link") or p.get("product_link") or "",
                "image_url":      p.get("thumbnail") or "",
                "rating":         safe_float(p.get("rating"), fallback=0.0),
                "in_stock":       True,
            })

            if len(results) >= 8:
                break

        return results

    except Exception as e:
        print(f"SerpAPI fetch error: {e}")
        return []
