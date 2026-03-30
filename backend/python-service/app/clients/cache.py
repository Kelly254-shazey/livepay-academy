import json
import logging
import time
from typing import Any

from redis import asyncio as redis


logger = logging.getLogger(__name__)


class MemoryCacheBackend:
    def __init__(self) -> None:
        self._store: dict[str, tuple[str, float | None]] = {}

    async def ping(self) -> bool:
        return True

    async def get_json(self, key: str) -> Any | None:
        entry = self._store.get(key)
        if entry is None:
            return None

        value, expires_at = entry
        if expires_at is not None and expires_at <= time.time():
            self._store.pop(key, None)
            return None

        return json.loads(value)

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        expires_at = time.time() + ttl_seconds if ttl_seconds > 0 else None
        self._store[key] = (json.dumps(value), expires_at)

    async def close(self) -> None:
        self._store.clear()


class CacheClient:
    def __init__(self, url: str | None) -> None:
        self._memory = MemoryCacheBackend()
        self._client = redis.from_url(url, decode_responses=True) if url else None
        self._using_memory = self._client is None

        if self._using_memory:
            logger.warning("REDIS_URL is not configured. Python service is using in-memory cache fallback.")

    async def ping(self) -> bool:
        if self._using_memory or self._client is None:
            return await self._memory.ping()

        try:
            return bool(await self._client.ping())
        except Exception as error:
            self._activate_memory_fallback("Redis ping failed. Falling back to in-memory cache.", error)
            return await self._memory.ping()

    async def get_json(self, key: str) -> Any | None:
        if self._using_memory or self._client is None:
            return await self._memory.get_json(key)

        try:
            value = await self._client.get(key)
            return json.loads(value) if value else None
        except Exception as error:
            self._activate_memory_fallback("Redis read failed. Falling back to in-memory cache.", error)
            return await self._memory.get_json(key)

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        if self._using_memory or self._client is None:
            await self._memory.set_json(key, value, ttl_seconds)
            return

        try:
            await self._client.set(key, json.dumps(value), ex=ttl_seconds)
        except Exception as error:
            self._activate_memory_fallback("Redis write failed. Falling back to in-memory cache.", error)
            await self._memory.set_json(key, value, ttl_seconds)

    async def close(self) -> None:
        if self._client is not None:
            if hasattr(self._client, "aclose"):
                await self._client.aclose()
            else:
                await self._client.close()

        await self._memory.close()

    @property
    def mode(self) -> str:
        return "memory" if self._using_memory or self._client is None else "redis"

    def _activate_memory_fallback(self, message: str, error: Exception) -> None:
        if self._using_memory:
            return

        logger.warning("%s %s", message, error)
        self._using_memory = True
