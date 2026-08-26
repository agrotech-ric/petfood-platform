## Why

Pet owners cannot currently share a complete pet profile or calculated recipe with an unauthenticated recipient, and the existing download actions do not produce usable reports. Public read-only links and polished PDF exports are needed so owners can communicate pet context and nutrition results without granting account access.

## What Changes

- Add owner-controlled public links for pet profiles and fully calculated recipes, accessible without authentication and rendered in a dedicated read-only layout.
- Add link creation, copying, revocation, and replacement controls to the corresponding private pet and recipe pages.
- Add owner-only PDF downloads for full pet profiles and fully calculated recipes, with localized, site-styled reports that include photos, descriptions, available nutrition data, and the charts backed by saved calculation data.
- Show recipe sharing and PDF controls only while a recipe has a complete saved calculation; a shared recipe becomes unavailable if it returns to draft state.
- Protect public access with unguessable revocable tokens, resource-level eligibility checks, uniform not-found responses, rate limiting, no-store responses, and noindex metadata.
- Keep public pet profiles privacy-conscious by excluding passport data by default and by showing calculated recipe summaries rather than drafts or full linked recipe navigation.

### Non-goals

- Adding or recalculating digestibility data; exports include digestibility only if a compatible value already exists in a saved calculation snapshot.
- Making PDFs downloadable from public share pages.
- Sharing draft or incompletely calculated recipes.
- Providing edit actions or access to the owner's private workspace from a public page.
- Making public pet passport details configurable in this change.

## Capabilities

### New Capabilities

- `public-resource-sharing`: Owner-controlled, unauthenticated, read-only sharing of pet profiles and calculated recipes.
- `profile-pdf-export`: Owner-only localized PDF export of complete pet profiles and calculated recipe reports.

### Modified Capabilities

None.

## Impact

- `frontend-next`: private share/download controls, public routes and layout, localized views, token handling, and PDF download behavior.
- `backend-main-sandbox/services/pets`: share-link persistence, ownership and eligibility enforcement, public aggregate DTOs, photo access, and PDF generation.
- `backend-main-sandbox/gateway`: narrowly scoped unauthenticated share endpoints and public-route protection boundaries.
- `docker-compose.sandbox.yml` and production configuration: a dedicated share-token signing secret and canonical public base URL handling.
- Database: a new pets-service Flyway migration for share records and their lifecycle metadata.
- Dependencies: a Java HTML/CSS-to-PDF renderer and embedded fonts capable of rendering Russian, English, and Kazakh text.
- Security and compatibility: existing private APIs remain authenticated; public links contain revocable bearer capability tokens and must not expose owner-only data. The feature can be rolled back by removing UI entry points and public routing while retaining inert share rows.
