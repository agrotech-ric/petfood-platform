## Context

See `proposal.md` for motivation. Pets currently store `owner_id` as the authenticated account UUID, and authorization, photo keys, health records, recipes, and sharing rely on that value. The new owner concept is different: it is veterinary CRM data with no credentials, login, account relationship, or self-service access. The supplied desktop designs reuse the visual language of the pet profile and forms but do not define responsive, dark-theme, empty, loading, or error states.

## Goals / Non-Goals

**Goals:**

- Store owner identity/contact records and owner notes entirely within the veterinary pet domain.
- Connect one owner to multiple pets without changing current account-based pet authorization.
- Reuse existing pet profile, pet card, form, photo, API client, i18n, and theme patterns.
- Store selected communication channels truthfully as metadata without implying delivery.
- Keep owner data and operations restricted to authenticated platform users while excluding anonymous and public-share requests.

**Non-Goals:**

- Creating or linking owner login accounts, passwords, sessions, or invitations.
- Sending or scheduling email, SMS, or Telegram messages.
- Changing account-service, auth-service, notifications-service, RabbitMQ, or SMTP.
- Adding clinic tenancy or redesigning unrelated pet-health and recipe workflows.

## Decisions

### 1. Pets-service owns standalone owner records

Pets-service will add a `pet_owners` table with UUID primary key, full name, country, city, address, phone, email, Telegram handle, avatar object key, placeholder marker, and audit timestamps. New owner creation requires a non-blank full name; contact and location fields are optional but validated when present. No column references an account user and no owner operation invokes account-service.

This owner is a veterinary client record rather than the account profile described by the existing account-service ownership boundary. Architecture documentation will distinguish `account user profile` from `veterinary pet owner record`.

Alternative considered: account-service storage. This was rejected after clarification that an owner is not a platform user and the data exists only for authenticated platform users working with pets.

### 2. Pet CRM ownership is separate from security ownership

Pets-service will add nullable `pet_owner_id` to `pets` with a foreign key to `pet_owners` and an index. The existing `owner_id` remains unchanged as the account-level authorization/custody identifier. `PetResponse` adds `petOwnerId` and an optional owner summary for authenticated platform responses; public and anonymous responses omit owner contact data.

Authenticated USER and legacy VET create/update requests may set, replace, or clear `petOwnerId`. Creating a pet from an owner page preselects the owner. Owner deletion is rejected while linked pets exist, so the foreign key never cascades pet deletion.

Alternative considered: repurposing `owner_id`. This was rejected because it would mix a no-login CRM record with the JWT subject used for current resource authorization.

### 3. Existing pets receive local placeholder owners

The pets migration creates one placeholder `pet_owners` row for each distinct existing `pets.owner_id`, reusing that UUID only as a migration key, and sets `pets.pet_owner_id` to it. Placeholder name/contact fields remain empty and `placeholder = true`; the authenticated UI shows a localized incomplete-owner state. The first valid user edit clears the placeholder flag.

This gives every existing pet an owner record without reading account-service tables or implying that the owner can log in. New pets may be temporarily unassigned because detach is an explicit requested workflow.

Alternative considered: leaving every existing pet unassigned. This was rejected because it would discard the useful grouping already represented by the legacy owner identifier.

### 4. Owner records and notes use one authenticated API boundary

Pets-service exposes authenticated endpoints under `/api/v1/pet-owners` for owner search, create, read, update, delete, photo operations, linked-pet listing, and owner records. Pet attach, reassign, and detach reuse the existing pet update path with `petOwnerId`; server-side checks accept the standard USER role and the legacy VET role during the compatibility period.

Owner deletion checks linked pets and active records in the same database transaction. Archived records are deleted only after explicit owner-deletion confirmation. Local ownership avoids distributed consistency and keeps owner profile tabs independently pageable if the data grows.

### 5. Owner notes store intent but perform no delivery

`pet_owner_records` stores UUID, owner foreign key, topic, message, local scheduled date, local scheduled time, `use_email`, `use_sms`, `use_telegram`, status (`active` or `archived`), archive timestamp, and audit timestamps. A selected channel requires the corresponding current owner contact value when creating or updating the record. The selected contact values are returned from the owner for display but are not copied into queues or delivery tables.

No worker observes the stored date/time. Passing the date/time does not archive or send anything. Archive and restore are explicit authenticated-user operations. Clear archive deletes only archived rows.

Alternative considered: automatic email delivery and due-time archival. This was rejected because all channel interaction is intentionally deferred.

### 6. Owner avatars reuse private photo storage patterns

