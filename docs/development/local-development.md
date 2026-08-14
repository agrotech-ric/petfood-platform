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

Set the frontend proxy target in `frontend-next/.env` to the sandbox gateway
reachable from the machine running the browser. Recommender requests also pass
through this gateway; do not configure browsers to call its container directly.

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
OTP values are never written to application logs. When email delivery is
unavailable, inspect sanitized delivery outcomes and RabbitMQ connectivity,
then use a controlled test mail sink rather than recovering codes from logs.

For database or migration failures, inspect the affected service logs before
changing Flyway files. Never edit a migration that may already have run.

## Environment rules

- Root `.env`: Docker and SMTP secrets.
- `frontend-next/.env`: frontend base URL and proxy targets.
- `.env.example` files: safe placeholders and documented keys only.
- Never commit real passwords, SMTP keys, cookies, or tokens.
- Local HTTP uses a root-scoped non-Secure session cookie. Production must set
  the `prod` profile and uses a Secure cookie scoped to `/petfood`.
- Credentialed CORS is exact-match only. Local defaults include the LAN frontend
  origin, localhost, and loopback; production allows only the official origin.

## Private-service diagnostics

Backend services other than the gateway do not publish host ports. Diagnose
them through container health, logs, or an in-network request:

```bash
docker compose -f docker-compose.sandbox.yml exec gateway-service-sandbox \
  wget -qO- http://pets-service-sandbox:8083/actuator/health
```

Do not temporarily expose an internal service on all interfaces. If direct
debugging is unavoidable, use a local override bound to `127.0.0.1` and remove
it after the session.

## Resetting sandbox data

This destroys only the isolated beta volumes, but it removes all sandbox users
and data:

```bash
docker compose -f docker-compose.sandbox.yml down -v
```

Run destructive reset commands only when data loss is intentional.
