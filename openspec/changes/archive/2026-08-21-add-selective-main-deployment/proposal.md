## Why

Merges to `main` no longer rebuild and publish the current application automatically, which allows the production domain to remain on an older revision after a successful merge. Restoring an automatic deployment path while limiting work to affected services will make releases timely without rebuilding the entire platform for every change.

## What Changes

- Trigger a production release automatically for each push to `main`.
- Determine affected runtime services from the changed paths and validate, build, and deploy only those services.
- Treat documentation, OpenSpec artifacts, and preserved legacy-source changes as a successful no-deployment release.
- Expand shared Java build or runtime changes to every affected Java service.
- Fall back to validating, building, and deploying all active services whenever the changed paths or comparison range cannot be classified safely.
- Tag newly built images with the exact `main` commit and deploy selected services in dependency-safe order.
- Verify the resulting deployment, report the classification and rollout, and restore only failed selected services to their previously running images when application rollback is possible.
- Retain the guarded manual full-deployment workflow as an operational fallback.
- Do not change application APIs, database schemas, production data, or the preserved legacy code as part of this change.

## Capabilities

### New Capabilities

- `selective-production-deployment`: Classifies changes, selects active runtime services, and performs automatic exact-commit production rollouts with safe fallback behavior.

### Modified Capabilities

- `production-cutover`: Extends the guarded production deployment requirement to permit automatic, traceable deployment of approved commits reaching `main`, including selective rollout and no-op releases.

## Impact

- Affects GitHub Actions workflows, path-classification automation, production Docker image publication, Compose rollout commands, deployment verification, and release documentation.
- Uses the existing GitHub runner, registry credentials, production environment configuration, and active beta service boundaries.
- Does not alter public API contracts or application-owned schemas. Database migration rollback remains outside automatic image rollback, so migration-bearing service changes retain the existing forward-compatible migration constraint and operational recovery risk.
- Preserves the existing manual deployment workflow for full validation, emergency rollout, and operator-controlled recovery.
