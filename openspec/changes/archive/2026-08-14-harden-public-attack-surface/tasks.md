## 1. Security Test Baseline and Configuration

- [x] 1.1 Add profile-specific configuration properties and startup validation for trusted proxies, CORS origins, session cookie attributes, public base paths, and authentication rate limits.
- [x] 1.2 Add focused test fixtures with canary OTP, SID, JWT, and identity values so responses and captured logs can be checked for disclosure.
- [x] 1.3 Add gateway integration-test coverage for allowed and rejected origins, credentialed preflight requests, and CORS headers on gateway-generated errors.

## 2. Credential and Session Confidentiality

- [x] 2.1 Remove OTP values and unnecessary personal identifiers from account-service and notification-service logs, retaining sanitized outcome and correlation data.
- [x] 2.2 Remove SID, JWT, cookie, Authorization header, and decoded-claim logging from the gateway and pets-service.
- [x] 2.3 Change successful authentication responses to set the `sid` cookie without returning a reusable session credential in JSON, and align backend DTOs and frontend consumers.
- [x] 2.4 Configure and test production and development cookie attributes, including `/petfood` production scope and root-scoped local HTTP behavior.
- [x] 2.5 Add automated assertions that seeded credentials and OTP values are absent from authentication responses and captured service logs.

## 3. Authentication Abuse Protection

- [x] 3.1 Implement gateway rate limits for each public authentication route using reactive Redis and a client address resolved only from configured trusted proxy hops.
- [x] 3.2 Implement normalized-identity OTP request cooldowns, verification attempt limits, expiry, one-time invalidation, and non-reversible rate-limit keys in account-service.
- [x] 3.3 Make known and unknown identity failures non-enumerating and return stable HTTP 429 retry semantics when a limit is exceeded.
- [x] 3.4 Add unit and integration tests for per-source exhaustion, distributed per-identity abuse, cooldown expiry, OTP attempt exhaustion, successful invalidation, and proxy-header spoofing.

## 4. Private Pet Photos

- [x] 4.1 Require authentication for photo upload and retrieval and resolve pet ownership in pets-service before filesystem access or pet mutation.
- [x] 4.2 Validate JPEG/PNG media types and the 10 MB limit, and generate new keys beneath `pets/<owner-id>/` without using client filenames as paths.
- [x] 4.3 Implement bounded safe resolution for new and existing filesystem photo associations and return uniform not-found behavior for missing, unauthenticated, and foreign resources.
- [x] 4.4 Return correct image media types with private cache directives and update frontend photo upload/download calls to use the shared credentialed API client.
- [x] 4.5 Add tests for owner success, non-owner denial, unauthenticated access, missing files, invalid types, oversized uploads, traversal filenames, and legacy photo reads.

## 5. Gateway Boundary and Deployment Paths

- [x] 5.1 Add authenticated gateway routing for recommender operations and ensure caller-supplied browser Authorization headers are removed or replaced by the session-derived JWT.
- [x] 5.2 Implement exact environment-specific CORS allowlists for the official origin, LAN development origin, localhost, and loopback without wildcard matching or error-payload reflection.
- [x] 5.3 Configure Vite public base, browser router basename, API URL construction, and SPA fallback for `/petfood/` production and `/` development operation.
- [x] 5.4 Add gateway mappings for `/petfood/api/**` and `/petfood/recommender/**` that strip the external prefix exactly once while preserving current internal service paths.
- [x] 5.5 Remove host port publication for internal services in `docker-compose.sandbox.yml`, retain private service networking, and bind any retained MinIO management/API ports to loopback.
- [x] 5.6 Add integration tests for authenticated and unauthenticated recommender calls, prefixed API routing, nested SPA refreshes, header precedence, and direct internal-port unavailability.

## 6. End-to-End Verification and Documentation

- [x] 6.1 Rebuild every affected sandbox container after Java and runtime configuration changes and inspect startup and request logs for failures or sensitive values.
- [x] 6.2 Exercise login, logout, OTP throttling, pet photo upload/download, and recommendation flows from `http://10.1.10.144:5174/`.
- [x] 6.3 Exercise a production-style build at `/petfood/`, including nested-route refresh, `/petfood/api`, `/petfood/recommender`, Secure cookie attributes, and official-origin CORS behavior.
- [x] 6.4 Verify internal service ports are unreachable externally while container health checks and service-to-service calls remain operational.
- [x] 6.5 Update architecture, local-development, and verification documentation with the gateway boundary, environment configuration, subpath behavior, and secure diagnostic workflow.
- [x] 6.6 Run the relevant frontend, backend, recommender, compose, and OpenSpec checks, then review `git status`, `git diff`, and `git diff --check` for focused changes and accidental secrets.
