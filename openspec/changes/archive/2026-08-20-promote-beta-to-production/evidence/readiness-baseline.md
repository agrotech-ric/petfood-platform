# Production Readiness Baseline

Captured: 2026-08-19 (Asia/Almaty)

This is a source and runtime reassessment for the promotion gate. It does not replace the durable audit in `docs/production-readiness.md`; that document is updated after implementation and verification establish the final state.

## Security blockers

### Release-blocking findings

1. Pets-service still builds the MinIO client with a trust-all certificate manager and accepts every hostname. Production MinIO TLS verification remains a P0 blocker.
2. Production configuration is not fail-fast and secret-backed. The sandbox runtime contains usable development defaults for PostgreSQL, RabbitMQ, and MinIO and must not be promoted unchanged.
3. The beta gateway and Vite development server are host-published on all interfaces. The final public topology must expose only the intended production edge.

### Previously hardened boundaries requiring regression verification

- Cookie-only sessions and environment-aware cookie attributes have code and focused tests, but the production values are not yet wired through a production runtime.
- Gateway source rate limits, account OTP controls, safe credential logging, exact CORS, private pet-photo ownership, gateway-only recommender routing, and internal beta service isolation are present in the current beta source and main specs.
- These controls remain cutover gates and require the full automated and public-domain smoke checks before release.

## Runtime and delivery blockers

1. No immutable production runtime exists for the active beta stack. The running frontend is source-mounted Vite development mode and Java services use Spring `dev` profiles.
2. A push to `main` currently executes the legacy deployment workflow against the old checkout and compose stack. The beta workflow also hard-resets a persistent checkout and contains no pre-deployment quality gate.
3. The frontend route guard has `DEV_MODE = true`, bypassing authenticated and role-aware navigation.
4. Java readiness coverage is incomplete, several dependencies use start order instead of readiness, and the public edge can become available before the full application is ready.
5. Production image/version pinning, build-once artifact identity, promotion evidence, and automated rollback are absent.

## Quality blockers

1. Backend tests cover selected gateway, account, notification, and photo security behavior, but core authentication/session lifecycle, resource ownership, recipes/ingredients, Flyway integration, and critical journeys remain incomplete.
2. No application frontend test suite was found. Lint and both root and `/petfood/` production builds must be rerun in the pinned toolchain.
3. Recommender coverage remains limited and its exact beta/main calculation parity requires verification.
4. CI does not currently enforce frontend, backend, recommender, OpenSpec, compose, secret-scan, dependency, or image gates before deployment.

## Data and operations blockers

1. No accepted encrypted backup set, retention policy, recovery manifest, or isolated restore proof exists yet for either generation.
2. No documented RPO/RTO, maintenance decision deadline, operator ownership, or tested coordinated rollback exists.
3. Health, logs, metrics, alerting, SMTP canary behavior, RabbitMQ retry/dead-letter policy, and post-deploy monitoring are not sufficient for an unattended production cutover.
4. Container hardening remains incomplete: mutable or floating image tags exist, and non-root/read-only filesystem/resource-limit policy is not consistently enforced.

## Cutover gate

The domain must not be switched and `main` must not trigger deployment until the P0 MinIO trust issue, production secret/configuration boundary, immutable production runtime, guarded deployment workflow, route-guard bypass, explicit storage identity, accepted backup/restore evidence, and pre-cutover verification suite are closed. Remaining lower-priority operational hardening must be explicitly accepted and recorded rather than silently treated as complete.
