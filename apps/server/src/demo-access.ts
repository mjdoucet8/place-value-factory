import type { QueryResult } from "pg";
import { FICTIONAL_MVP_ACCESS } from "../../../packages/config/src/index.js";
import { hashCredential, verifyCredential } from "./identity.js";

export type DemoAccessDatabase = {
  query: <Row extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ) => Promise<QueryResult<Row>>;
};

/** Keep the public fictional walkthrough account aligned with the login form. */
export async function ensureFictionalMvpAccess(
  database: DemoAccessDatabase,
) {
  const found = await database.query<{
    id: string;
    credential_hash: string;
  }>(
    `SELECT i.id,i.credential_hash
     FROM pvf_identity i
     JOIN pvf_student s ON s.id=i.id
     JOIN pvf_class c ON c.id=s.class_id
     WHERE i.role='student' AND c.code=$1 AND s.username=$2`,
    [FICTIONAL_MVP_ACCESS.classCode, FICTIONAL_MVP_ACCESS.username],
  );
  if (found.rowCount !== 1) return false;
  const account = found.rows[0];
  if (await verifyCredential(FICTIONAL_MVP_ACCESS.pin, account.credential_hash))
    return true;
  await database.query(
    "UPDATE pvf_identity SET credential_hash=$2 WHERE id=$1",
    [account.id, await hashCredential(FICTIONAL_MVP_ACCESS.pin)],
  );
  return true;
}
