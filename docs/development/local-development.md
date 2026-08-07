# Local Development

## Recommended Docker workflow

Docker is the supported path because it supplies the required Java, Node, and
Python runtimes consistently.

```bash
cp .env.example .env
cp frontend-next/.env.example frontend-next/.env

./run-beta.sh start
./run-beta.sh status
```

Set the frontend proxy targets in `frontend-next/.env` to the sandbox gateway
and recommender reachable from the machine running the browser. See
`README_SANDBOX_BACKEND.md` for the currently assigned endpoints.

The frontend container mounts the repository, so source changes are normally
picked up by Vite HMR. Dependency changes require a container restart so that
`npm ci` runs again.

## Native frontend workflow

Requires Node.js 20 or later.

```bash
cd frontend-next
npm ci
npm run dev
```

The default dev port is `5174`; proxy behavior comes from `vite.config.ts` and
`.env`.

## Backend rebuilds

After a Java change, rebuild only the affected service when possible:

```bash
docker compose -f docker-compose.sandbox.yml up -d --build --no-deps pets-service-sandbox
```

Other service names are:

- `account-service-sandbox`;
- `auth-service-sandbox`;
- `notifications-service-sandbox`;
- `gateway-service-sandbox`.

Use a full `up -d --build` after compose or shared runtime changes.

## Logs and diagnostics

```bash
docker compose -f docker-compose.sandbox.yml ps
docker logs pets_sandbox_gateway_service --tail 100
docker logs pets_sandbox_account_service --tail 100
docker logs pets_sandbox_pets_service --tail 100
docker logs pets_sandbox_notifications_service --tail 100
```

When registration mail is unavailable, inspect account and notification logs.
Development registration codes are printed by account-service; do not add this
behavior to production documentation or expose codes outside development.

For database or migration failures, inspect the affected service logs before
changing Flyway files. Never edit a migration that may already have run.

## Environment rules

- Root `.env`: Docker and SMTP secrets.
- `frontend-next/.env`: frontend base URL and proxy targets.
- `.env.example` files: safe placeholders and documented keys only.
- Never commit real passwords, SMTP keys, cookies, or tokens.

## Resetting sandbox data

This destroys only the isolated beta volumes, but it removes all sandbox users
and data:

```bash
docker compose -f docker-compose.sandbox.yml down -v
```

Run destructive reset commands only when data loss is intentional.
