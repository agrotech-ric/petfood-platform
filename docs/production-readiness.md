# Production Readiness Audit

Audit date: 2026-08-20
Scope: beta-derived production stack at release commit
`50bef694b392d1bd218c36b9b77d475294421e2a`.

## Verdict

**Accepted for production.** The beta-derived stack passed the release gates
and became the active PetFood generation at
`https://agrotech.astanait.edu.kz/petfood/` on 2026-08-20.

This verdict applies only to the active production topology and beta data
generation. The archived legacy generation retains documented historical
security limitations and is accepted only as an emergency rollback target
under the coordinated maintenance procedure.

## Closed release blockers

- Authentication secrets and session identifiers are absent from application
  logs, login responses do not expose the SID, and the production cookie is
  `Secure`, `HttpOnly`, scoped to `/petfood`, and uses `SameSite=Lax`.
- Only the frontend edge publishes a host port, and it is bound to loopback.
  Application services and durable infrastructure use a private internal
  network.
- Pet photo upload and download operations require authentication and enforce
  resource ownership. Owner and non-owner behavior passed the isolated smoke
  suite.
- Production CORS uses the single official HTTPS origin. An untrusted origin
  receives no allow-origin response header.
- Production object storage uses the controlled internal MinIO endpoint and no
  production trust-all TLS override.
- Authentication throttling and OTP cooldown behavior passed the release smoke
  checks.
- The production runtime uses immutable release-tagged images, Spring production
  profiles, a built frontend served by Nginx, read-only application containers,
  and no source bind mounts.
- The production deployment workflow is manual, serialized, exact-commit
  checked, environment gated, and separated from the validate-only beta
  workflow.
- Production secrets live in a protected file outside Git with no usable
  fallback in Compose. Matching historical credentials were invalidated before
  archive publication.

## Data protection and recovery

- The active generation uses the identified beta PostgreSQL and media stores;
  no legacy store is attached to production.
- Final quiesced legacy and beta backup sets were captured outside Git,
  OpenPGP-encrypted, checksummed, and associated with exact source and runtime
  identities in protected manifests.
- Both generations passed isolated restore rehearsals. The final legacy code is
  preserved by an immutable archive branch and annotated tag.
- Redis is non-durable session state. Recovery invalidates active sessions and
  requires users to authenticate again.
- If production has accepted writes, operators must quiesce it and preserve a
  new consistent beta backup before any rollback.

## Cutover acceptance evidence

- All 11 production containers ran from the approved release generation; every
  defined health check passed and only the frontend exposed a loopback port.
- The active database retained 4 users, 3 pets, 6 recipes, and 128 ingredients;
  filesystem media retained 5 files. RabbitMQ retained seven queues with zero
  pending messages after consumers connected.
- Official-domain checks passed for the SPA root, nested-route refresh, static
  assets, protected account routing, recommender routing, credentialed CORS,
  and rejection of an untrusted origin.
- The full frontend, backend, recommender, Compose, security-boundary, secret
  scan, OpenSpec, diff, restore, rehearsal, and rollback checks are recorded in
  `openspec/changes/promote-beta-to-production/evidence/`.

## Remaining operational improvements

These are not blockers for the accepted release, but remain durable follow-up
work:

- add centralized metrics, dashboards, alerting, latency/error SLOs, and an
  owned on-call process;
- automate encrypted off-host backup retention and scheduled restore drills;
- expand integration coverage for session lifecycle, migrations, ownership,
  and critical frontend journeys in required pull-request checks;
- add dependency, SAST, container, SBOM, signature, and provenance gates with
  remediation ownership;
- define resource limits, capacity tests, graceful-shutdown checks, and
  RabbitMQ retry, dead-letter, and idempotency policies;
- maintain incident-response, privacy, retention, and credential-rotation
  runbooks.

## Release ownership

The release owner approved autonomous execution with escalation only for a
critical issue. The observed RabbitMQ credential mismatch was resolved while
maintenance remained active, all acceptance gates were repeated, and rollback
was not invoked. Exact timing, identifiers, and verification results are in
`openspec/changes/promote-beta-to-production/evidence/cutover-execution.md`.
