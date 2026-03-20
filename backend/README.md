# LiveGate Backend Workspace

This workspace contains the new LiveGate backend platform under three clean service boundaries:

- `nodejs-service`: public API, auth, realtime orchestration, access coordination, admin workflows
- `python-service`: recommendations, ranking, analytics, moderation support, fraud and risk scoring
- `java-service`: finance-grade transaction recording, commission engine, wallet and payout logic

## Service philosophy

The services share the same product language:

- roles: `viewer`, `creator`, `moderator`, `admin`
- commission split: platform `20%`, creator `80%`
- pricing authority: backend only
- access authority: backend-verified grants only
- financial operations: auditable, idempotent, traceable

## Workspace layout

```text
backend/
  contracts/
  mysql/
  nodejs-service/
  python-service/
  java-service/
  docker-compose.yml
```

## Local development

1. Copy each service's `.env.example` to `.env`.
2. Start infrastructure and services from `backend/docker-compose.yml`.
3. Apply Prisma migrations for the Node.js service against MySQL.
4. Run Flyway migrations for the Java service against MySQL.
5. Start the Python service for internal analytics and ranking endpoints.

## Database coverage

- `backend/mysql/init/01-databases.sql` creates the three service databases.
- `backend/mysql/init/02-python-service.sql` creates the Python service snapshot, fraud, moderation, and job-run tables.
- `backend/nodejs-service/prisma/migrations/0001_init/migration.sql` defines the LiveGate main product schema for MySQL.
- `backend/java-service/src/main/resources/db/migration/V1__init_finance_schema.sql` defines the finance schema for MySQL via Flyway.

## Main Node.js surface

- auth, users, creators, categories
- live sessions, premium content, classes
- access grants and payment confirmation
- notifications, reviews, reports
- wallet summary and payout request integration
- admin moderation and audit endpoints

The legacy `gateway`, `analytics`, and `wallet` folders remain untouched. This workspace is the new production-ready structure requested for LiveGate.

This backend workspace does not include mock/sample seed data. It includes schema, migrations, service code, and container/runtime configuration only.
