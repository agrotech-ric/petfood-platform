# Final legacy drift reconciliation

Date: 2026-08-19

## Detected change

The promotion PR gate detected that remote `main` had advanced after the
original freeze. No promotion branch or pull request was published before the
gate stopped the operation.

Remote `main` advanced from the independently preserved snapshot
`162dba90af60764b9a9a3161a3758b5552da828b` to final legacy commit
`09eb6f1f3ee9c423f5ed73ff04f9085355ce1025` through pull requests 82, 83, and
84. The increment changes eight legacy/recommender files. It remains
legacy-only source and is not imported into the beta-derived promotion tree.

## Safety review

- Gitleaks `v8.30.1` scanned the accepted legacy increment in redacted mode:
  no leaks found.
- No live environment file, database dump, backup archive, media archive,
  dependency directory, compiler output, or test cache was introduced.
- The increment contains trailing whitespace in historical recommender source.
  It is retained unchanged to preserve exact provenance and is not copied into
  the promoted source tree.

## Additional immutable references

| Kind | Reference | Commit |
| --- | --- | --- |
| Branch | `archive/legacy-main-final` | `09eb6f1f3ee9c423f5ed73ff04f9085355ce1025` |
| Annotated tag | `legacy-main-final-v2-2026-08-19` | `09eb6f1f3ee9c423f5ed73ff04f9085355ce1025` |

The existing `archive/legacy-main` branch and
`legacy-main-final-2026-08-19` tag remain immutable at `162dba90`; they were not
rewritten or deleted.

GitHub rulesets `21038574` and `21038575` were extended before publication to
cover the additional branch and tag. Their active rules continue to block
deletion, non-fast-forward updates, and all updates with no bypass actor. The
effective branch-rules endpoint confirms all three rules on
`archive/legacy-main-final`; the tag ruleset definition confirms the exact new
tag match.

A new filtered clone at
`/tmp/petfood-final-legacy-filtered-clone.YzhCTx` fetched the remote references,
resolved both to the expected commit and tree
`c677beb8a4fdff70a197f6864a65c8214488d335`, and successfully checked out the
final legacy branch. Earlier fresh-clone evidence remains valid for the vendor,
frozen legacy, and beta candidate references.

## Second accepted drift before cutover

On 2026-08-20 the final GO/NO-GO refresh detected that remote `main` had
advanced again, from `09eb6f1f` to
`2cb8259dd01bbba8eff7f9f2c5169e58b072d8f7`, through pull requests 86, 87,
88, and 89. Maintenance had not begun and no live service or domain route had
been changed, so the gate remained safely at NO-GO while the increment was
reconciled.

The increment changes six `frontend-main` and `nutrient-recommender-main`
files, with 85 insertions and 17 deletions. It changes no `backend-main` file,
database migration, runtime definition, workflow, or persistent-data model.
Gitleaks `v8.30.1` scanned the exact `09eb6f1f..2cb8259d` range in redacted mode:
five commits and approximately 4.22 KB, with no leaks found. Historical
trailing whitespace is preserved unchanged and is not imported into beta.

The final increment is available as protected branch
`archive/legacy-main-final-v3` and annotated tag
`legacy-main-final-v3-2026-08-20`, both resolving to `2cb8259d` and tree
`accadaf0c6de8dc2394dbb5b5602dce742f00224`. Active rulesets `21038574` and
`21038575` include both exact refs and retain deletion, non-fast-forward, and
update protection with no bypass actor.

A fresh clone at `/tmp/petfood-fresh-archive-v3.jQ8Q1I/repo` independently
resolved the final branch and tag to `2cb8259d`; it also reconfirmed the vendor
and beta candidate archive commits. The earlier `162dba90` and `09eb6f1f`
archive boundaries remain intact.
