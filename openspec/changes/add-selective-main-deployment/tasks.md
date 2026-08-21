## 1. Change Classification

- [x] 1.1 Add a repository script that compares base and head revisions, handles additions/deletions/renames, and emits the selected active services, no-op state, full-fallback state, and classification reason.
- [x] 1.2 Encode service-local, shared Java, production-wide, explicit non-runtime, preserved legacy, and unknown-path rules from the design in the classifier.
- [x] 1.3 Add focused automated cases for each individual service, multiple services, shared Java files, production-wide files, documentation/OpenSpec-only changes, legacy-only changes, renames, unknown paths, and unavailable comparison revisions.

## 2. Automatic Main Workflow

- [x] 2.1 Add a dedicated GitHub Actions workflow triggered by pushes to `main` and optional forced-full manual dispatch, with production concurrency serialized and in-progress deployments protected from cancellation.
- [x] 2.2 Fetch sufficient Git history, invoke the classifier with the event revisions, expose its outputs to later jobs, and finish no-op evaluations successfully without image or Compose operations.
- [x] 2.3 Run the repository's existing checks for every selected frontend, recommender, and Java service area, and prevent rollout when any required check fails.
- [x] 2.4 Build every selected production image from the triggering commit, tag it with the full commit SHA, and verify the complete selected image set before deployment starts.

## 3. Selective Production Rollout

- [x] 3.1 Capture the running image reference and state of every selected service without printing production secrets.
- [x] 3.2 Deploy only the selected Compose services with immutable exact-commit images, no dependency recreation, and the dependency-safe order defined in the design.
- [x] 3.3 Add selected-container readiness checks and representative public `/petfood/` verification appropriate to the affected service set.
- [x] 3.4 On rollout failure, restore the recorded images for the affected selected services, verify the recovery attempt, and report when persistent state prevents complete automatic rollback.
- [x] 3.5 Publish a non-sensitive job summary containing comparison revisions, classification, selected services, fallback/no-op reason, per-service images, rollout results, verification results, and rollback outcome.

## 4. Operational Documentation

- [x] 4.1 Document the automatic `main` release flow, path-to-service mapping, no-op and full-fallback behavior, required GitHub environment configuration, and the retained manual full-deployment workflow.
- [x] 4.2 Document selective rollout diagnostics, per-service image identification, application rollback limits, and the operator recovery path for migration or persistent-state failures.

## 5. Verification

- [x] 5.1 Run the classifier test matrix and manually inspect its machine-readable outputs for representative single-service, multi-service, no-op, and full-fallback changes.
- [x] 5.2 Validate GitHub Actions syntax and expressions, confirm referenced Compose service names and Docker build contexts, and render the production Compose configuration without exposing its contents.
- [x] 5.3 Run the relevant checks from `docs/development/verification.md`, validate OpenSpec, and review `git status`, `git diff`, and `git diff --check` for focused, secret-free changes.
