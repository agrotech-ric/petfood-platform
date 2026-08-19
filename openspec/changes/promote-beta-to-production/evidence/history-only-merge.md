# History-Only Legacy Merge Evidence

Prepared: 2026-08-19 (Asia/Almaty)

## Parent identities

- First parent, reviewed beta-derived promotion commit:
  `478b93c363d811458e3739689fcec17bcf6b1890`
- First-parent tree before the merge:
  `b5f6d9d8af733bd2ce883a276cadf736636988f9`
- Second parent, protected final legacy archive:
  `162dba90af60764b9a9a3161a3758b5552da828b`
- Frozen beta candidate:
  `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`
- Frozen beta candidate tree:
  `8428f5f908cd9a63801975c11c90dbb571cf8ac5`

The remote `archive/legacy-main` ref was rechecked against the expected second
parent immediately before the merge.

## Merge method and zero-content proof

The legacy parent was merged with Git's `ours` strategy, `--no-ff`, and
`--no-commit`. Before any evidence or task file was edited, `git write-tree`
returned `b5f6d9d8af733bd2ce883a276cadf736636988f9`, exactly matching the first
parent tree. The index and working-tree diffs were both empty at that point.

Therefore the merge strategy introduced zero files, zero line changes, and no
conflict resolution from the legacy tree. The only merge-commit tree changes
relative to the first parent are this evidence file and the task-completion
checkbox.

## Tree review

The complete diff from the frozen beta candidate to the merge result was
reviewed with `git diff`, `git diff --name-status`, and tree hashes. Every
content change was already in the reviewed promotion commit or is the two
OpenSpec bookkeeping changes described above.

Focused comparisons for `frontend-main/`, `backend-main/`, the legacy root
`docker-compose.yml`, and the legacy root `nginx.conf` returned no change from
the first parent. No legacy runtime file, workflow, application source file, or
configuration was reintroduced by the history merge.

The result retains the previous `main` as reachable ancestry while keeping the
active source tree beta-derived. No remote promotion branch, pull request,
`main` update, deployment, data operation, or domain change is part of this
merge.
