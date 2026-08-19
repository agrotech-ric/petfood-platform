## 1. Freeze the Release Scope and Inventory

- [x] 1.1 Refresh remote refs in read-only mode, record the reviewed legacy `main` and beta candidate commits, confirm the working tree state, and block candidate drift during promotion preparation.
- [x] 1.2 Locate the original vendor source in Git history or verify the supplied archive checksum, provenance, file inventory, and absence of credentials before selecting its preservation method.
- [x] 1.3 Inventory current GitHub branch protections, tags, open pull requests, deployment triggers, self-hosted runner paths, and archive naming conventions without changing remote state.
- [x] 1.4 Inventory legacy and beta containers, networks, databases, schemas, volumes, bind mounts, media buckets or paths, message queues, proxy routes, domain endpoints, and required integration keys without recording secret values.
- [x] 1.5 Reassess `docs/production-readiness.md` against the current beta commit and record every unresolved release blocker that must close before the cutover gate.

## 2. Preserve Source Generations

- [x] 2.1 Scan the selected vendor snapshot and final legacy history for committed secrets or unsafe artifacts, classify historical development defaults, and block remote publication until equivalent live credentials are rotated or invalidated.
- [x] 2.2 Create local archive branches and annotated tags for the vendor source, final legacy `main`, and frozen beta candidate, and verify each reference against its expected tree and provenance.
- [x] 2.3 Add a non-secret recovery-manifest format and restoration runbook that associate source commits, runtime definitions, backup identifiers, checksums, tool versions, and storage aliases.

## 3. Back Up and Prove Data Recovery

- [x] 3.1 Select an encrypted access-controlled backup destination outside Git, verify available capacity and retention, and document authorized recovery access without copying credentials into the repository.
- [x] 3.2 Define and rehearse writer quiescence for PostgreSQL, pet media, RabbitMQ producers and consumers, and application services; document that Redis sessions are non-durable and require reauthentication after legacy recovery.
- [x] 3.3 Create preliminary legacy PostgreSQL and media backups, export or drain the required RabbitMQ state, generate checksums and a recovery manifest, and verify that no beta store was included.
- [x] 3.4 Restore the preliminary legacy backup into an isolated network and, using the matching archived legacy code, verify schema startup plus representative account, pet, and media reads; verify recipe reads only if recipes exist in that generation, otherwise record source-and-schema evidence that they are unsupported and do not import beta data.
- [x] 3.5 Create and verify a preliminary backup of the beta production candidate, then rehearse attaching or restoring it under explicit production storage identifiers without connecting any legacy data.

## 4. Prepare the Production Runtime and Deployment Path

- [x] 4.1 Build a production runtime for the active beta frontend, Spring services, recommender, and infrastructure that uses immutable build artifacts, production profiles, private internal services, and `/petfood/` routing without source bind mounts or a Vite development server.
- [x] 4.2 Replace the legacy automatic `main` deployment workflow with a serialized, manually or environment-gated workflow that deploys the active beta stack from an exact approved commit and validates configuration before stopping the current generation.
- [x] 4.3 Constrain the beta deployment workflow to an isolated staging path, or disable it for the cutover, so it cannot attach production stores, route the production domain, or race the `main` deployment.
- [x] 4.4 Add a static maintenance response and a reviewed reverse-proxy switch procedure that keeps the application unavailable until all required services pass readiness.
- [x] 4.5 Add production configuration validation for database identity, media storage, Redis, RabbitMQ, SMTP, exact CORS origins, secure `/petfood` cookie scope, gateway routes, and required external secret references without usable production fallbacks.
- [x] 4.6 With explicit operational approval, rotate or invalidate live credentials that match historical development values, reconnect affected legacy and beta services through external secrets, and prove old values no longer authenticate.
- [x] 4.7 Update architecture, local-development, deployment, backup, recovery, and verification documentation for the promoted beta topology and guarded release process.

