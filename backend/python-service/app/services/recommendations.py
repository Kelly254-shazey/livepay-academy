import asyncio
import logging
from datetime import datetime, timezone

from app.clients.cache import CacheClient
from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.core.config import get_settings
from app.schemas.common import RecommendationItem
from app.schemas.recommendations import RecommendationResponse
from app.services.ranking import RankingService


logger = logging.getLogger(__name__)


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
        normalized_include = list(dict.fromkeys(include or ["creators"]))
        cache_key = f"recommendations:{user_id}:{','.join(sorted(normalized_include))}:{limit}"
        cached = await self._cache.get_json(cache_key)
        if cached:
            return RecommendationResponse(**cached)

        jobs = []

        if "creators" in normalized_include:
            jobs.append(self._recommend_creators(user_id, limit))
        if "lives" in normalized_include:
            jobs.append(self._recommend_lives(user_id, limit))
        if "content" in normalized_include:
            jobs.append(self._recommend_content(limit))
        if "classes" in normalized_include:
            jobs.append(self._recommend_classes(limit))

        results = dict(await asyncio.gather(*jobs)) if jobs else {}

        payload = RecommendationResponse(
            user_id=user_id,
            generated_at=datetime.now(timezone.utc),
            results=results,
        )
        await self._persist_snapshot(
            user_id,
            ",".join(sorted(normalized_include)),
            cache_key,
            payload,
        )
        return payload

    async def warm_global_recommendations(self, limit: int = 10) -> dict[str, object]:
        scopes = {
            "creators": ("global-creators", ["creators"]),
            "lives": ("global-lives", ["lives"]),
            "content": ("global-content", ["content"]),
            "classes": ("global-classes", ["classes"]),
        }
        results = await asyncio.gather(
            *(
                self.recommend_for_user(subject_id, include, limit)
                for subject_id, include in scopes.values()
            ),
            return_exceptions=True,
        )
        warmed_scopes = [
            scope
            for scope, result in zip(scopes.keys(), results, strict=True)
            if not isinstance(result, Exception)
        ]
        return {
            "limit": limit,
            "warmed_scopes": warmed_scopes,
            "failed_scopes": len(scopes) - len(warmed_scopes),
        }

    async def warm_recent_user_recommendations(
        self, user_limit: int = 25, recommendation_limit: int = 6
    ) -> dict[str, int]:
        user_ids = await self._database.recent_user_ids(user_limit)
        if not user_ids:
            return {
                "candidate_users": 0,
                "users_warmed": 0,
                "recommendation_limit": recommendation_limit,
            }

        results = await asyncio.gather(
            *(
                self.recommend_for_user(user_id, ["creators"], recommendation_limit)
                for user_id in user_ids
            ),
            return_exceptions=True,
        )
        warmed_users = sum(
            1 for result in results if not isinstance(result, Exception)
        )
        return {
            "candidate_users": len(user_ids),
            "users_warmed": warmed_users,
            "recommendation_limit": recommendation_limit,
        }

    async def _recommend_creators(
        self, user_id: str, limit: int
    ) -> tuple[str, list[RecommendationItem]]:
        creator_rankings = self._ranking.personalize(
            user_id, await self._ranking.trending_creators(limit)
        )
        return (
            "creators",
            [
                RecommendationItem(
                    id=item.id,
                    title=item.title,
                    score=item.score,
                    reason="High creator momentum with follower and live-session strength.",
                    metadata=item.metadata,
                )
                for item in creator_rankings[:limit]
            ],
        )

    async def _recommend_lives(
        self, user_id: str, limit: int
    ) -> tuple[str, list[RecommendationItem]]:
        live_rankings = self._ranking.personalize(
            user_id, await self._ranking.trending_lives(limit)
        )
        return (
            "lives",
            [
                RecommendationItem(
                    id=item.id,
                    title=item.title,
                    score=item.score,
                    reason="Fresh or currently active live session aligned to platform demand.",
                    metadata=item.metadata,
                )
                for item in live_rankings[:limit]
            ],
        )

    async def _recommend_content(
        self, limit: int
    ) -> tuple[str, list[RecommendationItem]]:
        content_rows = await self._database.trending_content(limit)
        return (
            "content",
            [
                RecommendationItem(
                    id=row["id"],
                    title=row["title"],
                    score=round(80.0 - index * 2.5, 2),
                    reason="Recently published premium content with strong recency signal.",
                    metadata={
                        "creator_name": row.get("creatorName"),
                        "price": str(row.get("price", "")),
                    },
                )
                for index, row in enumerate(content_rows)
            ],
        )

    async def _recommend_classes(
        self, limit: int
    ) -> tuple[str, list[RecommendationItem]]:
        class_rows = await self._database.trending_classes(limit)
        return (
            "classes",
            [
                RecommendationItem(
                    id=row["id"],
                    title=row["title"],
                    score=round(78.0 - index * 2.0, 2),
                    reason="Published class with upcoming schedule and creator activity.",
                    metadata={
                        "creator_name": row.get("creatorName"),
                        "starts_at": str(row.get("startsAt", "")),
                    },
                )
                for index, row in enumerate(class_rows)
            ],
        )

    async def _persist_snapshot(
        self,
        user_id: str,
        include_key: str,
        cache_key: str,
        payload: RecommendationResponse,
    ) -> None:
        serialized = payload.model_dump(mode="json")
        try:
            await self._service_database.store_recommendation_snapshot(
                user_id,
                include_key,
                serialized,
            )
        except Exception as error:
            logger.warning(
                "Failed to persist recommendation snapshot for %s. %s",
                user_id,
                error,
            )

        try:
            await self._cache.set_json(cache_key, serialized, self._ttl)
        except Exception as error:
            logger.warning(
                "Failed to cache recommendation payload for %s. %s",
                user_id,
                error,
            )
