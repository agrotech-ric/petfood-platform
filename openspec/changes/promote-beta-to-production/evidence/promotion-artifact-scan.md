# Promotion artifact scan

Date: 2026-08-19

Promotion base: `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`

Reviewed head: `03a90acf73bfa67799a0c2cb3338317301c21e1b`

## Results

- Gitleaks `v8.30.1` scanned the complete checked-out tree in redacted mode: no leaks found.
- Gitleaks scanned the promotion history range, including both parents of the history-only merge: 87 commits and approximately 18.43 MB scanned, with no leaks found.
- The complete name-status diff from the frozen beta candidate was reviewed.
- No live `.env` file is present in the promotion diff. The only environment file added is the placeholder-only `.env.production.example`.
- No database dump, backup archive, media archive, dependency directory, compiler output, or test cache is present in the promotion diff.
- No added or modified path in the promotion diff is a symbolic link or exceeds 5 MiB.
- `git diff --check` passed for the complete promotion diff.

The promotion branch contains only source, runtime definitions, workflows, documentation, OpenSpec artifacts, and non-secret examples. Live configuration and recovery assets remain outside Git in their access-controlled locations.

## Commands

```sh
git diff --name-status e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e HEAD
git diff --check e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e HEAD
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 dir --no-banner --redact --exit-code 1 /workspace
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 git --no-banner --redact --exit-code 1 --log-opts='e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e^..HEAD' /workspace
```
