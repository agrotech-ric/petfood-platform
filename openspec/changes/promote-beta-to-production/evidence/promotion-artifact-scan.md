# Promotion artifact scan

Date: 2026-08-19

Promotion base: `e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e`

Reviewed head: `4c768130a37799e23ebd2d4db4076eebae6288eb`

## Results

- Gitleaks `v8.30.1` scanned the complete checked-out tree in redacted mode: no leaks found.
- Gitleaks scanned the final promotion history range, including both legacy history-only parents: 92 commits and approximately 18.47 MB scanned, with no leaks found.
- A separate Gitleaks scan covered the accepted `162dba90..09eb6f1f` final-legacy increment: no leaks found.
- A separate Gitleaks scan covered the accepted `09eb6f1f..2cb8259d` final-v3 legacy increment: five commits and approximately 4.22 KB scanned, with no leaks found.
- The complete name-status diff from the frozen beta candidate was reviewed.
- No live `.env` file is present in the promotion diff. The only environment file added is the placeholder-only `.env.production.example`.
- No database dump, backup archive, media archive, dependency directory, compiler output, or test cache is present in the promotion diff.
- All 51 promotion paths passed the artifact allowlist. No added or modified path is a symbolic link or exceeds 5 MiB.
- `git diff --check` passed for the complete promotion diff.

The promotion branch contains only source, runtime definitions, workflows, documentation, OpenSpec artifacts, and non-secret examples. Live configuration and recovery assets remain outside Git in their access-controlled locations.

## Commands

```sh
git diff --name-status e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e HEAD
git diff --check e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e HEAD
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 dir --no-banner --redact --exit-code 1 /workspace
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 git --no-banner --redact --exit-code 1 --log-opts='e07f5fc3c7ea9ed9e82f744bc26d3f4c0600a95e^..HEAD' /workspace
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 git --no-banner --redact --exit-code 1 --log-opts='162dba90af60764b9a9a3161a3758b5552da828b..09eb6f1f3ee9c423f5ed73ff04f9085355ce1025' /workspace
docker run --rm -v "$PWD:/workspace:ro" zricethezav/gitleaks:v8.30.1 git --no-banner --redact --exit-code 1 --log-opts='09eb6f1f3ee9c423f5ed73ff04f9085355ce1025..2cb8259dd01bbba8eff7f9f2c5169e58b072d8f7' /workspace
```
