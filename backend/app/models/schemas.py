from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class PlatformResult(BaseModel):
    platform: str
    title: Optional[str]
    price: Optional[float]
    original_price: Optional[float]
    discount_pct: Optional[float]
    url: Optional[str]
    image_url: Optional[str]
    rating: Optional[float]
    in_stock: bool = True


class PriceHistoryPoint(BaseModel):
    platform: str
    price: Optional[float]
    fetched_at: datetime


class SearchResponse(BaseModel):
    query: str
    product_id: int
    results: List[PlatformResult]
    best_deal: Optional[PlatformResult]
    ai_advice: Optional[str]
    fake_discount_warnings: List[str]
    # Extended AI fields
    price_trend: Optional[str] = None
    best_time_to_buy: Optional[str] = None
    tip: Optional[str] = None
    better_alternative: Optional[str] = None
    user_reviews_summary: Optional[str] = None


class HistoryResponse(BaseModel):
    product_id: int
    query: str
    history: List[PriceHistoryPoint]


class RecentProduct(BaseModel):
    product_id: int
    name: str
    query: str
    searched_at: str
    best_price: Optional[float]
    best_platform: Optional[str]
    image_url: Optional[str]
    platforms: List[str]


class RecentResponse(BaseModel):
    recent: List[RecentProduct]
