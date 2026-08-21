## Context

See `proposal.md` for motivation. Production currently has manual validation and full-deployment workflows, while the active application consists of seven independently built services: `frontend`, `recommender`, `auth-service`, `account-service`, `pets-service`, `notifications-service`, and `gateway`. `docker-compose.production.yml` accepts a single release identifier, but Compose can recreate an explicit subset with `--no-deps --no-build`; therefore a production generation may temporarily contain images from multiple commit identifiers.

The automatic path runs on the existing self-hosted production runner and must preserve external secrets, named data volumes, the `/petfood/` reverse-proxy contract, and the existing guarded manual deployment path. This change adds release automation only; it does not change service APIs, ownership boundaries, or schemas.

## Goals / Non-Goals

**Goals:**

- Produce a deterministic, reviewable service set for every `main` update.
- Avoid rebuilding or restarting unaffected services.
- Prefer a full active-runtime release over an unsafe partial release when classification is uncertain.
- Build immutable exact-commit images before changing production.
- Serialize rollout, verify the domain, and preserve enough state for targeted application rollback.
- Keep classification logic testable outside workflow YAML.

**Non-Goals:**

- Replace the current manual full-deployment and initial-cutover controls.
- Roll back Flyway migrations or restore persistent data automatically.
- Deploy or validate preserved `frontend-main`, `backend-main`, archive branches, or historical tags.
- Introduce a new registry, deployment platform, secret store, or application runtime.
- Add pull-request CI unrelated to the production release path.

## Decisions

### 1. Use a dedicated push-to-main workflow

A new production workflow will trigger only on `push` to `main`, with an optional manual dispatch for diagnosis or forced full rollout. GitHub environment protection and the repository's branch protection remain the approval boundary before a commit reaches `main`. Deployment concurrency uses one production group with cancellation disabled so a running rollout cannot be interrupted by a newer commit.

This is preferred over adding a push trigger to the existing manual workflow because the latter requires cutover-specific inputs and performs an intentionally full deployment. Keeping the paths separate reduces condition complexity and retains an understandable emergency tool.

### 2. Put path classification in a repository script

A small script will accept base and head revisions, obtain the changed file set, classify every path, and emit machine-readable booleans/service names plus a human-readable reason. Keeping this logic outside YAML makes the mapping locally testable and prevents workflow expressions from becoming the source of truth.

The initial mapping is:

| Changed path | Selected service set |
| --- | --- |
| `frontend-next/**` | `frontend` |
| `nutrient-recommender-main/**` | `recommender` |
| `backend-main-sandbox/services/auth/**` | `auth-service` |
| `backend-main-sandbox/services/account/**` | `account-service` |
| `backend-main-sandbox/services/pets/**` | `pets-service` |
| `backend-main-sandbox/services/notifications/**` | `notifications-service` |
| `backend-main-sandbox/platform/gateway/**` | `gateway` |
| Shared Gradle files, wrapper, shared Java build logic, or shared backend runtime files | all five Java services |
| Production Compose, production deployment/validation scripts, or the automatic production workflow | all seven active services |
| Documentation, OpenSpec artifacts, repository metadata, tests that cannot affect runtime artifacts, `frontend-main/**`, `backend-main/**`, and archived material | no service |
| Any unrecognized path | all seven active services |

If the event's base revision is absent, all zeroes, unavailable locally, or cannot produce a trustworthy diff, classification returns all services. Renames are classified using both old and new paths so moving a file cannot hide its impact.

Explicit no-op path groups are intentionally narrow. Adding a new top-level runtime area without extending the map therefore causes a full deployment rather than being ignored.

### 3. Validate and build the complete selected set before rollout

The workflow will run the existing relevant checks for each selected area, build all selected images, tag them with the full triggering commit SHA, and confirm that each image exists locally before invoking Compose. If any validation or build fails, rollout does not begin. Independent builds may run in parallel, but deployment remains one serialized job.

