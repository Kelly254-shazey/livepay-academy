import asyncio
import logging
import hashlib
from datetime import datetime, timezone

from app.clients.cache import CacheClient
from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.core.config import get_settings
from app.schemas.common import RankedMetric


logger = logging.getLogger(__name__)


class RankingService:
    def __init__(
        self,
        database: DatabaseClient,
        cache: CacheClient,
        service_database: ServiceDatabaseClient,
    ) -> None:
        self._database = database
        self._cache = cache
        self._service_database = service_database
        self._ttl = get_settings().cache_ttl_seconds

    async def trending_creators(self, limit: int = 10) -> list[RankedMetric]:
        cache_key = f"ranking:creators:{limit}"
        cached = await self._cache.get_json(cache_key)
        if cached:
            return [RankedMetric(**item) for item in cached]

        rows = await self._database.top_creators(limit)
        items = [
            RankedMetric(
                id=row["id"],
                title=row["title"],
                score=float(row["followers"] or 0) + float(row["publishedLives"] or 0) * 3,
                metadata={
                    "followers": int(row["followers"] or 0),
                    "published_lives": int(row["publishedLives"] or 0),
                },
            )
            for row in rows
        ]
        await self._persist_rankings("creators", cache_key, limit, items)
        return items

    async def trending_categories(self, limit: int = 10) -> list[RankedMetric]:
        cache_key = f"ranking:categories:{limit}"
        cached = await self._cache.get_json(cache_key)
        if cached:
            return [RankedMetric(**item) for item in cached]

        rows = await self._database.top_categories(limit)
        items = [
            RankedMetric(
                id=row["id"],
                title=row["title"],
                score=float(row["liveCount"] or 0)
                + float(row["contentCount"] or 0)
                + float(row["classCount"] or 0),
                metadata={
                    "live_count": int(row["liveCount"] or 0),
                    "content_count": int(row["contentCount"] or 0),
                    "class_count": int(row["classCount"] or 0),
                },
            )
            for row in rows
        ]
        await self._persist_rankings("categories", cache_key, limit, items)
        return items

    async def trending_lives(self, limit: int = 10) -> list[RankedMetric]:
        cache_key = f"ranking:lives:{limit}"
        cached = await self._cache.get_json(cache_key)
        if cached:
            return [RankedMetric(**item) for item in cached]

        rows = await self._database.trending_lives(limit)
        now = datetime.now(timezone.utc)
        items = []
        for row in rows:
            freshness = 50.0
            scheduled_for = row.get("scheduledFor")
            if scheduled_for:
                if scheduled_for.tzinfo is None:
                    scheduled_for = scheduled_for.replace(tzinfo=timezone.utc)
                freshness = max(
                    10.0,
                    100.0 - abs((scheduled_for - now).total_seconds()) / 3600,
                )
            items.append(
                RankedMetric(
                    id=row["id"],
                    title=row["title"],
                    score=freshness + (20.0 if row["status"] == "live" else 0.0),
                    metadata={
                        "status": row["status"],
                        "creator_name": row.get("creatorName"),
                    },
                )
            )

        await self._persist_rankings("lives", cache_key, limit, items)
        return items

    def personalize(self, user_id: str, items: list[RankedMetric]) -> list[RankedMetric]:
        personalized: list[RankedMetric] = []
        for item in items:
            digest = hashlib.sha256(f"{user_id}:{item.id}".encode()).hexdigest()
            lift = int(digest[:4], 16) / 65535 * 6
            personalized.append(
                RankedMetric(
                    id=item.id,
                    title=item.title,
                    score=round(item.score + lift, 2),
                    metadata=item.metadata,
                )
            )
        return sorted(personalized, key=lambda item: item.score, reverse=True)

    async def _store_snapshot(self, ranking_scope: str, limit: int, items: list[RankedMetric]) -> None:
        await self._service_database.store_ranking_snapshot(
            ranking_scope,
            {
                "limit": limit,
                "items": [item.model_dump(mode="json") for item in items],
            },
        )

    async def warm_rankings(self, limit: int = 10) -> dict[str, int]:
        creators, categories, lives = await asyncio.gather(
            self.trending_creators(limit),
            self.trending_categories(limit),
            self.trending_lives(limit),
        )
        return {
            "limit": limit,
            "creators": len(creators),
            "categories": len(categories),
            "lives": len(lives),
        }

    async def _persist_rankings(
        self,
        ranking_scope: str,
        cache_key: str,
        limit: int,
        items: list[RankedMetric],
    ) -> None:
        serialized = [item.model_dump() for item in items]
        try:
            await self._store_snapshot(ranking_scope, limit, items)
        except Exception as error:
            logger.warning(
                "Failed to persist %s ranking snapshot. %s",
                ranking_scope,
                error,
            )

        try:
            await self._cache.set_json(cache_key, serialized, self._ttl)
        except Exception as error:
            logger.warning(
                "Failed to cache %s rankings. %s",
                ranking_scope,
                error,
            )
