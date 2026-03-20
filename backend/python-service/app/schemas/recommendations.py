from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.common import RecommendationItem


class RecommendationRequest(BaseModel):
    include: list[str] = Field(
        default_factory=lambda: ["creators", "lives", "content", "classes"]
    )
    limit: int = Field(default=10, ge=1, le=50)


class RecommendationResponse(BaseModel):
    user_id: str
    generated_at: datetime
    results: dict[str, list[RecommendationItem]]

