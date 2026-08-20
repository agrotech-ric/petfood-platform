# Production Proxy Switch

The host Nginx owns the official domain. Its `agrotech` server currently sends
`/petfood/` to the legacy edge on loopback port 5555. Do not edit unrelated
locations in that server block.

The maintenance edge listens on loopback port 18079. The beta-derived
production edge uses the configured loopback port, initially 18080. Both are
private host endpoints; only the host Nginx exposes the official domain.

## Required location forms

Maintenance:

```nginx
location = /petfood {
    return 301 $scheme://$host/petfood/;
}

location /petfood/ {
    proxy_pass http://127.0.0.1:18079;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Production:

```nginx
location = /petfood {
    return 301 $scheme://$host/petfood/;
}

location /petfood/ {
    proxy_pass http://127.0.0.1:18080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The production `proxy_pass` intentionally has no trailing slash. Removing the
`/petfood/` prefix would bypass the production SPA and prefixed gateway routes.

## Reviewed switch procedure

1. Build and start `docker-compose.maintenance.yml` with the exact release ID.
2. Verify `http://127.0.0.1:18079/petfood/` returns 503, includes
   `Retry-After`, and shows all three language messages.
3. Copy the complete current host Nginx site file to the protected operations
   backup location. Do not store certificates, private keys, or unrelated
   virtual-host contents in Git.
4. Change only the two PetFood locations to the maintenance form above.
5. Run `sudo nginx -t`. If it fails, restore the saved file and do not reload.
6. Run `sudo systemctl reload nginx`, then verify the official `/petfood/`
   response is 503. Confirm an API path also returns maintenance rather than
   reaching either application generation.
7. Quiesce writers, perform final backups, and deploy the production runtime
   while the domain remains on maintenance.
8. Verify the production edge directly on loopback: health, `/petfood/`, a
   nested SPA route, prefixed API routing, and the absence of public internal
   ports.
9. Change only the PetFood locations to the production form, run
   `sudo nginx -t`, and reload Nginx.
10. Run the official-domain acceptance checks. If any release gate fails,
    immediately restore the maintenance form, validate, and reload before
    investigating or invoking rollback.

Never switch the domain directly from legacy to an unverified production edge.
Never reload Nginx after a failed configuration test.
