from google import genai
import os
import json
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

MODEL = "gemini-2.5-flash-lite"

async def get_ai_advice(query: str, results: list) -> dict:
    try:
        results_summary = []
        for r in results:
            if r.get("price"):
                results_summary.append(
                    f"{r['platform']}: Rs{r['price']} (was Rs{r.get('original_price', r['price'])}, {r.get('discount_pct', 0)}% off)"
                )
        prompt = f"""You are a sharp, opinionated Indian shopping expert like a knowledgeable friend who has researched this product deeply.
Product searched: "{query}"
Current prices found:
{chr(10).join(results_summary) if results_summary else "No prices found"}
Return ONLY valid JSON with no markdown:
{{
  "buy_advice": "<2-3 sentences: specific advice about THIS product — mention if it's good value, any known issues, and whether to buy now or wait>",
  "best_time_to_buy": "<specific sale event and approximate discount expected, e.g. Wait for Flipkart Big Billion Days in October — iPhone prices typically drop 8-12%>",
  "fake_discount_warnings": ["<only include if original price looks inflated vs street price>"],
  "price_trend": "<Rising / Falling / Stable>",
  "tip": "<one very specific actionable tip for this exact product, e.g. buy the 128GB if you use iCloud, the 256GB rarely goes on sale>",
  "better_alternative": "<name one specific better value product at a similar or lower price and why it beats this one for most buyers>",
  "user_reviews_summary": "<what real buyers commonly say about this product — both praise and complaints in 1-2 sentences>"
}}"""
        response = client.models.generate_content(model=MODEL, contents=prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini error: {e}")
        return {"buy_advice": "Compare prices across platforms before buying.", "best_time_to_buy": "Check during Big Billion Days or Great Indian Festival.", "fake_discount_warnings": [], "price_trend": "Unknown", "tip": "Always check the price history before assuming a deal is genuine."}


async def get_product_details(query: str, title: str = "") -> dict:
    try:
        prompt = f"""You are an expert Indian tech reviewer.
Product: "{title or query}"
Return ONLY valid JSON with no markdown:
{{"pros": ["pro1","pro2","pro3","pro4"], "cons": ["con1","con2","con3"], "verdict": "<2-3 sentence verdict>", "best_for": "<who its best for>", "avoid_if": "<who should avoid>"}}"""
        response = client.models.generate_content(model=MODEL, contents=prompt)
        text = response.text.strip().replace("```json", "").replace("```", "").strip()
        return json.loads(text)
    except Exception as e:
        print(f"Gemini details error: {e}")
        return {"pros": ["Good build quality", "Competitive pricing", "Strong performance", "Good camera"], "cons": ["Battery life could be better", "Limited updates", "Accessories extra"], "verdict": "A solid choice in its price range.", "best_for": "Users looking for reliable performance.", "avoid_if": "Users needing best-in-class camera or battery."}
