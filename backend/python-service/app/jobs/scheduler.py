import logging
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.clients.service_database import ServiceDatabaseClient
from app.services.analytics import AnalyticsService
from app.services.ranking import RankingService
from app.services.recommendations import RecommendationService

logger = logging.getLogger(__name__)

JobRunner = Callable[[], Awaitable[dict[str, object]]]


def build_scheduler(
    service_database: ServiceDatabaseClient,
    analytics_service: AnalyticsService,
    recommendation_service: RecommendationService,
    ranking_service: RankingService,
) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()

    async def record_job(job_name: str, status: str, details: dict[str, object]) -> None:
        try:
            await service_database.record_job_run(job_name, status, details)
        except Exception as error:
            logger.warning("Failed to persist %s job run. %s", job_name, error)

    async def execute_job(job_name: str, runner: JobRunner) -> None:
        started_at = datetime.now(timezone.utc)
        try:
            details = await runner()
            payload = {
                "started_at": started_at.isoformat(),
                "finished_at": datetime.now(timezone.utc).isoformat(),
                **details,
            }
            logger.info("%s executed.", job_name)
            await record_job(job_name, "completed", payload)
        except Exception as error:
            logger.exception("%s failed.", job_name)
            await record_job(
                job_name,
                "failed",
                {
                    "started_at": started_at.isoformat(),
                    "finished_at": datetime.now(timezone.utc).isoformat(),
                    "error": str(error),
                },
            )

    async def run_startup_prime() -> dict[str, object]:
        ranking_summary = await ranking_service.warm_rankings(10)
        analytics_summary = await analytics_service.warm_platform_snapshots(10)
        global_recommendations = await recommendation_service.warm_global_recommendations(8)
        user_recommendations = await recommendation_service.warm_recent_user_recommendations(25, 6)
        return {
            "ranking": ranking_summary,
            "analytics": analytics_summary,
            "global_recommendations": global_recommendations,
            "user_recommendations": user_recommendations,
        }

    async def run_daily_aggregation() -> dict[str, object]:
        return await analytics_service.warm_platform_snapshots(15)

    async def run_weekly_creator_insights() -> dict[str, object]:
        return await analytics_service.warm_platform_snapshots(25)

    async def run_recommendation_refresh() -> dict[str, object]:
        global_recommendations = await recommendation_service.warm_global_recommendations(8)
        user_recommendations = await recommendation_service.warm_recent_user_recommendations(25, 6)
        return {
            "global_recommendations": global_recommendations,
            "user_recommendations": user_recommendations,
        }

    async def run_anomaly_scan() -> dict[str, object]:
        fraud_summary = await service_database.recent_fraud_event_summary(24)
        moderation_summary = await service_database.recent_moderation_event_summary(24)
        review_required = (
            fraud_summary["deny_count"] > 0
            or fraud_summary["review_count"] >= 3
            or moderation_summary["high_severity_count"] >= 3
        )
        snapshot = {
            "fraud": fraud_summary,
            "moderation": moderation_summary,
            "review_required": review_required,
        }
        await service_database.store_trend_snapshot(
            "anomaly_scan",
            datetime.now(timezone.utc).isoformat(),
            snapshot,
        )
        return snapshot

    async def startup_prime_job() -> None:
        await execute_job("startup-prime", run_startup_prime)

    async def daily_aggregation_job() -> None:
        await execute_job("daily-aggregation", run_daily_aggregation)

    async def weekly_creator_insights_job() -> None:
        await execute_job("weekly-creator-insights", run_weekly_creator_insights)

    async def recommendation_refresh_job() -> None:
        await execute_job("recommendation-refresh", run_recommendation_refresh)

    async def anomaly_scan_job() -> None:
        await execute_job("anomaly-scan", run_anomaly_scan)

    scheduler.add_job(
        startup_prime_job,
        "date",
        run_date=datetime.now(timezone.utc) + timedelta(seconds=5),
        id="startup-prime",
        replace_existing=True,
    )
    scheduler.add_job(
        daily_aggregation_job,
        "cron",
        hour=1,
        minute=0,
        id="daily-aggregation",
        replace_existing=True,
    )
    scheduler.add_job(
        weekly_creator_insights_job,
        "cron",
        day_of_week="mon",
        hour=2,
        minute=0,
        id="weekly-creator-insights",
        replace_existing=True,
    )
    scheduler.add_job(
        recommendation_refresh_job,
        "interval",
        minutes=10,
        id="recommendation-refresh",
        replace_existing=True,
    )
    scheduler.add_job(
        anomaly_scan_job,
        "interval",
        minutes=15,
        id="anomaly-scan",
        replace_existing=True,
    )
    return scheduler
