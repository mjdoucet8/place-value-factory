import {
  createHash,
  createCipheriv,
  createDecipheriv,
  randomInt,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import type { PoolClient } from "pg";
import type { IncomingMessage } from "node:http";

export type Principal = {
  id: string;
  role: "student" | "teacher";
  classId?: string;
  csrfToken: string;
};
export class AccessError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
const normalize = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";
const derive = (value: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(
      value,
      salt,
      32,
      { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 },
      (error, key) => (error ? reject(error) : resolve(key)),
    ),
  );
export async function hashCredential(value: string) {
  const salt = randomBytes(16);
  return `scrypt-v1$${salt.toString("hex")}$${(await derive(value, salt)).toString("hex")}`;
}
async function verifyCredential(value: string, hash: string) {
  const [version, salt, key] = hash.split("$");
  if (
    version !== "scrypt-v1" ||
    !/^[a-f0-9]{32}$/.test(salt ?? "") ||
    !/^[a-f0-9]{64}$/.test(key ?? "")
  )
    return false;
  return timingSafeEqual(
    await derive(value, Buffer.from(salt, "hex")),
    Buffer.from(key, "hex"),
  );
}
export const sessionCookie = (token: string, secure: boolean) =>
  `pvf_session=${token}; HttpOnly; SameSite=Strict; Path=/api/v1; Max-Age=28800${secure ? "; Secure" : ""}`;
export function sessionToken(request: IncomingMessage) {
  return (
    request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("pvf_session="))
      ?.slice("pvf_session=".length) ?? ""
  );
}

/** Explicit local adapter; school/provider adapters can issue the same server session. */
export class LocalIdentity {
  constructor(
    private client: () => PoolClient,
    private receiptKey?: Buffer,
  ) {}

