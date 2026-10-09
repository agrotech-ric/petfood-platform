## 1. Pets Contracts and Persistence

- [x] 1.1 Add the next pets-service Flyway migration for `pet_owners`, `pet_owner_records`, and nullable indexed `pets.pet_owner_id`, including constraints, foreign keys, audit timestamps, and placeholder-owner backfill from distinct legacy `owner_id` values.
- [x] 1.2 Define owner, owner summary, owner search, owner record, archive, pet association, and photo DTO contracts with validation and consistent error responses.
- [x] 1.3 Extend pet create/update/response contracts with a distinctly named CRM owner association while preserving the existing account authorization owner field.

## 2. Pets-Service Owner Management

- [x] 2.1 Implement owner entities, repositories, mapping, search, create, read, update, placeholder completion, and dependency-safe delete behavior.
- [x] 2.2 Add authenticated owner APIs for search and CRUD, enforcing role checks in both controller security and service methods.
- [x] 2.3 Reuse private pets-service photo storage for authenticated owner avatar upload, download, replacement, and deletion with scoped key validation.
- [x] 2.4 Implement linked-pet listing plus pet attach, reassign, detach, and create-with-owner behavior without changing USER authorization semantics.
- [x] 2.5 Ensure owner identifiers and contact fields are omitted from anonymous shares, logs, and unrelated endpoints.
- [x] 2.6 Add focused pets-service tests for owner validation, placeholder migration behavior, role enforcement, cross-owner isolation, avatar ownership, association changes, safe deletion, and public privacy.

## 3. Owner Records and Archive

- [x] 3.1 Implement owner record persistence and authenticated create, detail, update, active list, archive list, archive, restore, delete, and clear-archive operations.
- [x] 3.2 Validate email, SMS, and Telegram selections against the owner's stored contact values while keeping every channel as metadata-only with no delivery side effects.
- [x] 3.3 Add focused tests for record validation, selected-channel persistence, authorization, ordering, archive/restore transitions, cleanup isolation, and confirmation-sensitive deletion.

## 4. Frontend Owner Experience

- [x] 4.1 Add a typed `ownerService.ts` through the shared API client and extend pet service types and requests with CRM owner summary and association data.
- [x] 4.2 Extract or reuse existing pet-card/profile patterns and implement the responsive owner profile with identity card plus pets, records, and archive tabs.
- [x] 4.3 Implement owner create/edit forms with all designed fields, existing avatar controls, validation, loading, error, confirmation, and disabled states.
- [x] 4.4 Implement the shared record create/edit form, metadata-only channel selections, read-only record detail page, active record actions, archive restore/delete, and clear-archive confirmation.
- [x] 4.5 Register authenticated owner and record routes under the existing application shell and add every visible string to `ru`, `en`, and `kz` using only existing theme variables.

## 5. Frontend Pet Integration

- [x] 5.1 Add the authenticated owner panel and unassigned state to the pet profile using the existing profile section patterns.
- [x] 5.2 Add searchable owner selection, create-owner return flow, reassignment, and detachment to VET pet create/edit forms while hiding these controls from USER flows.
- [x] 5.3 Support adding a new pet and attaching an existing unassigned pet from the owner profile, then refresh both owner and pet views consistently.
- [x] 5.4 Manually verify desktop/mobile, standard/dark theme, all locales, keyboard-accessible tabs/forms, and loading/empty/error states; add focused frontend tests where the project supports them.
- [x] 5.5 Align the VET pet-profile owner row with the supplied design by placing it directly below the description inside the pet summary card, including assigned and unassigned states and profile navigation.
- [x] 5.6 Replace the compact pet-edit owner selector with the supplied owner-information card, including searchable selection, field population, inline create/update, reassignment, detachment, validation, localization, and responsive styling.
- [x] 5.7 Browser-test the refined pet profile and edit layouts on desktop and mobile in standard and dark themes, including create, update, reassignment, detachment, and owner-profile navigation.

## 6. Documentation and Verification

- [x] 6.1 Update durable architecture documentation to distinguish account authorization ownership from veterinarian-managed pet owner records and document records as storage-only metadata.
- [x] 6.2 Run focused and full pets-service tests, frontend lint and root/subpath production builds, OpenSpec validation, and `git diff --check`.
- [x] 6.3 Rebuild the sandbox pets-service container, inspect Flyway/application logs, and smoke-test placeholder completion, owner CRUD, avatar handling, pet attach/reassign/detach, record/archive flows, and VET/non-VET/public authorization boundaries.
- [x] 6.4 Review `git status`, focused `git diff`, migration versions, generated files, and preservation of the user's existing untracked files before handoff.

## 7. Unified Account Experience and Owner Visual Parity

- [x] 7.1 Make `/dashboard` the canonical landing page for USER and legacy VET claims, retain `/vet/dashboard` as a compatibility redirect, and align protected routes and visible owner controls for both claims.
- [x] 7.2 Align pets-service owner, owner-record, avatar, and pet-owner association authorization for authenticated USER and legacy VET claims while preserving anonymous/public-share privacy.
- [x] 7.3 Restyle the owner profile to reuse the pet profile's page width, header, card scale, typography, controls, tabs, spacing, radii, and theme colors.
- [x] 7.4 Add or update focused backend/frontend tests for unified role compatibility, canonical routing, owner visibility, and public privacy.
- [x] 7.5 Run relevant frontend/backend checks, rebuild affected sandbox services, inspect logs, and browser-smoke-test USER and legacy VET login flows plus owner profile visual parity.
- [x] 7.6 Prevent nullable base pet favorite metadata from being copied into the primitive search-list favorite field, and cover non-empty pet search with a regression test.
