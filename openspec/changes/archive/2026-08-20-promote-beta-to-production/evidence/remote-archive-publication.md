# Remote Archive Publication Evidence

Published and verified: 2026-08-19 (Asia/Almaty)
Repository: `agrotech-ric/petfood-platform`
Operator approval: explicit remote-operation approval was received before any
remote reference or repository ruleset changed.

## Preconditions

- Credential invalidation evidence in `live-credential-rotation.md` was
  complete before publication.
- The authenticated GitHub identity was `agrotech-ric` and reported repository
  administrator permission.
- Remote `main` was rechecked at
  `162dba90af60764b9a9a3161a3758b5552da828b`.
- Remote `beta` was rechecked at
  `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`.
- No matching remote archive branch or tag existed before publication.

## Active protection

Protection was activated before the refs were created so that no published
archive existed in an unprotected window.

| Ruleset | ID | Target | Matching refs | Active rules |
| --- | ---: | --- | --- | --- |
| `immutable-release-archive-branches` | `21038574` | branch | the three exact `archive/*` branches below | deletion, non-fast-forward, update |
| `immutable-release-archive-tags` | `21038575` | tag | the three exact release tags below | deletion, non-fast-forward, update |

Both rulesets are active and have no bypass actors. The GitHub effective-rules
endpoint returned `deletion`, `non_fast_forward`, and `update` for each archive
branch. The tag ruleset API returned the same active rules and the three exact
tag conditions. This blocks deletion and rewriting; the update rule is stronger
than force-push protection because routine ref movement is not allowed at all.

## Published refs

One atomic push created all six refs:

| Generation | Remote branch | Annotated tag | Peeled commit |
| --- | --- | --- | --- |
| Vendor original | `archive/vendor-original` | `vendor-original-2026-04-24` | `938de22696138012cb6f2a54cd0218fa88bc8009` |
| Final legacy main | `archive/legacy-main` | `legacy-main-final-2026-08-19` | `162dba90af60764b9a9a3161a3758b5552da828b` |
| Frozen beta candidate | `archive/beta-promotion-candidate` | `beta-promotion-candidate-2026-08-19` | `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e` |

The remote tag object IDs matched the locally verified annotated tag objects.
Remote `main` remained at the final legacy commit after publication.

## Fresh-clone verification

A new clone from GitHub fetched all six refs. The three archive branches were
checked out into independent detached worktrees. Their commits and trees were:

| Generation | Commit | Tree |
| --- | --- | --- |
| Vendor original | `938de22696138012cb6f2a54cd0218fa88bc8009` | `a82da5df796f1efc734dcbbcb6b838595d23de3e` |
| Final legacy main | `162dba90af60764b9a9a3161a3758b5552da828b` | `677857fc5b5d32b372fed96fb885daf3feea8e43` |
| Frozen beta candidate | `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e` | `8428f5f908cd9a63801975c11c90dbb571cf8ac5` |

Each tag was confirmed as an annotated `tag` object and peeled to the matching
commit. GitHub Actions reported no workflow run whose head branch began with
`archive/`, confirming that archive publication did not activate deployment.

Result: all three source generations are remotely recoverable, protected from
routine deletion and rewriting, independently check-outable, and non-deploying.
No production branch or domain route changed.
