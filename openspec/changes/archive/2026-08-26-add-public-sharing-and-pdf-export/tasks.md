## 1. Contracts and Dependencies

- [x] 1.1 Define pets-service request/response contracts for pet and recipe share management, public aggregates, public photo retrieval, uniform public errors, and localized PDF downloads; align matching frontend service types.
- [x] 1.2 Select and pin a Java 21-compatible HTML-to-PDF renderer, review its transitive dependencies and licenses, and add redistributable font assets covering Russian, English, and Kazakh glyphs.

## 2. Share Persistence and Token Lifecycle

- [x] 2.1 Add the next pets-service Flyway migration for typed pet/recipe share records, lifecycle timestamps, foreign keys, resource-type consistency checks, and one-active-link-per-resource indexes.
- [x] 2.2 Implement the share entity and repository operations, including concurrency-safe active-link lookup, transactional replacement, revocation history, and deletion behavior.
- [x] 2.3 Add validated configuration for the canonical public application URL and a dedicated share signing secret, then implement versioned HMAC token creation and constant-time verification without storing raw tokens.
- [x] 2.4 Implement owner-authorized pet and recipe share lifecycle services and authenticated GET, POST, rotate, and DELETE endpoints, including calculated-recipe eligibility checks and non-disclosing non-owner failures.
- [x] 2.5 Add focused persistence and service tests for idempotent creation, one-active-link concurrency, replacement, revocation, resource deletion, ownership, recipe eligibility transitions, malformed tokens, and signing-secret changes.

## 3. Public Read-Only Backend

- [x] 3.1 Implement explicit public pet aggregate/view models for current profile data, photo availability, health context, contraindications, history series, and calculated recipe summaries, with passport, draft, owner, audit, storage-key, and private-link fields absent by construction.
- [x] 3.2 Implement explicit public recipe aggregate/view models for current inputs, ingredients, saved calculation data, chart-ready series, and the limited linked-pet summary; omit unsupported digestibility instead of invoking health-record digestion endpoints.
- [x] 3.3 Implement token-gated unauthenticated pet and recipe aggregate endpoints plus matching header-authorized photo subresources, evaluating active state and calculated-recipe eligibility on every request.
- [x] 3.4 Apply uniform 404 handling for all unusable-token and unavailable-resource cases and add no-store and no-referrer response headers without disclosing validation details.
- [x] 3.5 Add controller/integration tests for anonymous valid access, live data updates, revoked/replaced links, draft-to-calculated transitions, wrong resource types, deleted resources, missing photos, and negative assertions for every excluded private field.

## 4. Gateway and Public Security Boundary

- [x] 4.1 Restrict pets-service unauthenticated security rules to the exact public GET endpoints while keeping share management, exports, and every existing pet/recipe endpoint JWT-protected.
- [x] 4.2 Configure the gateway to bypass SID exchange only for the exact public share reads and photos, apply a separate trusted-client rate-limit bucket before forwarding, and return a token-validity-independent 429 response.
- [x] 4.3 Redact `X-Share-Token` from gateway and pets-service logs and diagnostics, prevent public-route location capture by analytics, and add route-aware `noindex,nofollow`, no-store, and referrer protections at the frontend edge.
- [x] 4.4 Add gateway and pets-service security tests covering missing SID behavior, forged forwarded identity, non-owner management/export, rate limiting, exact-path matching, response headers, and absence of share tokens in captured logs.

## 5. Server-Side PDF Reports

- [x] 5.1 Implement separate owner-only pet and recipe report assemblers with RU/EN/KZ message catalogs, locale validation, safe localized filenames, and complete typed view models.
- [x] 5.2 Build escaped HTML/CSS templates with embedded fonts, site-aligned print styling, headers/footers, page-break rules, optional-section states, and textual/tabular fallbacks for every chart.
- [x] 5.3 Implement deterministic inline SVG charts for pet weight/activity history and all supported saved recipe calculation series, rendering digestibility only when a compatible saved value is present.
- [x] 5.4 Load and normalize owner-authorized photos through the existing storage abstraction, embed them locally, and enforce bounds for input records, image dimensions, render time, and output size with no remote resource loading.
- [x] 5.5 Implement authenticated pet and eligible-recipe PDF endpoints returning `application/pdf` attachments without creating or changing share links.
- [x] 5.6 Add report tests for ownership, authentication, draft rejection, shared/unshared independence, all locales and glyph sets, long multi-page content, photos present/absent, charts, HTML escaping, safe filenames, bounds, and structurally readable PDF output.

