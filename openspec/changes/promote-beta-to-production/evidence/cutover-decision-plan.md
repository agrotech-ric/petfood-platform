# Cutover decision plan

Prepared: 2026-08-20

## Authority and roles

- **Release owner:** approves the maintenance start, accepts the documented
  emergency legacy rollback limitations, and owns the final reopen decision.
- **Release operator:** executes the runbook on the deployment host, records
  timestamps and exact identifiers, stops on any failed gate, and performs the
  rehearsed generation rollback when a trigger is met.
- **Verifier:** independently compares Git, backup, storage, image, health, and
  acceptance evidence before the operator changes the public route. One person
  may fill both operator and verifier roles for this owner-operated release, but
  each verification result must still be recorded separately from the action.

The owner instructed the operator to continue all approved promotion tasks
without another confirmation unless a critical issue occurs. The legacy
security mismatch was reported as critical and the owner explicitly accepted
it on 2026-08-20. A new critical issue still cancels that standing authority and
requires a new owner decision.

## Expected window and communications

- Expected public maintenance: **30 minutes**.
- Target sequence: maintenance and quiescence 5 minutes; final backup capture
  and verification 10 minutes; protected merge and exact deployment 5 minutes;
  startup and acceptance 10 minutes.
- Hard decision checkpoint: **45 minutes after maintenance begins**. If the
  promoted generation is not ready to reopen by then, invoke the rehearsed
  legacy rollback unless the owner explicitly extends maintenance after seeing
  the current evidence.
- Publish the static maintenance response when the window starts. Record the
  start time before stopping writers.
- Publish a delay update at 30 minutes if traffic is not yet restored.
- Publish either the promoted-generation success notice or the legacy-rollback
  notice after the selected generation passes its checks and the route reopens.
- Do not include personal data, credentials, internal hostnames, backup paths,
  or session identifiers in any notice.

## Go/no-go before downtime

Every item is mandatory. Any failure is **NO-GO**:

1. Remote archive branches and tags resolve to the recorded vendor, final
   legacy, and beta candidate commits from a fresh clone.
2. Promotion PR review is complete; its head commit and tree are recorded; the
   final tree contains the beta-derived runtime and does not reintroduce legacy
   runtime content.
3. Exact application artifacts exist for the approved promotion head and the
   production environment passes configuration and external-volume validation.
4. Preliminary beta and legacy backup sets remain checksum-valid and
   restore-tested; encryption access and free capacity for both final sets are
   available.
5. The static maintenance response and both proxy switch directions pass local
   configuration checks.
6. The exact beta rehearsal is healthy and its full authentication, ownership,
   data, notification, routing, CORS, cookie, and isolation smoke suite passes.
7. The coordinated legacy rollback is available and its generation-specific
   functional suite passes; the owner's accepted security exception remains
   recorded.
8. Live legacy and beta storage identities, writer containers, queue depths,
   and media fingerprints are unambiguous immediately before maintenance.

## Stop conditions during final backup and deployment

Keep maintenance active and stop the release immediately when any of these
occurs:

- a writer cannot be quiesced or a non-idle application database session
  remains;
- database dump, media archive, RabbitMQ capture, encryption, size, or SHA-256
  verification fails;
- a final backup contains the wrong generation or any storage identity becomes
  ambiguous;
- protected `main`, PR head, archive reference, workflow gate, or artifact
  identity differs from the approved value;
- any required dependency fails to start, reports unhealthy, or logs a
  release-blocking startup, Flyway, authentication, storage, or messaging
  error; or
- the official domain reaches a partial application while maintenance should
  still be active.

Before `main` changes, a stop condition aborts the cutover and restores the
previous running state. After `main` changes, repair may continue only within
the 45-minute decision deadline; otherwise rollback begins.

## Promoted-generation acceptance gates

All gates must pass through the official HTTPS `/petfood/` boundary before
traffic reopens:

- root and subpath routing, static assets, and nested SPA refresh;
- all required container health checks and absence of release-blocking logs;
- beta data fingerprints for accounts, pets, recipes, ingredients, and media;
- registration/confirmation, login, logout, protected account and pet reads,
  and session invalidation;
- secure `/petfood` cookie attributes, exact CORS allowlist, OTP throttling, and
  unauthenticated denial;
- owner photo upload/download and non-owner denial;
- ingredient and recipe reads plus authenticated recommender routing;
- RabbitMQ consumer readiness and a controlled notification canary;
- only the intended edge host port is published; and
- no legacy volume, network, application container, or data row is attached to
  the promoted generation.

## Objective rollback triggers

Invoke rollback without reopening the promoted generation when any mandatory
acceptance gate fails and cannot be corrected before the 45-minute checkpoint.
Invoke rollback immediately, without waiting for the deadline, for:

- wrong or ambiguous database/media generation;
- failed or inconsistent final beta backup;
- failed Flyway migration or schema mismatch;
- authentication/session failure, owner-boundary failure, permissive CORS, or
  exposed internal service port;
- confirmed loss or corruption of a beta durable record or media object;
- unavailable database, RabbitMQ, media storage, gateway, authentication,
  account, pets, recommender, frontend, or required notification path; or
- official routing that bypasses maintenance or exposes a partial stack.

If beta has accepted any public write, first return to maintenance, stop beta
writers, and create a new encrypted beta preservation backup. Then restore the
exact legacy code/runtime and matching legacy data together. Reopen legacy only
after its rehearsed routing, account, pet, media, recommender, notification, and
isolation checks pass. Its documented historical security behavior is an
explicitly accepted exception.

## Final checkpoint

The operator may enable maintenance and begin only while the standing owner
authority remains valid and every pre-downtime item is GO. The operator may
reopen the promoted site only after every promoted-generation gate is PASS. Any
unlisted critical discrepancy is treated as NO-GO and reported to the owner
rather than inferred away.
