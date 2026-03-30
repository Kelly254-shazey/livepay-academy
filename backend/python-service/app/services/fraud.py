import asyncio
import logging

from app.clients.service_database import ServiceDatabaseClient
from app.schemas.fraud import RiskScoreRequest, RiskScoreResponse


logger = logging.getLogger(__name__)


class FraudService:
    def __init__(self, service_database: ServiceDatabaseClient) -> None:
        self._service_database = service_database

    def score_transaction(self, request: RiskScoreRequest) -> RiskScoreResponse:
        reasons: list[str] = []
        risk_score = 0.0

        if request.amount >= 250:
            risk_score += 18
            reasons.append("Transaction amount is materially above baseline.")
        if request.failed_attempts_last_hour >= 3:
            risk_score += 20
            reasons.append("High recent failure velocity detected.")
        if request.device_risk_score >= 60:
            risk_score += request.device_risk_score * 0.2
            reasons.append("Device fingerprint indicates elevated risk.")
        if request.geo_switch_score >= 60:
            risk_score += request.geo_switch_score * 0.18
            reasons.append("Geographic movement is unusually abrupt.")
        if request.account_age_days <= 7:
            risk_score += 14
            reasons.append("Account is too new for the current transaction profile.")

        response = self._finalize(risk_score, reasons)
        self._record("transaction", request, response)
        return response

    def score_payout(self, request: RiskScoreRequest) -> RiskScoreResponse:
        reasons: list[str] = []
        risk_score = 0.0

        if request.payout_amount >= 500:
            risk_score += 22
            reasons.append("Payout amount exceeds the standard review threshold.")
        if request.flagged_reports > 0:
            risk_score += min(request.flagged_reports * 7, 21)
            reasons.append("Creator account has recent moderation or trust flags.")
        if request.account_age_days <= 14:
            risk_score += 18
            reasons.append("Creator account is too new for an unrestricted payout.")

        response = self._finalize(risk_score, reasons)
        self._record("payout", request, response)
        return response

    def score_account(self, request: RiskScoreRequest) -> RiskScoreResponse:
        reasons: list[str] = []
        risk_score = 0.0

        if request.failed_attempts_last_hour >= 5:
            risk_score += 24
            reasons.append("Repeated high-intensity failed activity detected.")
        if request.flagged_reports >= 2:
            risk_score += min(request.flagged_reports * 10, 30)
            reasons.append("Multiple moderation reports are attached to the account.")
        if request.device_risk_score >= 70:
            risk_score += 15
            reasons.append("Device trust score is materially degraded.")

        response = self._finalize(risk_score, reasons)
        self._record("account", request, response)
        return response

    def _finalize(self, risk_score: float, reasons: list[str]) -> RiskScoreResponse:
        clamped = max(0.0, min(round(risk_score, 2), 100.0))
        if clamped >= 85:
            decision = "deny"
        elif clamped >= 60:
            decision = "review"
        else:
            decision = "allow"

        trust_score = round(100.0 - clamped, 2)
        return RiskScoreResponse(
            risk_score=clamped,
            trust_score=trust_score,
            decision=decision,
            reasons=reasons or ["No elevated fraud indicators detected."],
        )

    def _record(self, event_type: str, request: RiskScoreRequest, response: RiskScoreResponse) -> None:
        asyncio.create_task(
            self._record_event(event_type, request, response)
        )

    async def _record_event(
        self,
        event_type: str,
        request: RiskScoreRequest,
        response: RiskScoreResponse,
    ) -> None:
        try:
            await self._service_database.record_fraud_event(
                event_type,
                response.risk_score,
                response.decision,
                {
                    "request": request.model_dump(mode="json"),
                    "response": response.model_dump(mode="json"),
                },
            )
        except Exception as error:
            logger.warning(
                "Failed to persist fraud event for %s. %s",
                event_type,
                error,
            )
