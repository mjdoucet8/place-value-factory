import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";

const hash = (value: string) => createHash("sha256").update(value).digest("hex");

/** A preview contains counts, not student names, credentials or answers. */
export async function previewStudentDeletion(
  client: PoolClient,
  classId: string,
  studentId: string,
) {
  const student = (
    await client.query(
      `SELECT s.id,s.username,c.code,c.teacher_id,c.archived_at
       FROM pvf_student s JOIN pvf_class c ON c.id=s.class_id
       WHERE s.class_id=$1 AND s.id=$2`,
      [classId, studentId],
    )
  ).rows[0];
  if (!student) throw new Error("Selected student is not in the selected class.");
  const counts = (
    await client.query(
      `SELECT
       (SELECT count(*)::int FROM pvf_attempt WHERE student_id=$1) AS attempts,
       (SELECT count(*)::int FROM pvf_order o JOIN pvf_attempt a ON a.id=o.attempt_id WHERE a.student_id=$1) AS orders,
       (SELECT count(*)::int FROM pvf_response r JOIN pvf_order o ON o.id=r.order_id JOIN pvf_attempt a ON a.id=o.attempt_id WHERE a.student_id=$1) AS answers,
       (SELECT count(*)::int FROM pvf_skill_evidence WHERE student_id=$1) AS evidence,
       (SELECT count(*)::int FROM pvf_session WHERE actor_id=$1) AS sessions,
       (SELECT count(*)::int FROM pvf_command_receipt WHERE actor_id=$1) AS receipts`,
      [studentId],
    )
  ).rows[0];
  return {
    classHash: hash(classId),
    studentHash: hash(studentId),
    archived: Boolean(student.archived_at),
    counts,
    student,
  };
}

export async function deleteStudent(
  pool: Pool,
  classId: string,
  studentId: string,
  reason: "student_delete" | "retention_delete",
  backupRetentionDays: number,
) {
  if (!Number.isSafeInteger(backupRetentionDays) || backupRetentionDays < 1)
    throw new Error("An approved positive backup retention period in days is required.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(736482902)");
    const preview = await previewStudentDeletion(client, classId, studentId);
    // A roster receipt may hold a recently issued encrypted PIN and old receipts
    // have no target-student column. Remove the class teacher's roster receipts.
    await client.query("DELETE FROM pvf_roster_receipt WHERE actor_id=$1", [
      preview.student.teacher_id,
    ]);
    await client.query("DELETE FROM pvf_command_receipt WHERE actor_id=$1", [studentId]);
    await client.query("DELETE FROM pvf_game_profile WHERE student_id=$1", [studentId]);
    await client.query("DELETE FROM pvf_student WHERE id=$1 AND class_id=$2", [studentId, classId]);
    await client.query("DELETE FROM pvf_identity WHERE id=$1", [studentId]);
    await client.query("DELETE FROM pvf_login_limit WHERE bucket=$1", [
      hash(`student:${preview.student.code}:${preview.student.username}`),
    ]);
    await client.query(
      "INSERT INTO pvf_operations_audit(action,target_hash,actor_hash,detail,backup_expiry_at) VALUES($1,$2,$3,$4::jsonb,now()+make_interval(days => $5::int))",
      [reason, preview.studentHash, preview.classHash, JSON.stringify(preview.counts), backupRetentionDays],
    );
    await client.query("COMMIT");
    return { classHash: preview.classHash, studentHash: preview.studentHash, counts: preview.counts };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function retentionCandidates(pool: Pool, classId: string, days: number) {
  if (!Number.isSafeInteger(days) || days < 1)
    throw new Error("An approved positive retention period in days is required.");
  const result = await pool.query(
    `SELECT s.id FROM pvf_student s JOIN pvf_class c ON c.id=s.class_id
     WHERE c.id=$1 AND c.archived_at IS NOT NULL
       AND c.archived_at < now() - make_interval(days => $2::int)
     ORDER BY s.id`,
    [classId, days],
  );
  return result.rows.map((row) => ({ studentId: row.id as string, studentHash: hash(row.id) }));
}

export async function cleanupExpiredSecrets(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const secrets = await client.query("UPDATE pvf_roster_receipt SET secret_ciphertext=NULL WHERE secret_expires_at<=now() AND secret_ciphertext IS NOT NULL");
    const sessions = await client.query("DELETE FROM pvf_session WHERE expires_at<=now() OR last_seen_at<=now()-interval '30 minutes'");
    const limits = await client.query("DELETE FROM pvf_login_limit WHERE window_start<now()-interval '1 day'");
    const counts = { secrets: secrets.rowCount ?? 0, sessions: sessions.rowCount ?? 0, limits: limits.rowCount ?? 0 };
    await client.query(
      "INSERT INTO pvf_operations_audit(action,target_hash,detail) VALUES('secret_cleanup',$1,$2::jsonb)",
      [hash("expired-secrets"), JSON.stringify(counts)],
    );
    await client.query("COMMIT");
    return counts;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function auditRetention(pool: Pool, days: number, execute: boolean) {
  if (!Number.isSafeInteger(days) || days < 1)
    throw new Error("An approved positive audit retention period in days is required.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id FROM pvf_operations_audit
       WHERE created_at < now() - make_interval(days => $1::int)
         AND (backup_expiry_at IS NULL OR backup_expiry_at < now())
       ORDER BY id LIMIT 1000 FOR UPDATE`,
      [days],
    );
    if (execute && result.rowCount)
      await client.query("DELETE FROM pvf_operations_audit WHERE id=ANY($1::bigint[])", [result.rows.map((row) => row.id)]);
    await client.query("COMMIT");
    return { eligibleRecords: result.rowCount ?? 0, deletedRecords: execute ? result.rowCount ?? 0 : 0 };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
