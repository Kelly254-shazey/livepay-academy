import hashlib
from datetime import datetime, timezone

from app.clients.cache import CacheClient
from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.core.config import get_settings
from app.schemas.common import RankedMetric


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
        await self._store_snapshot("creators", limit, items)
        await self._cache.set_json(cache_key, [item.model_dump() for item in items], self._ttl)
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
        await self._store_snapshot("categories", limit, items)
        await self._cache.set_json(cache_key, [item.model_dump() for item in items], self._ttl)
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

        await self._store_snapshot("lives", limit, items)
        await self._cache.set_json(cache_key, [item.model_dump() for item in items], self._ttl)
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
