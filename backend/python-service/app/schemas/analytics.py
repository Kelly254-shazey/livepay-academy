from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import RankedMetric


class DashboardSummaryResponse(BaseModel):
    generated_at: datetime
    counts: dict[str, int]
    top_creators: list[RankedMetric]
    top_categories: list[RankedMetric]
    trending_lives: list[RankedMetric]


class CreatorInsightsResponse(BaseModel):
    generated_at: datetime
    creator_id: str
    creator_name: str
    followers: int
    average_rating: float | None
    published_lives: int
    premium_content_items: int
    published_classes: int
    quality_score: float
