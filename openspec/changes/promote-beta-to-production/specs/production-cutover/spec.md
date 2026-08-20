## Purpose

Defines a controlled maintenance-window cutover that makes the beta application and beta data the production system while preserving a coordinated rollback path.

## ADDED Requirements

### Requirement: Promoted main matches the approved beta release
The production `main` source tree SHALL match the reviewed beta release content while retaining the reachable history of the previous `main`. Legacy application directories and runtime files MUST NOT be combined into the active beta runtime merely to preserve history.

#### Scenario: Release tree is verified before promotion
- **WHEN** the release candidate is compared with the approved beta commit
- **THEN** their tracked source trees are identical except for explicitly reviewed promotion artifacts

#### Scenario: Unreviewed legacy files enter the release tree
- **WHEN** the release candidate contains a legacy file or conflict resolution absent from the approved beta content
- **THEN** the promotion is blocked pending review and correction

### Requirement: Production uses only beta application data
After cutover, the domain SHALL serve the promoted beta application using the existing approved beta persistent data. Legacy `main` data MUST NOT be merged, imported, or mounted into the active beta stores as part of the promotion.

#### Scenario: Production starts after cutover
- **WHEN** the production application accepts traffic
- **THEN** its accounts, pets, recipes, ingredients, and media resolve from the identified beta data generation

#### Scenario: Storage identity is ambiguous
- **WHEN** an operator cannot prove whether a configured database or media volume belongs to beta or legacy `main`
- **THEN** startup and cutover are blocked until the storage identity is resolved

### Requirement: Production deployment is reproducible and guarded
The promoted beta stack SHALL be deployed from the approved `main` commit through a production-specific, review-gated process. The production runtime MUST use built release artifacts, MUST NOT run a source-mounted frontend development server, and MUST NOT activate development-only backend profiles. Archived branches MUST NOT be deployable through the normal production trigger.

#### Scenario: Main promotion is ready to deploy
- **WHEN** the approved promotion commit reaches the protected production path
- **THEN** the deployment identifies the exact commit and release artifacts, validates configuration, and requires all pre-cutover gates before changing the running domain

#### Scenario: An archive reference is updated
- **WHEN** a historical branch or tag is created or changed
- **THEN** no production deployment is triggered

#### Scenario: Development runtime is selected for production
- **WHEN** the release configuration would start Vite development mode, bind-mount mutable application source, or activate a Spring development profile
- **THEN** deployment is blocked before the existing production generation is stopped

### Requirement: Cutover occurs under a controlled maintenance window
The release process SHALL prevent user writes during final backups and production reassignment. The entire existing platform MAY be stopped during the announced maintenance window, but public traffic MUST NOT be returned to a partially connected application.

#### Scenario: Maintenance begins
- **WHEN** the cutover reaches its final data and routing phase
- **THEN** legacy and beta writers are quiesced before final backups and storage reassignment

#### Scenario: Only some required services are ready
- **WHEN** the frontend is available but a required backend, storage, messaging, or authentication dependency is not ready
- **THEN** the domain remains in maintenance mode rather than serving the incomplete application

### Requirement: All required production integrations are restored
Before maintenance ends, the promoted system SHALL have its domain and reverse-proxy routing, gateway, authentication, account, pets, recommender, notifications, database, Redis, RabbitMQ, media storage, and SMTP connections restored using production-approved configuration. Secrets MUST remain outside source control.

#### Scenario: Integration verification succeeds
- **WHEN** every required service is started with production configuration
- **THEN** health checks and representative authenticated flows confirm end-to-end connectivity through the public domain

#### Scenario: Required integration cannot be restored
- **WHEN** any required integration fails its readiness or representative flow check
- **THEN** public traffic remains disabled and the operator either repairs the cutover or invokes rollback

### Requirement: Existing production security contracts remain enforced
The promoted system SHALL continue to satisfy the accepted credential confidentiality, abuse protection, browser origin, private photo, service network boundary, and subpath deployment specifications.

#### Scenario: Production acceptance checks run
- **WHEN** the promoted release is tested through the official domain
- **THEN** session cookies, CORS, rate limits, private service exposure, photo ownership, and `/petfood/` routing satisfy their existing specifications

### Requirement: Cutover has an atomic rollback path
The release process SHALL define objective rollback triggers and SHALL restore code, runtime configuration, and persistent data as one matching generation. Before rollback, the current beta state MUST be preserved so writes accepted after cutover are not silently destroyed. When the exact final legacy generation is selected, its documented historical session and photo-security limitations MAY be accepted for emergency reopening only with explicit owner approval recorded in the release evidence. This exception MUST NOT weaken the promoted beta generation's security gates or permit legacy and beta code or data to be mixed.

#### Scenario: Acceptance checks fail before public reopening
- **WHEN** a release-blocking check fails during maintenance
- **THEN** the operator can restore the final legacy generation and keep the domain unavailable until that generation passes its checks

#### Scenario: Rollback is required after beta accepted writes
- **WHEN** rollback is invoked after the promoted application has accepted production writes
- **THEN** the post-cutover beta data is backed up and isolated before the legacy code and matching legacy data are restored

#### Scenario: Owner accepts exact legacy security limitations
- **WHEN** the matching final legacy generation passes its rehearsed functional, routing, integration, data, and isolation checks but retains its documented historical session and photo-security behavior
- **THEN** the owner may explicitly authorize emergency reopening of that exact generation, the acceptance and limitations are recorded, maintenance remains active during the switch, and the promoted beta security baseline remains unchanged

### Requirement: Cutover completion is auditable
The release SHALL record the approved source references, backup verification results, maintenance start and end, acceptance results, deployed generation, and rollback decision without recording secrets or personal data.

#### Scenario: Release review is performed
- **WHEN** an operator reviews the completed cutover
- **THEN** the record demonstrates which code and data generation became active and which checks authorized reopening the domain
