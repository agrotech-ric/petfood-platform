# Production rehearsal acceptance

Date: 2026-08-19

Rehearsal release commit: `892dcaa06b522650e9ddafc818f00d7a81b77fad`

Compose project: `petfood_rehearsal`

Loopback edge: `127.0.0.1:18082`

## Scope and isolation

The complete public-boundary canary ran through `/petfood/` against the exact
images and restored beta generation recorded in `exact-artifact-rehearsal.md`.
The script accepted only a loopback base URL. It created two temporary
`example.test` identities, routed notifications only to the unexposed local
MailHog container, and removed the accounts, session and OTP keys, and photo on
exit. No production user, SMTP endpoint, domain route, or live data store was
contacted.

Post-cleanup fingerprints returned to 4 accounts, 3 pets, 6 recipes, and five
media files. No rehearsal canary identity remained in Redis.

## Acceptance results

All checks in `scripts/production-rehearsal-smoke.sh` passed:

- registration confirmation issued an `HttpOnly`, `Secure`, `SameSite=Lax`
  `sid` cookie scoped to `/petfood` without returning the SID in the body;
- authenticated account profile and pet collection requests returned HTTP 200;
- ingredient and recipe collections returned their expected JSON shapes;
- logout invalidated the session, the protected request then returned HTTP 401,
  and a password login established a new valid session;
- the first password-reset OTP request returned HTTP 200 and an immediate
  repeat returned HTTP 429;
- an owner generated, uploaded, and downloaded a private photo, including
  byte-for-byte content and `Cache-Control: private, no-store`; a second user
  received HTTP 404 for the same object key;
- the authenticated recommender route returned its healthy response and the
  unauthenticated route returned HTTP 401;
- both registration canaries arrived in isolated MailHog;
- the trusted origin received the exact CORS allow-origin and credentials
  headers, while an untrusted origin received no allow-origin header;
- direct refresh of `/petfood/pets/rehearsal-canary` returned the SPA entry
  point; and
- Docker inspection confirmed that only the frontend published a host port and
  that binding was loopback-only. Every internal service had no host binding.

The authenticated test used the restored beta data generation only. The live
legacy domain, live beta runtime, and remote `main` remained unchanged.
