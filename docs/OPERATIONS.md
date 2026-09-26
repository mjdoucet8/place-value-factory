# Fictional-data PostgreSQL operations

These commands operate only on the explicitly supplied database. Use a disposable database for rehearsal. School retention and backup periods await approval; no period is built into the application.

## Backup and restore

Set `PVF_BACKUP_SOURCE_URL` to the source PostgreSQL URL and `PVF_BACKUP_KEY` to a private random 32-byte hex key held outside the repository. Create an AES-256-GCM encrypted custom-format backup to a new absolute path:

```sh
node scripts/backup-restore.mjs backup --archive=/absolute/private/path/pvf.backup --confirm-source-db=source_database
```

The path must not exist. The script creates it with mode 0600, streams database output through encryption without a plaintext intermediate file, omits owner/ACL metadata and removes a partial file on failure. Protect the key separately from the archive and expire both under the school-approved backup policy; the encrypted archive contains student credentials and evidence. The script does not automatically delete backups.

Create a **separate empty database** and set `PVF_RESTORE_TARGET_URL` to its URL. Supply the original `PVF_BACKUP_KEY`. Restore only with explicit execution and exact target confirmation:

```sh
node scripts/backup-restore.mjs restore --archive=/absolute/private/path/pvf.backup --execute --confirm-target-db=empty_target_database --confirm-no-deletion-ledger
```

`--confirm-no-deletion-ledger` is only for a verified zero-deletion-request rehearsal. If a deletion request has been accepted, set `PVF_DELETION_LEDGER` and `PVF_DELETION_LEDGER_KEY` instead and omit that flag. Restore authenticates the archive and ledger before writing, then replays recorded deletions before declaring success. The target public schema must be empty and its database name must differ from the source when the source URL is provided. Verify reports, certifications, rewards and current access state before using a restored database. A partially failed restore or replay is quarantined; create another empty target for retry. An older backup may predate class archive, PIN resets or access revocation, so do not open it to students until the latest authorized access state is reconciled and sessions are revoked.

## Archive, deletion and retention

An authorized teacher sends `PATCH /api/v1/teacher/classes/:id/archive` with `{commandId}` and matching `Idempotency-Key`, session, origin and CSRF token. Archive is one-way in V1, revokes student sessions, rejects new student login and roster/access changes, and preserves the class for teacher reports. The audit table stores hashed target/actor identifiers and a timestamp, not names or answers.

Set `PVF_OPERATIONS_DATABASE_URL` explicitly. Preview deletion before executing:

```sh
npx tsx scripts/operations.ts student-delete --class-id=CLASS_ID --student-id=STUDENT_ID
PVF_BACKUP_RETENTION_DAYS=APPROVED_BACKUP_DAYS npx tsx scripts/operations.ts student-delete --class-id=CLASS_ID --student-id=STUDENT_ID --execute --confirm-db=database_name
```

The preview gives hashed identifiers and dependent record counts. Execution requires an approved positive `PVF_BACKUP_RETENTION_DAYS`, an absolute private `PVF_DELETION_LEDGER` file outside the repository, and a distinct private 32-byte hex `PVF_DELETION_LEDGER_KEY`. The CLI authenticates the existing ledger and fsyncs an encrypted intent before changing the database. A failed database operation leaves a pending intent for safe replay. The transaction deletes access, sessions, game profile, attempts, immutable orders, answers, evidence, support events, command receipts, access overrides and login limit; teacher reports then reconstruct without the student. It also removes that teacher's roster command receipts because historical PIN receipts lack a student target field. The database audit contains only hashes, counts and `backup_expiry_at` calculated from the configured backup period. Existing backups still contain the deleted record until approved expiry. Keep the ledger, its key and the access-controlled request record outside the database and under separate custody from backup archives; losing them makes an old-backup restore unsafe.

For archived classes only, retention deletion requires an explicit positive `PVF_RETENTION_DAYS`, selected class ID and execution confirmation:

```sh
PVF_RETENTION_DAYS=APPROVED_DAYS npx tsx scripts/operations.ts retention --class-id=CLASS_ID
PVF_RETENTION_DAYS=APPROVED_DAYS PVF_BACKUP_RETENTION_DAYS=APPROVED_BACKUP_DAYS npx tsx scripts/operations.ts retention --class-id=CLASS_ID --execute --confirm-db=database_name
```

