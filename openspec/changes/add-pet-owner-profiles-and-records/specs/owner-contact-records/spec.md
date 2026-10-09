## Purpose

Defines authenticated platform-user owner records for planned communications, their detail and edit flows, selected channel metadata, and archive lifecycle without sending messages.

## ADDED Requirements

### Requirement: Owner record lifecycle
The system SHALL let an authenticated platform user create, open, edit, archive, restore, and delete an owner record with a topic, date, time, message, recipient owner, and one or more selected email, SMS, or Telegram channels.

#### Scenario: Create a valid record
- **WHEN** an authenticated user submits a valid date and time, non-blank topic and message, and at least one channel whose contact value exists on the owner
- **THEN** the system stores the record in active state and displays it in the owner's records tab

#### Scenario: Open record details
- **WHEN** an authenticated user selects a record row
- **THEN** the system opens a localized detail page showing the stored date, time, recipient, selected channels and contact values, topic, message, and archive state

#### Scenario: Edit an active record
- **WHEN** an authenticated user changes a valid field on an active record
- **THEN** the system validates and stores the new values without creating a duplicate record

#### Scenario: Invalid record is rejected
- **WHEN** a record has an invalid date or time, blank topic or message, no selected channel, or a selected channel without the corresponding owner contact value
- **THEN** the system rejects the request with validation information and preserves the current record

### Requirement: Channel selections are stored without delivery
The system SHALL allow email selection when the owner has an email address, SMS selection when the owner has a phone number, and Telegram selection when the owner has a Telegram handle. Saving, editing, archiving, or restoring a record SHALL NOT send, schedule, publish, or report delivery of any message.

#### Scenario: Select all available channels
- **WHEN** the owner has email, phone, and Telegram values and the authenticated user selects all three channels
- **THEN** the system stores all three selections and returns the corresponding contact values on detail and edit views

#### Scenario: Channel contact is missing
- **WHEN** the owner lacks the contact value required for a channel
- **THEN** the form shows that channel as unavailable and the backend rejects requests that select it

#### Scenario: Record reaches its stored date and time
- **WHEN** the current time passes a record's stored date and time
- **THEN** the system performs no automatic delivery or status transition

### Requirement: Active records and archive tabs
The owner profile SHALL separate active records from archived records, order each list consistently by stored date and time, and provide localized loading, empty, error, and disabled states.

#### Scenario: View active records
- **WHEN** an authenticated user opens the records tab
- **THEN** only active records are shown with date, topic, message, and edit action

#### Scenario: Archive a record
- **WHEN** an authenticated user confirms archiving an active record
- **THEN** the record is removed from the active tab and appears unchanged in the archive tab

#### Scenario: Restore a record
- **WHEN** an authenticated user restores an archived record
- **THEN** the record returns to the active tab with its stored content unchanged

#### Scenario: View archived records
- **WHEN** an authenticated user opens the archive tab
- **THEN** only archived records are shown with date, topic, message, restore, and delete actions

### Requirement: Archive cleanup
The system SHALL let an authenticated user delete one archived record or clear an owner's archive after explicit confirmation. Active records SHALL never be removed by archive cleanup.

#### Scenario: Delete one archived record
- **WHEN** an authenticated user confirms deletion of an archived record
- **THEN** that record is removed and all other active and archived records remain unchanged

#### Scenario: Clear archive
- **WHEN** an authenticated user confirms clearing an owner's archive
- **THEN** all archived records for that owner are removed and active records remain unchanged

### Requirement: Record isolation
Owner records and their contact values SHALL be available only to authenticated platform users. They SHALL NOT appear in anonymous responses, public shares, notification queues, or application logs.

#### Scenario: Unauthorized record read
- **WHEN** an anonymous caller requests an owner's active record or archive
- **THEN** the system denies the request without returning record or owner contact data
