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
