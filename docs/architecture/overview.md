# Architecture Overview

## System context

The active beta system is a modular application deployed as separate
containers. The React frontend sends all backend and calculation traffic
through the Spring gateway. Internal services are reachable only on the
application network and must not publish host ports.

```text
                       +--------------------+
Browser -- /api ------>| Gateway            |
   |                   | sid -> JWT exchange|
   |                   +--+-------+-------+-+
   |                      |       |       |
   |                 Account    Auth     Pets
   |                    |         |       |  \
   |                    +----+----+       |   MinIO
   |                         |            |
   |                       Redis      PostgreSQL
                          |
                          +------> FastAPI recommender

Account / Pets --> RabbitMQ --> Notifications --> SMTP
```

Exact container wiring belongs to `docker-compose.sandbox.yml`; do not copy
host-specific addresses into additional documentation.

## Runtime generations

The sandbox and production definitions serve different purposes:

- `docker-compose.sandbox.yml` runs mutable local development with Vite and
  Spring `dev` profiles. Its named stores remain the beta data generation that
  is selected for promotion.
- `docker-compose.production.yml` builds immutable release-tagged images, runs
  Spring `prod` profiles, has no application source bind mounts, and attaches
  only explicitly named external beta-derived volumes.
- the final legacy source and data stay archived as one recoverable generation;
  they are never mounted into the promoted application or merged into beta
  data.

In production, only `frontend-production` publishes a loopback port. The
application network is internal, notifications receives a separate outbound
network for SMTP, and the host reverse proxy is the sole public boundary. The
domain remains in maintenance mode until infrastructure, internal services,
gateway, frontend, and representative authenticated flows are ready.

## Components

### Frontend

`frontend-next/` is a React 19 and TypeScript application built with Vite.

- `context/`: authentication, language, and theme state;
- `services/`: typed API contracts;
- `i18n/`: the `ru`, `en`, and `kz` dictionaries;
- `src/pages/`: routed screens;
- `src/components/`: reusable UI;
- `src/layout/`: authenticated application shell;
- `src/styles.css`: global theme tokens.

All application API requests include the `sid` cookie through
`credentials: 'include'`. New API calls should extend a service module instead
of adding page-local `fetch` calls.

### Gateway and authentication

The browser holds an opaque `sid` cookie. The gateway exchanges it with the auth
service and forwards a short-lived JWT to protected downstream services.
Browser-supplied bearer credentials are replaced by the session-derived JWT.
Public authentication routes are rate-limited at the gateway, while the account
service applies identity-scoped OTP cooldown and attempt controls.

Public paths are configured in the gateway. A route must only be public when its
controller and service do not require authenticated JWT data. Pets and account
services also enforce authorization independently.

Production is served below `/petfood/`: application APIs use `/petfood/api` and
recommender calls use `/petfood/recommender`. The gateway removes the deployment
prefix before routing. Local development remains root-based.

### Account service

Owns user identity and profile data, credential changes, registration/login
flows, Redis-backed sessions, support requests, and audit history. User-facing
activity is stored in `audit_logs`; new events should include a readable
`description` in the JSON event information.

### Pets service

Owns pet profiles and reference data, health records, contraindications, foods,
favorites, photo keys, ingredients, and recipes.

- Pet resources are checked against the JWT subject and role.
- Pet photos are private owner resources. Filesystem keys are generated beneath
  the authenticated owner's prefix and photo responses are not publicly cached.
- System ingredients are global and read-only.
- User ingredients belong to their creator and are not exposed to other users.
- Recipes belong to their creator and may reference only accessible
  ingredients and the creator's pets.
- The service stores recipe inputs and an optional calculation snapshot; it does
  not implement the calculation algorithm.

The service uses its own Flyway schema history. Schema changes always require a
new migration with the next available version.

### Recommender

`nutrient-recommender-main/` is a private FastAPI service responsible for breed lookup,
calorie and nutrient calculations, disorder recommendations, and recipe
optimization. The frontend integration is in
`frontend-next/services/recommenderService.ts`.

Recipe requests always carry `age` together with `age_metric`. Profiles for
user-created ingredients are request-scoped and use the recommender's internal
nutrient keys. The maximization model currently supports moisture, protein,
carbohydrates, and fat.

### Notifications

The account and pets services publish email commands to RabbitMQ. The
notifications service consumes them and sends mail through SMTP configured in
the root `.env`.

## Data ownership

| Data | Owner | Storage |
| --- | --- | --- |
| Users, profiles, audit logs | Account service | PostgreSQL (default schema) |
| Sessions and JWT exchange state | Account/Auth | Redis |
| Pets, health, ingredients, recipes | Pets service | PostgreSQL `pets` schema |
| Pet images | Pets service | MinIO or configured filesystem storage |
| Calculation reference data | Recommender | files under `nutrient-recommender-main/data` |
| Email commands | Producers/Notifications | RabbitMQ queues |

Services should communicate through their existing HTTP or messaging contracts,
not by reading another service's tables directly.

## Durable design rules

- Keep beta and main runtime state isolated.
- Select production stores by explicit external volume name and verified
  recovery manifest; never infer them from Compose creation order or a similar
  legacy name.
- Supply production credentials from a protected environment file outside Git.
  Historical sandbox defaults are never valid production inputs.
- Keep the gateway as the only host-published backend service.
- Treat controller/DTO/service/frontend types as one API contract.
- Enforce ownership on the backend even when the UI filters resources.
- Put persistent schema evolution in Flyway migrations.
- Keep calculation logic in the recommender and persistence in pets-service.
- Update this document when component ownership or request flow changes.