## 5. Publish Archives and Build the Promotion Commit

- [x] 5.1 With explicit remote-operation approval and completed credential invalidation evidence, push the archive references before any `main` update, configure deletion and force-push protection, and verify all generations from a fresh clone.
- [x] 5.2 Create the promotion branch from the frozen beta candidate and add only the reviewed OpenSpec, production runtime, workflow, and documentation changes required by this change.
- [ ] 5.3 Merge the archived legacy `main` as a history-only parent, then verify the resulting source tree against the approved beta-derived candidate with tree hashes, a full diff, and an explicit check that legacy runtime files were not reintroduced.
- [ ] 5.4 Run secret scanning and confirm that environment files, active credentials, database dumps, media archives, and generated build outputs are absent from the promotion diff.
- [ ] 5.5 Open and review the promotion pull request without merging it; confirm archive references, branch rules, workflow event filters, release gates, and rollback evidence are all visible to the approver.

## 6. Verify and Rehearse Before Downtime

- [ ] 6.1 Run frontend lint and production builds for root and `/petfood/` bases, all sandbox backend tests, recommender tests, Compose validation, OpenSpec strict validation, `git diff --check`, and the documented security-boundary smoke checks.
- [ ] 6.2 Build the exact promotion artifacts and deploy them in an isolated rehearsal using a restored beta backup and non-production integrations.
- [ ] 6.3 Verify rehearsal flows for login and logout, OTP throttling, protected account and pet requests, owner and non-owner photos, ingredients and recipes, recommender routing, notification delivery canary, nested-route refresh, CORS, cookies, and direct internal-port isolation.
- [ ] 6.4 Rehearse a complete rollback to the matching legacy code and restored legacy data, then repeat public-boundary acceptance checks without contacting production users or production external integrations.
- [ ] 6.5 Define objective go/no-go and rollback thresholds, expected maintenance duration, operator responsibilities, communication steps, and the final approval checkpoint.

## 7. Execute the Maintenance-Window Cutover

- [ ] 7.1 Obtain explicit cutover approval, publish the maintenance notice, enable the maintenance response, and disable public writes before stopping legacy and beta writers.
- [ ] 7.2 Take final consistent legacy and beta database and media backups, capture required messaging state, verify all checksums and manifests, and stop if any recovery asset is incomplete.
- [ ] 7.3 Reconfirm the remote vendor, legacy, and beta archive references from a fresh clone, then merge the approved promotion through the protected path so `main` resolves to the reviewed promotion commit.
- [ ] 7.4 Deploy the exact promoted `main` artifacts and connect only the explicitly identified beta database and media generation; keep the domain in maintenance mode.
- [ ] 7.5 Restore database, Redis, RabbitMQ, media storage, authentication, account, pets, recommender, notifications, gateway, frontend, reverse proxy, SMTP, and other required integrations in dependency order.
- [ ] 7.6 Run health, log, security-boundary, data-generation, and end-to-end acceptance checks through the official domain; invoke the rehearsed rollback if any release-blocking threshold is met.
- [ ] 7.7 Reopen public traffic only after all gates pass and record maintenance timing, deployed code and data identifiers, test evidence, and the explicit rollback decision without secrets or personal data.

## 8. Stabilize and Close the Change

- [ ] 8.1 Monitor startup, authentication, authorization, database, storage, messaging, SMTP, gateway, and frontend behavior through the agreed stabilization window and preserve a new beta backup before any rollback after accepted writes.
- [ ] 8.2 Verify that archived source references and legacy recovery assets remain accessible but cannot trigger deployment or attach to the active production network.
- [ ] 8.3 Update the production-readiness audit and durable operations documentation with the verified final state, remaining blockers, backup ownership, and tested recovery procedure.
- [ ] 8.4 Re-run all applicable checks, review `git status`, `git diff`, and `git diff --check`, confirm every OpenSpec scenario and task has evidence, and archive the change only after acceptance is complete.
