# Live Credential Rotation Evidence

Date: 2026-08-19
Approval: the repository owner explicitly approved live credential rotation and
the required PetFood service restart in the conversation before execution.

## Scope

The live legacy and beta generations were checked against the historical
development values classified in `secret-scan-baseline.md`. The following
matching credentials were replaced:

- PostgreSQL passwords for both generations;
- RabbitMQ passwords for both generations;
- MinIO root access keys and secret keys for both generations;
- the beta account-service rate-limit pepper.

SMTP was not rotated. It is an external provider credential and did not match
the historical development defaults that caused the archive-publication gate.
Redis remains an internal unauthenticated development dependency; its session
state is non-durable and was not reclassified as a credential by this task.

## Protected configuration and rollback

- Replacement values are stored outside Git under the protected production
  configuration alias `petfood-production-config`.
- The configuration directory was verified as mode `0700`; both generation
  files were verified as regular, non-symlink mode-`0600` files.
- The original runtime configuration was encrypted before mutation in backup
  set `live-credential-rotation-20260819T101419Z`.
- The encrypted files, checksum list, and rollback manifest are mode `0600` in
  a mode-`0700` backup directory.
- The backup uses the previously verified local recovery key fingerprint and
  contains no plaintext copy of either environment file.
- No credential value was written to this evidence or to Git.

## Execution

Writers and public/development edges for the two PetFood generations were
stopped. PostgreSQL and RabbitMQ credentials were changed in place. The
PostgreSQL, RabbitMQ, and MinIO containers were then recreated with their same
named volumes, followed by the dependent application services. The legacy
edge, beta frontend, and administration edge were restarted only after the
dependencies were healthy. The official reverse-proxy route was not changed.

## Authentication proof

The checks were run from outside each dependency's local trust boundary:

| Generation | Dependency | Historical value | Replacement value |
| --- | --- | --- | --- |
| Legacy | PostgreSQL | rejected | accepted |
| Beta | PostgreSQL | rejected | accepted |
| Legacy | RabbitMQ | rejected | accepted |
| Beta | RabbitMQ | rejected | accepted |
| Legacy | MinIO S3 SigV4 | HTTP 403 | HTTP 200 |
| Beta | MinIO S3 SigV4 | HTTP 403 | HTTP 200 |

The beta account-service runtime value matched the external replacement pepper
and differed from the historical fallback. All database, RabbitMQ, MinIO, and
pepper consumers were compared with the protected configuration in memory;
every comparison passed without printing values.

## Runtime acceptance

- all legacy and beta PetFood containers were running; infrastructure health
  checks were healthy;
- no error, exception, authentication-failure, or access-denied lines were
  found in the restarted Java services during the verification window;
- the legacy loopback edge returned HTTP 200;
- the beta frontend returned HTTP 200;
- an unauthenticated beta protected request returned the expected HTTP 401;
- the official `/petfood/` domain returned HTTP 200 through the unchanged
  legacy route;
- RabbitMQ application queues had zero pending messages, and all implemented
  email queues had an active consumer.

Result: the historical live values are inert, affected services use protected
external configuration, and the credential gate for remote archive publication
is satisfied. Remote Git operations remain separately gated.
