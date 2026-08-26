## Context

See `proposal.md` for motivation and the delta specs for observable behavior. Pet and recipe data, health records, contraindications, recipe calculation snapshots, and photo keys are owned by pets-service. Today the React application exposes only authenticated pet and recipe routes; its share buttons copy private URLs, and its download buttons export a photo or JSON rather than a report. The gateway exchanges the browser `sid` cookie for JWTs on private API requests, while pets-service storage access is owner-scoped.

This change crosses frontend routing, gateway security, pets-service authorization and persistence, object-backed photos, production subpath configuration, and server-side document rendering. The public views must work at `https://agrotech.astanait.edu.kz/petfood` without a session while preserving the authenticated boundary for every existing private endpoint.

## Goals / Non-Goals

**Goals:**

- Establish a narrow capability-token boundary for live, revocable, read-only pet and calculated-recipe sharing.
- Keep public aggregation and PDF generation inside pets-service, where resource ownership and source data already live.
- Produce consistent public DTOs and PDF view models from explicit allowlists rather than serializing persistence entities.
- Make public routes refresh-safe under the production `/petfood` basename and keep tokens out of server URL logs and referrers.
- Generate deterministic, localized PDFs without depending on a browser, frontend screenshot, public link, or external network resource.

**Non-Goals:**

- Reusing the health-record digestion endpoints or adding a recipe digestibility calculation pipeline.
- Creating immutable share snapshots; both public views use current saved data.
- Supporting recipient comments, editing, accounts, link expiry, access analytics, or per-recipient permissions.
- Exposing public PDF endpoints or a public directory of shared resources.
- Generalizing the renderer into a cross-service reporting platform.

## Decisions

### 1. Pets-service owns sharing, aggregation, and export

Pets-service will add authenticated management and export endpoints plus narrowly scoped public read endpoints. It will load the owned aggregates directly from its repositories after either authenticated ownership validation or public token validation. The gateway will bypass SID-to-JWT exchange only for the exact public read routes and forward all management and PDF routes through the existing authenticated flow.

This keeps authorization beside the source data and avoids giving the frontend or gateway access to private storage keys. A separate reporting service was rejected because it would duplicate ownership rules and require a new authenticated service-to-service aggregation boundary for only two report types. Client-side PDF generation was rejected because output would vary by browser, expose more source data to the client, and make fonts, pagination, and charts harder to verify.

### 2. Share records store lifecycle state, not a reusable raw secret

A pets-service Flyway migration will create a share-link table with a UUID share identifier, resource type, exactly one typed resource reference (`pet_id` or `recipe_id`), creation time, optional revocation time, and audit metadata needed for owner management. Foreign keys will remove links with their resource. A database constraint will require the reference that matches the resource type, and partial unique indexes will allow at most one unrevoked link per pet or recipe.

The external token will be versioned and consist of the share identifier plus an HMAC signature produced with a dedicated production secret. Signature comparison will be constant-time. Because the signature is deterministic, pets-service can return an existing active link without storing the raw bearer token; a database disclosure alone is insufficient to mint links. Replacing a link revokes the current row and creates a new identifier in one transaction. Revocation is retained as lifecycle history rather than deleting the row.

Random opaque tokens stored as hashes were considered. They provide similar database-leak protection but cannot reproduce an existing URL, which would either require storing the raw token or make the create-or-retrieve action unexpectedly rotate links. Signed resource IDs without a database row were rejected because revocation and one-active-link enforcement would be awkward.

The signing secret will be supplied independently of session, JWT, and database credentials, must not have a committed default, and will be redacted from configuration diagnostics. Changing it intentionally invalidates all existing links; this is the emergency global-revocation mechanism.

### 3. Tokens travel in URL fragments and a dedicated request header

Production URLs will have these forms:

- `https://agrotech.astanait.edu.kz/petfood/shared/pet#<token>`
- `https://agrotech.astanait.edu.kz/petfood/shared/recipe#<token>`

The configured canonical public application URL will be the source for generated links, with an environment-specific local value for sandbox use. The fragment is not included in HTTP requests or referrer headers. The public React route reads it into memory and sends it to pets-service as `X-Share-Token`; it does not copy the token into query parameters, local storage, session storage, cookies, analytics, or error telemetry. Keeping the fragment in the address permits reload and forwarding of the same share URL. Public photo endpoints are fetched as blobs with the same header so tokens never need to appear in image URLs.

