# Source Promotion Baseline

Captured: 2026-08-19 (Asia/Almaty)

This evidence freezes identifiers for planning and verification. It does not create, move, or publish any Git reference.

## Reviewed remote identifiers

| Generation | Remote reference | Commit | Tree |
| --- | --- | --- | --- |
| Legacy production | `refs/heads/main` | `162dba90af60764b9a9a3161a3758b5552da828b` | `677857fc5b5d32b372fed96fb885daf3feea8e43` |
| Existing legacy alias | `refs/heads/old-main` | `162dba90af60764b9a9a3161a3758b5552da828b` | `677857fc5b5d32b372fed96fb885daf3feea8e43` |
| Beta promotion candidate | `refs/heads/beta` | `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e` | `8428f5f908cd9a63801975c11c90dbb571cf8ac5` |

The remote default branch resolves to `main`. The remote returned no tags. The merge base between legacy `main` and beta is `97ab92bf1382ecc69debb2b4742fd0db678d082d`; the histories contain 152 legacy-only and 74 beta-only commits from that base.

## Local state at capture

- Active branch: `test/pet-profile-backend`.
- Local HEAD equals the remote beta commit and is one merge commit ahead of its configured `origin/test/pet-profile-backend` upstream.
- The only reported working-tree addition is this uncommitted OpenSpec change directory.
- No fetch, branch switch, local reference creation, commit, push, or remote configuration change was performed during capture.

## Drift gate

All later archive, promotion-branch, backup-manifest, rehearsal, and cutover steps must compare live remote refs with the full commit identifiers above. A mismatch blocks the step until the change artifacts and evidence are reviewed and deliberately updated.
