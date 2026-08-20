# PetFood Platform Beta

PetFood Platform is a web application for managing pet profiles, health data,
ingredients, and calculated food recipes. This repository contains both the
current beta stack and older main/legacy implementations.

## Active development scope

Use these directories for beta work:

| Area | Active code | Do not edit for beta tasks |
| --- | --- | --- |
| Frontend | `frontend-next/` | `frontend-main/` |
| Backend | `backend-main-sandbox/` | `backend-main/` |
| Recommender | `nutrient-recommender-main/` | - |
| Runtime | `docker-compose.sandbox.yml` | main compose files |

The beta environment is isolated from main: it has its own containers,
database, Redis, RabbitMQ, and MinIO data.

## Quick start

Prerequisites:

- Docker with the Compose plugin;
- access to the proxy targets configured in `frontend-next/.env`;
- SMTP values in the root `.env` when email delivery must work.

Create local environment files once:

```bash
cp .env.example .env
cp frontend-next/.env.example frontend-next/.env
```

Review the copied values, then start the beta stack:

```bash
./run-beta.sh start
./run-beta.sh status
```

The frontend dev server listens on port `5174`. Backend service addresses and
diagnostic commands are documented in
[`README_SANDBOX_BACKEND.md`](README_SANDBOX_BACKEND.md).

Useful lifecycle commands:

```bash
./run-beta.sh logs
./run-beta.sh stop
```

`./run-beta.sh update` pulls the remote `beta` branch. Do not use it when the
working tree contains local changes that have not been saved.

## Architecture at a glance

```text
Browser (React/Vite)
  |-- /api ----------> Gateway -- sid cookie -> JWT
  |                       |-- Account service
  |                       |-- Auth service
  |                       `-- Pets service ----> PostgreSQL / MinIO
  |
                          `-- FastAPI recommender

Account/Pets services --> RabbitMQ --> Notifications service --> SMTP
Sessions and signing data --> Redis
```

The main ownership boundaries are:

- `account`: users, profiles, credentials, sessions, and audit history;
- `auth`: exchange of a session identifier for a short-lived JWT;
- `pets`: pets, health records, ingredients, recipes, and photo metadata;
- `notifications`: outgoing email consumers;
- `gateway`: public entry point and authentication exchange;
- `recommender`: calorie, nutrient, disorder, and recipe calculations.

See [`docs/architecture/overview.md`](docs/architecture/overview.md) for the
request flow, data ownership, and integration boundaries.

## Repository map

```text
frontend-next/                 React 19 + TypeScript + Vite beta UI
backend-main-sandbox/          Java 21 + Spring Boot beta services
nutrient-recommender-main/     Python + FastAPI calculation service
docker-compose.sandbox.yml     isolated beta runtime
run-beta.sh                    beta lifecycle helper
docs/                          durable project documentation
AGENTS.md                      mandatory rules for coding agents
```

## Development

Read these before changing code:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) - workflow and Definition of Done;
- [`docs/development/local-development.md`](docs/development/local-development.md)
  - setup, rebuilds, and troubleshooting;
- [`docs/development/verification.md`](docs/development/verification.md) - checks
  by change type;
- [`docs/development/openspec.md`](docs/development/openspec.md) - specification
  workflow for significant changes;
- [`docs/production-readiness.md`](docs/production-readiness.md) - current
  release blockers and production acceptance criteria;
- [`docs/operations/production-promotion-recovery.md`](docs/operations/production-promotion-recovery.md)
  - backup manifests, isolated restore checks, and coordinated rollback;
- [`docs/operations/production-deployment.md`](docs/operations/production-deployment.md)
  - guarded release inputs, dependency order, and deployment boundaries;
- [`docs/operations/production-proxy-switch.md`](docs/operations/production-proxy-switch.md)
  - reviewed maintenance and production route switching;
- [`AGENTS.md`](AGENTS.md) - repository rules for AI coding agents.

Native toolchains are optional when Docker is used. Direct local development
requires Node.js 20+ for the frontend and Java 21 for the backend.

## Documentation sources of truth

- Runtime topology and environment wiring: `docker-compose.sandbox.yml`.
- Frontend proxy behavior: `frontend-next/vite.config.ts` and
  `frontend-next/.env`.
- Backend routes and authorization: controllers, security configuration, and
  gateway `application.yml`.
- Database schema: Flyway migrations in each service.
- Stable working conventions: `AGENTS.md` and `docs/`.
- Change specifications and history: `openspec/`.

Do not commit `.env` files or real credentials. Examples must contain
placeholders only.
