# Preliminary Beta Backup and Production-Storage Rehearsal

Captured and restore-tested: 2026-08-19

## Backup identity

- Generation: `beta-promotion-candidate`
- Source commit: `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`
- Source tree: `8428f5f908cd9a63801975c11c90dbb571cf8ac5`
- Annotated tag: `beta-promotion-candidate-2026-08-19`
- Sandbox Compose SHA-256:
  `2678a02bdf62968530ca0c786a4d935d942ae12aa91b108262787d1a05cb8c2c`
- Backup-set ID: `beta-promotion-candidate-preliminary-20260819T094922Z`
- Storage alias: `petfood-local-encrypted-backups`

Only beta writers were stopped. The legacy domain remained available. After
capture, every beta application container restarted without a loop, and both
the beta gateway health endpoint and beta frontend returned HTTP 200.

## Encrypted artifacts

| Role | Stored size | SHA-256 |
| --- | ---: | --- |
| PostgreSQL custom dump | 46,335 bytes | `9fa76c13af8bec46959e0a59d0489d526bc81f532859125e6996dff4c3bb00f5` |
| Filesystem pet photos | 865,385 bytes | `874dfe15d36c483cca4bb5b1c1b3c7359289d73b0921e9ea460dcacd01ca4b0e` |
| MinIO data | 4,287 bytes | `c6d109e39bd9f1f340237a463af863e7de62fd34b61fa0b8b251c841d3f06efc` |
| RabbitMQ definitions | 1,009 bytes | `a07ea02e67a5e6e40848cfeffc9293e0c8699a0d094f857bd0220a9d35172eae` |

Authorized decryption exposed a valid database archive with 211 TOC entries
and 29 table-data entries, filesystem and MinIO archives with 14 and 20 entries,
and valid RabbitMQ definitions JSON.

## Explicit production-storage rehearsal

The backup was restored into a new internal-only network named
`petfood-production-candidate-20260819`, with no published ports and these
explicit durable identifiers:

- `petfood_production_candidate_postgres_20260819`;
- `petfood_production_candidate_photos_20260819`;
- `petfood_production_candidate_minio_20260819`;
- `petfood_production_candidate_rabbitmq_20260819`.

Inspection of every named durable mount found zero legacy or live-beta volume
names. The restored PostgreSQL schemas contained 7 public and 22 pets tables,
zero failed Flyway migrations, 4 account rows, 3 pet rows, 6 recipes, and 128
ingredients. Only counts were recorded. Auth, account, and pets beta services
started against the restored stores; the pets service read restored media.

The filesystem-media aggregate hash matched the live beta source. Both the live
and restored MinIO stores contained zero business-object files. Internal
`.minio.sys` files were not used as a content hash because MinIO rewrites its own
metadata during startup. Seven RabbitMQ queues restored with zero pending
messages.

The isolated rehearsal containers were stopped after verification. Their
containers, network, and volumes remain for review; no recovery data was
deleted. This set is `restore-tested`, but not yet operator-accepted for final
cutover.