Owner avatars use the existing pets-service storage abstraction with keys scoped below an authenticated-user-controlled `pet-owners/` prefix. Upload/download endpoints validate an authenticated platform role and the referenced owner. Deleting or replacing an avatar follows the current bounded image and key-validation rules. Avatar keys are never exposed through public pet shares.

### 7. Frontend reuses existing pet structures

New owner routes use the authenticated application shell for both standard USER and legacy VET claims:

- `/owners/:ownerId`
- `/owners/:ownerId/edit`
- `/owners/:ownerId/records/new`
- `/owners/:ownerId/records/:recordId`
- `/owners/:ownerId/records/:recordId/edit`

The owner page reuses the pet profile header/card/tab layout and extracts the existing pet-card presentation where practical. The owner editor reuses current inputs, photo controls, buttons, confirmations, and responsive form patterns. Record create and edit share one form component; record detail uses the same layout in read-only mode until the missing sixth design is supplied.

The owner directory reuses the pet dashboard's page-width, top-bar, primary action, search control, content card, responsive grid, loading/error/empty states, and card interaction patterns. Owner cards adapt the pet-card metadata area to show owner identity, primary contact, and linked-pet count. The owner profile wrapper must not introduce vertical padding beyond the shared application layout, so its header aligns with the pet profile header.

An owner's Telegram contact may be either an `@username` or a phone number accepted by the owner phone format. The backend remains authoritative and the frontend describes both accepted formats without silently discarding a supplied value.

`ownerService.ts` owns owner and record contracts. `petService.ts` gains `petOwnerId`, owner summary, and association operations. The pet profile shows a compact owner row directly below the description to authenticated platform users. The pet edit page uses a separate owner-information card below the pet fields: selecting an owner populates editable contact fields, clearing the selection supports detachment, and entering details without a selection creates and associates a new owner on save. The pet create flow retains searchable owner selection and its create-owner return route. The owner profile mirrors the pet profile's page width, header, identity-card scale, typography, radii, spacing, controls, tabs, and theme colors. Every visible string is added to `ru`, `en`, and `kz`, and all styling uses existing theme variables.

### 8. Privacy and authorization are enforced in pets-service

Every owner and owner-record endpoint requires an authenticated standard USER or legacy VET claim. Service methods enforce the same compatibility rule in addition to route security. Pet mapping uses role-aware DTO construction so owner IDs and contact values are absent from public shares and anonymous responses. Logs use record IDs only and never print contact values or messages.

### 9. USER and VET claims share one product experience

`/dashboard` is the canonical authenticated landing page. Login sends both USER and legacy VET accounts there, and `/vet/dashboard` remains only as a compatibility redirect. Routes and controls for pets, owners, records, ingredients, recipes, settings, and profile accept both claims so persisted legacy roles do not create separate account types in the interface. ADMIN remains a distinct administrative role.

## Risks / Trade-offs

- [Existing placeholder owners have incomplete names and contacts] -> Mark them explicitly, show a localized incomplete state, and let authenticated users complete them without changing pet authorization.
- [Technical `owner_id` and CRM `pet_owner_id` are easy to confuse] -> Use distinct Java/TypeScript names, document both meanings, and test that USER authorization never uses `pet_owner_id`.
- [No delivery despite channel checkboxes] -> Label the section as preferred/planned channels and never show sent, delivered, or failed states.
- [Detaching leaves a pet without a CRM owner] -> Show an unassigned state and keep search/assignment readily available to authenticated platform users.
- [Owner deletion removes archived notes] -> Require confirmation and block deletion while pets or active notes remain.
- [Static desktop designs omit mobile/dark/error states] -> Derive them from existing responsive and theme conventions and include manual verification.
- [Telegram accounts may be identified by username or phone number] -> Validate both explicit formats and reject unrelated free text.

## Migration Plan

1. Add `pet_owners` and `pet_owner_records` with the next pets-service Flyway migration.
2. Add nullable `pets.pet_owner_id`, create one placeholder owner per distinct legacy `pets.owner_id`, backfill the association, and add the foreign key/index without changing `pets.owner_id`.
3. Deploy pets-service owner/record APIs and role-aware pet DTOs before exposing frontend routes.
4. Deploy the frontend owner pages and pet integration, then verify migrated placeholders, new owners, attach/reassign/detach, archive behavior, and privacy boundaries.

Rollback leaves `pets.owner_id` untouched. The application can ignore the additive owner tables and `pet_owner_id` column after a code rollback. Do not drop owner records as part of an application rollback; export or retain them until a separately reviewed data rollback is approved.

## Open Questions

- The sixth record-detail mockup was not supplied. The detail page will use the confirmed record form layout in read-only mode until that visual reference arrives; this does not change fields or behavior.
