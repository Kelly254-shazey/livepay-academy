from pydantic import BaseModel, Field


class RiskScoreRequest(BaseModel):
    user_id: str | None = None
    creator_id: str | None = None
    target_type: str | None = None
    target_id: str | None = None
    amount: float = Field(default=0, ge=0)
    payout_amount: float = Field(default=0, ge=0)
    account_age_days: int = Field(default=365, ge=0)
    device_risk_score: float = Field(default=0, ge=0, le=100)
    geo_switch_score: float = Field(default=0, ge=0, le=100)
    failed_attempts_last_hour: int = Field(default=0, ge=0)
    flagged_reports: int = Field(default=0, ge=0)
    metadata: dict[str, object] = Field(default_factory=dict)


class RiskScoreResponse(BaseModel):
    risk_score: float
    trust_score: float
    decision: str
    reasons: list[str]