The API surface will be grouped as follows, with equivalent pet and recipe management routes:

- authenticated `GET`/`POST`/`DELETE /api/v1/{resource}/{id}/share` for current status, idempotent creation, and revocation;
- authenticated `POST /api/v1/{resource}/{id}/share/rotate` for explicit replacement;
- unauthenticated `GET /api/v1/public/shares/pet` and `/recipe` for allowlisted aggregate DTOs;
- unauthenticated photo subresources under the matching public share path, also requiring `X-Share-Token`;
- authenticated `GET /api/v1/{resource}/{id}/export.pdf?locale=<ru|en|kz>` for owner downloads.

The exact existing plural resource paths will be preserved when controllers are implemented. Management responses return active state and the canonical URL, never a signing secret or storage key.

Putting tokens in path parameters or query strings was rejected because reverse proxies, server access logs, browser history tooling, analytics, and copied diagnostics commonly record those URL components. Cookies were rejected because they create ambient authority and complicate sharing multiple resources.

### 4. Public DTOs are live, allowlisted projections

Token validation resolves one active record and then loads current resource data. Public pet DTOs will explicitly map basic profile fields, photo availability, descriptions, current health context, health history, contraindications, weight/activity series, and summaries filtered to fully calculated recipes. They will never map passport fields, owner IDs, audit fields, photo keys, draft recipes, or private URLs.

Public recipe DTOs will map current recipe input fields, ingredient names and quantities, calculation metadata, all supported values present in the saved calculation snapshot, and a chart-ready representation. A linked-pet projection is limited to current name, species, breed, age, weight, and photo availability. It does not include health records or a pet route. Recipe eligibility is evaluated on every public request using status, non-null calculation result, and calculation timestamp; the share row remains active when an edited recipe becomes a draft, so a later valid recalculation restores the same link.

Digestibility is treated as optional saved recipe data only. The mapper and renderers may show it after validating a compatible calculation-result shape, but they will not call the existing health-record digestion endpoints or synthesize values. Those endpoints operate on recommendation payloads rather than recipe snapshots and therefore belong to a separate future change.

Snapshot copies were rejected because the agreed behavior is live and because they would duplicate sensitive profile data. Reusing private DTOs and deleting fields afterward was rejected because new private fields could leak by default.

### 5. Public pages use a dedicated route boundary and presentation layout

`frontend-next` will register `/shared/pet` and `/shared/recipe` outside `PrivateRoute` and `AppLayout`. `AuthProvider` may continue its passive session check, but a missing session must not redirect or surface a 401 on these routes. The public layout will reuse theme variables, typography, chart conventions, and the existing language context while omitting the sidebar, account navigation, mutation controls, private links, and download controls. Every new static string will be added to Russian, English, and Kazakh dictionaries.

The page will present loading, invalid/unavailable link, and rate-limit states as normal localized public screens. It will set `noindex,nofollow`; the production web server will support SPA fallback for both nested paths. Language selection changes only presentation state and does not mutate or replace the fragment token.

Reusing private profile pages in a disabled mode was rejected because a future private control or data field could accidentally appear publicly. Dedicated components may share pure formatting and chart components, but public data types and page composition remain separate.

### 6. Public endpoints fail closed and reveal no token state

Pets-service security will permit unauthenticated access only to the named public GET endpoints. All malformed signatures, missing or mismatched share rows, revoked links, deleted resources, wrong resource types, and ineligible recipes return the same 404 body. Token verification occurs before aggregate or photo loading. Owner management continues to use JWT identity and explicit resource ownership checks.

Gateway rate limiting will protect public routes using client network identity and coarse route buckets, with limits applied before expensive aggregate/photo work. A token-validity-independent 429 response prevents probing. Public API and photo responses will include `Cache-Control: no-store` and `Referrer-Policy: no-referrer`; public HTML will additionally carry `X-Robots-Tag: noindex, nofollow` or equivalent route-aware web-server headers. Logging configuration and request filters will redact `X-Share-Token`, and public pages will be excluded from analytics that capture full locations.

Relying on token entropy without rate limiting was rejected because token validation and large profile/photo responses can still be abused for resource exhaustion.

### 7. PDFs use server-side HTML/CSS templates with embedded local assets

