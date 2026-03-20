import json
from typing import Any

from redis import asyncio as redis


class CacheClient:
    def __init__(self, url: str) -> None:
        self._client = redis.from_url(url, decode_responses=True)

    async def ping(self) -> bool:
        return bool(await self._client.ping())

    async def get_json(self, key: str) -> Any | None:
        value = await self._client.get(key)
        return json.loads(value) if value else None

    async def set_json(self, key: str, value: Any, ttl_seconds: int) -> None:
        await self._client.set(key, json.dumps(value), ex=ttl_seconds)

    async def close(self) -> None:
        if hasattr(self._client, "aclose"):
            await self._client.aclose()
        else:
            await self._client.close()
