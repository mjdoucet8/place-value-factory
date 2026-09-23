import { useEffect, useState } from "react";
import { api } from "../api.js";
import { TeacherScreen } from "./TeacherScreen.js";

type Classroom = {
  id: string;
  name: string;
  timezone: string;
  code?: string;
  classCode?: string;
  enabled?: boolean;
};
type Student = {
  id: string;
  alias: string;
  username: string;
  enabled: boolean;
};

export function TeacherWorkspace() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [report, setReport] = useState<any>();
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [alias, setAlias] = useState("");
  const [username, setUsername] = useState("");
  const [issued, setIssued] = useState<{ alias: string; pin: string } | null>(
    null,
  );
  const selected = classes.find((item) => item.id === classId);
  const refresh = async (id: string) => {
    const [roster, evidence] = await Promise.all([
      api(`/teacher/classes/${id}/students`),
      api(`/teacher/classes/${id}/games/place-value-factory/report`),
    ]);
    setStudents(roster.students);
    setReport(evidence);
  };
  useEffect(() => {
    let cancelled = false;
    api("/teacher/classes")
      .then((data) => {
        if (!cancelled) {
          setClasses(data.classes);
          setClassId(data.classes[0]?.id ?? "");
        }
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    setReport(undefined);
    setStudents([]);
    setIssued(null);
    Promise.all([
      api(`/teacher/classes/${classId}/students`),
      api(`/teacher/classes/${classId}/games/place-value-factory/report`),
    ])
      .then(([roster, evidence]) => {
        if (!cancelled) {
          setStudents(roster.students);
          setReport(evidence);
        }
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);
  const mutate = async (
    path: string,
    body: Record<string, unknown>,
    method = "POST",
  ) => {
    const commandId = crypto.randomUUID();
    return api(path, {
      method,
      headers: { "idempotency-key": commandId },
      body: JSON.stringify({ ...body, commandId }),
    });
  };
  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setNotice("");
    try {
      await work();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <TeacherScreen report={report}>
      <section
        className="teacher-management"
        aria-label="Class and access management"
        aria-busy={busy}
      >
        <p>Use fictional learners only for this local pilot.</p>
        {notice ? <p role="alert">{notice}</p> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const created = await mutate("/teacher/classes", {
                name,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              });
              setClasses((current) => [...current, created]);
              setClassId(created.id);
              setName("");
            });
          }}
        >
          <label>
            New class name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
            />
          </label>
          <button disabled={busy}>Create class</button>
        </form>
        {classes.length ? (
          <div>
            <label htmlFor="teacher-class">Class</label>
            <select
              id="teacher-class"
              value={classId}
              disabled={busy}
              onChange={(event) => setClassId(event.target.value)}
            >
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p>Create a class to issue student access.</p>
        )}
        {selected ? (
          <>
            <p>
              Class code:{" "}
              <strong>
                {selected.classCode ?? selected.code ?? "FACTORY5"}
              </strong>
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const created = await mutate(
                    `/teacher/classes/${classId}/students`,
                    { alias, username },
                  );
                  setIssued({
                    alias: created.student.alias,
                    pin: created.oneTimePin,
                  });
                  setAlias("");
                  setUsername("");
                  await refresh(classId);
                });
              }}
            >
              <label>
                Student alias
                <input
                  value={alias}
                  onChange={(event) => setAlias(event.target.value)}
                  required
                  maxLength={40}
                />
              </label>
              <label>
                Student username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  pattern="[A-Za-z0-9._-]+"
                  maxLength={40}
                />
              </label>
              <button disabled={busy || selected.enabled === false}>
                Issue student access
              </button>
            </form>
            {issued ? (
              <div className="access-issued" role="status">
                <p>
                  PIN for {issued.alias}: <strong>{issued.pin}</strong>
                </p>
                <p>Share privately. This PIN is not stored on this device.</p>
                <button onClick={() => setIssued(null)}>Hide PIN</button>
              </div>
            ) : null}
            <ul className="roster-list">
              {students.map((student) => (
                <li key={student.id}>
                  <strong>{student.alias}</strong>
                  <span>
                    {student.username} ·{" "}
                    {student.enabled ? "Access enabled" : "Access disabled"}
                  </span>
                  <div className="actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const reset = await mutate(
                            `/teacher/students/${student.id}/reset-pin`,
                            {},
                          );
                          setIssued({
                            alias: student.alias,
                            pin: reset.oneTimePin,
                          });
                          setNotice(
                            "New PIN issued. Previous sessions have ended.",
                          );
                        })
                      }
                    >
                      Reset PIN for {student.alias}
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          await mutate(
                            `/teacher/students/${student.id}/access`,
                            { enabled: !student.enabled },
                            "PATCH",
                          );
                          await refresh(classId);
                          setNotice(
                            student.enabled
                              ? "Access revoked. Previous sessions have ended."
                              : "Access enabled. The student can sign in again.",
                          );
                        })
                      }
                    >
                      {student.enabled ? "Revoke" : "Enable"} access for{" "}
                      {student.alias}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const enabled = selected.enabled === false;
                  await mutate(
                    `/teacher/classes/${classId}/access`,
                    { enabled },
                    "PATCH",
                  );
                  setClasses((current) =>
                    current.map((item) =>
                      item.id === classId ? { ...item, enabled } : item,
                    ),
                  );
                  setNotice(
                    enabled
                      ? "Class access enabled."
                      : "Class access disabled. Student sessions have ended.",
                  );
                })
              }
            >
              {selected.enabled === false ? "Enable" : "Disable"} class access
            </button>
          </>
        ) : null}
      </section>
    </TeacherScreen>
  );
}
