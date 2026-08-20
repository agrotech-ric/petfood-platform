# Production Deployment

This runbook describes the guarded beta-derived production path. It does not
authorize a domain cutover, a `main` update, or a remote archive publication;
each remains an explicit release gate.

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

## Guarded workflow

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

The beta workflow is validate-only and shares the same concurrency group, so it
cannot race a production deployment or attach production stores.

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
