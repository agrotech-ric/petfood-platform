# Production Deployment

This runbook describes the guarded beta-derived production path. The initial
domain cutover, a direct `main` update, and a remote archive publication remain
explicit release gates. After the cutover, commits that reach `main` use the
automatic selective release described below.

## Release inputs

An approved deployment identifies all of the following before it changes a
running generation:

- the full 40-character commit currently at protected `origin/main`;
- a restore-tested or accepted backup-set identifier;
- a protected production environment file outside the checkout;
- five explicit beta-derived external volume names for PostgreSQL, Redis,
  RabbitMQ, MinIO, and pet photos;
- the production environment approval and `DEPLOY_APPROVED` confirmation.

Create the protected environment file from `.env.production.example`, keep it
mode `0600`, and never print or commit it. The validator rejects placeholders,
in-repository files, secret fallbacks, insecure cookie/path settings, invalid
CORS and public URL shapes, legacy volume names, and unexpected public ports.

RabbitMQ storage is hostname-sensitive. The production runtime uses the stable
node identity `rabbit@petfood-rabbitmq`; do not attach a raw beta broker volume
whose Mnesia directory belongs to a random historical container hostname.
Create the reviewed external RabbitMQ volume with the stable production node
identity and import the checksum-verified beta definitions after producers and
consumers are quiesced. Pending messages must be drained or explicitly handled
before the final export. The imported definitions volume is the beta-derived
production broker generation recorded in the release manifest.

## Automatic main workflow

`.github/workflows/deploy-main-selective.yml` evaluates every push to `main` on
the self-hosted runner labelled `linux` and `petfood-prod`. It is serialized
under the `petfood-production-deploy` concurrency group with cancellation
disabled. A second commit waits for an active rollout instead of interrupting
it.

The workflow requires the protected `production` GitHub environment and its
`PETFOOD_PRODUCTION_ENV_FILE` variable. That variable must identify the existing
mode-`0600` environment file under `/home/iot/PetFood/production-config/` on the
runner. The environment file and all credentials remain outside the checkout.
If the GitHub environment requires reviewers, the workflow waits at that gate;
remove that reviewer requirement only when fully unattended routine deployment
is the accepted policy.

The workflow checks out the exact triggering `main` commit and classifies its
`before..after` change. A manual dispatch additionally requires the selected
commit to be the current `origin/main`. The workflow then runs relevant tests
and builds every selected image before changing a container. Images use the
full commit SHA. A validation, test, or build failure leaves production
unchanged.

The path classifier in `scripts/select-production-services.sh` applies this
mapping:

| Changed path | Selected production service |
| --- | --- |
| `frontend-next/**` | frontend |
| `nutrient-recommender-main/**` | recommender |
| `backend-main-sandbox/services/auth/**` | auth |
| `backend-main-sandbox/services/account/**` | account |
| `backend-main-sandbox/services/pets/**` | pets |
| `backend-main-sandbox/services/notifications/**` | notifications |
| `backend-main-sandbox/platform/gateway/**` | gateway |
| shared Gradle, wrapper, backend build, or backend deployment files | all Java services |
| production Compose, production validation/deployment scripts, or production workflows | all active services |
| documentation, OpenSpec, beta-only runtime files, and preserved `frontend-main/**` or `backend-main/**` | none |
| an unrecognized path or an unavailable comparison | all active services |

Renames classify both the old and new path. Multiple path matches produce the
union of services. A known non-runtime-only change finishes successfully and
does not run Docker or Compose operations. An unknown path deliberately causes
a full active-service release so a new runtime dependency cannot be silently
missed.

The workflow can also be dispatched manually with `force_all` enabled. This is
useful for rebuilding a uniform exact-commit application generation; it does
not replace the backup and confirmation gates of the manual cutover workflow.

## Selective rollout and verification

`scripts/deploy-selected-production-services.sh` records the running image ID
for each selected service and gives those images a run-specific local rollback
tag. It then recreates only selected Compose services with `--no-deps` and
`--no-build`, in this order:

1. auth, account, pets, notifications, and recommender;
2. gateway;
3. frontend.

PostgreSQL, Redis, RabbitMQ, MinIO, photo storage, and unselected application
containers are not recreated. Consequently, a normal production generation can
contain per-service images from different commits. The workflow summary is the
authoritative per-service release record; do not infer the complete generation
from the newest frontend tag alone.

After rollout, the script checks container state and declared Docker health,
checks each selected service from the application network, and verifies the
configured HTTPS `/petfood/` route. Gateway or recommender changes also verify
the public recommender route. Authentication, account, pets, or gateway changes
verify that the public protected route still rejects an anonymous request.

Each Actions summary records the compared commits, changed-path count,
classification reason, selected services, full-fallback/no-op state, target
image tag, prior selected image IDs, readiness result, and rollback result. It
does not render Compose configuration or environment values.

## Selective rollback and diagnostics

If rollout or readiness fails after container replacement starts, the script
recreates the selected service set from the images captured before rollout and
repeats readiness checks. Unselected services remain untouched. Successful
rollbacks are visible in the workflow summary; failed recovery keeps the local
rollback tags for operator inspection.

For a failed run, review these items without printing the production environment
file:

```bash
# Inspect the Actions classification and per-service image summary first.
docker compose --env-file /path/to/petfood-production.env \
  -f docker-compose.production.yml ps

# Resolve one running image without rendering environment values.
docker inspect --format '{{.Config.Image}} {{.Image}}' \
  "$(docker compose --env-file /path/to/petfood-production.env \
    -f docker-compose.production.yml ps -q pets-production)"
```

An image rollback cannot undo a Flyway migration or accepted writes. If the
summary reports incomplete rollback or a persistent-state compatibility issue,
stop automatic retries, keep the domain in maintenance if necessary, and use
`docs/operations/production-promotion-recovery.md`. Never restore legacy data
into the active beta-derived runtime or delete production volumes as a retry.

## Guarded manual workflow

`.github/workflows/deploy-self-hosted.yml` is manual, serialized under the
production concurrency group, and uses the protected `production` environment.
Its default `validate` mode checks the requested commit and recovery inputs,
validates configuration, and builds exact release-tagged images without
changing the running application.

Use `deploy` only after validate mode, backup review, and operator approval.
Deploy mode recreates `docker-compose.production.yml` from the already built
images. It does not switch host Nginx; follow
`docs/operations/production-proxy-switch.md` under the separately approved
maintenance window.

The manual workflow remains the path for initial cutover, backup-gated full
deployment, and operator-controlled recovery. The beta workflow is
validate-only and shares the same concurrency group, so it cannot race a
production deployment or attach production stores.

## Dependency and readiness order

Bring up and verify the generation in this order:

1. PostgreSQL, Redis, RabbitMQ, MinIO, and the explicit external volumes;
2. auth, account, pets, recommender, and notifications;
3. gateway;
4. frontend loopback edge;
5. host reverse proxy after the direct edge and representative flows pass.

Keep the official route on maintenance when any required dependency is not
ready. A frontend HTTP response alone is not release acceptance.

## Rollback boundary

Rollback selects one matching source, runtime configuration, and data manifest.
If beta has accepted writes, quiesce it and preserve a new backup first. Restore
the complete selected generation and repeat the same readiness, security, and
public routing checks before reopening traffic.

This coordinated rollback boundary takes precedence whenever a migration or
persistent data change makes the automatic per-service image rollback
insufficient.
