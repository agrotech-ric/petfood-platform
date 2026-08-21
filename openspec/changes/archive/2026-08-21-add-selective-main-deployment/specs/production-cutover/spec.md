## MODIFIED Requirements

### Requirement: Production deployment is reproducible and guarded
The promoted beta stack SHALL be deployed from an exact `main` commit through production-specific automation. The initial cutover MUST remain review-gated and require all pre-cutover gates. After cutover, a push to `main` SHALL automatically deploy the affected active services when classification, validation, exact-commit image build, serialized rollout, and post-deployment verification succeed. Uncertain classification MUST select the full active runtime, while recognized non-runtime-only changes MUST leave production unchanged. The production runtime MUST use built release artifacts, MUST NOT run a source-mounted frontend development server, and MUST NOT activate development-only backend profiles. Archived branches and tags MUST NOT be deployable through the automatic production trigger. A guarded manual full-deployment path SHALL remain available.

#### Scenario: Main promotion is ready to deploy
- **WHEN** the approved promotion commit reaches the protected production path during initial cutover
- **THEN** the deployment identifies the exact commit and release artifacts, validates configuration, and requires all pre-cutover gates before changing the running domain

#### Scenario: Routine approved change reaches main
- **WHEN** a post-cutover commit reaches `main`
- **THEN** production automation classifies the change and deploys the exact-commit artifacts for only the affected active services after required validation

#### Scenario: Runtime impact cannot be determined
- **WHEN** the production automation cannot safely classify the changed paths or comparison range
- **THEN** it validates, builds, and deploys the full active runtime instead of omitting a potentially affected service

#### Scenario: Main update affects no active runtime
- **WHEN** every changed path is recognized as documentation, specification content, or preserved legacy source
- **THEN** the release succeeds without changing production containers or images

#### Scenario: An archive reference is updated
- **WHEN** a historical branch or tag is created or changed
- **THEN** no production deployment is triggered

#### Scenario: Development runtime is selected for production
- **WHEN** the release configuration would start Vite development mode, bind-mount mutable application source, or activate a Spring development profile
- **THEN** deployment is blocked before the existing production generation is stopped

#### Scenario: Automatic rollout cannot recover safely
- **WHEN** post-deployment verification fails and automatic application rollback cannot restore a consistent state
- **THEN** the release fails, records the recovery condition, and leaves operator recovery available through the guarded manual process
