# Public Resource Sharing Specification

## Purpose

Provide owner-controlled public, read-only views of pet profiles and calculated recipes without exposing private workspace access or requiring recipient authentication.

## Requirements

### Requirement: Owners can manage pet profile share links
The system SHALL let an authenticated pet owner create or retrieve one active public link for a pet profile, copy that link, revoke it, and replace it with a new link. A created link SHALL remain valid until the owner revokes or replaces it.

#### Scenario: Owner creates a pet share link
- **WHEN** the authenticated owner requests sharing for a pet that has no active link
- **THEN** the system creates one active link and returns a canonical URL under `/petfood/shared/pet`
- **AND** the capability token is placed in the URL fragment rather than its path or query string

#### Scenario: Owner requests an existing pet share link
- **WHEN** the authenticated owner requests sharing for a pet that already has an active link
- **THEN** the system returns that link without creating an additional active link

#### Scenario: Owner replaces a pet share link
- **WHEN** the authenticated owner replaces an active pet share link
- **THEN** the system returns a new link and the previous link no longer grants access

#### Scenario: Owner revokes a pet share link
- **WHEN** the authenticated owner revokes an active pet share link
- **THEN** subsequent use of that link receives the same not-found response as an unknown link

#### Scenario: Non-owner manages a pet share link
- **WHEN** an authenticated user attempts to create, retrieve, replace, or revoke a link for another owner's pet
- **THEN** the system denies the operation without disclosing share-link details

### Requirement: Owners can manage calculated recipe share links
The system SHALL offer the same create-or-retrieve, copy, revoke, and replace lifecycle for a recipe only while the recipe is fully calculated. A recipe is fully calculated only when it has calculated status, a saved calculation result, and a calculation timestamp.

#### Scenario: Owner shares an eligible recipe
- **WHEN** the authenticated owner requests sharing for a fully calculated recipe
- **THEN** the system returns one active canonical URL under `/petfood/shared/recipe` with its capability token in the URL fragment

#### Scenario: Owner attempts to share an ineligible recipe
- **WHEN** the authenticated owner requests sharing for a draft or incompletely calculated recipe
- **THEN** the system rejects the request and does not create an active link

#### Scenario: Recipe becomes ineligible after sharing
- **WHEN** a shared recipe no longer satisfies the fully calculated criteria
- **THEN** the public link becomes unavailable until the recipe is fully calculated again

#### Scenario: Recipe becomes eligible again
- **WHEN** the owner recalculates a previously shared recipe without revoking or replacing its link
- **THEN** the existing active link serves the current calculated recipe again

#### Scenario: Non-owner manages a recipe share link
- **WHEN** an authenticated user attempts to create, retrieve, replace, or revoke a link for another owner's recipe
- **THEN** the system denies the operation without disclosing share-link details

### Requirement: Public pet links expose a current privacy-safe profile
The system SHALL allow an unauthenticated recipient with a valid active pet link to view the pet's current profile in a read-only public layout. The view SHALL include all available profile details, photo, descriptions, current condition, health history, contraindications, weight and activity history with charts, and summaries of fully calculated recipes. It MUST exclude passport data, draft recipes, owner identifiers, private storage keys, and links into private resources.

#### Scenario: Recipient opens a valid pet link
- **WHEN** an unauthenticated recipient opens an active pet share URL
- **THEN** the recipient sees the pet's current privacy-safe profile without being redirected to sign in
- **AND** the page contains no create, edit, delete, or private-workspace controls

#### Scenario: Pet data changes after link creation
- **WHEN** the owner updates data included in an actively shared pet profile
- **THEN** the next public view reflects the current saved data

#### Scenario: Pet has draft and calculated recipes
- **WHEN** a shared pet has both draft recipes and fully calculated recipes
- **THEN** the public profile shows summaries only for the fully calculated recipes
- **AND** those summaries do not provide navigation to a full recipe unless that recipe is independently shared

#### Scenario: Pet has passport data
- **WHEN** a shared pet profile contains passport details
- **THEN** the public response and page omit every passport field

### Requirement: Public recipe links expose a current calculated recipe
The system SHALL allow an unauthenticated recipient with a valid active recipe link to view the current saved recipe and its complete available calculation in a read-only public layout. The view SHALL include recipe inputs, ingredient quantities, saved nutrition results, and graphs derived from those results. When a pet is linked, it SHALL include a brief current pet summary and photo without exposing the full pet profile or private identifiers.

#### Scenario: Recipient opens a valid calculated recipe link
- **WHEN** an unauthenticated recipient opens an active link for a fully calculated recipe
- **THEN** the recipient sees the current saved recipe and calculation without being redirected to sign in
- **AND** the page contains no create, edit, delete, recalculate, or private-workspace controls

#### Scenario: Linked pet is present
- **WHEN** the shared recipe is linked to a pet
- **THEN** the public recipe shows the pet's name, species, breed, age, weight, and photo when those values are available
- **AND** it does not expose the pet's passport, health history, owner identifiers, or a private profile link

#### Scenario: Saved calculation has no digestibility data
- **WHEN** a shared recipe calculation does not contain compatible digestibility data
- **THEN** the public recipe omits digestibility values and charts rather than calculating or fabricating them

### Requirement: Public share access is capability-bound and privacy-preserving
Public share access MUST require a cryptographically unguessable active capability token scoped to one resource. Invalid, malformed, unknown, revoked, deleted-resource, and unauthorized-resource tokens SHALL receive a uniform not-found response. Public share responses SHALL be rate-limited, marked non-cacheable, and marked not for search indexing, and the system MUST NOT place tokens in application logs, analytics, referrer-bearing URLs, or persistent browser storage.

#### Scenario: Recipient supplies a valid token
- **WHEN** the public view presents a valid active token for its matching resource type
- **THEN** the system returns only the public data contract for that resource

#### Scenario: Recipient supplies an unusable token
- **WHEN** the token is malformed, unknown, revoked, belongs to another resource type, or refers to a deleted resource
- **THEN** the system returns the same not-found status and public error shape in every case

#### Scenario: Public traffic exceeds its limit
- **WHEN** a client exceeds the configured rate limit for public share access
- **THEN** the system rejects further requests with a rate-limit response without revealing whether a token is valid

#### Scenario: Public content is returned
- **WHEN** the system returns a public share page or data response
- **THEN** it instructs clients and intermediaries not to store the response
- **AND** the page instructs search engines not to index or follow it

### Requirement: Public share pages support all product languages
The public pet and recipe views SHALL support Russian, English, and Kazakh and SHALL allow the recipient to switch language without changing or invalidating the share link.

#### Scenario: Recipient changes public page language
- **WHEN** a recipient selects another supported language
- **THEN** all static labels and formatted values use the selected language
- **AND** the same shared resource remains open
