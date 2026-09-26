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
node scripts/backup-restore.mjs restore --archive=/absolute/private/path/pvf.backup --execute --confirm-target-db=empty_target_database
```

The archive is authenticated before the target is opened for writes. The target public schema must be empty and its database name must differ from the source when the source URL is provided. The restore reports counts of students, attempts, orders, answers, evidence and command receipts. Verify reports, certifications and reward state through the restored application before using a restored database. A partially failed database restore may contain partial objects; create another empty target for a retry.

## Archive, deletion and retention

An authorized teacher sends `PATCH /api/v1/teacher/classes/:id/archive` with `{commandId}` and matching `Idempotency-Key`, session, origin and CSRF token. Archive is one-way in V1, revokes student sessions, rejects new student login and roster/access changes, and preserves the class for teacher reports. The audit table stores hashed target/actor identifiers and a timestamp, not names or answers.

Set `PVF_OPERATIONS_DATABASE_URL` explicitly. Preview deletion before executing:

```sh
npx tsx scripts/operations.ts student-delete --class-id=CLASS_ID --student-id=STUDENT_ID
PVF_BACKUP_RETENTION_DAYS=APPROVED_BACKUP_DAYS npx tsx scripts/operations.ts student-delete --class-id=CLASS_ID --student-id=STUDENT_ID --execute --confirm-db=database_name
```

The preview gives hashed identifiers and dependent record counts. Execution additionally requires `PVF_BACKUP_RETENTION_DAYS` set to an approved positive integer; there is no default. It runs in one transaction, deletes access, sessions, game profile, attempts, immutable orders, answers, evidence, support events, command receipts, access overrides and login limit; teacher reports then reconstruct without the student. It also removes that teacher's roster command receipts because historical PIN receipts lack a student target field. Keep an external, access-controlled deletion request record; the database audit contains only hashes, counts and `backup_expiry_at` calculated from the configured backup period. Existing backups still contain the deleted record until their approved expiry and must be tracked separately.

For archived classes only, retention deletion requires an explicit positive `PVF_RETENTION_DAYS`, selected class ID and execution confirmation:

```sh
PVF_RETENTION_DAYS=APPROVED_DAYS npx tsx scripts/operations.ts retention --class-id=CLASS_ID
PVF_RETENTION_DAYS=APPROVED_DAYS PVF_BACKUP_RETENTION_DAYS=APPROVED_BACKUP_DAYS npx tsx scripts/operations.ts retention --class-id=CLASS_ID --execute --confirm-db=database_name
```

This uses the class archive timestamp and prints only hashed student IDs. Execution also requires `PVF_BACKUP_RETENTION_DAYS`. A dry run performs no deletions. `APPROVED_DAYS` is a placeholder, not an approved policy or default.

Preview and remove expired PIN receipt ciphertext, idle/absolute-expired sessions and old login-limit buckets with `npx tsx scripts/operations.ts cleanup` followed by `--execute --confirm-db=database_name`. Schedule this only under approved operational policy. Session and PIN replay rules remain enforced even before cleanup.

Content-free operations audit retention is separately configurable. Set `PVF_AUDIT_RETENTION_DAYS` to an approved positive period and run `npx tsx scripts/operations.ts audit-retention` for a dry-run count; add `--execute --confirm-db=database_name` to remove at most 1,000 eligible rows per invocation. Student-deletion markers remain until their configured `backup_expiry_at` even if the audit period has elapsed. Repeat until the preview reports zero eligible records. This does not erase backup archives; their custody and actual expiry must be managed under school policy.

`npm run test:postgres` creates a private disposable cluster and exercises archive, separate-database restore, dependent deletion, class isolation and expired-secret cleanup with fictional records. It does not prove school backup custody or a real deployment.