Pets-service will build explicit pet-report and recipe-report view models, render escaped HTML/CSS templates, and convert them to PDF with a maintained Java renderer compatible with Java 21, such as OpenHTMLToPDF backed by PDFBox. The final dependency choice will be pinned and license-reviewed during implementation. Fonts covering Latin, Cyrillic, and Kazakh-specific glyphs will be bundled and embedded; photos will be read through the service's storage abstraction, normalized within size limits, and embedded rather than loaded by public URL.

Charts will be generated as inline renderer-compatible SVG from the same saved series exposed textually or in tables. Pet reports include every owner-visible field, including passport data, because the endpoint is authenticated and owner-only. Recipe reports include the complete compatible saved calculation and begin with the limited linked-pet summary when present. Missing optional sections use deliberate empty states; a missing photo never prevents export.

Templates will use a light print theme derived from product variables, stable page margins, repeatable headers/footers, `page-break` rules, and bounded image/chart dimensions. User-provided text is escaped. Input counts, image sizes, rendering time, and output size will be bounded to limit memory and CPU abuse. Generated bytes are returned directly with `application/pdf`, `Content-Disposition: attachment`, and a sanitized localized filename; reports are not persisted.

The frontend passes its current supported locale explicitly. Pets-service owns a small report message catalog for those locales because PDF generation cannot depend on frontend runtime translations. Unsupported locales fail validation or use the documented default consistently.

### 8. Shared aggregate assembly is reusable without widening authorization

Private PDF generation and public views will share pure aggregate/view-model assemblers only after the caller's authorization context is established. Separate allowlist mappers will produce public-pet, public-recipe, owner-pet-report, and owner-recipe-report models. Repository methods that bypass owner filters remain package-internal to the validated public-share flow and never become general controller APIs.

This prevents divergence in calculations and chart inputs while keeping the richer owner report from accidentally flowing into public responses. A single universal DTO with visibility flags was rejected because omitted flags and serializer changes create a high privacy risk.

## Risks / Trade-offs

- [A bearer link can be forwarded by any recipient] → Explain this in the share dialog, provide visible revoke/replace controls, use high-entropy signed tokens, and never expose account actions through the link.
- [A database or signing-secret leak could affect public links] → Store no raw token, keep the signing secret outside the database and repository, redact it from diagnostics, and support emergency global invalidation by rotating the secret.
- [Live links can reveal later owner edits] → State that the link shows current data in the management dialog and make revocation immediately available.
- [Public aggregate mappers can accidentally expose new fields] → Use dedicated response types and explicit field mapping, plus negative contract tests for passport, ownership, audit, storage-key, and draft data.
- [PDF rendering can consume excessive CPU or memory] → Bound inputs and image dimensions, add render time/output limits, avoid remote resource loading, and cover large representative reports in integration tests.
- [HTML-to-PDF support for SVG, pagination, or fonts may vary] → Prove the pinned renderer with RU/EN/KZ fixtures, all chart types, long descriptions, and image/no-image cases before wiring the UI.
- [A share becomes temporarily unavailable after recipe edits] → Preserve the active row and return a localized unavailable state until a valid saved calculation exists, as required by the live-link model.
- [Public rate limits behind proxies can group unrelated clients or trust spoofed headers] → Use only gateway-known proxy headers and configure limits separately from authenticated traffic.
- [Changing the canonical base URL can create incorrect copied links] → Validate it at startup in production and test the `/petfood` basename in deployment verification.

## Migration Plan

1. Add the pets-service share-link migration, entity/repository, signing-secret configuration validation, and token/ownership tests without exposing routes.
2. Add allowlisted aggregate DTOs, public/photo endpoints, uniform failures, security headers, gateway route exceptions, rate limiting, and audit-safe logging. Keep frontend entry points disabled until the complete public path is verified.
3. Add localized report view models, templates, fonts, chart rendering, bounded photo processing, authenticated PDF endpoints, and golden/structural PDF tests.
4. Add the public frontend routes and dedicated layout, then replace private pet and recipe share/download behavior with the new lifecycle and export APIs.
5. Configure the production canonical URL and signing secret, rebuild affected sandbox containers, verify logs, and test anonymous access through the real `/petfood` subpath before enabling the controls.

Rollback removes or disables the frontend controls and exact public gateway routes first, stopping new public access. The pets-service public routes can then be disabled while the new table remains inert and backward-compatible. Rolling back the database migration is not required; if immediate invalidation is needed, rotate or remove the share signing secret and revoke active rows before disabling the feature. Existing private APIs and stored recipe calculation snapshots are unchanged.
