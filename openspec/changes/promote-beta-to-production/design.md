## Context

See `proposal.md` for motivation and the delta specs for the release contracts. The Git repository currently has a legacy `main` at `162dba90`, a beta line at `e07f5fc3`, and a shared ancestor followed by substantial independent histories. The production-style legacy stack and the isolated beta stack are both present on the host, with distinct containers and persistent stores. The beta application already defines the intended `/petfood/` routing and security boundary, but its promotion requires coordinated Git, data, runtime, and domain operations.

The original vendor snapshot is confirmed as commit `938de22696138012cb6f2a54cd0218fa88bc8009`. Production credentials and backup payloads cannot be committed. Git operations remain user-owned, and any remote branch update or domain cutover must be performed only after the corresponding review and execution approval. The current `main` push workflow deploys the legacy checkout and compose stack, while the beta workflow runs a Vite development server and Spring `dev` profiles; neither path is acceptable as the final production trigger. Automated scanning found no token or key leaks, but current containers still use development defaults that are visible in historical source.

## Goals / Non-Goals

**Goals:**

- Preserve independently recoverable vendor, legacy, and beta source generations in one repository.
- Make the final `main` tree equivalent to the approved beta tree without force-pushing away the legacy ancestry.
- Preserve legacy durable data outside Git and prove it can be restored in isolation.
- Reuse the identified beta data generation in production without merging legacy data.
- Use a full maintenance window to obtain consistent backups, reconnect every dependency, verify the public boundary, and retain an atomic rollback path.
- Replace the conflicting deployment workflows with a guarded, reproducible production path for the active beta stack before `main` is promoted.

**Non-Goals:**

- Maintaining the legacy site as a second publicly available product.
- Migrating legacy users, pets, recipes, sessions, or media into beta.
- Combining `frontend-main`, `backend-main`, or legacy compose definitions with the active beta runtime.
- Redesigning APIs, schemas, authentication, or the reverse-proxy architecture during promotion.
- Storing database dumps, media archives, environment files, or credentials in Git.
- Establishing a permanent multi-branch release model beyond documenting the recommended post-cutover workflow.

## Decisions

### 1. Preserve source generations in the existing repository

Use protected archive branches for discoverability and annotated tags for fixed release identity. The expected references are conceptually `archive/vendor-original`, `archive/legacy-main`, and tags for the vendor snapshot, final legacy release, and beta promotion candidate. Exact names are selected once against existing remote conventions and recorded in the recovery manifest.

Tag and archive the confirmed vendor commit without rewriting its tree. Local archive branches and annotated tags may be prepared after scanning because they expose no blobs beyond the existing public history. Remote publication remains blocked until every historical development value that is still usable by a live container has been rotated or invalidated.

Scrubbing or rewriting the vendor and legacy commits was rejected because it would destroy exact provenance and change the source generation being preserved. Once live credentials are rotated to external secret inputs, historical development values become inert evidence; archive branch protection and deployment filters prevent them from being executed as a production configuration.

A separate repository was rejected because these are generations of the same product and shared history is useful for comparison. It remains an exception only if ownership, access control, legal constraints, or repository-size limits prohibit storing the vendor snapshot here.

### 2. Promote beta with a history-preserving release merge

Create the promotion branch from the approved beta commit, merge the archived legacy `main` as a second parent using a history-only merge whose resulting tree remains the beta tree, and verify the resulting tree hash against the beta candidate. The promotion branch can then advance `main` through the protected review path because old `main` remains an ancestor of the release commit.

This approach preserves both histories and avoids a force push. A normal content merge was rejected because conflict resolution could reintroduce legacy application files. Moving `main` directly to beta with a forced update was rejected because it increases operational risk and makes branch-protection exceptions necessary.

Only OpenSpec promotion artifacts or deployment adjustments explicitly approved in this change may differ from the candidate tree. Those differences must be committed and tested on the beta-derived release branch before the final tree comparison.

### 3. Keep data archives outside Git and bind them to source manifests

Create encrypted, access-controlled backups for the legacy PostgreSQL database and pet media store. Quiesce message producers and either drain RabbitMQ delivery or export the queue definitions and document any intentionally discarded pending messages. Redis session state is not treated as durable business data; a restored legacy generation may require users to authenticate again.

Each backup set receives a non-secret manifest containing the associated commit and tag, runtime definition checksum, database and media backup identifiers, sizes and cryptographic checksums, creation timestamp, restore tool versions, storage location alias, and restore procedure. Secret-store references may be recorded, but secret values may not.

Before cutover, restore the legacy database and media into an isolated network and verify schema startup plus representative record/media readability with the archived legacy code. The verification follows the archived generation's actual data model: later beta-only entities are documented as absent rather than fabricated or imported into legacy data. File creation alone is not evidence of a valid backup.

### 4. Identify persistent stores explicitly before stopping services

Inventory actual container, database, schema, volume, bind-mount, bucket, and object-prefix identities for both generations. Capture read-only counts and checksums appropriate to each store. Do not infer data ownership from a Compose project name alone.

The promoted runtime must reference the approved beta stores through explicit, reviewed identifiers. If the production Compose project would generate different volume names, either declare the existing beta volumes as external resources or restore the verified beta backup into newly named production volumes. The chosen method must be rehearsed before cutover and must not attach a legacy volume by pattern or position.

### 5. Use a gated full-stop cutover

Run builds, tests, OpenSpec validation, compose validation, security-boundary checks, and a production-style `/petfood/` smoke test before downtime. Announce a maintenance window, stop public routing, quiesce legacy and beta writers, take final legacy and beta backups, and re-check their manifests.

