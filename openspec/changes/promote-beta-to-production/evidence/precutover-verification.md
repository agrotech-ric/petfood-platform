# Pre-cutover verification

Date: 2026-08-19

Verified source commit: `ef7af17b964220891756d859bcac4eb9fd935e24`

## Frontend

- `npm ci`: passed under Node 22.
- `npm run lint`: passed with zero errors and 13 non-blocking existing React
  refresh/hook warnings.
- Production build with `VITE_PUBLIC_BASE=/`: passed; generated asset URLs use
  `/assets/`.
- Production build with `VITE_PUBLIC_BASE=/petfood/`: passed; generated asset
  URLs use `/petfood/assets/`.
- `npm audit --omit=dev --audit-level=high`: zero production dependency
  vulnerabilities after upgrading React Router within version 7. The complete
  development dependency audit still reports five high findings in build-time
  tooling; none is shipped by the static production image.
- Both builds report a non-blocking approximately 1.12 MB JavaScript chunk.

The original ESLint configuration did not attach a TypeScript parser and
failed on every TypeScript declaration. The release branch now uses the
supported `typescript-eslint` flat configuration. Genuine unused-expression
and unused-variable findings were corrected without changing intended UI
behavior.

## Backend and recommender

- `bash ./gradlew test` in `backend-main-sandbox`: passed, 18 tasks, with no
  failed service or gateway test. Gradle reported only its existing version 9
  deprecation notice.
- Recommender tests ran in the sandbox recommender image with the repository
  mounted read-only: five tests passed. Existing Pydantic/FastAPI deprecation
  warnings were non-blocking.

## Runtime definitions and specifications

- Sandbox Compose validation: passed.
- Maintenance Compose validation with the exact release ID: passed.
- Production environment validation from an owner-only external non-production
  validation file: passed.
- Production Compose validation with the exact release ID: passed.
- OpenSpec `validate --all`: seven items passed, zero failed.
- `git diff --check`: passed.

## Security boundary

- `scripts/security-boundary-smoke.sh` passed against the running isolated beta
  stack, including registration/confirmation cleanup, SID confidentiality,
  logout/login, cookie-over-caller-Authorization precedence, prefixed APIs,
  private photo upload/download, recommender authentication, OTP throttling,
  and internal-port isolation.
- A separate untrusted-origin request received no permissive CORS header.
- Internal application ports `18181`, `18182`, `18183`, `18184`, and `18001`
  were not reachable on loopback.
- Sandbox logs contain none of the seeded password, caller JWT, bearer-header,
  or SID cookie markers used by the smoke test.

The temporary smoke account and photo were removed by the test cleanup. The
official domain, legacy runtime, beta durable stores, and remote `main` were not
changed by these checks.
