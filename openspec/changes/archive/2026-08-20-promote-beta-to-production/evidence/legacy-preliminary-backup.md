# Preliminary Legacy Backup Evidence

Captured and structure-verified: 2026-08-19

## Backup identity

- Generation: `legacy-main-final`
- Source commit: `162dba90af60764b9a9a3161a3758b5552da828b`
- Source tree: `677857fc5b5d32b372fed96fb885daf3feea8e43`
- Annotated tag: `legacy-main-final-2026-08-19`
- Compose definition SHA-256:
  `3c83fac0cb0c8f2bf8cbf06b2b85c615788d95bdc95dc4da47734363aaeac422`
- Backup-set ID: `legacy-main-final-preliminary-20260819T092516Z`
- Storage alias: `petfood-local-encrypted-backups`
- Authoritative manifest: stored beside the payload as `manifest.yaml`, outside
  Git, with mode `0600`

Capture ran while the writer-quiescence rehearsal was active. Commands named
only the legacy database container and the exact
`petfood_platforma_pets_photos` and `petfood_platforma_minio_data` volumes.
The RabbitMQ definition export came only from `pets_rabbitmq`. No beta database,
volume, container, or network was attached.

## Encrypted artifacts

| Role | Stored size | SHA-256 |
| --- | ---: | --- |
| PostgreSQL custom dump | 70,602 bytes | `9d02fac0cfa49f928cb868e88b2cf30687aa57d99c16f9879ab3bfe2fef9bfe3` |
| Filesystem pet photos | 792,319 bytes | `625dae28ec2cc49e3d1046cd4b250bef9e632f78746f2d407c8daad0c4b6f460` |
| MinIO data | 5,599 bytes | `ce47032cd65078657658df2d295ad787eb3c9bffb2c026a1ddea56bebdf2fe88` |
| RabbitMQ definitions | 1,015 bytes | `c9df71cf433a64d82d48cf2f5977e62de710e9208f03fae6d7cdeb0dd767a3fc` |

Every payload is OpenPGP encrypted. A second full read reproduced all four
stored-object checksums. Authorized decryption exposed a valid PostgreSQL
custom archive with 128 TOC entries and 19 table-data entries, media archives
with 23 and 36 entries, and valid RabbitMQ definitions JSON. The manifest parses
as YAML and records PostgreSQL 16.13, RabbitMQ 3.13.7, BusyBox tar 1.36.1, and
the non-secret encryption key reference.

This is a `verified` preliminary capture, not yet an accepted recovery set.
Task 3.4 must restore it into isolated storage and perform representative reads
before the manifest can advance to `restore-tested` or `accepted`.
