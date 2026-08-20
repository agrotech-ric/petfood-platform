# Production Runtime Evidence

Verified: 2026-08-19

The beta-derived production runtime is defined by
`docker-compose.production.yml`. It builds release-tagged frontend, Spring, and
recommender images and connects them to version-pinned infrastructure. Durable
storage is external and must be named explicitly through production variables;
the runtime contains no legacy volume name.

Automated Compose inspection confirmed:

- exactly one published port, bound to host loopback on the frontend edge;
- no bind-mounted source directories;
- `prod` for every Spring service profile;
- an internal application network for databases, storage, messaging, gateway,
  and application services;
- a separate egress network only for the notification service;
- no Vite command or development profile in the production definition.

The frontend multi-stage image was built with Node 22 and served by Nginx from
static output. A read-only container smoke test returned HTTP 308 for
`/petfood`, HTTP 200 for `/petfood/` and a refreshed nested route, and HTTP 404
for the root boundary. Asset references used `/petfood/assets/`; the running
command was Nginx rather than Vite. The verified local image ID was
`sha256:5fcde22f5eeaf3d8db9df585239879bc35547c42e766ad3cc3159e95916e2e1d`.

The frontend dependency installation reported existing npm audit findings
(one moderate and six high). They remain a release-readiness item for the full
task 6.1 verification and are not concealed by this runtime check.
