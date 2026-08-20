# AI Agent Guide - PetFood Beta

Read `README.md` and this file before making changes. Detailed architecture,
setup, and checks live in `docs/`.

## Mandatory rules

1. **Git belongs to the user.** Do not commit, push, or change Git configuration
   unless explicitly asked. Preserve unrelated working-tree changes. After an
   implementation task, provide focused `git add` and `git commit` commands.
   Commit messages must be written in English.
2. **Keep the diff focused.** Change only what the task requires. Do not perform
   unrelated refactors or add superficial tests.
3. **Protect secrets.** Never commit `.env` files, credentials, tokens, cookies,
   or real production values.
4. **Respect beta boundaries.** Edit `frontend-next/`,
   `backend-main-sandbox/`, `nutrient-recommender-main/`, and
   `docker-compose.sandbox.yml`. Do not edit `frontend-main/`, `backend-main/`,
   or main compose files for beta work.
5. **Keep durable documentation current.** Update the relevant file in the same
   task when architecture, ownership, setup, verification, or stable conventions
   change. Do not document temporary IPs, migration numbers, or workarounds.
6. **Use OpenSpec for significant behavior changes.** Follow
   `docs/development/openspec.md` for new capabilities, API/schema/security
   changes, and cross-service work. Do not require it for small unambiguous fixes.

## Implementation rules

### Frontend

- Reuse `src/utils/apiClient.ts` and existing modules in `services/`; requests
  must include `credentials: 'include'`.
- Use `PrivateRoute`/`PrivateLayoutRoute`; pages inside `AppLayout` must not
  render another sidebar.
- Put every static UI string in all three dictionaries: `ru`, `en`, and `kz`.
- Use theme variables from `src/styles.css` and the global theme context; do not
  hardcode UI colors or introduce another i18n/theme system.
- Follow the current CSS Module and component patterns.

### Backend

- Change schemas only through a new Flyway migration in the owning service;
  never edit an applied migration.
- Keep DTOs, controllers, services, frontend types, and authorization aligned.
- The gateway exchanges the browser `sid` cookie for JWT. Never make a
  JWT-dependent endpoint public.
- Enforce roles and resource ownership on the backend.
- Rebuild the affected sandbox container after Java changes and inspect logs.

### Domain ownership

- Account-service owns users, profiles, credentials, sessions, and audit logs.
- Pets-service owns pets, health records, ingredients, recipes, and photo keys.
- System ingredients are global/read-only; user ingredients and recipes are
  private to their owner.
- Recommender owns calculations; pets-service stores recipe inputs and optional
  calculation snapshots. Recipe maximization supports moisture, protein,
  carbohydrates, and fat.
- Notifications consumes RabbitMQ messages and sends email through SMTP.

See `docs/architecture/overview.md` for request flow and complete boundaries.

## Verification

Run the relevant commands from `docs/development/verification.md`. Always review
`git status`, `git diff`, and `git diff --check`. If a check cannot run, report
that clearly.

## Documentation map

- `README.md` - onboarding and repository map;
- `CONTRIBUTING.md` - workflow and Definition of Done;
- `docs/architecture/overview.md` - architecture and ownership;
- `docs/development/local-development.md` - setup and diagnostics;
- `docs/development/verification.md` - checks by change type;
- `docs/development/openspec.md` - specification workflow;
- `docs/production-readiness.md` - release blockers and production criteria.
