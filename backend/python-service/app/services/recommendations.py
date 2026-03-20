from datetime import datetime, timezone

from app.clients.cache import CacheClient
from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.core.config import get_settings
from app.schemas.common import RecommendationItem
from app.schemas.recommendations import RecommendationResponse
from app.services.ranking import RankingService


class RecommendationService:
    def __init__(
        self,
        database: DatabaseClient,
        cache: CacheClient,
        service_database: ServiceDatabaseClient,
        ranking_service: RankingService,
    ) -> None:
        self._database = database
        self._cache = cache
        self._service_database = service_database
        self._ranking = ranking_service
        self._ttl = get_settings().cache_ttl_seconds

    async def recommend_for_user(
        self, user_id: str, include: list[str], limit: int
    ) -> RecommendationResponse:
        cache_key = f"recommendations:{user_id}:{','.join(sorted(include))}:{limit}"
        cached = await self._cache.get_json(cache_key)
        if cached:
            return RecommendationResponse(**cached)

        results: dict[str, list[RecommendationItem]] = {}

        if "creators" in include:
            creator_rankings = self._ranking.personalize(
                user_id, await self._ranking.trending_creators(limit)
            )
            results["creators"] = [
                RecommendationItem(
                    id=item.id,
                    title=item.title,
                    score=item.score,
                    reason="High creator momentum with follower and live-session strength.",
                    metadata=item.metadata,
                )
                for item in creator_rankings[:limit]
            ]

        if "lives" in include:
            live_rankings = self._ranking.personalize(
                user_id, await self._ranking.trending_lives(limit)
            )
            results["lives"] = [
                RecommendationItem(
                    id=item.id,
                    title=item.title,
                    score=item.score,
                    reason="Fresh or currently active live session aligned to platform demand.",
                    metadata=item.metadata,
                )
                for item in live_rankings[:limit]
            ]

        if "content" in include:
            content_rows = await self._database.trending_content(limit)
            results["content"] = [
                RecommendationItem(
                    id=row["id"],
                    title=row["title"],
                    score=round(80.0 - index * 2.5, 2),
                    reason="Recently published premium content with strong recency signal.",
                    metadata={"creator_name": row.get("creatorName"), "price": str(row.get("price", ""))},
                )
                for index, row in enumerate(content_rows)
            ]

        if "classes" in include:
            class_rows = await self._database.trending_classes(limit)
            results["classes"] = [
                RecommendationItem(
                    id=row["id"],
                    title=row["title"],
                    score=round(78.0 - index * 2.0, 2),
                    reason="Published class with upcoming schedule and creator activity.",
                    metadata={"creator_name": row.get("creatorName"), "starts_at": str(row.get("startsAt", ""))},
                )
                for index, row in enumerate(class_rows)
            ]

        payload = RecommendationResponse(
            user_id=user_id,
            generated_at=datetime.now(timezone.utc),
            results=results,
        )
        await self._service_database.store_recommendation_snapshot(
            user_id,
            ",".join(sorted(include)),
            payload.model_dump(mode="json"),
        )
        await self._cache.set_json(cache_key, payload.model_dump(mode="json"), self._ttl)
        return payload
