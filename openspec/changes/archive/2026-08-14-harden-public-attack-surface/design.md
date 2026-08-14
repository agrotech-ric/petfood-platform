## Context

See `proposal.md` for motivation and the delta specs for behavioral contracts. The beta stack currently exposes multiple Spring Boot and FastAPI ports from `docker-compose.sandbox.yml`; the gateway exchanges the browser `sid` cookie for a JWT, but several browser paths can bypass that boundary. Session and OTP values are logged in multiple services, login returns `sid` in JSON, pets-service permits photo endpoints without adequate ownership checks, and development CORS combines credentials with wildcard origin matching.

The official deployment is `https://agrotech.astanait.edu.kz/petfood/`, while developers must retain root-based access at `http://10.1.10.144:5174/` plus localhost equivalents. Photos currently use filesystem storage and existing associations must remain valid. The current product does not expose meaningful role-specific functionality, so photo authorization is based on resource ownership only.

## Goals / Non-Goals

**Goals:**

- Establish the gateway as the only browser-facing backend boundary.
- Apply abuse controls at both network-source and account/OTP scopes.
- Preserve the current cookie-to-JWT architecture without exposing reusable credentials.
- Make photo authorization owner-based and compatible with existing filesystem data.
- Support production subpath routing and local root routing from explicit configuration.
- Make security behavior testable at service, gateway, and browser integration levels.

**Non-Goals:**

- Introducing user roles, veterinary access to another user's photos, or role-specific UI.
- Migrating photos to MinIO or another object store.
- Adding session device management, revoke-all UI, OAuth, or signing-key rotation.
- Designing the external reverse proxy, TLS termination, or broader production infrastructure.
- Changing schemas unless implementation discovery proves persistent rate-limit state cannot use existing storage safely.

## Decisions

### 1. Use layered rate limiting with separate trust scopes

The gateway will apply coarse per-route and trusted-client-IP limits to public auth endpoints using its existing reactive Redis integration. Account-service will independently enforce normalized-identity cooldowns, OTP attempt limits, expiry, and one-time invalidation. Configuration will define limits and trusted proxy handling per environment.

This separation keeps volumetric traffic out of downstream services while preventing distributed attacks against one account. Gateway-only limits were rejected because source rotation bypasses them; account-only limits were rejected because abusive traffic would still consume service resources.

Public failures will have stable, non-enumerating semantics. Rate-limit keys and logs will use a non-reversible keyed digest where identity correlation is required, never plaintext email, phone, OTP, SID, or JWT values.

### 2. Keep the session architecture but narrow credential handling

Account-service will continue creating server-side sessions and the gateway will continue exchanging `sid` for a downstream JWT. Login will set only the cookie and remove `sid` from its JSON DTO. Cookie attributes will come from validated environment configuration: production uses `Secure`, `HttpOnly`, `SameSite=Lax`, and `/petfood`; local HTTP development uses `HttpOnly`, `SameSite=Lax`, `/`, and explicitly allows `Secure=false`.

At the gateway, any browser-supplied Authorization header on protected browser routes will be removed or overwritten before the session-derived JWT is attached. This avoids ambiguous credential precedence. Replacing the architecture with browser-visible JWTs was rejected because it increases credential exposure and is unnecessary for this hardening change.

### 3. Apply structured log redaction at each source

Sensitive log statements will be removed or rewritten at the code that emits them rather than relying only on downstream log scrubbing. Auth, account, notification, pets, and gateway logs may retain event type, outcome, correlation ID, and irreversible identity fingerprint where operationally necessary. Request/header dumps and decoded JWT claims will not be logged.

Central filtering alone was rejected because secrets may already have reached local container logs, exception messages, or alternate sinks before filtering.

### 4. Make the gateway the only public backend route

Compose will stop publishing host ports for auth, account, pets, notifications, and recommender containers while retaining their private network ports. The recommender will gain a gateway route and use the same session-derived authentication boundary as protected APIs. MinIO, if retained by the sandbox composition, will bind management/API ports to loopback rather than all interfaces.

Frontend and documented diagnostics will use gateway routes. Private service-to-service DNS names remain unchanged. Network isolation alone does not replace backend authorization; services will still validate JWTs and resource ownership.

### 5. Enforce photo ownership in pets-service

Photo upload and retrieval will require authentication in pets-service. The service will resolve the pet under the caller's owner identity before reading or mutating photo state. No role exception will be added. Unauthorized, foreign, and missing retrievals will converge on the same not-found response to reduce resource enumeration.

