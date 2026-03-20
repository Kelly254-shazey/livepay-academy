from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI

from app.api.routes.analytics import router as analytics_router
from app.api.routes.fraud import router as fraud_router
from app.api.routes.health import router as health_router
from app.api.routes.moderation import router as moderation_router
from app.api.routes.rankings import router as rankings_router
from app.api.routes.recommendations import router as recommendations_router
from app.clients.cache import CacheClient
from app.clients.database import DatabaseClient
from app.clients.service_database import ServiceDatabaseClient
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.dependencies.security import require_internal_api_key
from app.jobs.scheduler import build_scheduler
from app.services.analytics import AnalyticsService
from app.services.fraud import FraudService
from app.services.moderation import ModerationService
from app.services.ranking import RankingService
from app.services.recommendations import RecommendationService


configure_logging()
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    source_database = DatabaseClient(settings.source_database_url)
    service_database = ServiceDatabaseClient(settings.database_url)
    cache = CacheClient(settings.redis_url)
    await service_database.init_schema()
    ranking_service = RankingService(source_database, cache, service_database)
    recommendation_service = RecommendationService(
        source_database, cache, service_database, ranking_service
    )
    analytics_service = AnalyticsService(source_database, service_database, ranking_service)
    fraud_service = FraudService(service_database)
    moderation_service = ModerationService(service_database)
    scheduler = build_scheduler(service_database)

    app.state.source_database = source_database
    app.state.service_database = service_database
    app.state.cache = cache
    app.state.ranking_service = ranking_service
    app.state.recommendation_service = recommendation_service
    app.state.analytics_service = analytics_service
    app.state.fraud_service = fraud_service
    app.state.moderation_service = moderation_service
    app.state.scheduler = scheduler

    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        await cache.close()
        await source_database.close()
        await service_database.close()


app = FastAPI(title="LiveGate Python Service", version="1.0.0", lifespan=lifespan)
app.include_router(health_router)

internal_router = APIRouter(dependencies=[Depends(require_internal_api_key)])
internal_router.include_router(recommendations_router)
internal_router.include_router(fraud_router)
internal_router.include_router(moderation_router)
internal_router.include_router(analytics_router)
internal_router.include_router(rankings_router)

app.include_router(internal_router)