  private seal(secret: string) {
    if (this.receiptKey?.length !== 32)
      throw new Error("PIN receipt encryption key required");
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.receiptKey, iv);
    return [
      iv,
      Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]),
      cipher.getAuthTag(),
    ]
      .map((part) => part.toString("base64url"))
      .join(".");
  }
  private unseal(value: string) {
    if (this.receiptKey?.length !== 32)
      throw new Error("PIN receipt encryption key required");
    const [iv, data, tag] = value
      .split(".")
      .map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", this.receiptKey, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString(
      "utf8",
    );
  }

  async roster(
    method: string,
    path: string,
    actor: Pick<Principal, "id" | "role">,
    body: Record<string, unknown>,
    idempotencyKey: unknown,
  ): Promise<{ status: number; body: unknown } | null> {
    const classCreate = method === "POST" && path === "/api/v1/teacher/classes";
    const studentCreate =
      method === "POST"
        ? path.match(/^\/api\/v1\/teacher\/classes\/([^/]+)\/students$/)
        : null;
    const studentAction = path.match(
      /^\/api\/v1\/teacher\/students\/([^/]+)\/(reset-pin|access)$/,
    );
    const classAction =
      method === "PATCH"
        ? path.match(/^\/api\/v1\/teacher\/classes\/([^/]+)\/access$/)
        : null;
    if (
      !classCreate &&
      !studentCreate &&
      !classAction &&
      !(
        studentAction &&
        ((studentAction[2] === "reset-pin" && method === "POST") ||
          (studentAction[2] === "access" && method === "PATCH"))
      )
    )
      return null;
    if (actor.role !== "teacher")
      throw new AccessError(
        403,
        "NOT_AUTHORIZED",
        "Teacher access is required.",
      );
    const client = this.client();
    let student:
      | { id: string; alias: string; username: string; class_id: string }
      | undefined;
    if (studentAction) {
      student = (
        await client.query(
          "SELECT s.* FROM pvf_student s JOIN pvf_class c ON c.id=s.class_id WHERE s.id=$1 AND c.teacher_id=$2 FOR UPDATE OF s,c",
          [studentAction[1], actor.id],
        )
      ).rows[0];
      if (!student)
        throw new AccessError(404, "NOT_FOUND", "Student not found.");
    }
    if (studentCreate || classAction) {
      const classId = studentCreate ? studentCreate[1] : classAction![1];
      const owned = (
        await client.query(
          "SELECT id,enabled FROM pvf_class WHERE id=$1 AND teacher_id=$2 FOR UPDATE",
          [classId, actor.id],
        )
      ).rows[0];
      if (!owned) throw new AccessError(404, "NOT_FOUND", "Class not found.");
      if (studentCreate && !owned.enabled)
        throw new AccessError(
          403,
          "ACCESS_DISABLED",
          "Enable this class before adding students.",
        );
    }
    if (
      typeof body.commandId !== "string" ||
      body.commandId.length < 1 ||
      body.commandId.length > 128 ||
      body.commandId !== idempotencyKey
    )
      throw new AccessError(
        422,
        "INVALID_INPUT",
        "A command and matching key are required.",
      );
    const canonical = Object.fromEntries(
      Object.keys(body)
        .sort()
        .map((key) => [key, body[key]]),
    );
    const payloadHash = digest(JSON.stringify([method, path, canonical]));
    const prior = (
      await client.query(
        "SELECT *,secret_expires_at>now() AS secret_live FROM pvf_roster_receipt WHERE actor_id=$1 AND command_id=$2",
        [actor.id, body.commandId],
      )
    ).rows[0];
    if (prior) {
      if (prior.payload_hash !== payloadHash)
        throw new AccessError(
          409,
          "IDEMPOTENCY_CONFLICT",
          "This command was already used for different work.",
        );
      if (prior.secret_ciphertext && !prior.secret_live)
        throw new AccessError(
          409,
          "RESET_COMPLETED_PIN_NOT_REDISPLAYABLE",
          "Access was issued. Reset it again if you need a new PIN.",
        );
      return {
        status: prior.status,
        body: {
          ...prior.response,
          ...(prior.secret_ciphertext
            ? { oneTimePin: this.unseal(prior.secret_ciphertext) }
            : {}),
        },
      };
    }
    let result: Record<string, unknown>;
    let pin: string | undefined;
    let status = 200;
    if (classCreate) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.length > 80 ||
        typeof body.timezone !== "string"
      )
        throw new AccessError(
          422,
          "INVALID_INPUT",
          "Give your class a name and timezone.",
        );
      try {
        new Intl.DateTimeFormat("en", { timeZone: body.timezone }).format();
      } catch {
        throw new AccessError(422, "INVALID_INPUT", "Choose a valid timezone.");
      }
      const id = randomUUID();
      const code = randomBytes(5).toString("hex");
      await client.query(
        "INSERT INTO pvf_class(id,teacher_id,name,timezone,code) VALUES($1,$2,$3,$4,$5)",
        [id, actor.id, body.name.trim(), body.timezone, code],
      );
      result = {
        id,
        name: body.name.trim(),
        timezone: body.timezone,
        classCode: code,
        enabled: true,
        studentCount: 0,
      };
      status = 201;
    } else if (studentCreate) {
      const username = normalize(body.username);
      if (
        !/^[a-z0-9._-]{1,40}$/.test(username) ||
        typeof body.alias !== "string" ||
        !body.alias.trim() ||
        body.alias.length > 40
      )
        throw new AccessError(
          422,
          "INVALID_INPUT",
          "Use a short alias and a username with letters, digits, dots or dashes.",
        );
      if (
        (
          await client.query(
            "SELECT id FROM pvf_student WHERE class_id=$1 AND username=$2",
            [studentCreate[1], username],
          )
        ).rowCount
      )
        throw new AccessError(
          409,
          "USERNAME_UNAVAILABLE",
          "Choose a different username for this class.",
        );
      const id = randomUUID();
      pin = String(randomInt(1_000_000)).padStart(6, "0");
      const credential = await hashCredential(pin);
      await client.query(
        "INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'student',$2,$3)",
        [id, username, credential],
      );
      await client.query(
        "INSERT INTO pvf_student(id,class_id,username,alias) VALUES($1,$2,$3,$4)",
        [id, studentCreate[1], username, body.alias.trim()],
      );
      await client.query(
        "INSERT INTO pvf_game_profile(student_id) VALUES($1)",
        [id],
      );
      result = {
        student: { id, alias: body.alias.trim(), username, enabled: true },
      };
      status = 201;
    } else if (studentAction?.[2] === "reset-pin") {
      pin = String(randomInt(1_000_000)).padStart(6, "0");
      await client.query(
        "UPDATE pvf_identity SET credential_hash=$2 WHERE id=$1",
        [student!.id, await hashCredential(pin)],
      );
      await client.query("DELETE FROM pvf_session WHERE actor_id=$1", [
        student!.id,
      ]);
      result = {};
    } else {
      if (typeof body.enabled !== "boolean")
        throw new AccessError(
          422,
          "INVALID_INPUT",
          "Choose whether access is enabled.",
        );
      if (student) {
        await client.query("UPDATE pvf_identity SET enabled=$2 WHERE id=$1", [
          student.id,
          body.enabled,
        ]);
        await client.query(
          "UPDATE pvf_game_profile SET access_enabled=$2 WHERE student_id=$1",
          [student.id, body.enabled],
        );
        await client.query("DELETE FROM pvf_session WHERE actor_id=$1", [
          student.id,
        ]);
        result = {
          student: {
            id: student.id,
            alias: student.alias,
            username: student.username,
            enabled: body.enabled,
          },
        };
      } else {
        await client.query("UPDATE pvf_class SET enabled=$2 WHERE id=$1", [
          classAction![1],
          body.enabled,
        ]);
        await client.query(
          "DELETE FROM pvf_session WHERE actor_id IN (SELECT id FROM pvf_student WHERE class_id=$1)",
          [classAction![1]],
        );
        result = { id: classAction![1], enabled: body.enabled };
      }
    }
    await client.query(
      "INSERT INTO pvf_roster_receipt(actor_id,command_id,payload_hash,status,response,secret_ciphertext,secret_expires_at) VALUES($1,$2,$3,$4,$5::jsonb,$6,CASE WHEN $6::text IS NULL THEN NULL ELSE now()+interval '5 minutes' END)",
      [
        actor.id,
        body.commandId,
        payloadHash,
        status,
        JSON.stringify(result),
        pin ? this.seal(pin) : null,
      ],
    );
    return { status, body: { ...result, ...(pin ? { oneTimePin: pin } : {}) } };
  }

  async provisionTeacher(username: string, password: string) {
    if (
      !/^[a-z0-9._-]{3,40}$/.test(normalize(username)) ||
      password.length < 12 ||
      password.length > 128
    )
      throw new AccessError(
        422,
        "INVALID_INPUT",
        "Use a valid teacher username and a password of 12–128 characters.",
      );
    const id = randomUUID();
    await this.client().query(
      "INSERT INTO pvf_identity(id,role,username,credential_hash) VALUES($1,'teacher',$2,$3)",
      [id, normalize(username), await hashCredential(password)],
    );
    return id;
  }

  async login(
    role: "student" | "teacher",
    body: Record<string, unknown>,
    previousToken: string,
  ) {
    const username = normalize(body.username);
    const classCode = normalize(body.classCode);
    const password = role === "student" ? body.pin : body.password;
    if (
      !/^[a-z0-9._-]{1,40}$/.test(username) ||
      typeof password !== "string" ||
      password.length > 128 ||
      (role === "student" &&
        (!/^\d{6}$/.test(password) || !/^[a-z0-9]{4,16}$/.test(classCode)))
    )
      throw new AccessError(
        401,
        "INVALID_CREDENTIALS",
        "Those login details did not match.",
      );
    const client = this.client();
    const bucket = digest(`${role}:${classCode}:${username}`);
    await client.query(
      "INSERT INTO pvf_login_limit(bucket) VALUES($1) ON CONFLICT DO NOTHING",
      [bucket],
    );
    const limit = (
      await client.query(
        "SELECT failures,window_start < now()-interval '10 minutes' AS expired,blocked_until > now() AS blocked FROM pvf_login_limit WHERE bucket=$1 FOR UPDATE",
        [bucket],
      )
    ).rows[0];
    if (limit.blocked && !limit.expired)
      throw new AccessError(
        429,
        "TRY_LATER",
        "Please wait before trying again.",
      );
    if (limit.expired)
      await client.query(
        "UPDATE pvf_login_limit SET failures=0,window_start=now(),blocked_until=NULL WHERE bucket=$1",
        [bucket],
      );
    const found =
      role === "teacher"
        ? await client.query(
            "SELECT id,credential_hash,enabled FROM pvf_identity WHERE role='teacher' AND username=$1",
            [username],
          )
        : await client.query(
            "SELECT i.id,i.credential_hash,i.enabled AND c.enabled AS enabled,s.class_id FROM pvf_identity i JOIN pvf_student s ON s.id=i.id JOIN pvf_class c ON c.id=s.class_id WHERE i.role='student' AND s.username=$1 AND c.code=$2",
            [username, classCode],
          );
    const account = found.rows[0];
    // Equal-cost hash verification for unknown usernames; no account-existence response.
    const dummy = `scrypt-v1$${"0".repeat(32)}$${"0".repeat(64)}`;
    const valid = await verifyCredential(
      password,
      account?.credential_hash ?? dummy,
    );
    if (!account?.enabled || !valid) {
      await client.query(
        "UPDATE pvf_login_limit SET failures=failures+1,blocked_until=CASE WHEN failures+1>=5 THEN now()+interval '10 minutes' ELSE now() + make_interval(secs => power(2,failures)::int) END WHERE bucket=$1",
        [bucket],
      );
      throw new AccessError(
        401,
        "INVALID_CREDENTIALS",
        "Those login details did not match.",
      );
    }
    await client.query("DELETE FROM pvf_login_limit WHERE bucket=$1", [bucket]);
    if (previousToken)
      await client.query("DELETE FROM pvf_session WHERE token_hash=$1", [
        digest(previousToken),
      ]);
    const token = randomBytes(32).toString("base64url");
    const csrfToken = randomBytes(32).toString("base64url");
    await client.query(
      "INSERT INTO pvf_session(token_hash,actor_id,csrf_token) VALUES($1,$2,$3)",
      [digest(token), account.id, csrfToken],
    );
    return {
      token,
      csrfToken,
      principal: {
        id: account.id,
        role,
        ...(account.class_id ? { classId: account.class_id } : {}),
      },
    };
  }

  async authenticate(request: IncomingMessage): Promise<Principal | null> {
    const token = sessionToken(request);
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
    const client = this.client();
    const row = (
      await client.query(
        `SELECT i.id,i.role,i.enabled,s.csrf_token,st.class_id,c.enabled AS class_enabled
      FROM pvf_session s JOIN pvf_identity i ON i.id=s.actor_id
      LEFT JOIN pvf_student st ON st.id=i.id LEFT JOIN pvf_class c ON c.id=st.class_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND s.last_seen_at>now()-interval '30 minutes'`,
        [digest(token)],
      )
    ).rows[0];
    if (!row) return null;
    if (!row.enabled || (row.role === "student" && !row.class_enabled))
      throw new AccessError(
        403,
        "ACCESS_DISABLED",
        "Access is disabled. Ask your teacher for help.",
      );
    await client.query(
      "UPDATE pvf_session SET last_seen_at=now() WHERE token_hash=$1",
      [digest(token)],
    );
    return {
      id: row.id,
      role: row.role,
      csrfToken: row.csrf_token,
      ...(row.class_id ? { classId: row.class_id } : {}),
    };
  }

  async logout(request: IncomingMessage) {
    await this.client().query("DELETE FROM pvf_session WHERE token_hash=$1", [
      digest(sessionToken(request)),
    ]);
  }

  async directory() {
    const client = this.client();
    const classes = (
      await client.query(
        'SELECT id,teacher_id AS "teacherId",name,timezone,code,enabled FROM pvf_class',
      )
    ).rows;
    const students = (
      await client.query(
        'SELECT s.id,s.alias,s.username,s.class_id AS "classId",i.enabled FROM pvf_student s JOIN pvf_identity i ON i.id=s.id',
      )
    ).rows;
    const teachers = (
      await client.query(
        "SELECT id,username FROM pvf_identity WHERE role='teacher'",
      )
    ).rows.map((row) => ({
      ...row,
      classIds: classes.filter((c) => c.teacherId === row.id).map((c) => c.id),
    }));
    return { classes, students, teachers };
  }
}
