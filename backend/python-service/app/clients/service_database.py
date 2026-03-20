from collections.abc import Mapping
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


class ServiceDatabaseClient:
    def __init__(self, database_url: str) -> None:
        self._engine: AsyncEngine = create_async_engine(
            database_url,
            pool_pre_ping=True,
            future=True,
        )

    async def init_schema(self) -> None:
        statements = [
            """
            CREATE TABLE IF NOT EXISTS analytics_snapshots (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                snapshot_type VARCHAR(64) NOT NULL,
                payload JSON NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_analytics_snapshots_type_generated (snapshot_type, generated_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS recommendation_snapshots (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                subject_id VARCHAR(191) NOT NULL,
                recommendation_scope VARCHAR(64) NOT NULL,
                payload JSON NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_recommendation_snapshots_scope_generated (recommendation_scope, generated_at),
                INDEX idx_recommendation_snapshots_subject_scope_generated (subject_id, recommendation_scope, generated_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS ranking_snapshots (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                ranking_scope VARCHAR(64) NOT NULL,
                subject_id VARCHAR(191) NULL,
                payload JSON NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ranking_snapshots_scope_generated (ranking_scope, generated_at),
                INDEX idx_ranking_snapshots_subject_generated (subject_id, generated_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS trend_snapshots (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                trend_scope VARCHAR(64) NOT NULL,
                period_key VARCHAR(64) NOT NULL,
                payload JSON NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_trend_snapshots_scope_period_generated (trend_scope, period_key, generated_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS creator_insight_snapshots (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                creator_id VARCHAR(191) NOT NULL,
                insight_type VARCHAR(64) NOT NULL,
                payload JSON NOT NULL,
                generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_creator_insight_creator_type_generated (creator_id, insight_type, generated_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS fraud_events (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                event_type VARCHAR(64) NOT NULL,
                risk_score DECIMAL(5,2) NOT NULL,
                decision VARCHAR(32) NOT NULL,
                payload JSON NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_fraud_events_type_created (event_type, created_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS moderation_events (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                content_type VARCHAR(64) NOT NULL,
                risk_score DECIMAL(5,2) NOT NULL,
                severity VARCHAR(32) NOT NULL,
                payload JSON NOT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_moderation_events_type_created (content_type, created_at)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS job_runs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                job_name VARCHAR(128) NOT NULL,
                status VARCHAR(32) NOT NULL,
                details JSON NULL,
                started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                finished_at TIMESTAMP NULL,
                INDEX idx_job_runs_name_started (job_name, started_at)
            )
            """,
        ]
        async with self._engine.begin() as connection:
            for statement in statements:
                await connection.execute(text(statement))

    async def ping(self) -> bool:
        async with self._engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True

    async def store_analytics_snapshot(self, snapshot_type: str, payload: Mapping[str, Any]) -> None:
        await self._execute(
            """
            INSERT INTO analytics_snapshots (snapshot_type, payload)
            VALUES (:snapshot_type, :payload)
            """,
            {"snapshot_type": snapshot_type, "payload": self._as_json(payload)},
        )

    async def store_recommendation_snapshot(
        self, subject_id: str, recommendation_scope: str, payload: Mapping[str, Any]
    ) -> None:
        await self._execute(
            """
            INSERT INTO recommendation_snapshots (subject_id, recommendation_scope, payload)
            VALUES (:subject_id, :recommendation_scope, :payload)
            """,
            {
                "subject_id": subject_id,
                "recommendation_scope": recommendation_scope,
                "payload": self._as_json(payload),
            },
        )

    async def store_ranking_snapshot(
        self,
        ranking_scope: str,
        payload: Mapping[str, Any],
        subject_id: str | None = None,
    ) -> None:
        await self._execute(
            """
            INSERT INTO ranking_snapshots (ranking_scope, subject_id, payload)
            VALUES (:ranking_scope, :subject_id, :payload)
            """,
            {
                "ranking_scope": ranking_scope,
                "subject_id": subject_id,
                "payload": self._as_json(payload),
            },
        )

    async def store_trend_snapshot(
        self,
        trend_scope: str,
        period_key: str,
        payload: Mapping[str, Any],
    ) -> None:
        await self._execute(
            """
            INSERT INTO trend_snapshots (trend_scope, period_key, payload)
            VALUES (:trend_scope, :period_key, :payload)
            """,
            {
                "trend_scope": trend_scope,
                "period_key": period_key,
                "payload": self._as_json(payload),
            },
        )

    async def store_creator_insight_snapshot(
        self,
        creator_id: str,
        insight_type: str,
        payload: Mapping[str, Any],
    ) -> None:
        await self._execute(
            """
            INSERT INTO creator_insight_snapshots (creator_id, insight_type, payload)
            VALUES (:creator_id, :insight_type, :payload)
            """,
            {
                "creator_id": creator_id,
                "insight_type": insight_type,
                "payload": self._as_json(payload),
            },
        )

    async def record_fraud_event(self, event_type: str, risk_score: float, decision: str, payload: Mapping[str, Any]) -> None:
        await self._execute(
            """
            INSERT INTO fraud_events (event_type, risk_score, decision, payload)
            VALUES (:event_type, :risk_score, :decision, :payload)
            """,
            {
                "event_type": event_type,
                "risk_score": risk_score,
                "decision": decision,
                "payload": self._as_json(payload),
            },
        )

    async def record_moderation_event(self, content_type: str, risk_score: float, severity: str, payload: Mapping[str, Any]) -> None:
        await self._execute(
            """
            INSERT INTO moderation_events (content_type, risk_score, severity, payload)
            VALUES (:content_type, :risk_score, :severity, :payload)
            """,
            {
                "content_type": content_type,
                "risk_score": risk_score,
                "severity": severity,
                "payload": self._as_json(payload),
            },
        )

    async def record_job_run(self, job_name: str, status: str, details: Mapping[str, Any] | None = None) -> None:
        await self._execute(
            """
            INSERT INTO job_runs (job_name, status, details, finished_at)
            VALUES (:job_name, :status, :details, CURRENT_TIMESTAMP)
            """,
            {
                "job_name": job_name,
                "status": status,
                "details": self._as_json(details or {}),
            },
        )

    async def list_job_runs(self, limit: int) -> list[dict[str, Any]]:
        async with self._engine.connect() as connection:
            rows = (
                await connection.execute(
                    text(
                        """
                        SELECT id, job_name, status, details, started_at, finished_at
                        FROM job_runs
                        ORDER BY started_at DESC
                        LIMIT :limit
                        """
                    ),
                    {"limit": limit},
                )
            ).mappings().all()
        return [dict(row) for row in rows]

    async def close(self) -> None:
        await self._engine.dispose()

    async def _execute(self, sql: str, params: Mapping[str, Any]) -> None:
        async with self._engine.begin() as connection:
            await connection.execute(text(sql), params)

    @staticmethod
    def _as_json(payload: Mapping[str, Any]) -> str:
        import json

        return json.dumps(payload, default=str)
