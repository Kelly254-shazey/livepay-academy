from datetime import datetime, timezone

from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.schemas.analytics import CreatorInsightsResponse, DashboardSummaryResponse
from app.services.ranking import RankingService


class AnalyticsService:
    def __init__(
        self,
        database: DatabaseClient,
        service_database: ServiceDatabaseClient,
        ranking_service: RankingService,
    ) -> None:
        self._database = database
        self._service_database = service_database
        self._ranking = ranking_service

    async def dashboard_summary(self) -> DashboardSummaryResponse:
        counts = await self._database.dashboard_counts()
        top_creators, top_categories, trending_lives = await self._gather_rankings()
        payload = DashboardSummaryResponse(
            generated_at=datetime.now(timezone.utc),
            counts={key: int(value) for key, value in counts.items()},
            top_creators=top_creators,
            top_categories=top_categories,
            trending_lives=trending_lives,
        )
        await self._service_database.store_analytics_snapshot(
            "dashboard_summary",
            payload.model_dump(mode="json"),
        )
        await self._service_database.store_trend_snapshot(
            "dashboard_summary",
            payload.generated_at.date().isoformat(),
            {"counts": payload.counts},
        )
        return payload

    async def top_creators(self, limit: int = 10):
        return await self._ranking.trending_creators(limit)

    async def top_categories(self, limit: int = 10):
        return await self._ranking.trending_categories(limit)

    async def trending_lives(self, limit: int = 10):
        return await self._ranking.trending_lives(limit)

    async def recent_job_runs(self, limit: int = 20):
        return await self._service_database.list_job_runs(limit)

    async def creator_insights(self, creator_id: str) -> CreatorInsightsResponse | None:
        row = await self._database.creator_overview(creator_id)
        if not row:
            return None

        quality_score = round(
            float(row["followers"] or 0) * 0.1
            + float(row["publishedLives"] or 0) * 4
            + float(row["premiumContentItems"] or 0) * 3
            + float(row["publishedClasses"] or 0) * 5
            + float(row["averageRating"] or 0) * 12,
            2,
        )
        payload = CreatorInsightsResponse(
            generated_at=datetime.now(timezone.utc),
            creator_id=row["creatorId"],
            creator_name=row["creatorName"],
            followers=int(row["followers"] or 0),
            average_rating=float(row["averageRating"]) if row.get("averageRating") is not None else None,
            published_lives=int(row["publishedLives"] or 0),
            premium_content_items=int(row["premiumContentItems"] or 0),
            published_classes=int(row["publishedClasses"] or 0),
            quality_score=quality_score,
        )
        await self._service_database.store_creator_insight_snapshot(
            creator_id,
            "overview",
            payload.model_dump(mode="json"),
        )
        return payload

    async def _gather_rankings(self):
        return (
            await self._ranking.trending_creators(5),
            await self._ranking.trending_categories(5),
            await self._ranking.trending_lives(5),
        )