This uses the class archive timestamp and prints only hashed student IDs. Execution also requires `PVF_BACKUP_RETENTION_DAYS`. A dry run performs no deletions. `APPROVED_DAYS` is a placeholder, not an approved policy or default.

Preview and remove expired PIN receipt ciphertext, idle/absolute-expired sessions and old login-limit buckets with `npx tsx scripts/operations.ts cleanup` followed by `--execute --confirm-db=database_name`. Schedule this only under approved operational policy. Session and PIN replay rules remain enforced even before cleanup.

Content-free operations audit retention is separately configurable. Set `PVF_AUDIT_RETENTION_DAYS` to an approved positive period and run `npx tsx scripts/operations.ts audit-retention` for a dry-run count; add `--execute --confirm-db=database_name` to remove at most 1,000 eligible rows per invocation. Student-deletion markers remain until their configured `backup_expiry_at` even if the audit period has elapsed. Repeat until the preview reports zero eligible records. This does not erase backup archives; their custody and actual expiry must be managed under school policy.

## Backup inventory, expiry and deletion replay

`PVF_BACKUP_DIRECTORY` must be an explicit private 0700 directory. `PVF_BACKUP_RETENTION_DAYS` is an approved positive period with no default. Inventory reads only direct-child `.backup` files with the encrypted archive header and private 0600 permissions:

```sh
node scripts/backup-inventory.mjs inventory
node scripts/backup-inventory.mjs expire --name=selected.backup
node scripts/backup-inventory.mjs expire --name=selected.backup --execute --confirm-directory=/absolute/private/directory --confirm-sha256=HASH_FROM_PREVIEW
```

The last command removes only that exact expired archive after checking its current SHA-256 and the directory confirmation. Expiry uses filesystem modification time, an operator-maintained local timestamp rather than a trusted original creation date. Reconcile against the independent custody register before executing. The tool does not select a school period or erase a directory automatically. Keep deletion-ledger records until every archive that could contain those students has expired; ledger retention then needs a separate approved decision. Never delete an existing user backup merely to rehearse this tool.

To rehearse deletion after restoring an older fictional backup, first create the encrypted backup, delete a fictional student through the guarded CLI, then restore the earlier archive into another empty database with the ledger variables set. Restore invokes `deletion-replay` automatically. Independently preview or repeat replay with `npx tsx scripts/operations.ts deletion-replay`; execution also needs `PVF_BACKUP_RETENTION_DAYS`, `--execute` and `--confirm-db=target_database`. Replay is idempotent for already-absent students, refuses a class mismatch, and leaves unrelated classes intact. `tests/integration/operations-real.test.ts` executes this disposable-database sequence, including wrong-key and wrong-hash rejection.

## Custody, scheduling and incident recovery

Keep backup, receipt and deletion-ledger keys distinct; obtain them from the approved secret custodian at execution time, never from a committed `.env` file or command argument. Keep archives, the ledger and keys under separate access-controlled custody. Record archive creation, SHA-256, owner, key identifier, approved expiry and deletion-ledger coverage in the school custody register. `node scripts/validate-deployment.mjs pilot` checks local configuration syntax and private paths without connecting to a provider; production intentionally fails until the school identity adapter exists.

After policy approval, an operator may schedule `backup`, `cleanup`, `audit-retention`, archived-class `retention`, and backup `inventory` as separate jobs using the explicit commands above. First run each as a preview; add execution flags and exact database/directory/hash confirmations only to reviewed jobs. Do not install a system timer or auto-delete backups from this repository. Monitor exit codes and keep secrets out of job output.

For an incident: stop application writes and isolate the suspect service; preserve logs and the independent deletion ledger; choose a clean archive and a new empty target; authenticate and restore; confirm deletion replay; compare teacher totals, immutable answer counts, certifications and reward state; revoke restored sessions and reconcile current class/student access, PIN resets and archives; then obtain the school operator's approval before exposing the target. Rotate affected keys under the custodian's procedure if compromise is suspected. The local rehearsal proves mechanics with fictional data, not a production recovery-time objective or backup-custody process.

`npm run test:postgres` creates a private disposable cluster and exercises these operations with fictional records. It does not prove school backup custody or a real deployment.
