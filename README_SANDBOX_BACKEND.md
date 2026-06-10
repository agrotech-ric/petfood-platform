# Sandbox backend (isolated)

This project can run a fully isolated PetFood backend stack alongside the main one.

## What it creates
- Separate Docker network, volumes, and container names (`pets_sandbox_*`)
- Separate host ports (to avoid collisions with other projects on the server)
- Separate Postgres database (`pets_db_sandbox`)
- Separate MinIO endpoint for browser-accessible presigned URLs

## Ports
- Gateway: `http://10.1.10.144:18190`
- Auth: `http://10.1.10.144:18182`
- Account: `http://10.1.10.144:18181`
- Pets: `http://10.1.10.144:18183`
- Notifications: `http://10.1.10.144:18184`
- MinIO S3 API: `http://10.1.10.144:19100`
- MinIO Console: `http://10.1.10.144:19101`

## Start / stop

Start:

```bash
docker compose -f docker-compose.sandbox.yml up -d --build
```

Stop:

```bash
docker compose -f docker-compose.sandbox.yml down
```

Stop and delete sandbox data:

```bash
docker compose -f docker-compose.sandbox.yml down -v
```

## Code location
- Main backend: `backend-main/` (do not edit for sandbox work)
- Sandbox backend: `backend-main-sandbox/` (safe to edit)

## Frontend-next (test UI)
In `frontend-next/.env` set:

```env
VITE_API_PROXY_TARGET=http://10.1.10.144:18190
```

Then restart Vite dev server (`npm run dev` or the `petfood_frontend_next_dev` container) so `/api/*` proxies to sandbox gateway.

**Note:** Sandbox has its own Postgres — you need to register/login again (separate users from main).

**Email codes:** `notifications-service-sandbox` uses SMTP vars from root `.env` (same as main). If mail fails, check `docker logs pets_sandbox_notifications_service`. Until SMTP is fixed, codes are printed in account logs: `docker logs pets_sandbox_account_service 2>&1 | grep 'REG CONFIRM'`.

## Auth fix (sandbox only)
`/api/v1/pets` requires authentication (`401` without token). Previously `permitAll` allowed anonymous access but controller expected `Jwt`, causing `500`.

