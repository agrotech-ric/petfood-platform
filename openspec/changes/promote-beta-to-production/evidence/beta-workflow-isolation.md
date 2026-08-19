# Beta Workflow Isolation

Verified: 2026-08-19

`.github/workflows/deploy-beta.yml` no longer has a push trigger and contains no
deployment step. It can only be started manually with a full commit SHA that
must match both the checkout and current `origin/beta`.

The workflow shares the `petfood-production-deploy` concurrency lock with the
production workflow, validates only `docker-compose.sandbox.yml`, rejects any
rendered production-named service or volume, and does not run `compose up`,
restart a container, mutate a proxy, or change domain routing. Actionlint 1.7.7
and the local sandbox-isolation assertions passed.
