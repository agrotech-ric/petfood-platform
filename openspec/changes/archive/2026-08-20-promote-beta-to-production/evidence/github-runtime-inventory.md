# GitHub and Runtime Inventory

Captured: 2026-08-19 (Asia/Almaty)

This inventory is read-only and intentionally excludes environment values, runner credentials, database rows, and personal data.

## GitHub state

- Repository: `agrotech-ric/petfood-platform`; default branch: `main`.
- `main` and `beta` report branch protection enabled through the public branches API.
- `old-main` exists at the same commit as `main` but does not report protection enabled.
- No remote tags and no open pull requests were reported.
- Detailed protection rules and registered runner details require authenticated GitHub administration access and were not exposed by the public API.
- Both deploy workflows target the `[self-hosted, linux, petfood-prod]` runner labels.
- The local legacy checkout contains runner registration files. Their contents were not read or recorded.

## Deployment triggers

| Workflow | Trigger | Checkout path | Current behavior |
| --- | --- | --- | --- |
| `deploy-self-hosted.yml` | push to `main` or manual | `/home/iot/PetFood/petfood_platforma` | Hard-resets to `origin/main`, stops the legacy compose project, and rebuilds it. |
| `deploy-beta.yml` | push to `beta` or manual | `/home/iot/PetFood/petfood_platforma-beta` | Hard-resets to `origin/beta`, selectively rebuilds sandbox services, and uses the source-mounted Vite development container. |

A promotion merge must not occur until the `main` trigger is replaced with the gated beta-derived production deployment. Archive branch and tag patterns are not current deployment triggers.

## Live generation separation

| Area | Legacy generation | Beta generation |
| --- | --- | --- |
| Network | `petfood_platforma_pets_network` | `pets_sandbox_pets_network_sandbox` |
| Database container | `pets_postgres` | `pets_sandbox_postgres` |
| Database | `pets_db` | `pets_db_sandbox` |
| PostgreSQL volume | `petfood_platforma_postgres_data` | `pets_sandbox_postgres_data_sandbox` |
| Media filesystem volume | `petfood_platforma_pets_photos` | `pets_sandbox_pets_photos_sandbox` |
| MinIO volume | `petfood_platforma_minio_data` | `pets_sandbox_minio_data_sandbox` |
| RabbitMQ volume | `petfood_platforma_rabbitmq_data` | `pets_sandbox_rabbitmq_data_sandbox` |
| Redis volume | `petfood_platforma_redis_data` | `pets_sandbox_redis_data_sandbox` |
| Public application edge | legacy nginx on host port 5555 | beta gateway on host port 18190 plus Vite dev server on 5174 |

The official `/petfood/` domain currently returns the same legacy frontend metadata as the local legacy edge. The beta gateway responds separately, and its frontend is still the development server. The domain cutover has not occurred.

## Persistent-data fingerprints

- Legacy database: approximately 9.6 MB, with 13 tables in the `pets` schema and 6 in `public`.
- Beta database: approximately 10.4 MB, with 22 tables in the `pets` schema and 7 in `public`.
- Legacy filesystem media: 17 files; beta filesystem media: 5 files.
- Both RabbitMQ generations currently report the expected mail/SMS queues with zero pending messages; consumer counts differ by queue as expected for the running services.
- MinIO data directories currently contain no regular object files; both generations use a separate filesystem media volume for observed pet photos.

Volume byte counts were captured during inventory and must be recaptured in each backup manifest. They are fingerprints, not backup evidence.

## Integration-key inventory

Required production configuration includes database address/name/user/password, Redis address, JWT issuer/JWK settings, account and pets internal URLs, gateway session exchange, recommender URL, RabbitMQ address/user/password, SMTP host/port/TLS/sender credentials, media storage endpoint/bucket/access credentials, session cookie security/path, exact CORS origins, public base path, and rate-limit key material.

Only key names were inspected. Values remain in the existing environment or container configuration and were not copied into this change.

## Current routing observations

- The legacy nginx publishes the legacy frontend, API gateway, recommender, MinIO, and RabbitMQ management routes on its internal edge.
- The host-level domain proxy serves the application beneath `/petfood/` and currently reaches the legacy generation.
- The beta gateway is the only host-published beta backend; beta MinIO management/API bindings are loopback-only.
- The beta Vite development server and beta gateway currently listen on all host interfaces. Neither is an acceptable final production frontend/runtime configuration.
