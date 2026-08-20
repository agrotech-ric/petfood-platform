# Production Readiness Audit

Audit date: 2026-08-07  
Scope: active beta stack (`frontend-next`, `backend-main-sandbox`,
`nutrient-recommender-main`, `docker-compose.sandbox.yml`, and CI workflows).

## Verdict

**Not production-ready.** The stack is suitable for isolated development and
beta testing. It must not be exposed to untrusted networks or used for real user
data until all P0 and P1 items below are closed and verified.

The main blockers are disclosure of authentication secrets in logs, insecure
session handling, gateway bypass through published service ports, unauthenticated
file operations, permissive CORS, disabled TLS verification, a development-only
frontend/runtime profile, and the absence of effective quality gates.

## Priority model

- **P0 - release blocker:** direct risk of account compromise, secret exposure,
  unauthorized access, or unbounded resource abuse.
- **P1 - required before production:** substantial reliability, delivery, data,
  or operational risk.
- **P2 - required for dependable operation:** hardening that may follow the first
  blockers but must have an owner and deadline.
- **P3 - improvement:** maturity work that reduces long-term cost and risk.

## P0 release blockers

### P0-1: Authentication secrets are written to logs

Evidence:

- account-service prints registration, 2FA, and password-reset codes in
  `AccountService`;
- notifications-service prints the same codes and recipient addresses in
  `MailConsumers`;
- pets-service prints the complete JWT and all claims when a pet is created;
- gateway logs the complete `sid` value in `SidToJwtGlobalFilter` and
  `AuthExchangeClient`.

Impact: anyone with log access can take over sessions, bypass verification, or
reset passwords. Centralized logs would multiply the exposure.

Exit criteria:

- no password, OTP, JWT, SID, cookie, or SMTP secret is logged at any level;
- automated tests or a log-redaction check cover these values;
- existing retained logs are treated as compromised and removed according to a
  documented incident procedure.

### P0-2: Session cookie and response handling are unsafe

Evidence: every `sid` cookie in `AccountController` uses `Secure=false`, and the
email login response also returns the raw SID in JSON.

Impact: a session can be exposed over plaintext transport, browser tooling,
frontend logs, or application monitoring.

Exit criteria:

- production cookies use `HttpOnly`, `Secure`, an explicitly reviewed
  `SameSite` policy, constrained path/domain, and environment-specific settings;
- SID is never returned in a response body;
- HTTPS is mandatory at the public edge and HTTP is redirected or unavailable;
- login, logout, expiration, rotation, and revocation are integration-tested.

### P0-3: Internal services are reachable directly and bypass the gateway

Evidence: sandbox compose publishes auth, account, pets, notifications,
recommender, MinIO API/console, and gateway ports to all host interfaces.
Downstream Spring services have their own public exceptions, so direct access
does not have the same boundary as gateway access.

Impact: an attacker can bypass gateway authentication, CORS, routing policy, and
future rate limits.

Exit criteria:

- only the intended edge proxy is publicly reachable;
- databases, Redis, RabbitMQ, MinIO console, and application services are on
  private networks with no public host bindings;
- firewall rules and an external network scan confirm the boundary.

### P0-4: Filesystem photo endpoints allow unauthenticated writes

Evidence: pets `SecurityConfig` permits `/api/v1/pets/photos/upload` and
`/download`; `PetPhotoController` accepts an arbitrary request body and replaces
the selected file. Compose publishes pets-service directly. The upload endpoint
does not enforce authentication, ownership, content type, or an application
size limit.

Impact: unauthorized file replacement, data disclosure by guessed object key,
and disk exhaustion.

Exit criteria:

- uploads require authenticated, owner-bound, short-lived authorization;
- downloads enforce the intended privacy policy;
- file type, size, object key, quota, and overwrite behavior are validated;
- abuse and ownership tests cover direct and gateway access.

### P0-5: CORS trusts every origin while allowing credentials

