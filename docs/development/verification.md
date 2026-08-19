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

For production-runtime or release-path changes, copy
`.env.production.example` outside the repository, replace every placeholder,
restrict it to the owner, and validate it without printing the rendered
configuration:

```bash
chmod 600 /path/to/petfood-production.env
bash scripts/validate-production-config.sh \
  /path/to/petfood-production.env <full-approved-commit>
docker compose --env-file /path/to/petfood-production.env \
  -f docker-compose.production.yml config --quiet
```

Use `--require-volumes` only on the deployment host after the five reviewed
beta-derived external volume names exist. Confirm that no legacy volume name is
selected, only the frontend edge has a host binding, Java services use `prod`,
and no source bind mount is rendered.

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

For deployment-path changes, build once with `VITE_PUBLIC_BASE=/petfood/` and
verify asset URLs plus a refreshed nested route. Local development must continue
to work with `VITE_PUBLIC_BASE=/`.

For a production-style smoke test, verify `/petfood/`, a refreshed nested SPA
route, an unauthenticated protected request, and recommender routing through the
edge. Do not expose internal ports for this test.

For an isolated production rehearsal, use the loopback-only canary after the
exact release images and restored beta stores are running. The script refuses a
non-loopback target and removes its temporary accounts, Redis keys, and photo:

```bash
REHEARSAL_ENV_FILE=/path/to/petfood-rehearsal.env \
  bash scripts/production-rehearsal-smoke.sh
```

Override `REHEARSAL_BASE_URL`, `REHEARSAL_ORIGIN`, or
`REHEARSAL_COMPOSE_PROJECT` only when the isolated rehearsal uses different
reviewed values. Its notification check expects an isolated MailHog container;
it must never point at production SMTP or production users.

For a legacy rollback drill, first restore the accepted legacy backup and start
the matching archived generation behind a loopback-only edge. Then run:

```bash
bash scripts/legacy-rollback-smoke.sh
```

The script refuses non-loopback targets, uses only a temporary `example.test`
identity, and removes its account, Redis state, and photo. Passing this
generation-specific functional check does not waive current production
security gates; separately verify the session, photo-ownership, CORS, and
network-boundary requirements before returning public traffic.

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

For security-boundary changes also verify:

- seeded OTP, SID, JWT, Cookie, and Authorization values are absent from logs;
- untrusted origins receive no permissive CORS headers;
- auth limits return HTTP 429 without forwarding excess requests;
- owner and non-owner photo access produce the specified results;
- internal service ports are absent from `docker compose ... ps` host bindings.

With the sandbox running, execute the repeatable boundary smoke test. It creates
and removes a temporary account and photo:

```bash
bash scripts/security-boundary-smoke.sh
```

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
