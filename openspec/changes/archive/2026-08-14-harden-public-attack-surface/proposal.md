## Why

The beta deployment exposes authentication secrets, private media, permissive browser access, and internal services beyond their intended trust boundaries. These gaps must be closed before the platform can be treated as production-ready while preserving both the official `/petfood/` deployment and developer access from the local network.

## What Changes

- Add layered abuse protection to public authentication endpoints, including gateway rate limits, identity-aware OTP controls, and non-enumerating responses.
- Prevent OTP values, JWTs, session identifiers, cookies, and unnecessary personal identifiers from appearing in application logs.
- Make browser sessions cookie-only, environment-aware, and secure for the official HTTPS deployment; stop returning session identifiers in response bodies.
- Restrict browser CORS to explicit production and development origins while retaining credentialed requests.
- Remove direct host exposure of internal services and route browser-facing recommender traffic through the gateway.
- Require authentication and resource ownership for pet photo upload and download while retaining the existing filesystem storage backend.
- Support the official `https://agrotech.astanait.edu.kz/petfood/` base path across the frontend, gateway, SPA routing, APIs, and session cookie scope.
- **BREAKING**: Clients that depend on a JSON `sid`, direct internal-service ports, unauthenticated photo URLs, wildcard CORS, or root-path production URLs will no longer work.

## Capabilities

### New Capabilities

- `authentication-abuse-protection`: Layered rate limits, OTP attempt controls, and neutral authentication responses.
- `credential-confidentiality`: Cookie-only sessions and safe logging requirements for credentials and personal data.
- `service-network-boundary`: Gateway-only browser access to backend and recommender services.
- `browser-origin-policy`: Explicit credentialed CORS allowlists for production and local development.
- `private-pet-photos`: Owner-authorized pet photo upload, storage, and retrieval behavior.
- `subpath-deployment`: Consistent operation beneath the official `/petfood/` production base path.

### Modified Capabilities

None. The repository does not yet contain baseline behavioral specifications.

## Impact

- Affected components: `frontend-next`, gateway, account-service, auth-service, pets-service, notification-service, `nutrient-recommender-main`, and `docker-compose.sandbox.yml`.
- Public API behavior changes for login/session responses, CORS failures, photo access, recommender routing, and production URL prefixes.
- Runtime configuration gains explicit origin, cookie, proxy-prefix, and rate-limit settings; Redis remains the gateway rate-limit store.
- Existing filesystem photo data and the current user experience remain supported; no schema or object-storage migration is planned.
- Rollback requires restoring the prior routing and client contracts together; partial rollback could strand sessions or make APIs unreachable.

