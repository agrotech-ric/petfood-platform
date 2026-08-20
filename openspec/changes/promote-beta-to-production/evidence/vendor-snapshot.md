# Vendor Snapshot Evidence

Captured: 2026-08-19 (Asia/Almaty)

## Confirmed source

- Commit: `938de22696138012cb6f2a54cd0218fa88bc8009`
- Tree: `a82da5df796f1efc734dcbbcb6b838595d23de3e`
- Commit date: 2026-04-24T12:36:35+05:00
- Commit subject: `Init commit`
- Inventory: 390 tracked files, 4,218,189 bytes in Git blobs
- Provenance: the repository owner confirmed this commit is the originally delivered version.

The snapshot is already reachable from the public repository history. Preservation should therefore create an immutable annotated tag and protected archive branch at this exact commit; a disconnected archive import is unnecessary unless later evidence contradicts the confirmed provenance.

## Credential screening result

A filename-only pattern scan identified credential-like defaults, configuration keys, and password-related application code. No values are reproduced in this evidence. The findings include deployment documentation, compose definitions, service configuration, messaging configuration, and authentication/reset-password code.

This screening does not classify every match as a live secret. Task 2.1 must distinguish placeholders and validation code from usable credentials, confirm rotation for any live value, and run a dedicated repository secret scanner before an archive reference is published.

No project archive was found under the scoped `/home/iot/PetFood` and `/home/iot/Downloads` search locations. The unrelated Actions runner distribution was excluded.
