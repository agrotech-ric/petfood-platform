# Maintenance Response and Proxy Procedure

Verified: 2026-08-19

The host Nginx is active and its `agrotech` site currently proxies
`/petfood/` to the legacy loopback edge on port 5555. The reviewed procedure in
`docs/operations/production-proxy-switch.md` changes only the PetFood locations,
requires `nginx -t` before every reload, and routes through maintenance before
production or rollback.

The immutable maintenance Nginx image was built and run read-only on a temporary
loopback port. A `/petfood/` request returned HTTP 503, `Retry-After: 300`, and
Russian, Kazakh, and English maintenance messages. The image health endpoint
returned 200. No host Nginx file or public-domain route was changed during this
verification.
