# Verification

Run checks that match the changed surface. Report any check that could not be
run and why.

## Documentation and configuration

```bash
docker compose -f docker-compose.sandbox.yml config --quiet
git diff --check
```

Verify Markdown links and command names manually when no link checker is
available. Confirm that examples contain no real credentials.

For changes containing OpenSpec artifacts, run from the repository root:

```bash
docker run --rm -e OPENSPEC_TELEMETRY=0 -v "$PWD:/workspace" \
  -w /workspace node:22-bookworm-slim \
  npx -y @fission-ai/openspec@1.8.0 validate --all
```

## Frontend

```bash
cd frontend-next
npm ci
npm run lint
npm run build
```

For UI changes also check:

- desktop and mobile layout;
- standard and dark themes;
- `ru`, `en`, and `kz` locales;
- loading, empty, error, and disabled states relevant to the flow;
- navigation and authenticated route behavior.

## Backend

Run all sandbox tests:

```bash
cd backend-main-sandbox
bash ./gradlew test
```

For a focused service:

```bash
bash ./gradlew :services:pets:test
bash ./gradlew :services:account:test
bash ./gradlew :services:auth:test
bash ./gradlew :services:notifications:test
bash ./gradlew :platform:gateway:test
```

After rebuilding a changed service, check its startup logs for Flyway,
authorization, and dependency errors.

## Recommender

Install the Python dependencies in an isolated environment, then run:

```bash
cd nutrient-recommender-main
python -m pytest tests
```

When a frontend contract changes, validate at least one representative request
against the running recommender and compare it with
`frontend-next/services/recommenderService.ts`.

## Final diff review

```bash
git status --short
git diff --check
git diff
```

Check that the diff contains only intended files, migrations have unique
versions, generated outputs are excluded, and no existing user changes were
overwritten.