Deploy the promoted source with production configuration, connect only the approved beta stores, and restore dependencies in order: durable infrastructure, internal services, gateway, then frontend/reverse proxy. Keep the public route in maintenance mode until health checks and representative login, protected API, pet photo, recipe/recommender, and notification flows pass.

Incremental live migration was rejected because the user permits downtime and the two data generations must not be merged. Serving the frontend before all dependencies pass readiness was rejected because it exposes a partially connected system.

### 6. Reconnect configuration without moving secrets into source control

Inventory required configuration keys and external endpoints, not their secret values. Production values come from the existing approved secret mechanism or are entered by an authorized operator. Remove usable production fallbacks, rotate the live PostgreSQL, RabbitMQ, MinIO, rate-limit, SMTP, and other applicable credentials away from historical development values, and verify that old values no longer authenticate. Validate exact CORS origins, secure cookie scope, gateway routes, SMTP sender, storage access, database ownership, Redis, and RabbitMQ connectivity before reopening traffic.

The active beta security specifications remain release gates. Promotion does not justify making internal ports public, disabling TLS verification, weakening CORS, returning session identifiers, or bypassing backend ownership checks.

### 7. Roll back complete generations only

Define release-blocking checks and an operator decision deadline before maintenance starts. If a blocker occurs before traffic reopens, restore the final legacy code, runtime, and legacy data together. If beta has already accepted writes, first stop writes and preserve a new beta backup; then restore the legacy generation, acknowledging that the two histories remain separate.

Code-only rollback against beta data and data-only rollback under beta code were rejected because Flyway state, API expectations, media associations, and credentials may not match. After any rollback, the same public readiness and security checks run before traffic returns.

### 8. Separate production deployment from the existing development launcher

Build immutable frontend and service artifacts from the approved commit and run them with explicit production configuration. The production frontend is served by a production web server with `/petfood/` SPA fallback; Java services do not use the `dev` profile; application source is not bind-mounted; and only the intended edge publishes a public port. The active beta runtime remains the source of service topology, but legacy `docker-compose.yml` and legacy application directories are not reused.

Replace the current legacy `main` push workflow before the promotion merge can trigger it. The initial cutover workflow must be manually gated or environment-approved, identify the exact commit and backup generation, validate configuration before stopping the current site, and serialize deployments. After successful stabilization, normal `main` automation may be enabled through a separately reviewed policy. Archive refs never match a deployment trigger, and the existing beta workflow may continue only as an isolated staging path that cannot attach production stores.

Directly reusing the beta dev launcher was rejected because mutable bind mounts, Vite HMR, and Spring development profiles are not reproducible production artifacts. Reusing the legacy `main` deployment workflow was rejected because it targets the old checkout and compose topology and would make the promotion push itself an unsafe cutover trigger.

## Risks / Trade-offs

- [The vendor snapshot cannot be matched to an existing commit] -> Preserve a checksum-verified, secret-screened disconnected reference and document its provenance.
- [Archive references are accidentally deleted or rewritten] -> Push them before promotion, protect them on GitHub, create annotated tags, and verify them from a fresh clone.
- [A history-only merge hides an unintended tree difference] -> Compare Git tree hashes and a full name-status diff against the approved beta commit before updating `main`.
- [The wrong database or media volume is attached] -> Require explicit storage identifiers, manifests, read-only fingerprints, and a rehearsed restore; block on ambiguity.
- [A backup exists but cannot be restored] -> Require an isolated restore test and representative application-level reads before cutover.
- [Maintenance lasts longer than expected] -> Prebuild artifacts, rehearse the storage mapping, define a rollback deadline, and keep a static maintenance response available.
- [SMTP or another external integration causes side effects during rehearsal] -> Use isolated endpoints or disable delivery in rehearsal, then perform a controlled production canary after cutover.
- [Rollback after production writes separates new beta activity from legacy state] -> Back up post-cutover beta data before rollback and never attempt an unplanned automatic merge.
- [Historical branches contain development values used by live containers] -> Preserve exact history locally, rotate or invalidate every equivalent live credential through external secret configuration, prove old values no longer authenticate, and only then publish protected non-deployable archive refs.
- [Merging to `main` triggers the legacy deployment before the cutover is ready] -> Replace and review the `main` workflow on the promotion branch, require a manual/environment gate, and verify its event filters before merging.

## Migration Plan

1. Freeze the promotion candidate and record current local and remote Git state without changing branches.
2. Verify the vendor commit, scan vendor and legacy history, and create reviewed local archive references without publishing them.
3. Inventory beta and legacy runtime/data ownership; create preliminary backups and recovery manifests; complete an isolated legacy restore test.
4. Build the production runtime, replace the legacy `main` deployment trigger, and move live dependencies from historical defaults to externally supplied rotated credentials.
5. Prove old credential values no longer authenticate, then publish and protect the archive references and verify them from a fresh clone.
6. Build the beta-derived promotion branch with the history-only legacy merge, verify its tree, and run the full release checks through a review request without updating production `main` yet.
7. Rehearse the promoted runtime with restored beta data and non-production integrations, including `/petfood/`, authentication, ownership, recommender, and network-boundary checks.
8. Approve and announce the maintenance window; disable public traffic and quiesce all writers.
9. Take and verify final legacy and beta backups, then update `main` through the protected promotion path.
10. Deploy the promoted runtime, attach only the approved beta data, reconnect production integrations, and run health, security, and end-to-end acceptance checks.
11. Reopen the domain only after every release gate passes; record the active code/data generation and archive the release evidence.
12. If a rollback trigger is met, preserve the current beta state, restore the matching legacy generation, repeat acceptance checks, and keep maintenance active until a safe generation is ready.
