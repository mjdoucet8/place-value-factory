import { Pool } from "pg";
import {
  auditRetention,
  cleanupExpiredSecrets,
  deleteStudent,
  previewStudentDeletion,
  retentionCandidates,
} from "../apps/server/src/operations.js";

const args = new Set(process.argv.slice(2));
const value = (name: string) =>
  [...args].find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
const action = process.argv[2];
const connectionString = process.env.PVF_OPERATIONS_DATABASE_URL;
if (!connectionString) throw new Error("PVF_OPERATIONS_DATABASE_URL is required.");
if (!action || !["student-delete", "retention", "cleanup", "audit-retention"].includes(action))
  throw new Error("Use student-delete, retention, cleanup, or audit-retention.");
const pool = new Pool({ connectionString });
const backupDays = Number(process.env.PVF_BACKUP_RETENTION_DAYS);
try {
  const database = (await pool.query("SELECT current_database() AS name")).rows[0].name as string;
  const execute = args.has("--execute");
  if (execute && value("confirm-db") !== database)
    throw new Error(`Execution requires --confirm-db=${database}.`);
  if (execute && ["student-delete", "retention"].includes(action) && (!Number.isSafeInteger(backupDays) || backupDays < 1))
    throw new Error("PVF_BACKUP_RETENTION_DAYS must be an approved positive integer for deletion.");
  if (action === "audit-retention") {
    const days = Number(process.env.PVF_AUDIT_RETENTION_DAYS);
    console.log(JSON.stringify({ database, execute, auditRetentionDays: days, counts: await auditRetention(pool, days, execute) }));
  } else if (action === "cleanup") {
    if (!execute) {
      const result = await pool.query(
        `SELECT
         (SELECT count(*)::int FROM pvf_roster_receipt WHERE secret_expires_at<=now() AND secret_ciphertext IS NOT NULL) AS secrets,
         (SELECT count(*)::int FROM pvf_session WHERE expires_at<=now() OR last_seen_at<=now()-interval '30 minutes') AS sessions,
         (SELECT count(*)::int FROM pvf_login_limit WHERE window_start<now()-interval '1 day') AS limits`,
      );
      console.log(JSON.stringify({ database, execute, counts: result.rows[0] }));
    } else console.log(JSON.stringify({ database, execute, counts: await cleanupExpiredSecrets(pool) }));
  } else {
    const classId = value("class-id");
    if (!classId) throw new Error("--class-id is required.");
    if (action === "student-delete") {
      const studentId = value("student-id");
      if (!studentId) throw new Error("--student-id is required.");
      if (execute) {
        console.log(JSON.stringify({ database, execute, backupRetentionDays: backupDays, result: await deleteStudent(pool, classId, studentId, "student_delete", backupDays) }));
      } else {
        const client = await pool.connect();
        try {
          const { student: _student, ...preview } = await previewStudentDeletion(client, classId, studentId);
          console.log(JSON.stringify({ database, execute, preview }));
        } finally {
          client.release();
        }
      }
    } else {
      const days = Number(process.env.PVF_RETENTION_DAYS);
      const candidates = await retentionCandidates(pool, classId, days);
      if (execute) {
        for (const candidate of candidates)
          await deleteStudent(pool, classId, candidate.studentId, "retention_delete", backupDays);
      }
      console.log(JSON.stringify({ database, execute, classId, retentionDays: days, studentHashes: candidates.map((item) => item.studentHash) }));
    }
  }
} finally {
  await pool.end();
}
