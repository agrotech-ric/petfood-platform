# Local Archive Reference Evidence

Created and verified: 2026-08-19 (Asia/Almaty)

The remote `main` and `beta` commit identifiers were rechecked immediately before creating these refs. No remote reference was changed, and the working branch remained `test/pet-profile-backend`.

| Generation | Local archive branch | Annotated tag | Commit | Tree |
| --- | --- | --- | --- | --- |
| Vendor original | `archive/vendor-original` | `vendor-original-2026-04-24` | `938de22696138012cb6f2a54cd0218fa88bc8009` | `a82da5df796f1efc734dcbbcb6b838595d23de3e` |
| Final legacy main | `archive/legacy-main` | `legacy-main-final-2026-08-19` | `162dba90af60764b9a9a3161a3758b5552da828b` | `677857fc5b5d32b372fed96fb885daf3feea8e43` |
| Frozen beta candidate | `archive/beta-promotion-candidate` | `beta-promotion-candidate-2026-08-19` | `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e` | `8428f5f908cd9a63801975c11c90dbb571cf8ac5` |

Each tag object was verified as an annotated `tag`, then peeled to the expected
commit and tree. The preconditions were later satisfied and the refs were
published and protected as recorded in `remote-archive-publication.md`.