Evidence: gateway `application-dev.yml` uses `allowedOriginPatterns: "*"` with
`allowCredentials: true`; error responses also reflect the request origin and
set credential access headers.

Impact: hostile origins can make credentialed browser requests, increasing the
impact of cookie and CSRF weaknesses.

Exit criteria:

- production has an explicit allowlist of HTTPS origins;
- CORS behavior is consistent for normal and error responses;
- preflight and cross-origin credential tests exist;
- cookie-based state-changing endpoints have a documented CSRF defense.

### P0-6: MinIO TLS verification is disabled

Evidence: `MinioConfig` installs a trust-all certificate manager and accepts
every hostname.

Impact: object credentials and pet data are vulnerable to interception or
server impersonation when TLS is used.

Exit criteria:

- the default JVM trust chain or a controlled CA bundle is used;
- hostname validation cannot be disabled in production;
- connection failure with an invalid certificate is tested.

### P0-7: Public authentication flows have no rate limiting

Evidence: registration, login, verification, SID exchange, and password-reset
paths have no rate limiter, lockout policy, or edge throttle in the active
stack.

Impact: credential stuffing, password/OTP guessing, email flooding, resource
exhaustion, and account enumeration.

Exit criteria:

- layered per-IP and per-account limits exist at the edge and application level;
- verification attempts are capped and codes are invalidated safely;
- responses do not reveal whether an account exists;
- load and abuse tests verify limits and recovery behavior.

## P1 requirements before production

### P1-1: Production runtime does not exist

The beta launcher runs `npm ci && npm run dev` in a mutable Node container and
activates Spring's `dev` profile for every service. There is no production
compose/profile for the active beta code.

Required outcome: immutable versioned images, a multi-stage frontend build
served by a production web server, explicit production Spring configuration,
no bind-mounted source, and a reproducible release manifest.

### P1-2: Client-side access control is deliberately disabled

`frontend-next/src/components/PrivateRoute.tsx` sets `DEV_MODE = true` and always
renders protected screens. Backend authorization must remain authoritative, but
the production UI must enforce authenticated navigation and roles without a
compile-time bypass.

### P1-3: CI/CD deploys without quality or security gates

The workflows reset a self-hosted checkout and deploy immediately. They do not
run tests, frontend build/lint, dependency audit, secret scan, image scan,
migration validation, or smoke tests. Deployment has no automated rollback.

Required outcome: pull-request and release gates must pass before deployment;
artifacts are built once, identified by digest/version, promoted between
environments, smoke-tested, and rolled back through a documented procedure.

### P1-4: Automated tests do not cover core behavior

Observed result of `bash ./gradlew test`: build successful, but gateway, account,
auth, and pets report `NO-SOURCE`; only notifications has a context-load test.
The frontend has no tests. The recommender has one integration test module.

Required outcome: integration tests cover authentication/session lifecycle,
roles and ownership, public-path behavior, recipe/ingredient contracts, Flyway
migrations, photo authorization, and critical user journeys.

### P1-5: Frontend quality gates are broken

Observed results:

- `npm run lint`: 109 errors because ESLint is not configured to parse
  TypeScript/TSX correctly;
