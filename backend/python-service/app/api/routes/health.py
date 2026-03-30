from fastapi import APIRouter, Request


router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(request: Request) -> dict[str, object]:
    try:
        source_database = await request.app.state.source_database.ping()
    except Exception:
        source_database = False

    try:
        service_database = await request.app.state.service_database.ping()
    except Exception:
        service_database = False

    try:
        cache = await request.app.state.cache.ping()
    except Exception:
        cache = False

    return {
        "status": "ok" if source_database and service_database and cache else "degraded",
        "services": {
            "source_database": "up" if source_database else "down",
            "service_database": "up" if service_database else "down",
            "cache": "up" if cache else "down",
        },
        "cache_mode": getattr(request.app.state.cache, "mode", "unknown"),
    }
