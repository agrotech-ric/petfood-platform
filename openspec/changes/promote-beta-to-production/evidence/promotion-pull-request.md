# Promotion pull request review

Date: 2026-08-19

- Pull request: https://github.com/agrotech-ric/petfood-platform/pull/85
- Base: `main`
- Published promotion head: `91e6d377fb5cf23ee4429093c27b753e0b06745e`
- Base commit at publication: `09eb6f1f3ee9c423f5ed73ff04f9085355ce1025`
- State after review: open, non-draft, mergeable, clean merge state
- Review index: https://github.com/agrotech-ric/petfood-platform/pull/85#issuecomment-5342642899

The pull request was opened without merging it. Remote `main` remained on the
final legacy generation throughout publication and review.

## Approver visibility

The PR summary identifies every protected vendor, frozen-legacy,
final-legacy, and beta archive branch/tag pair; explains both history-only
merges and beta-only data selection; and states that section 6 is a mandatory
pre-merge gate.

Because the legacy-to-beta comparison is intentionally large, a direct review
index links the approver to:

- both guarded workflow definitions;
- the production Compose runtime;
- deployment and configuration gates;
- complete-generation rollback instructions;
- archive/ruleset and fresh-clone evidence;
- final legacy drift reconciliation;
- history-only merge tree proof; and
- final secret/artifact scan evidence.

Rulesets `21038574` and `21038575` were re-read during PR review. Both are
active, contain no bypass actors, and enforce deletion, non-fast-forward, and
update rules on all eight exact archive refs.

Both deployment workflows expose only `workflow_dispatch`, contain no `push`
or `pull_request` event, and share the `petfood-production-deploy` concurrency
lock. Therefore opening and updating the PR cannot deploy beta, change the
domain, or attach production storage. The PR has no automatic status checks by
design; the required release checks are the recorded OpenSpec section 6 gates
that must be completed before merge.
