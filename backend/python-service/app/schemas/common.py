from datetime import datetime

from pydantic import BaseModel, Field


class RecommendationItem(BaseModel):
    id: str
    title: str
    score: float
    reason: str
    metadata: dict[str, object] = Field(default_factory=dict)


class RankedMetric(BaseModel):
    id: str
    title: str
    score: float
    metadata: dict[str, object] = Field(default_factory=dict)


class GeneratedPayload(BaseModel):
    generated_at: datetime

