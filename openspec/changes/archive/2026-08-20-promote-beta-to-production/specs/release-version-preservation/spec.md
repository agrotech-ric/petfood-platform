## Purpose

Preserves every historically significant source generation and associates it with verifiable recovery metadata before beta replaces the legacy production line.

## ADDED Requirements

### Requirement: Significant source generations remain remotely recoverable
The release process SHALL preserve the original vendor-delivered source, the final legacy `main`, and the approved beta release as distinct remote references before production `main` changes. Each reference MUST resolve to immutable source content and MUST NOT contain an active credential or untracked environment secret. Historical development values MAY remain to preserve exact provenance only after every equivalent live credential is rotated or invalidated and the historical reference is made non-deployable.

#### Scenario: All source generations are available
- **WHEN** an operator inspects the repository from a fresh clone after promotion
- **THEN** the vendor source, final legacy `main`, and promoted beta source can each be checked out independently

#### Scenario: A source generation cannot be identified in existing history
- **WHEN** the vendor-delivered source does not correspond to a verifiable existing commit
- **THEN** the supplied source archive is integrity-checked, screened for secrets, and preserved as a distinct historical reference without altering its content

#### Scenario: Historical value is still usable
- **WHEN** a credential-like value in a preserved source generation still authenticates to a live legacy or beta dependency
- **THEN** remote archive publication is blocked until the live credential is rotated or invalidated and the replacement remains outside Git

### Requirement: Historical references are protected
Historical source references SHALL be protected against routine deletion, rewriting, and accidental deployment. Local archive references MAY be prepared after scanning, but remote publication MUST wait until usable historical credentials are invalidated. The final protected legacy reference MUST exist on the remote before `main` is updated.

#### Scenario: Promotion is attempted without remote archival
- **WHEN** the final legacy `main` reference is absent from the remote or does not match the reviewed legacy commit
- **THEN** promotion is blocked before any update to `main`

#### Scenario: Archived source is inspected
- **WHEN** a developer checks out a historical reference
- **THEN** it is clearly identifiable as archived and is not selected by the normal production deployment path

### Requirement: Code and data generations are traceable
Each preserved production generation SHALL have a non-secret recovery manifest that identifies its source commit, runtime definition, persistent-data backup set, creation time, integrity checksums, and restoration instructions.

#### Scenario: Operator locates matching recovery assets
- **WHEN** an operator selects the final legacy source reference
- **THEN** the manifest identifies the matching database and media backups without exposing credentials

#### Scenario: Backup content does not match its manifest
- **WHEN** an integrity check for a recorded backup or source reference fails
- **THEN** that recovery set is rejected and production promotion remains blocked

### Requirement: Archived production data remains recoverable
Legacy PostgreSQL data and pet-photo or object-storage data SHALL be preserved in access-controlled backups outside Git. A restore verification MUST prove that the backups can be opened with the matching archived application generation before they are accepted.

Restore acceptance SHALL be evaluated against the data model actually supported by the archived source generation. Representative reads MUST cover the durable entities and media owned by that generation. An entity introduced only in a later generation MUST be proven absent from the archived code and schema and MUST NOT be fabricated or imported from another generation merely to satisfy a generic checklist.

#### Scenario: Legacy data is needed after promotion
- **WHEN** an authorized operator needs historical legacy data
- **THEN** the operator can restore it into an isolated environment without connecting it to the active beta data stores

#### Scenario: Restore verification fails
- **WHEN** a legacy database or media restore is incomplete, inconsistent, or unreadable
- **THEN** the backup is not accepted and cutover cannot proceed

#### Scenario: A later-generation entity is absent from the legacy model
- **WHEN** a restore checklist names an entity that the archived source and database schema did not support
- **THEN** the operator records evidence of that absence, performs representative reads for the entities that generation did own, and does not introduce data from another generation
