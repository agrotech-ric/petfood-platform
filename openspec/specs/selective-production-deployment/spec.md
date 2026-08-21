# Selective Production Deployment Specification

## Purpose

Defines how changes reaching the production branch select, build, deploy, verify, and report the active runtime services affected by that change.

## Requirements

### Requirement: Main updates initiate production release evaluation
The release system SHALL evaluate every push to `main` for production deployment. Updates to branches, pull requests, and tags other than `main` MUST NOT trigger the automatic production rollout.

#### Scenario: Commit reaches main
- **WHEN** a commit is pushed or merged into `main`
- **THEN** the system evaluates the changed paths and starts the applicable validation and deployment flow for that exact commit

#### Scenario: Non-main reference changes
- **WHEN** a branch other than `main`, a pull request reference, or a tag changes
- **THEN** no automatic production rollout is started

### Requirement: Affected services are selected deterministically
The release system SHALL map every recognized active-source change to the complete set of runtime services it can affect. A service-local change MUST select that service, and a shared Java build or runtime change MUST select all affected Java services.

#### Scenario: One service changes
- **WHEN** all runtime-relevant changed paths belong exclusively to one active service
- **THEN** only that service is selected for validation, image build, and rollout

#### Scenario: Multiple independent services change
- **WHEN** recognized paths affect multiple active services
- **THEN** the union of those services is selected exactly once

#### Scenario: Shared Java source changes
- **WHEN** a shared Java build, wrapper, configuration, or runtime path changes
- **THEN** every Java service that consumes that shared path is selected

#### Scenario: Production-wide configuration changes
- **WHEN** production Compose, release automation, or another recognized platform-wide runtime path changes
- **THEN** all active runtime services are selected

### Requirement: Non-runtime changes produce a successful no-op release
The release system SHALL recognize documentation, OpenSpec artifacts, and preserved legacy application sources as non-runtime paths. When every changed path is non-runtime, the release SHALL complete successfully without building images or changing running services.

#### Scenario: Documentation-only change reaches main
- **WHEN** every changed path is classified as documentation or specification content
- **THEN** the release reports that no runtime service is affected and performs no production rollout

#### Scenario: Preserved legacy source changes
- **WHEN** every changed path belongs to a repository area explicitly preserved outside the active production runtime
- **THEN** the release performs no production rollout

### Requirement: Uncertain classification falls back to all services
The release system SHALL select all active runtime services when it cannot reliably establish the comparison range or classify every changed path. It MUST NOT silently omit an unknown path from deployment consideration.

#### Scenario: Changed path is unknown
- **WHEN** at least one changed path is neither a recognized runtime path nor an explicitly recognized non-runtime path
- **THEN** all active runtime services are selected and the fallback reason is reported

#### Scenario: Commit comparison is unavailable
- **WHEN** the release cannot obtain a trustworthy changed-file set for the `main` update
- **THEN** all active runtime services are selected and the fallback reason is reported

### Requirement: Selected services use exact-commit artifacts
Each selected service SHALL be validated and built from the triggering `main` commit. Its production image MUST be identified by that exact commit, and unselected services MUST retain their currently deployed images and processes.

#### Scenario: Selected service is released
- **WHEN** validation and image build succeed for a selected service
- **THEN** production starts that service from an image identified by the triggering commit

#### Scenario: Service is not selected
- **WHEN** a service is not in the affected set
- **THEN** its running container and deployed image remain unchanged

#### Scenario: Validation or build fails
- **WHEN** any required validation or selected image build fails
- **THEN** no selected service is rolled out for that commit

### Requirement: Rollout is serialized, verified, and recoverable
Production rollouts SHALL be serialized, deploy selected services in dependency-safe order, and verify service readiness plus representative public routing before declaring success. Before rollout, the system MUST record each selected service's running image, and on a recoverable application rollout failure it SHALL restore affected selected services without changing unselected services.

#### Scenario: Concurrent main updates arrive
- **WHEN** a production rollout is active and a newer `main` update requests another rollout
- **THEN** the rollout operations do not execute concurrently and the active rollout is not cancelled mid-deployment

#### Scenario: Selected services become ready
- **WHEN** all selected services start successfully and required readiness and public checks pass
- **THEN** the release is marked successful

#### Scenario: Application rollout check fails
- **WHEN** a selected service fails startup, readiness, or public verification after rollout begins and its previous image is available
- **THEN** the release restores the affected selected service set to the recorded images and reports the failure

#### Scenario: Database state prevents safe image rollback
- **WHEN** an application rollback cannot safely reverse a database migration or other persistent-state change
- **THEN** the release reports that automatic rollback is incomplete and requires the documented operational recovery procedure

### Requirement: Every evaluation produces non-sensitive release evidence
The release system SHALL publish a summary containing the compared commits, changed-path classification, selected services, fallback reason when applicable, exact image identifiers, deployment results, verification results, and rollback outcome. The evidence MUST NOT expose secrets or personal data.

#### Scenario: Operator reviews a selective release
- **WHEN** a main release evaluation completes
- **THEN** its summary is sufficient to determine why each service was selected or skipped and which production images were left running
