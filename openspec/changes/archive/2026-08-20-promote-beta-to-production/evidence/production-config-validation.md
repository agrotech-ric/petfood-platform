# Production Configuration Validation

Verified: 2026-08-19

`scripts/validate-production-config.sh` validates a protected environment file
without printing its values. It requires the file to be outside the repository,
rejects symlinks and group/world permissions, and rejects example placeholders.

The rendered production definition is checked for:

- one loopback-only edge port and no source bind mounts;
- `prod` on every Spring service and an internal application network;
- one exact HTTPS CORS origin, explicit trusted proxies, secure session cookies,
  and `/petfood` cookie/public paths;
- consistent database identity across auth, account, and pets services;
- explicit Redis, RabbitMQ, filesystem-media, MinIO, and SMTP wiring;
- filesystem photo storage matching the active beta data generation and a
  public `/petfood` media base URL;
- exact release-SHA image tags for every application artifact;
- five distinct external durable volumes, with legacy volume prefixes rejected;
- required production secrets without usable Compose fallbacks;
- prefixed account, pets, and recommender routes in the gateway definition;
- absence of tracked non-example environment files.

The validator passed with a mode-0600 temporary external configuration and the
identified live beta volumes. The temporary file contained only non-operational
test values and was removed after the check. The guarded production workflow
now invokes the same validator before building or deploying.
