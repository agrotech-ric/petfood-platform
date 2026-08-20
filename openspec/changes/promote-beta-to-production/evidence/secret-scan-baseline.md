# Legacy Secret Scan Baseline

Captured: 2026-08-19 (Asia/Almaty)

## Automated scan

- Scanner: Gitleaks `v8.30.1`
- Container image digest: `sha256:c00b6bd0aeb3071cbcb79009cb16a60dd9e0a7c60e2be9ab65d25e6bc8abbb7f`
- Git scope: history reachable from final legacy `main` commit `162dba90af60764b9a9a3161a3758b5552da828b`
- Commits scanned: 117
- Result: zero Gitleaks findings
- Secret output policy: full redaction enabled; no secret values were printed or copied into this change

## Manual classification

The vendor and legacy trees contain documented development credentials and fallback values in README, compose, and application configuration files. They are not classified as token/key leaks by Gitleaks, but the live legacy and beta inventories show that equivalent development defaults are still used by running containers.

Consequences:

- The values cannot be treated as inert historical placeholders until live services have moved to rotated, externally supplied credentials.
- Creating another local reference does not expose new blob content because the commits are already public, but remote archive publication must remain gated on rotation or explicit invalidation of every usable historical default.
- Production configuration must fail when required secrets are missing and must not retain usable fallback values.
- The archive branches remain non-deployable, and the final secret scan must cover the promotion diff and all preserved refs.

No archive reference, tag, push, credential rotation, service restart, or production configuration change was performed by this scan.
