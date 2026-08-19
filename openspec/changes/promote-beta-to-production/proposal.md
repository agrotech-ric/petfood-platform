## Why

The repository contains an original vendor-delivered version, an evolved legacy `main`, and a beta line that is intended to become the production system. The team needs a controlled promotion that makes beta the new `main` and domain deployment without losing any source generation or legacy production data.

## What Changes

- Preserve the original vendor source and the final legacy `main` exactly as delivered as remotely available, immutable release references before changing `main`; invalidate any historical development credential that is still usable before publishing new archive references.
- Promote the beta source tree and its existing security and deployment contracts to `main` while retaining the ancestry of both development lines.
- Make the beta data stores the only active production data stores on the domain; do not merge legacy `main` data into them.
- Create restorable, access-controlled backups of the legacy PostgreSQL and pet-photo/object data, plus the metadata needed to identify and restore their matching code and runtime configuration.
- Perform a maintenance-window cutover in which the existing site may be fully stopped, then reconnect and verify the domain, reverse proxy, application services, storage, messaging, email, and other required integrations.
- Replace the legacy automatic `main` deployment path with a guarded, reproducible production deployment for the active beta stack; production must not run the Vite development server or Spring development profiles.
- Define pre-cutover gates, post-cutover acceptance checks, rollback triggers, and a rehearsable recovery path.
- **BREAKING**: The beta application replaces the legacy application on the production domain, and the legacy production data becomes archived rather than available through the active application.

## Capabilities

### New Capabilities

- `release-version-preservation`: Durable, remotely accessible references for the vendor source, legacy `main`, promoted beta release, and their matching data-backup manifests.
- `production-cutover`: Controlled promotion of beta to `main` and the production domain, including data isolation, maintenance mode, integration restoration, acceptance checks, and rollback.

### Modified Capabilities

None. Existing security, network-boundary, and subpath-deployment requirements remain in force for the promoted beta system.

## Impact

- Affected systems: GitHub branches, tags and protection rules; the `main` and beta histories; `.github/workflows`; production runtime definitions; the reverse proxy and official domain; beta PostgreSQL, Redis, RabbitMQ, pet-photo/MinIO or filesystem storage, and SMTP integrations.
- Active application code remains within `frontend-next`, `backend-main-sandbox`, `nutrient-recommender-main`, and the beta runtime definition. Legacy `frontend-main`, `backend-main`, and main compose files are preserved only as historical source and are not combined into the promoted runtime.
- No application API or database-schema change is planned solely for this promotion. Any newly discovered schema or security change requires a separate reviewed delta or an update to this change before implementation.
- Data risk is high because selecting or restoring the wrong volumes could overwrite beta or legacy state. Backups, manifests, restore verification, and explicit storage identifiers are required before cutover.
- Historical source contains development defaults that are also used by current containers. The exact history is retained, but live credentials must be rotated to external production secrets so historical values are inert before archive publication.
- Compatibility risk includes clients or operators relying on the legacy site or legacy data. The maintenance window and breaking replacement must be communicated before execution.
- Rollback restores the final legacy code/runtime and its matching data as one coordinated generation; partial code-only or data-only rollback is not permitted.
