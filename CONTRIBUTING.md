# Contributing

## Before starting

1. Read `README.md` and `AGENTS.md`.
2. Confirm that the task belongs to the beta stack.
3. Run `git status --short` and preserve unrelated local changes.
4. Locate the existing route, service, DTO, migration, and UI patterns before
   introducing a new one.

Use the OpenSpec workflow in `docs/development/openspec.md` for new capabilities,
behavior/API/schema/security changes, and cross-service work. Small unambiguous
fixes and documentation-only changes do not require a specification.

## Change boundaries

- Frontend beta changes belong in `frontend-next/`.
- Backend beta changes belong in `backend-main-sandbox/`.
- Recommender algorithm changes belong in `nutrient-recommender-main/`.
- Runtime changes belong in `docker-compose.sandbox.yml` or `run-beta.sh`.
- Do not modify `frontend-main/`, `backend-main/`, or main compose files for a
  beta task.

Keep diffs focused. Do not combine a feature or bug fix with unrelated cleanup.

## Implementation workflow

1. Identify the owner of the behavior using
   `docs/architecture/overview.md`.
2. Reuse existing frontend services and backend patterns.
3. Add a Flyway migration for every schema change; never edit an applied
   migration.
4. Keep frontend strings in all three locale files and colors in theme
   variables.
5. Rebuild the affected container after Java changes.
6. Run the checks listed in `docs/development/verification.md`.
7. Review `git diff` for secrets, generated files, and unrelated changes.
8. Update durable documentation when an architecture or workflow rule changed.

## Definition of Done

A change is complete when:

- the requested behavior and failure paths work;
- frontend and backend contracts agree;
- authorization and data ownership are preserved;
- migrations are present when the schema changed;
- relevant build, lint, and test commands pass;
- light/dark theme and `ru`/`en`/`kz` are checked for affected UI;
- no secret or local `.env` value is included;
- documentation reflects any durable architectural or workflow change;
- the final diff contains only intended files.

## Git policy

AI agents do not create commits or push unless the user explicitly asks. A
human contributor should inspect the final diff and commit it with an
intent-focused message.

```bash
git status
git diff

git add <changed-paths>

git commit -m "$(cat <<'EOF'
Explain why the change is needed.

EOF
)"
```