Uploads will accept JPEG and PNG up to 10 MB. Storage keys will be generated as `pets/<owner-id>/<uuid>.<extension-derived-from-media-type>` and resolved beneath the configured storage root using safe path APIs. Client filenames will not form storage paths. Responses will use private cache directives, and frontend photo requests will use the shared credentialed API client pattern.

The existing filesystem backend and legacy photo associations will remain in place. A compatibility resolver may recognize existing stored keys, but all new writes use the safe key format. MinIO migration was rejected for this change because it expands rollout and data-migration risk without being necessary to establish authorization.

### 6. Separate origin policy from URL-prefix routing

CORS will use exact, environment-provided origins. Production allows `https://agrotech.astanait.edu.kz`; the `/petfood/` path is intentionally absent because paths are not part of an origin. Development allows `http://10.1.10.144:5174`, `http://localhost:5174`, and `http://127.0.0.1:5174`. Gateway-generated success and error responses will share this policy, with credentials enabled only for matched origins.

Production builds will set the Vite base and router basename to `/petfood/`; development uses `/`. The public gateway will accept `/petfood/api/**` and `/petfood/recommender/**`, remove the deployment prefix once, and forward stable internal paths. SPA fallback must serve the entry point for valid nested `/petfood/` routes without intercepting API paths.

Hardcoding the production prefix throughout components was rejected because it would make local development fragile. A single environment-derived public base is used by asset generation, routing, API construction, gateway mapping, and cookie configuration.

### 7. Verify at policy boundaries

Tests will cover rate-limit exhaustion and reset behavior, OTP attempt/cooldown semantics, response and log secret absence, cookie attributes by profile, origin allowlist behavior including gateway errors, direct port unavailability, recommender gateway authentication, photo ownership and invalid uploads, legacy photo reads, and production/local routing.

Security regression checks will scan test-captured logs and response payloads for seeded canary OTP, SID, and JWT values. Browser-level checks will exercise both the production-style `/petfood/` build and local root development routing.

## Risks / Trade-offs

- [Shared NAT addresses can trigger gateway limits for legitimate users] -> Keep gateway limits coarse, make values configurable, and rely on identity-level controls for precision.
- [Incorrect trusted-proxy configuration can collapse all clients to one IP or trust spoofed headers] -> Trust forwarded addresses only from explicitly configured proxy hops and test both direct and proxied requests.
- [Changing cookie path or removing JSON `sid` can invalidate existing sessions or old clients] -> Deploy frontend and gateway/account changes together and require users to authenticate again after rollout if necessary.
- [Subpath rewriting can produce doubled or missing prefixes] -> Define one external prefix, strip it exactly once at the gateway, and add route-contract integration tests.
- [Removing host ports can disrupt developer diagnostics] -> Keep container-network health checks and document `docker compose exec`, logs, and optional loopback-only debugging procedures.
- [Uniform photo 404 responses reduce diagnostic detail] -> Preserve internal correlation IDs and authorization outcomes in sanitized server logs.
- [Legacy filesystem keys may not satisfy the new layout] -> Read legacy associations through a bounded safe resolver; never use an unvalidated key as an arbitrary filesystem path.
- [Existing secrets remain in historical logs] -> Treat log cleanup as forward protection and separately rotate credentials or purge retained logs according to the deployment's operational policy.

## Migration Plan

1. Add configuration defaults, validation, and automated security tests without changing public routing.
2. Remove sensitive logging and update session response/cookie behavior in account, auth, notification, pets, and gateway services.
3. Add account-level OTP controls and gateway rate limits, then verify trusted proxy behavior in the target environment.
4. Secure photo endpoints and frontend credentialed photo requests; verify both new uploads and legacy photo associations.
5. Add recommender gateway routing and production `/petfood/` support across frontend and gateway.
6. Update compose exposure only after gateway health and end-to-end routes pass; verify internal ports are unreachable from external interfaces.
7. Deploy frontend, gateway, and affected services as one coordinated release. Confirm official HTTPS cookies, CORS, nested-route refresh, login, photos, and recommendations.

Rollback should restore the previous frontend, gateway routes, service versions, and compose exposure as one unit. No photo data rewrite or schema migration is planned, so stored files remain rollback-compatible. Sessions created with the new production cookie path may require re-authentication after rollback.

