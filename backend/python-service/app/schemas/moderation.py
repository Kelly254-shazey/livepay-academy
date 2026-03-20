from pydantic import BaseModel, Field


class ContentAnalysisRequest(BaseModel):
    title: str
    description: str | None = None
    content_type: str = "generic"


class ContentAnalysisResponse(BaseModel):
    risk_score: float
    severity: str
    labels: list[str] = Field(default_factory=list)
    review_required: bool
    sanitized_excerpt: str | None = None

