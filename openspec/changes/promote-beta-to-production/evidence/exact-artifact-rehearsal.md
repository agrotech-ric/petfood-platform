# Exact-artifact production rehearsal

Date: 2026-08-19

Rehearsal release commit: `892dcaa06b522650e9ddafc818f00d7a81b77fad`

Compose project: `petfood_rehearsal`

Loopback edge: `127.0.0.1:18082`

## Exact application images

| Service | Image ID |
| --- | --- |
| auth | `sha256:1fb19d57b963f18e49e5e831698b1a58a10af69ea246cc5bd197fa61070ce2ab` |
| account | `sha256:e16817e66d679b4e06029d5e6139291f6f23b85599dffd015a89c82e5dd3a761` |
| pets | `sha256:ef907fef99c9d6372d01681abb5d4a18bdc409453ecb46523788286bff081a33` |
| notifications | `sha256:abfcfac0b2923e12db2450a4da12204108b7748d003a1067bfd5fa58af5be0d2` |
| gateway | `sha256:8df2b47b9d354563d0f171301eb02ec12549f4823a7d484cf383be6c2d97cf0d` |
| recommender | `sha256:787fe01a96831ee29bcce982c530325c3a157d6b4f3f6a8a2411378a784a7e57` |
| frontend | `sha256:9490b1f705100ffa08772576cbb495f58be16c1b57a6aad0f41454538a3054bc` |

Every running application container was compared with its exact release-tagged
image ID. No source bind mount is present.

## Restored beta generation

The runtime uses the restore-tested backup set
`beta-promotion-candidate-preliminary-20260819T094922Z` and only these
beta-derived external volumes:

- `petfood_production_candidate_postgres_20260819`;
- `petfood_production_candidate_redis_20260819` (new, intentionally empty
  non-durable session state);
- `petfood_production_candidate_rabbitmq_stable_20260819`;
- `petfood_production_candidate_minio_20260819`; and
- `petfood_production_candidate_photos_20260819`.

PostgreSQL fingerprints matched the preliminary restore: 4 accounts, 3 pets,
6 recipes, and 128 ingredients, with zero failed Flyway migrations. The media
volume contains the expected five files. RabbitMQ contains the seven exported
queues and zero pending messages.

The first raw RabbitMQ rehearsal volume revealed that Mnesia is tied to a
container hostname. The runtime now uses the stable node identity
`rabbit@petfood-rabbitmq`. The encrypted, checksum-verified beta definitions
were imported into a new external volume with that identity. This prevents a
future container recreation from silently selecting an empty node directory.

## Isolation and readiness

- The application network is Docker-internal.
- Only the frontend publishes a port, bound to loopback.
- No application source bind mount exists.
- Mail delivery is routed to the unexposed local container
  `petfood-rehearsal-mailhog`; no production SMTP endpoint is configured.
- All infrastructure health checks passed.
- Recommender and frontend health checks passed.
- Auth, account, pets, notifications, gateway, recommender, and frontend logs
  contain no startup `ERROR`, `FATAL`, or failed-start marker.
- `/petfood/`, a refreshed nested route, and gateway health returned HTTP 200;
  the root boundary returned HTTP 404.

The legacy domain, live beta stores, and remote `main` were not changed. The
isolated runtime remains running for the end-to-end rehearsal in task 6.3.
