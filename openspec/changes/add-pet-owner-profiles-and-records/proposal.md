## Why

Platform users currently work with pets without a dedicated owner record or a durable place to keep owner-facing follow-up notes. The platform needs a user-managed owner directory that connects one owner record to multiple pets without turning owners into platform users.

## What Changes

- Add standalone owner records managed by authenticated platform users, with full name, country, city, address, phone, email, Telegram handle, avatar, and a stable identifier.
- Associate a pet with at most one owner record while allowing one owner record to contain multiple pets.
- Let authenticated platform users create, view, edit, and delete owner records and attach, detach, or reassign pets.
- Add owner profile tabs for linked pets, active records, and archived records, including record create, detail, edit, archive, delete, and archive-clear flows.
- Store a record's topic, date, time, message, and selected email, SMS, and Telegram channels as planning data only; no channel sends a message in this change.
- Show the linked owner on authenticated pet pages and let users select an existing owner or create a new one while creating or editing a pet.
- Use one canonical `/dashboard` for the single platform-account experience; legacy `USER` and `VET` claims remain compatibility aliases and SHALL NOT produce separate dashboards.
- Reuse the current pet profile, pet cards, forms, API client, theme, and localization patterns instead of introducing a parallel UI system.
- Make the owner directory reuse the pet dashboard's header, search, content-card, card-grid, spacing, and responsive visual structure, and align the owner profile's top edge with other profile pages.
- Accept a Telegram username or a phone-number contact in owner records so existing Telegram-by-number workflows are not rejected.
- Preserve the existing pet `owner_id` account authorization contract and store the veterinarian-managed owner relationship separately.
- Non-goals include owner registration or login, account-profile linkage, email/SMS/Telegram delivery, scheduling workers, provider integrations, and redesigning unrelated pet-health or recipe workflows.

## Capabilities

### New Capabilities

- `pet-owner-management`: Authenticated owner record lifecycle, pet association, owner presentation on pet screens, authorization, and migration behavior.
- `owner-contact-records`: Stored active and archived owner records, channel metadata, detail/edit flows, and archive lifecycle without message delivery.

### Modified Capabilities

- None.

## Impact

- Pets-service entities, DTOs, repositories, services, controllers, authorization, photo storage integration, and new Flyway migrations for owners, records, and pet association.
- Frontend routes, owner and record pages, pet profile/create/edit integration, typed service contracts, CSS Modules, and all `ru`, `en`, and `kz` dictionaries.
- Existing pets require a compatible local backfill into placeholder owner records while the original account authorization identifier remains unchanged.
- No account-service, auth-service, notifications-service, RabbitMQ, SMTP, SMS, or Telegram provider changes are required.
- Owner contact information is personal data. Authenticated access, anonymous/public-share exclusion, deletion behavior, and log safety must be explicitly tested.
