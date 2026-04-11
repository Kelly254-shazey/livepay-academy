import asyncio
import logging
from threading import Thread

from app.clients.service_database import ServiceDatabaseClient
from app.schemas.moderation import ContentAnalysisRequest, ContentAnalysisResponse


logger = logging.getLogger(__name__)


class ModerationService:
    _high_risk_terms = {"guaranteed profit", "hate", "scam", "cheat", "violent"}
    _medium_risk_terms = {"forex signal", "double money", "adult", "fake"}

    def __init__(self, service_database: ServiceDatabaseClient) -> None:
        self._service_database = service_database

    def analyze_content(
        self, request: ContentAnalysisRequest
    ) -> ContentAnalysisResponse:
        text = f"{request.title} {request.description or ''}".lower()
        labels: list[str] = []
        risk_score = 0.0

        for term in self._high_risk_terms:
            if term in text:
                labels.append(term.replace(" ", "_"))
                risk_score += 28

        for term in self._medium_risk_terms:
            if term in text:
                labels.append(term.replace(" ", "_"))
                risk_score += 12

        severity = "low"
        if risk_score >= 60:
            severity = "high"
        elif risk_score >= 25:
            severity = "medium"

        excerpt = (request.description or request.title)[:180]
        response = ContentAnalysisResponse(
            risk_score=min(risk_score, 100.0),
            severity=severity,
            labels=labels,
            review_required=risk_score >= 25,
            sanitized_excerpt=excerpt,
        )
        coroutine = self._record_event(request, response)
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            Thread(
                target=lambda: asyncio.run(coroutine),
                name="moderation-record",
                daemon=True,
            ).start()
        else:
            asyncio.ensure_future(coroutine, loop=loop)
        return response

    async def _record_event(
        self,
        request: ContentAnalysisRequest,
        response: ContentAnalysisResponse,
    ) -> None:
        try:
            await self._service_database.record_moderation_event(
                request.content_type,
                response.risk_score,
                response.severity,
                {
                    "request": request.model_dump(mode="json"),
                    "response": response.model_dump(mode="json"),
                },
            )
        except Exception as error:
            logger.warning(
                "Failed to persist moderation event for %s. %s",
                request.content_type,
                error,
            )
