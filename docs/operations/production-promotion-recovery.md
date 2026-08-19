# Production Promotion Recovery

This runbook defines how a PetFood source generation is associated with its
recoverable data without storing backup payloads or secrets in Git. It applies
to the vendor snapshot, the final legacy deployment, the beta promotion
candidate, and any later rollback checkpoint.

Use this together with the accepted OpenSpec change and
`docs/development/verification.md`. A source tag is not a backup, and an archive
file is not accepted until an isolated restore has passed.

## Safety boundaries

- Store PostgreSQL dumps, media archives, and RabbitMQ exports outside every
  repository checkout.
- Encrypt backup payloads before they leave the trusted host. Record only the
  secret-manager key reference, never a passphrase or key value.
- Never attach a legacy volume to the active beta network, or a beta volume to
  a legacy recovery environment.
- Identify a source by full commit and tree hashes. Branch names alone are not
  stable recovery identifiers.
- Stop or quiesce writers before a final backup. A filesystem copy of a running
  PostgreSQL data directory is not an accepted database backup.
- Restore code, runtime configuration, database, and media as one generation.
- Disable outbound SMTP and other external side effects during recovery tests.
- Keep public traffic in maintenance mode until all acceptance gates pass.
- Keep runtime environment files outside Git as regular non-symlink files with
  no group or other access. Encrypt a pre-rotation copy before changing a live
  dependency credential.

## Recovery manifest lifecycle

Copy `docs/operations/recovery-manifest.example.yaml` to the protected backup
location for each backup set. The completed manifest may be committed only when
it contains no user data, credentials, secret values, private storage URLs, or
temporary host-specific paths. The authoritative completed copy normally lives
beside the encrypted payload outside Git.

Manifest states are:

1. `prepared`: source and storage identities are recorded, but backup capture
   has not finished;
2. `captured`: artifacts exist and have size and checksum metadata;
3. `verified`: checksums and encryption metadata have been checked;
4. `restore-tested`: an isolated application-level restore has passed;
5. `accepted`: an authorized operator approved the set for rollback or archive
   recovery;
6. `rejected`: the set must not be used; the reason remains in the audit record.

Do not skip directly from `captured` to `accepted`.

## Capture procedure

### 1. Establish identities

Record and independently verify:

- full source commit, tree, annotated tag, and archive branch;
- checksums of Compose files, Dockerfiles, lockfiles, and migration directories;
- Compose project, container, network, database, schema, volume, bucket, and
  object-prefix identities;
- image digests and backup/restore tool versions;
- queue depth and consumer state before quiescence;
- expected database schema/table counts and media object/file counts.

If any storage identity is ambiguous, stop. Do not select a volume by similar
name, creation order, or directory position.

### 2. Quiesce writers

Place the public edge in maintenance mode, stop new user traffic, and wait for
in-flight requests. Stop application producers and consumers before the final
database/media snapshot. Record start and end times plus the observed queue
depths in the manifest.

Use this dependency order for each generation:

1. disable the public edge and any database administration UI;
2. stop the gateway and frontend development edge, when present;
3. stop account, authentication, pets, notification, and recommender services;
4. leave PostgreSQL, media storage, RabbitMQ, and Redis running for logical
   capture;
5. verify zero non-idle application database sessions, record every queue depth
   and consumer count, and fingerprint media file/object counts twice;
6. capture the encrypted database, media, and RabbitMQ artifacts;
7. restart application services, wait for dependency connections, then restart
   gateways and public edges;
8. require all containers to remain running and verify the legacy edge, beta
   gateway health, beta frontend, and RabbitMQ consumers before ending the
   maintenance or rehearsal window.

If a stopped container does not restart cleanly, keep public routing disabled
and investigate it; do not continue with a partially connected generation.

Redis session state is not durable business data and is not restored across
generations. Users must authenticate again after legacy recovery.

### 3. Capture durable artifacts

Create a logical PostgreSQL dump with the server-compatible `pg_dump` version.
Archive the exact media volume or bucket identified in the manifest. Export
RabbitMQ definitions and either drain pending commands or capture and document
their disposition. Do not copy live `.env` files into the backup set.

Write payloads directly to the approved external destination, encrypt them,
then record their byte size and SHA-256 checksum. The checksum applies to the
stored encrypted object; when supported, also record a checksum for the
plaintext stream without retaining an extra unencrypted file.

### 4. Verify capture

Confirm that:

- every expected artifact exists at the storage alias in the manifest;
- recorded sizes and checksums match a new read;
- the encryption key reference resolves for an authorized recovery operator;
- no payload is inside Git or a web-served directory;
- legacy and beta artifacts have distinct backup-set identifiers;
- the source and runtime hashes still match the frozen generation.

## Isolated restore procedure

1. Create a new temporary Compose project and private network whose names cannot
   collide with either live generation.
2. Provision new empty database and media volumes. Never reuse or rename a live
   volume for a restore test.
3. Retrieve the accepted manifest and encrypted payloads through authorized
   backup access. Verify stored-object checksums before decryption.
4. Restore PostgreSQL logically into the new database and restore media into the
   new volume or bucket.
5. Check Flyway history, schema/table counts, representative non-sensitive row
   counts, media counts, and storage-key readability.
6. Start the matching archived application code with isolated configuration,
   no public ports, and outbound notifications disabled or directed to a test
   sink.
7. Verify application startup and representative account, pet, recipe, and
   owner-authorized media reads. Do not use or record personal values as test
   evidence.
8. Record results, tool versions, timestamps, and operator approval in the
   manifest. Mark the set `restore-tested` and then `accepted`, or mark it
   `rejected` with the failure reason.

Removing an isolated recovery environment is a separate destructive operation.
List and verify its exact containers, network, and volumes before requesting
cleanup approval.

## Production rollback

Before rollback, stop writes and capture the currently active beta generation,
especially if it has accepted production traffic. Select one accepted recovery
manifest and verify its source and data generation together. Restore the full
generation while the public edge remains in maintenance mode, then repeat the
same readiness, security-boundary, routing, and end-to-end checks used for the
promotion.

Never run legacy code against beta data or beta code against legacy data as an
ad-hoc rollback shortcut.

Credential rollback is part of generation rollback. Retrieve the encrypted
pre-rotation configuration through authorized recovery access, restore the
dependency credentials, and recreate every affected consumer with that same
configuration. Do not restore only an application environment file while the
database, broker, or object store still expects another value. After either
rotation or rollback, prove the superseded value is rejected from outside the
dependency's local trust boundary and prove the selected value is accepted.

## Retention and access

The backup destination, retention period, recovery owners, RPO, and RTO must be
approved before preliminary capture. A copy outside the application host's
failure domain is strongly recommended. If the owner explicitly accepts
same-disk storage, record that exception and its loss-of-disk risk in the change
evidence; access control and encryption are still required. Periodically
re-check checksums and run a restore drill; successful file listing alone is not
a recovery test.