Using the commit SHA preserves traceability. Unselected services keep their existing container image rather than being retagged to the new release identifier. The job summary therefore records per-service image identities instead of claiming the entire stack has one uniform release tag.

### 4. Deploy explicit Compose services in dependency-safe order

The deployment job captures the current image reference and container state for every selected service. It then invokes production Compose for only the selected services with `up -d --no-deps --no-build`, ordered as application services, recommender, gateway, then frontend. Persistent dependencies are not recreated by an ordinary selective release.

Compose remains the runtime source of truth. No second deployment manifest or custom container lifecycle is introduced. A full fallback selects all application services but still preserves databases, Redis, RabbitMQ, and media volumes unless the established production workflow explicitly manages them.

### 5. Verify selected services and the public route

After rollout, the workflow checks that selected containers are running and uses declared health status where available. It then runs representative readiness and public-domain checks appropriate to the selected set, always including the public `/petfood/` route when gateway or frontend behavior could be affected. Logs are inspected on failure without rendering environment values or printing secrets.

A successful no-op classification writes a release summary and exits before image or Compose operations.

### 6. Roll back application images per selected set

If startup or post-deployment verification fails, the workflow restores the recorded previous image references for services changed during the rollout and recreates only that selected set, then repeats readiness checks. This prevents a frontend-only failure from restarting backend services.

Image rollback does not reverse Flyway migrations or other persisted writes. Service migrations must remain forward-compatible as required by existing project conventions. When persistent state makes image rollback unsafe or unsuccessful, automation stops, reports incomplete recovery, and directs the operator to the existing manual recovery procedure. It never substitutes legacy data or source automatically.

### 7. Preserve auditable, non-sensitive evidence

The GitHub Actions summary will include base/head commits, changed paths or a bounded classification summary, selected services, no-op/full-fallback reason, built image identifiers, rollout order, readiness results, and rollback outcome. Commands that render secret-bearing production configuration are not included in normal logs.

## Risks / Trade-offs

- **[Incorrect classification causes a stale dependency]** → Unknown paths and failed comparisons select all services; shared paths expand to every known consumer; the path matrix is covered by automated tests.
- **[A later commit waits behind an older rollout]** → Production concurrency is serialized without cancellation. The later workflow reevaluates and deploys its own exact commit after the current rollout ends.
- **[Mixed commit tags make stack identity less obvious]** → Record per-service running images in each summary and retain a manual full rollout when a uniform generation is needed.
- **[Automatic deployment amplifies a bad merge]** → Complete validation and image builds precede rollout, readiness checks follow it, and previous selected images are captured for recovery.
- **[Database migration cannot be reversed by image rollback]** → Keep migrations forward-compatible, explicitly report incomplete rollback, and use the guarded manual data-recovery process when required.
- **[Runner or Git history cannot determine the diff]** → Fetch sufficient history and fall back to all services rather than treating the update as a no-op.
- **[Production secrets leak through diagnostics]** → Use environment-scoped secrets, avoid rendered configuration output, mask sensitive values, and publish only non-sensitive image and classification evidence.

## Migration Plan

1. Add and test the classifier against representative single-service, multi-service, shared, no-op, rename, and unknown-path cases.
2. Add the automatic workflow while retaining the manual production workflow unchanged.
3. Validate workflow syntax, Compose service names, build contexts, and the no-op path on the repository runner.
4. Merge a documentation-only change to confirm release evaluation without deployment.
5. Merge a low-risk frontend change and verify exact-commit build, frontend-only recreation, public readiness, and unchanged backend container identities.
6. Keep the manual full workflow available for emergency rollout or recovery.

Rollback of this automation consists of disabling its `push` trigger or reverting the workflow and classifier. This stops future automatic releases without changing the currently running application. A failed application rollout follows the per-service image recovery described above; persistent-data recovery remains manual.
