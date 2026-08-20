# Guarded Production Deployment Workflow

Verified: 2026-08-19

`.github/workflows/deploy-self-hosted.yml` no longer reacts to a push on
`main`. It is a manual workflow serialized by the
`petfood-production-deploy` concurrency group and attached to the GitHub
`production` environment.

Before building or changing a running production Compose project it:

- validates a full lowercase requested commit and proves that both the checkout
  and current `origin/main` resolve to it;
- requires a constrained backup-set identifier and a restore-tested or accepted
  manifest beneath the approved backup root;
- constrains the external production configuration path to the approved
  host-only directory without printing its values;
- renders the production Compose definition and verifies that exactly five
  external durable volumes exist;
- rejects any selected volume using the legacy `petfood_platforma_` prefix;
- builds every application image with the exact release SHA as its tag and
  verifies each image exists;
- defaults to validate-only mode and requires a separate `DEPLOY_APPROVED`
  selection for deploy mode.

The deploy step uses prebuilt images with `--no-build`. Archive branch or tag
updates cannot trigger the workflow. Actionlint 1.7.7 passed with only the
known custom self-hosted runner label explicitly ignored.
