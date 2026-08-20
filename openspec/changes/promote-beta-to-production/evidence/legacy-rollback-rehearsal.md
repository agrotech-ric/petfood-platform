# Full legacy rollback rehearsal

Date: 2026-08-19

Final legacy source: `09eb6f1f3ee9c423f5ed73ff04f9085355ce1025`

Final legacy tree: `c677beb8a4fdff70a197f6864a65c8214488d335`

Backup set: `legacy-main-final-preliminary-20260819T092516Z`

## Matching generation

The restored legacy PostgreSQL, Redis, RabbitMQ, MinIO, and filesystem-media
volumes from the task 3.4 rehearsal were started on the internal-only network
`petfood-restore-legacy-20260819`. The restored generation contained 15 account
rows and 30 pet rows before and after the drill. Its filesystem-media volume
contained 17 files after canary cleanup, and RabbitMQ returned to seven queues
with zero pending messages.

No `backend-main/` file changed between the restore-tested `162dba90` source and
final legacy `09eb6f1f`, so the previously verified auth, account, pets,
gateway, and notifications images remained matching application artifacts. The
changed final frontend and recommender were rebuilt from a detached
`09eb6f1f` worktree:

| Service | Image ID |
| --- | --- |
| auth | `sha256:dde31bd99b3ba186e7289b652a83f1219cf9fce2428bbf1019310f84e824a624` |
| account | `sha256:31bc8d33e4362287cc33a7cc7e45f733ae9adeabfd824569222cbdddd684c4ad` |
| pets | `sha256:30038088365f173ceff4af38ffdbe25dbcceb4d34ee072f1e1bf2d8d77e1e8dc` |
| gateway | `sha256:285c8ff24e84d195119218a920982dcba4bc1d1fc36549049e299a589815671c` |
| notifications | `sha256:2cb9526b40b77666c31fcacdea235278344f9e326a93f82b40bdf692f836d63f` |
| recommender | `sha256:74f99291cb3d49a6fb1ff41d1a2f129ed983269150e235cd16f53a93de8f1e05` |
| frontend | `sha256:615be73285e61dbe97b154b233c86126a11eec9252bdf5bbde1b258604768041` |

The final recommender requires the public
`sentence-transformers/all-MiniLM-L6-v2` model at startup. The isolated drill
used a separate volume populated from the already downloaded cache of the
matching live legacy runtime, then started with offline flags. No rollback
container received outbound network access.

Notifications were directed only to the local MailHog container. Only the
temporary outer edge published a port, bound to loopback. No production user,
SMTP endpoint, official domain, live store, or other production integration was
contacted.

## Switch and functional acceptance

The beta rehearsal was stopped without deleting or changing its five external
volumes. The legacy outer edge then took the same loopback boundary
`127.0.0.1:18082`, reproducing the host `/petfood/` prefix removal. The complete
`scripts/legacy-rollback-smoke.sh` suite passed both before and after this
switch:

- root boundary, frontend, and nested SPA refresh;
- temporary registration and confirmation, account and pet reads;
- photo URL generation, upload, and byte-for-byte media read;
- final legacy recommender routing;
- logout, protected post-logout denial, and login;
- notification delivery to isolated MailHog; and
- direct-port isolation.

The canary accounts, Redis keys, and photos were removed. Because this legacy
generation has no self-delete endpoint, the script uses an exact generated
`rollback-canary-...@example.test` email predicate against the isolated restored
database for cleanup.

After the drill, every legacy rollback container was stopped. The exact beta
rehearsal was restarted from its unchanged external volumes, all 11 services
became healthy, its full production rehearsal smoke suite passed again, and its
fingerprints returned to 4 accounts, 3 pets, 6 recipes, and five media files.

## Accepted legacy rollback exception

The matching legacy generation cannot pass the current production security
boundary used for promotion:

- its session cookie is explicitly `Secure=false` and scoped to `/`;
- email login returns the raw SID in the JSON body; and
- filesystem photo upload and download are public and do not authenticate or
  enforce object ownership.

These are source-level behaviors of final legacy `09eb6f1f`, not rehearsal
configuration errors. Rebuilding the archived source does not correct them,
and mixing the secured beta backend with legacy data is explicitly forbidden.

On 2026-08-20 the owner explicitly accepted these documented limitations and
directed that, during an emergency rollback, the exact old site may be reopened
after its generation-specific functional checks pass. Maintenance mode remains
active while the switch is in progress. The exception applies only to the
coordinated legacy rollback generation and does not weaken the promoted beta
security gates. With this recorded acceptance, the complete rollback rehearsal
satisfies task 6.4.
