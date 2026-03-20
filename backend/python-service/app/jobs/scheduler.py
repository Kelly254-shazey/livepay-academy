import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.clients.service_database import ServiceDatabaseClient

logger = logging.getLogger(__name__)


def build_scheduler(service_database: ServiceDatabaseClient) -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()

    async def log_job(job_name: str, details: dict[str, object]) -> None:
        logger.info("%s executed.", job_name)
        await service_database.record_job_run(job_name, "completed", details)

    scheduler.add_job(
        log_job,
        "cron",
        hour=1,
        minute=0,
        id="daily-aggregation",
        replace_existing=True,
        args=["daily-aggregation", {"scope": "platform"}],
    )
    scheduler.add_job(
        log_job,
        "cron",
        day_of_week="mon",
        hour=2,
        minute=0,
        id="weekly-creator-insights",
        replace_existing=True,
        args=["weekly-creator-insights", {"scope": "creator"}],
    )
    scheduler.add_job(
        log_job,
        "interval",
        minutes=30,
        id="recommendation-refresh",
        replace_existing=True,
        args=["recommendation-refresh", {"scope": "recommendations"}],
    )
    scheduler.add_job(
        log_job,
        "interval",
        hours=6,
        id="anomaly-scan",
        replace_existing=True,
        args=["anomaly-scan", {"scope": "fraud-moderation"}],
    )
    return scheduler