- `npm run build`: cannot run in the current host environment (Node 18 versus
  Vite's Node 20.19+ requirement, plus ownership problems in `node_modules`);
- `npm audit --omit=dev`: fails on the Vite npm alias instead of producing a
  vulnerability report.

Required outcome: lint, type-check, production build, tests, and a functioning
dependency audit run in a pinned CI toolchain and are mandatory gates.

### P1-6: Secrets and defaults are development-grade

Sandbox compose hardcodes database, RabbitMQ, and MinIO administrative
credentials and enables remote use of RabbitMQ's `guest` account. Application
configuration also has weak fallback credentials.

Required outcome: fail-fast required secrets from a managed secret store,
least-privilege service accounts, rotation procedure, no administrative account
for application traffic, and no usable production fallback.

### P1-7: Backup and disaster recovery are undefined

No backup, restore, retention, encryption, or recovery verification was found
for PostgreSQL, MinIO, or other persistent volumes.

Required outcome: documented RPO/RTO, automated encrypted backups, off-host
retention, scheduled restore drills, and verified consistency between database
records and objects.

### P1-8: Health and deployment readiness are incomplete

Only infrastructure and recommender have compose health checks. Java containers
are considered started before they are ready; dependencies often use
`service_started`. No end-to-end post-deploy check validates login or a protected
request.

Required outcome: liveness/readiness endpoints for every service, dependency
health propagation, startup timeouts, graceful shutdown, and release smoke
tests.

## P2 operational hardening

- Add structured logs with correlation/request IDs and PII redaction.
- Add metrics, dashboards, alerts, error-rate and latency SLOs.
- Add retry/dead-letter/idempotency policy for RabbitMQ consumers.
- Pin Python dependencies and container base images; avoid `latest` tags.
- Run containers as non-root with read-only filesystems, dropped capabilities,
  resource limits, and writable mounts only where required.
- Establish dependency, container, SAST, and secret scanning with remediation
  SLAs.
- Review Swagger/Actuator/debug exposure for production profiles.
- Define database migration rollout compatibility and failure recovery.
- Add request/body/time limits at the edge, especially for recommender calls.
- Review error responses so internal exception messages are never returned.

## P3 maturity improvements

- Generate and publish an SBOM for release artifacts.
- Sign images and retain provenance for releases.
- Add architecture decision records for authentication, object storage, and
  deployment topology.
- Add capacity tests for recommender memory/CPU and concurrent calculations.
- Create incident-response, on-call, data-retention, and privacy runbooks.

## Recommended execution order

1. **Contain exposure:** remove secret logging, secure cookies, close direct
   ports, protect photo endpoints, restrict CORS, restore TLS validation.
2. **Create a production runtime:** immutable images, production profiles,
   controlled secrets, HTTPS edge, private networks.
3. **Create trustworthy gates:** fix frontend tooling, add critical integration
   tests, scan dependencies/secrets/images, validate migrations.
4. **Protect data:** implement backups, restores, release rollback, and smoke
   tests.
5. **Operate intentionally:** health/readiness, metrics, logs, alerts, SLOs, and
   incident runbooks.

Do not combine all of these into one change. Each P0 should be a focused,
reviewable task with an explicit test and rollback note.

## Definition of Production Ready

The active stack may be called production-ready only when:

- every P0 and P1 item is closed with recorded evidence;
- the public attack surface matches the documented edge topology;
- no authentication secret or personal data is emitted to logs;
- HTTPS, secure sessions, CORS, CSRF defenses, and abuse limits are tested;
- critical user and ownership flows pass in CI;
- production images are immutable, scanned, versioned, and reproducible;
- migrations are validated against a production-like database;
- backup restoration meets the agreed RPO/RTO;
- all services expose useful readiness/liveness signals;
- dashboards and alerts exist for availability, latency, errors, saturation,
  queues, database, storage, and email delivery;
- a release can be rolled back using a tested runbook;
- named owners approve security, operations, and product acceptance.

## Checks performed during this audit

- inspected active compose, Dockerfiles, application/security configuration,
  session flow, public endpoints, CI workflows, and dependency manifests;
- `docker compose -f docker-compose.sandbox.yml config --quiet` - passed;
- `bash ./gradlew test` - passed, with the coverage limitation described above;
- `npm run lint` - failed with 109 errors;
- `npm run build` - not executable in the current host toolchain/permissions;
- `npm audit --omit=dev --json` - failed to parse the Vite npm alias;
- searched the repository for tests, rate limiting, backup/restore,
  observability, container hardening, and secret logging.

This is a static repository audit, not a penetration test, load test, privacy
assessment, or disaster-recovery exercise. Those remain required before a real
production decision.
