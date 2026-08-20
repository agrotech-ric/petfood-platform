# Writer Quiescence Rehearsal

Rehearsed: 2026-08-19 from 09:24:39Z to 09:28:46Z

The repository owner had explicitly authorized a full stop provided every
integration was reconnected. This rehearsal affected only the two PetFood
generations; unrelated host containers were not stopped.

## Stop boundary

The legacy public nginx edge and database administration UI were stopped first.
The beta frontend development edge and both gateways were then stopped, followed
by the account, authentication, pets, notifications, and recommender containers
for both generations. These services cover PostgreSQL and pet-media writers,
RabbitMQ producers, and RabbitMQ consumers.

PostgreSQL, MinIO, RabbitMQ, and Redis remained running so their state could be
inspected and captured. The exact containers were verified against their Compose
project and service labels before the rehearsal.

## Quiescent-state evidence

- All 15 selected edge/application containers reported `exited`.
- Both PostgreSQL generations reported zero non-idle sessions other than the
  inspection query.
- All seven expected queues in each RabbitMQ generation reported zero pending
  messages and zero consumers after application shutdown.
- Legacy media identities: `petfood_platforma_pets_photos` (17 files,
  916,670 bytes) and `petfood_platforma_minio_data` (13 files, 96,345 bytes).
- Beta media identities: `pets_sandbox_pets_photos_sandbox` (5 files,
  972,735 bytes) and `pets_sandbox_minio_data_sandbox` (9 files, 77,203 bytes).
- No beta volume was mounted by a legacy capture command.

Redis was intentionally not captured. Its contents are session/cache state, not
durable business data; users must authenticate again after legacy recovery.

## Restart evidence

Application services were restarted before gateways and public edges. At
09:28:46Z every selected container was running without a restart loop. The
legacy edge `/` and `/petfood/`, beta gateway health endpoint, and beta frontend
each returned HTTP 200. The expected RabbitMQ notification consumers reattached
in both generations and all queues remained at zero pending messages.
