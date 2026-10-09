## Purpose

Defines authenticated platform-user owner records and their one-to-many relationship with pets without granting owners platform accounts or access.

## ADDED Requirements

### Requirement: Authenticated owner lifecycle
The system SHALL let an authenticated platform user create, read, update, and delete an owner record containing a stable identifier, full name, country, city, address, phone, email, Telegram handle, and optional avatar. Creating an owner SHALL NOT create credentials, a user account, a session, or any ability to sign in.

#### Scenario: User creates an owner
- **WHEN** an authenticated user submits valid owner details
- **THEN** the system creates an owner record with a stable identifier and returns every stored field

#### Scenario: User updates all editable fields
- **WHEN** an authenticated user changes any valid name, location, address, phone, email, Telegram, or avatar value
- **THEN** the system stores the changes and returns them on the next owner read

#### Scenario: Invalid owner data is rejected
- **WHEN** an authenticated user submits an invalid email address, phone number, Telegram handle, or overlong value
- **THEN** the system rejects the request with field-level validation information and preserves the previous data

#### Scenario: Anonymous caller requests owner data
- **WHEN** an anonymous caller attempts to browse, read, create, edit, or delete an owner
- **THEN** the system denies the request without disclosing owner or contact data

### Requirement: One owner can be associated with multiple pets
The system SHALL allow one owner record to be associated with multiple pets and SHALL allow each pet to reference at most one owner record. Owner association SHALL remain separate from the account identifier used to authorize existing pet resources.

#### Scenario: Add a pet from the owner profile
- **WHEN** an authenticated user starts pet creation from an owner profile and completes a valid pet form
- **THEN** the new pet is associated with that owner and appears in the owner's pet list

#### Scenario: Attach an existing pet
- **WHEN** an authenticated user selects an unassigned pet from an owner profile
- **THEN** the pet becomes associated with that owner and appears in the owner's pet list

#### Scenario: Reassign a pet
- **WHEN** an authenticated user selects a different owner while editing a pet
- **THEN** the pet is removed from the previous owner's list and appears in the selected owner's list

#### Scenario: Detach a pet
- **WHEN** an authenticated user removes a pet from an owner and confirms the change without selecting a replacement
- **THEN** the pet remains available to authorized platform workflows with no owner record assigned

#### Scenario: Create and select an owner while editing a pet
- **WHEN** an authenticated user creates a valid owner from the pet owner selector
- **THEN** the new owner is persisted, selected for the pet, and available in later owner searches

### Requirement: Existing pets remain usable
The migration SHALL preserve every existing pet and its account-level authorization identifier. Existing pets SHALL receive a separate placeholder owner record per distinct legacy owner identifier, with unknown owner fields left empty for later authenticated-user completion.

#### Scenario: Existing pet after migration
- **WHEN** an authenticated platform user opens a pet that existed before the migration
- **THEN** the pet remains accessible under the previous authorization rules and resolves to an authenticated-user-editable placeholder owner record

#### Scenario: Complete a placeholder owner
- **WHEN** an authenticated user edits a migrated placeholder with valid owner details
- **THEN** the profile becomes a normal complete owner record without changing pet authorization

### Requirement: Owner profile pet list
The owner profile SHALL show every associated pet using the existing pet-card information and SHALL let an authenticated user open, attach, detach, or add pets through the established pet workflows. Its header, identity card, controls, tabs, typography, radii, spacing, and theme colors SHALL reuse the pet profile's visual scale and component patterns.

#### Scenario: Owner has multiple pets
- **WHEN** an authenticated user opens an owner associated with multiple pets
- **THEN** the pets tab shows every associated pet with its photo, name, breed, age, and favorite state

#### Scenario: Owner has no pets
- **WHEN** an authenticated user opens an owner with no associated pets
- **THEN** the pets tab shows a localized empty state and actions to add or attach a pet

#### Scenario: Browse the owner directory
- **WHEN** an authenticated user opens the owners route
- **THEN** the page reuses the pet dashboard's header, primary action, search area, content card, responsive grid, spacing, and interactive card presentation

#### Scenario: Owner profile header alignment
- **WHEN** an authenticated user opens an owner profile
- **THEN** its page header starts at the same vertical position as the pet profile header without owner-specific top padding

#### Scenario: Store Telegram by phone number
- **WHEN** an authenticated user creates or updates an owner with a valid phone number in the Telegram field
- **THEN** the system stores and returns that Telegram contact without validation failure

### Requirement: Owner presentation on pet screens
The authenticated pet profile SHALL display the associated owner's identity directly below the pet description inside the pet summary card. The owner row SHALL open the complete owner profile. The authenticated pet edit form SHALL contain a separate owner-information card below the pet fields with searchable owner selection and editable full name, country, city, address, phone, email, and Telegram fields. Saving SHALL create an owner when the entered details do not reference an existing owner, update the selected owner when its details change, and associate, reassign, or detach the pet accordingly. Owner information SHALL NOT appear in anonymous shared-pet responses.

#### Scenario: User views pet owner
- **WHEN** an authenticated user opens a pet with an associated owner
- **THEN** the pet summary shows a compact owner row directly below the description that links to the complete owner profile

#### Scenario: User edits owner from a pet
- **WHEN** an authenticated user selects an existing owner in the pet edit form and changes valid owner fields before saving
- **THEN** the system stores the owner changes and keeps that owner associated with the pet

#### Scenario: User creates owner inline
- **WHEN** an authenticated user enters valid owner details in the pet edit form without selecting an existing owner
- **THEN** the system creates the owner and associates the new owner with the pet

#### Scenario: Pet has no assigned owner
- **WHEN** an authenticated user opens or edits an unassigned pet
- **THEN** the UI shows a localized unassigned state and an action to select or create an owner

#### Scenario: Anonymous shared pet view
- **WHEN** an anonymous visitor opens a valid public pet share
- **THEN** the response and page do not expose the owner identifier or any owner fields

### Requirement: Safe owner deletion
The system SHALL delete an owner only when no pets remain associated and no active records remain. Archived records SHALL be removed only as part of the explicitly confirmed owner deletion.

#### Scenario: Delete unused owner
- **WHEN** an authenticated user confirms deletion of an owner with no pets and no active records
- **THEN** the owner and its archived records are deleted and later reads return not found

#### Scenario: Delete owner with dependencies
- **WHEN** an authenticated user attempts to delete an owner that still has pets or active records

### Requirement: Single account dashboard
The frontend SHALL use `/dashboard` as the single dashboard for authenticated platform users. Legacy `USER` and `VET` claims SHALL receive the same routes and owner-management capabilities, and `/vet/dashboard` SHALL redirect to `/dashboard` without rendering a separate experience.

#### Scenario: Legacy VET account signs in
- **WHEN** an authenticated account carrying the legacy `VET` claim completes login
- **THEN** the frontend navigates to `/dashboard`

#### Scenario: Legacy USER account opens owner management
- **WHEN** an authenticated account carrying the legacy `USER` claim opens an owner or owner-record route
- **THEN** the frontend and backend allow the same operation as for a legacy `VET` claim
- **THEN** the system rejects deletion and reports which dependencies must be resolved
