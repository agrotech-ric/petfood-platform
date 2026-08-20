# Isolated Legacy Restore Rehearsal

Rehearsed: 2026-08-19 from 09:31:28Z to 09:33:42Z

## Isolation and generation identity

The preliminary set `legacy-main-final-preliminary-20260819T092516Z` was
restored into the internal-only Docker network
`petfood-restore-legacy-20260819`. The network reported `Internal=true`; none
of its seven containers published a host port. SMTP/notification services were
not started, and the internal network prevented outbound side effects.

New, explicitly named PostgreSQL, filesystem-media, MinIO, and RabbitMQ volumes
were created. No live legacy or beta volume was mounted by an archived
application container. The application images were the same image IDs used by
the live legacy checkout, whose HEAD and tree match archived commit
`162dba90af60764b9a9a3161a3758b5552da828b` and tree
`677857fc5b5d32b372fed96fb885daf3feea8e43`.

## Passed checks

- The encrypted PostgreSQL custom dump restored with `--exit-on-error`.
- RabbitMQ definitions imported into a new isolated broker.
- Both media archives restored into new, explicitly named volumes.
- Public and pets Flyway histories contained zero failed migrations.
- Restored database counts showed 15 account rows and 30 pet rows; only counts,
  not personal values, were recorded.
- Auth, account, and pets applications each logged a successful Spring startup
  while connected to the restored infrastructure.
- The restored filesystem-media aggregate content hash matched the captured
  legacy volume, and the archived pets-service container successfully read a
  representative mounted media file.
- The isolated containers were stopped after verification. Their containers,
  network, and volumes remain available for review; no recovery data was
  deleted. Live legacy and beta endpoints continued to return HTTP 200.

## Generation-specific recipe evidence

The final legacy database contains 13 `pets` tables and 6 `public` tables, but
zero table names containing `recipe`. Recipe storage belongs to the later beta
generation and cannot be read from this legacy backup. Therefore the literal
task 3.4 requirement to verify a representative legacy recipe read is
impossible without fabricating or importing beta data, which the specification
explicitly forbids.

The accepted planning clarification requires account, pet, and media reads plus
proof that recipes are absent when unsupported by that source generation. The
completed checks satisfy that criterion without importing beta data, so the
backup has advanced to `restore-tested`. It is not yet operator-accepted for a
production rollback.
