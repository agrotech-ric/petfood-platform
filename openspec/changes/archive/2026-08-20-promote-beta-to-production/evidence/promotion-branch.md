# Promotion Branch Evidence

Prepared: 2026-08-19 (Asia/Almaty)

## Identity

- Branch: `promotion/beta-to-main`
- Required base commit:
  `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`
- Required base tree:
  `8428f5f908cd9a63801975c11c90dbb571cf8ac5`
- Source archive: `archive/beta-promotion-candidate`
- Matching annotated tag: `beta-promotion-candidate-2026-08-19`

The working `HEAD` was rechecked at the exact required base immediately before
the branch was created. No rebase, merge, cherry-pick, or legacy content import
was used to prepare the branch.

## Reviewed commit scope

The first promotion commit contains only:

- the OpenSpec proposal, specifications, design, tasks, and non-secret
  implementation evidence for this promotion;
- guarded production and isolated beta workflow changes;
- beta-derived production and static maintenance runtime definitions;
- the production frontend image and `/petfood/` Nginx configuration;
- production configuration validation and safe placeholder examples;
- architecture, local-development, deployment, backup, recovery, readiness,
  and verification documentation;
- the beta sandbox external-secret wiring required by the completed live
  credential rotation;
- the pets-service production storage setting required by the reviewed runtime.

The commit does not intentionally include legacy application changes, legacy
Compose changes, a live environment file, credentials, database dumps, media
archives, backup payloads, or generated build outputs. Full secret and payload
verification is repeated in task 5.4 after the history-only merge.

No remote promotion branch, pull request, `main` update, deployment, or domain
change is part of this step.