## 6. Frontend Sharing and Export Experience

- [x] 6.1 Extend existing frontend service modules to manage share links, fetch public aggregates/photos with an in-memory fragment token in `X-Share-Token`, and download authenticated PDF blobs with the selected locale and credentials.
- [x] 6.2 Register refresh-safe `/shared/pet` and `/shared/recipe` routes outside `PrivateRoute` and `AppLayout`, ensuring a missing session neither redirects nor surfaces the private API 401 state.
- [x] 6.3 Build a dedicated responsive public pet view with profile sections, calculated recipe summaries, weight/activity charts, localized loading/not-found/rate-limit states, language switching, and no edit, private-navigation, or download controls.
- [x] 6.4 Build a dedicated responsive public recipe view with saved calculation sections and charts, optional linked-pet summary/photo, localized public states, and no edit, recalculate, private-navigation, or download controls.
- [x] 6.5 Replace the pet page's current URL-sharing behavior with a clear share dialog that explains live bearer-link behavior and supports create/copy, revoke, and replace; keep sharing available independently of the pet photo.
- [x] 6.6 Replace the recipe page's current URL-sharing behavior with the same lifecycle controls, show recipe share/download actions only when status, result, and timestamp establish full calculation, and reflect temporary ineligibility without rotating the link.
- [x] 6.7 Replace the pet photo and recipe JSON download actions with authenticated PDF downloads, including progress, safe error handling, and browser filename handling.
- [x] 6.8 Add every new static string to RU/EN/KZ dictionaries and verify public/private layouts in light and dark themes using existing theme variables and component patterns.

## 7. Configuration and Durable Documentation

- [x] 7.1 Add placeholder-only sandbox and production configuration for the canonical public URL, share signing secret, rate limits, and PDF bounds; validate production startup fails safely when required secret or canonical URL values are invalid.
- [x] 7.2 Update architecture, local-development, production-readiness, and verification documentation for the public token flow, pets-service ownership, PDF renderer/font assets, configuration, anonymous route boundary, operational revocation, and focused smoke checks.
- [x] 7.3 Extend a repeatable sandbox smoke test to create temporary pet/recipe shares, verify anonymous live access and privacy exclusions, revoke/replace links, download owner PDFs, test non-owner failures and rate limits, scan logs for token leakage, and remove all temporary data.

## 8. Verification and Handoff

- [x] 8.1 Run `bash ./gradlew :services:pets:test` and `bash ./gradlew :platform:gateway:test` from `backend-main-sandbox`, then run the full backend test suite if focused checks pass.
- [x] 8.2 Rebuild the affected sandbox pets-service, gateway, and frontend containers; inspect startup logs for Flyway, configuration, authorization, PDF dependency/font, and token-redaction errors; run `docker compose -f docker-compose.sandbox.yml config --quiet`.
- [x] 8.3 Run the existing security-boundary smoke test and the new share/export smoke coverage, confirming no internal service ports are published and no SID, JWT, photo key, signing secret, or share token appears in logs.
- [x] 8.4 Run `npm ci`, `npm run lint`, and `npm run build` in `frontend-next`; repeat the production-path build with `VITE_PUBLIC_BASE=/petfood/` and manually verify refreshed anonymous share routes, RU/EN/KZ, mobile/desktop, light/dark themes, PDFs, invalid links, and authenticated route behavior.
- [x] 8.5 Validate a placeholder-filled production environment outside the repository without printing rendered secrets, verify generated share URLs use `https://agrotech.astanait.edu.kz/petfood`, and confirm rollback by disabling public routes while private pet/recipe flows remain functional.
- [x] 8.6 Run OpenSpec validation, `git status --short`, `git diff --check`, and a focused `git diff` review; confirm the diff stays within beta paths plus required OpenSpec/docs/config files and contains no credentials or generated report artifacts.
