# Backup Storage Selection Evidence

Selected and verified: 2026-08-19 (Asia/Almaty)

## Approved destination

- Storage alias: `petfood-local-encrypted-backups`
- Payload root: `/home/iot/PetFood/petfood-backups`
- Repository relationship: outside `/home/iot/PetFood/petfood_platforma-beta`
- Filesystem: `ext4` on `/dev/nvme0n1p2`
- Capacity at selection: 467 GB total, approximately 237 GB available, 44%
  reported usage by `findmnt`
- Current durable source data identified by the inventory is approximately
  20 MB before dump/archive overhead, so available capacity is sufficient for
  preliminary, final, and rollback-checkpoint sets

The payload root is owned by the operating-system account `iot` and has mode
`0700`. Recovery access is authorized through that account; the system
administrator (`root`) retains inherent emergency access. No application,
container, web-server, or Git process is granted access by this decision.

## Encryption

- Method: OpenPGP encryption with GnuPG 2.2.40
- Public-key fingerprint:
  `7FFE87DAC62C45543F55BF8EABB843C2D96EB7B3`
- Non-secret manifest key reference:
  `local-gpg:petfood-backup-recovery:7FFE87DAC62C45543F55BF8EABB843C2D96EB7B3`
- Private key home: `/home/iot/.local/share/petfood-backup/gnupg`, owned by
  `iot` with mode `0700`
- Verification: an in-memory encrypt/decrypt round trip completed successfully
  on 2026-08-19; no plaintext probe file was retained

The private key has no interactive passphrase and therefore relies on the
operating-system account and directory permissions. This supports unattended
recovery on the selected host but does not protect against compromise of the
`iot` or `root` account. Private key material and backup payloads are never
copied into Git.

## Retention

- Accepted final legacy, pre-cutover beta, and rollback-checkpoint backup sets
  are retained indefinitely until the repository owner explicitly authorizes
  deletion after a successful replacement backup and restore test.
- Preliminary or rejected sets are not deleted automatically. They remain until
  manual review confirms that an accepted replacement exists and that the
  promotion stabilization period has ended.
- Every set uses a distinct generation identifier and manifest; legacy and beta
  payloads must never share a backup-set directory.

## Accepted residual risk

The repository, running application data, backup payloads, and recovery key are
on the same physical filesystem. The owner explicitly selected same-disk
storage. This provides version recovery and access control but does not survive
loss, corruption, or compromise of `/dev/nvme0n1p2`. The promotion may proceed
under that accepted constraint; adding an off-host copy later remains the
recommended resilience improvement.
