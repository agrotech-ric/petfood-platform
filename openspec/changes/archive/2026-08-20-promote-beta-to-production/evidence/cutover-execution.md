# Production cutover execution

Date: 2026-08-20

## Maintenance and quiescence

- Standing owner approval: execute all promotion tasks without another
  confirmation unless a critical issue occurs.
- Accepted rollback exception: exact legacy may be reopened with its documented
  historical security limitations after generation-specific checks pass.
- Maintenance started: `2026-08-20T05:45:27Z`.
- The maintenance image was built from the reviewed promotion source and passed
  its loopback health, HTTP 503, `Retry-After`, API-path, and `ru`/`kk`/`en`
  content checks.
- The complete host Nginx site was copied to the protected operations directory
  before modification; its source SHA-256 was
  `e53a5c938d2b0e166bf6f5157475c79866ea88e37ca16e6c313acf6eec65373b`.
- Only the PetFood upstream changed, from the legacy loopback edge to the
  maintenance loopback edge. `nginx -t` passed before reload.
- Official `/petfood/` and a prefixed account API path both returned HTTP 503
  after reload.
- Legacy and beta frontend, reverse-proxy/gateway, administration UI,
  authentication, account, pets, notifications, and recommender containers
  were stopped. Durable infrastructure remained running only for consistent
  capture.
- The directly published beta development frontend was no longer reachable.

No production source branch, durable store, or application artifact had been
changed when maintenance and writer quiescence completed.

## Final recovery capture

- Final legacy and beta captures started at `2026-08-20T05:47:35Z` only after
  all application writers, message producers, and consumers were stopped.
- The legacy capture contains only the final legacy PostgreSQL database,
  filesystem media, MinIO data, and RabbitMQ definitions. Its protected local
  backup identifier is `legacy-main-final-cutover-20260820T054735Z`.
- The beta capture contains only the selected beta PostgreSQL database,
  filesystem media, MinIO data, and RabbitMQ definitions. Its protected local
  backup identifier is `beta-production-cutover-20260820T054735Z`.
- Both backup directories and manifests have restricted local permissions. All
  artifacts are OpenPGP encrypted and their recorded sizes and SHA-256 values
  were verified after capture.
- PostgreSQL 16.13 successfully read both custom-format dump catalogs; the
  media archives were listed; and both RabbitMQ exports parsed as JSON.
- Pre- and post-capture fingerprints matched: legacy retained 15 accounts, 30
  pets, and 17 filesystem media files; beta retained 4 accounts, 3 pets, 6
  recipes, 128 ingredients, and 5 filesystem media files. Both generations had
  zero pending RabbitMQ messages and zero non-idle database sessions.
- Each final manifest links the capture to its exact source generation and to a
  previously successful isolated restore rehearsal. Redis remains deliberately
  excluded as non-durable session state.

All final recovery assets were complete and verified, so the cutover was not
stopped at the recovery gate.

## Protected promotion and deployment

- A fresh clone independently resolved the vendor archive branch and tag to
  `938de22696138012cb6f2a54cd0218fa88bc8009`, the final legacy v3 branch and
  tag to `2cb8259dd01bbba8eff7f9f2c5169e58b072d8f7`, and the frozen beta branch
  and tag to `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`.
- Promotion PR #85 was mergeable and clean immediately before protected merge.
  GitHub merged it at `2026-08-20T05:54:12Z`; production `main` became
  `50bef694b392d1bd218c36b9b77d475294421e2a`.
- Application build contexts at promoted `main` were byte-identical to the
  already verified release-image contexts. The exact reviewed image IDs were
  tagged with the promoted `main` SHA before deployment.
- Production attached the original beta PostgreSQL, MinIO, and filesystem
  media volumes. It used the isolated Redis volume and the stable RabbitMQ
  volume restored from the same beta candidate; no legacy volume was attached.
- The production environment file is protected outside Git and passed exact
  release, secret-fallback, topology, and external-volume validation.

## Dependency restoration and acceptance

- PostgreSQL, Redis, RabbitMQ, MinIO, authentication, account, pets,
  recommender, notifications, gateway, and frontend started in dependency
  order. Only the frontend publishes a host port, bound to loopback.
- The first notification startup exposed a RabbitMQ credential mismatch: the
  stable restored broker correctly retained its rehearsal credential rather
  than the source runtime credential. Public traffic remained in maintenance.
  The protected production configuration was aligned with that broker, the
  three RabbitMQ clients were recreated, broker authentication passed, and all
  client restart counts remained zero afterward.
- The selected beta generation retained 4 users, 3 pets, 6 recipes, 128
  ingredients, and 5 filesystem media files. Seven RabbitMQ queues contained
  zero pending messages and five active consumers after startup.
- All 11 production containers were running; every defined health check passed.
  Recent logs contained no release-blocking startup, Flyway, memory, binding,
  fatal, or panic pattern after remediation.
- Through the official HTTPS domain, the SPA root, refreshed nested route, and
  frontend asset returned HTTP 200. Unauthenticated account and recommender
  routes returned HTTP 401. The official origin received credentialed CORS
  headers and an untrusted origin received no allow-origin header.
- SMTP configuration was restored from the approved beta runtime and the
  notification consumers remained connected. No test message was sent through
  the real production relay during cutover.

## Traffic reopening

- Host Nginx configuration was validated before reload. The PetFood upstream
  alone changed from the maintenance loopback edge to production loopback port
  `18080`.
- Public traffic reopened at `2026-08-20T06:00:31Z`. Maintenance lasted 15
  minutes from its recorded start. Official acceptance passed after reopening,
  so rollback was not invoked.
- The maintenance container was stopped after acceptance. The complete
  pre-cutover Nginx configuration and both final encrypted backup generations
  remain available for recovery.

## Stabilization and recovery isolation

- Three post-open stabilization samples passed between `2026-08-20T06:04:12Z`
  and `2026-08-20T06:06:53Z`. All 11 containers remained running with zero
  restarts, every defined health check stayed healthy, official root and nested
  routes returned HTTP 200, protected unauthenticated access returned HTTP 401,
  PostgreSQL remained responsive, and RabbitMQ retained zero pending messages.
- Post-remediation production logs contained no release-blocking startup,
  Flyway, memory, binding, fatal, or panic pattern. Resource samples showed no
  immediate CPU or memory saturation.
- The immutable archive branch and tag rulesets remain active, prohibit update
  and deletion, and have no bypass actor. Legacy application containers remain
  stopped, legacy infrastructure is absent from every production network, and
  no production container mounts a legacy volume.
- Both deployment workflows remain manual-only. Production validates an exact
  current `main` commit; beta is validate-only. Archive refs therefore cannot
  trigger either workflow or attach a production store.
- The production-readiness audit now records the accepted topology, closed
  blockers, recovery ownership, and remaining non-blocking operational work.
- Because rollback was not invoked, no post-write rollback backup was required.
  The durable rollback rule remains: quiesce production and create a new
  consistent beta backup before restoring another generation after accepted
  writes.
