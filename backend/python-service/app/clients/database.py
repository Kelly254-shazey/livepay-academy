from collections.abc import Mapping
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


class DatabaseClient:
    def __init__(self, source_database_url: str) -> None:
        self._engine: AsyncEngine = create_async_engine(
            source_database_url,
            pool_pre_ping=True,
            future=True,
        )

    async def ping(self) -> bool:
        async with self._engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True

    async def dashboard_counts(self) -> dict[str, int]:
        query = text(
            """
            SELECT
              (SELECT COUNT(*) FROM `User`) AS users,
              (SELECT COUNT(*) FROM `CreatorProfile`) AS creators,
              (SELECT COUNT(*) FROM `LiveSession`) AS live_sessions,
              (SELECT COUNT(*) FROM `PremiumContent`) AS premium_content,
              (SELECT COUNT(*) FROM `classes`) AS classes
            """
        )
        return await self._fetch_one_dict(query)

    async def top_creators(self, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT
              cp.userId AS id,
              cp.displayName AS title,
              cp.followersCount AS followers,
              COUNT(ls.id) AS publishedLives
            FROM `CreatorProfile` cp
            LEFT JOIN `LiveSession` ls
              ON ls.creatorId = cp.userId
             AND ls.status IN ('published', 'live', 'ended')
            GROUP BY cp.userId, cp.displayName, cp.followersCount
            ORDER BY (cp.followersCount + COUNT(ls.id) * 3) DESC, cp.displayName ASC
            LIMIT :limit
            """
        )
        return await self._fetch_many_dicts(query, {"limit": limit})

    async def top_categories(self, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT
              c.id AS id,
              c.name AS title,
              COUNT(DISTINCT ls.id) AS liveCount,
              COUNT(DISTINCT pc.id) AS contentCount,
              COUNT(DISTINCT cl.id) AS classCount
            FROM `Category` c
            LEFT JOIN `LiveSession` ls ON ls.categoryId = c.id
            LEFT JOIN `PremiumContent` pc ON pc.categoryId = c.id
            LEFT JOIN `classes` cl ON cl.categoryId = c.id
            GROUP BY c.id, c.name
            ORDER BY (COUNT(DISTINCT ls.id) + COUNT(DISTINCT pc.id) + COUNT(DISTINCT cl.id)) DESC, c.name ASC
            LIMIT :limit
            """
        )
        return await self._fetch_many_dicts(query, {"limit": limit})

    async def trending_lives(self, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT
              ls.id AS id,
              ls.title AS title,
              ls.status AS status,
              ls.scheduledFor AS scheduledFor,
              cp.displayName AS creatorName
            FROM `LiveSession` ls
            LEFT JOIN `CreatorProfile` cp ON cp.userId = ls.creatorId
            WHERE ls.status IN ('published', 'live')
            ORDER BY CASE WHEN ls.status = 'live' THEN 0 ELSE 1 END, ls.scheduledFor ASC, ls.createdAt DESC
            LIMIT :limit
            """
        )
        return await self._fetch_many_dicts(query, {"limit": limit})

    async def trending_content(self, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT
              pc.id AS id,
              pc.title AS title,
              pc.price AS price,
              cp.displayName AS creatorName
            FROM `PremiumContent` pc
            LEFT JOIN `CreatorProfile` cp ON cp.userId = pc.creatorId
            WHERE pc.status = 'published'
            ORDER BY pc.publishedAt DESC, pc.createdAt DESC
            LIMIT :limit
            """
        )
        return await self._fetch_many_dicts(query, {"limit": limit})

    async def trending_classes(self, limit: int) -> list[dict[str, Any]]:
        query = text(
            """
            SELECT
              cl.id AS id,
              cl.title AS title,
              cl.startsAt AS startsAt,
              cp.displayName AS creatorName
            FROM `classes` cl
            LEFT JOIN `CreatorProfile` cp ON cp.userId = cl.creatorId
            WHERE cl.status = 'published'
            ORDER BY cl.startsAt ASC, cl.createdAt DESC
            LIMIT :limit
            """
        )
        return await self._fetch_many_dicts(query, {"limit": limit})

    async def creator_overview(self, creator_id: str) -> dict[str, Any] | None:
        query = text(
            """
            SELECT
              cp.userId AS creatorId,
              cp.displayName AS creatorName,
              cp.followersCount AS followers,
              cp.averageRating AS averageRating,
              COUNT(DISTINCT CASE WHEN ls.status IN ('published', 'live', 'ended') THEN ls.id END) AS publishedLives,
              COUNT(DISTINCT CASE WHEN pc.status = 'published' THEN pc.id END) AS premiumContentItems,
              COUNT(DISTINCT CASE WHEN cl.status = 'published' THEN cl.id END) AS publishedClasses
            FROM `CreatorProfile` cp
            LEFT JOIN `LiveSession` ls ON ls.creatorId = cp.userId
            LEFT JOIN `PremiumContent` pc ON pc.creatorId = cp.userId
            LEFT JOIN `classes` cl ON cl.creatorId = cp.userId
            WHERE cp.userId = :creator_id
            GROUP BY cp.userId, cp.displayName, cp.followersCount, cp.averageRating
            """
        )
        async with self._engine.connect() as connection:
            row = (await connection.execute(query, {"creator_id": creator_id})).mappings().first()
        return dict(row) if row else None

    async def close(self) -> None:
        await self._engine.dispose()

    async def _fetch_one_dict(self, query: Any, params: Mapping[str, Any] | None = None) -> dict[str, Any]:
        async with self._engine.connect() as connection:
            row = (await connection.execute(query, params or {})).mappings().one()
            return dict(row)

    async def _fetch_many_dicts(
        self, query: Any, params: Mapping[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        async with self._engine.connect() as connection:
            rows = (await connection.execute(query, params or {})).mappings().all()
            return [dict(row) for row in rows]
