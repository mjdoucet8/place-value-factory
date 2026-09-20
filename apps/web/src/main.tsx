import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const api = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`http://localhost:3101/api/v1${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.error?.message ?? body.error?.code ?? "Request failed",
    );
  return body;
};
const places = [
  { value: 100000, name: "Hundred thousands", icon: "◆" },
  { value: 10000, name: "Ten thousands", icon: "●" },
  { value: 1000, name: "Thousands", icon: "▲" },
  { value: 100, name: "Hundreds", icon: "■" },
  { value: 10, name: "Tens", icon: "✦" },
  { value: 1, name: "Ones", icon: "●" },
];
type Screen = "login" | "map" | "game" | "results" | "teacher";
function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [session, setSession] = useState("");
  const [attempt, setAttempt] = useState<any>();
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0]);
  const [quantitiesB, setQuantitiesB] = useState([0, 0, 0, 0, 0, 0]);
  const [undo, setUndo] = useState<number[] | null>(null);
  const [notice, setNotice] = useState("");
  const [report, setReport] = useState<any>();
  const [map, setMap] = useState<any>();
  const [progress, setProgress] = useState<any>();
  const [saving, setSaving] = useState(false);
  const shiftTabUsed = useRef(false);
  const reconciled = useRef(new Set<string>());
  const tabId = useRef(crypto.randomUUID()).current;
  useEffect(() => {
    if (screen === "game") {
      const saved = localStorage.getItem(
        `pvf:draft:${attempt?.attemptId}:${attempt?.activeOrder?.id}`,
      );
      if (saved) {
        try {
          setQuantities(JSON.parse(saved));
        } catch {
          localStorage.removeItem(
            `pvf:draft:${attempt?.attemptId}:${attempt?.activeOrder?.id}`,
          );
        }
      }
      requestAnimationFrame(() =>
        document.getElementById("quantity-0")?.focus(),
      );
    }
  }, [screen, attempt?.attemptId, attempt?.activeOrder?.id]);
  useEffect(() => {
    if (screen === "game" && attempt?.activeOrder)
      localStorage.setItem(
        `pvf:draft:${attempt.attemptId}:${attempt.activeOrder.id}`,
        JSON.stringify(quantities),
      );
  }, [screen, attempt?.attemptId, attempt?.activeOrder?.id, quantities]);
  useEffect(() => {
    if (screen !== "game" || !attempt?.activeOrder) return;
    const heartbeat = () => {
      const commandId = crypto.randomUUID();
      void api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/lease/heartbeat`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            expectedRevision: attempt.revision,
            leaseEpoch: attempt.leaseEpoch,
            tabId,
          }),
        },
      )
        .then((data) =>
          setAttempt((current: any) =>
            current?.attemptId === attempt.attemptId
              ? {
                  ...current,
                  leaseEpoch: data.leaseEpoch,
                  leaseExpiresAt: data.leaseExpiresAt,
                }
              : current,
          ),
        )
        .catch(() => undefined);
    };
    heartbeat();
    const interval = window.setInterval(heartbeat, 30_000);
    return () => window.clearInterval(interval);
  }, [
    screen,
    attempt?.attemptId,
    attempt?.activeOrder?.id,
    attempt?.revision,
    attempt?.leaseEpoch,
    session,
    tabId,
  ]);
  useEffect(() => {
    if (screen !== "game" || !attempt?.activeOrder) return;
    const key = `pvf:pending:${attempt.attemptId}`;
    if (reconciled.current.has(key)) return;
    reconciled.current.add(key);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending.orderId !== attempt.activeOrder.id) return;
      setNotice("Checking a saved shipment…");
      void api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${pending.orderId}/responses`,
        {
          method: "POST",
          headers: {
            "x-session": session,
            "idempotency-key": pending.commandId,
          },
          body: JSON.stringify({ ...pending, activeMs: 0 }),
        },
      )
        .then((data) => {
          localStorage.removeItem(key);
          setAttempt(data.snapshot);
          setNotice(
            data.validation.shipmentAccepted
              ? "Saved shipment restored."
              : feedback(data.validation.feedbackCode),
          );
        })
        .catch(() => {
          reconciled.current.delete(key);
          setNotice("Saved shipment is waiting for a connection.");
        });
    } catch {
      localStorage.removeItem(key);
    }
  }, [screen, attempt?.attemptId, attempt?.activeOrder?.id, session]);
  const loadMap = async () => {
    const headers = { "x-session": session || "student-ava" };
    const [nextMap, nextProgress] = await Promise.all([
      api("/games/place-value-factory/map", { headers }),
      api("/games/place-value-factory/progress", { headers }),
    ]);
    setMap(nextMap);
    setProgress(nextProgress);
  };
  const login = async (teacher = false) => {
    try {
      await api(teacher ? "/auth/teacher/session" : "/auth/student/session", {
        method: "POST",
        body: JSON.stringify(
          teacher
            ? { username: "teacher", password: "factory-demo" }
            : { classCode: "FACTORY5", username: "ava", pin: "123456" },
        ),
      });
      setSession(teacher ? "teacher-dev" : "student-ava");
      if (teacher) {
        setReport(
          await api(
            "/teacher/classes/class-demo/games/place-value-factory/report",
            { headers: { "x-session": "teacher-dev" } },
          ),
        );
        setScreen("teacher");
      } else {
        await loadMap();
        setScreen("map");
      }
    } catch (error) {
      setNotice((error as Error).message);
    }
  };
  const start = async (
    levelId = "level-1",
    kind: "path" | "practice" = "path",
  ) => {
    const commandId = crypto.randomUUID();
    const data = await api("/games/place-value-factory/attempts", {
      method: "POST",
      headers: { "x-session": session, "idempotency-key": commandId },
      body: JSON.stringify({
        commandId,
        profileRevision: map?.profileRevision ?? 0,
        tabId,
        levelId,
        kind,
      }),
    });
    setAttempt(data);
    setQuantities([0, 0, 0, 0, 0, 0]);
    setQuantitiesB([0, 0, 0, 0, 0, 0]);
    setScreen("game");
  };
  const ship = async () => {
    if (saving) return;
    setSaving(true);
    setNotice("Saving your shipment…");
    const commandId = crypto.randomUUID();
    try {
      localStorage.setItem(
        `pvf:pending:${attempt.attemptId}`,
        JSON.stringify({
          orderId: attempt.activeOrder.id,
          commandId,
          expectedRevision: attempt.revision,
          leaseEpoch: attempt.leaseEpoch,
          tabId,
          representationA: quantities,
          representationB:
            attempt.activeOrder.distinctRepresentations === 2
              ? quantitiesB
              : null,
        }),
      );
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${attempt.activeOrder.id}/responses`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            expectedRevision: attempt.revision,
            leaseEpoch: attempt.leaseEpoch,
            tabId,
            representationA: quantities,
            representationB:
              attempt.activeOrder.distinctRepresentations === 2
                ? quantitiesB
                : null,
            activeMs: 0,
          }),
        },
      );
      localStorage.removeItem(`pvf:pending:${attempt.attemptId}`);
      localStorage.removeItem(
        `pvf:draft:${attempt.attemptId}:${attempt.activeOrder.id}`,
      );
      setNotice(
        data.validation.feedbackCode === "SHIPMENT_CORRECT"
          ? "Saved — shipment accepted."
          : feedback(data.validation.feedbackCode),
      );
      setAttempt(data.snapshot);
      if (data.result) setScreen("results");
      else if (data.validation.shipmentAccepted) {
        setQuantities([0, 0, 0, 0, 0, 0]);
        setQuantitiesB([0, 0, 0, 0, 0, 0]);
      }
    } catch (error) {
      setNotice(`Not saved — ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };
  const takeOver = async () => {
    const commandId = crypto.randomUUID();
    try {
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/lease/takeover`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            expectedRevision: attempt.revision,
            leaseEpoch: attempt.leaseEpoch,
            tabId,
          }),
        },
      );
      setAttempt(data.snapshot);
      setNotice("This tab now controls the saved attempt.");
    } catch (error) {
      setNotice(`Could not take over — ${(error as Error).message}`);
    }
  };
  const changeAttemptState = async (action: "pause" | "resume") => {
    const commandId = crypto.randomUUID();
    try {
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/${action}`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            expectedRevision: attempt.revision,
            leaseEpoch: attempt.leaseEpoch,
            tabId,
          }),
        },
      );
      setAttempt(data.snapshot);
      if (action === "pause") {
        await loadMap();
        setScreen("map");
      }
    } catch (error) {
      setNotice(`Could not ${action} — ${(error as Error).message}`);
    }
  };
  if (screen === "login")
    return (
      <main className="login">
        <h1>Place Value Factory</h1>
        <p>Development accounts only. Student: Ava / FACTORY5 / 123456.</p>
        <button onClick={() => login(false)}>Student login as Ava</button>
        <button className="secondary" onClick={() => login(true)}>
          Teacher login
        </button>
        {notice && <p role="alert">{notice}</p>}
      </main>
    );
  if (screen === "map")
    return (
      <main>
        <header>
          <h1>Factory Map</h1>
          <span>Ava · Progress is saved</span>
        </header>
        {progress?.nextPracticeSkillId && (
          <section className="practice-card">
            <h2>Practice recommendation</h2>
            <p>
              Build more evidence for{" "}
              <strong>{progress.nextPracticeSkillId}</strong> before your next
              stage gate.
            </p>
            <button
              onClick={() =>
                start(map?.highestUnlockedLevelId ?? "level-1", "practice")
              }
            >
              Start practice
            </button>
          </section>
        )}
        {map?.zones.map((zone: any) => (
          <section className="map" key={zone.id}>
            <h2>{zone.name}</h2>
            <ol aria-label={`${zone.name} levels`}>
              {zone.levels.map((level: any) => (
                <li key={level.id}>
                  <strong>
                    Level {level.id.replace("level-", "")}: {level.title}
                  </strong>
                  <br />
                  <small>
                    Stage {level.stage} · {level.status}
                  </small>
                  <br />
                  {level.status === "unlocked" ? (
                    <button onClick={() => start(level.id)}>Start</button>
                  ) : (
                    <span>
                      {level.status === "completed"
                        ? "Completed"
                        : level.prerequisiteSummary}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </main>
    );
  if (screen === "results")
    return (
      <main className="results">
        <h1>Level complete!</h1>
        <p>You saved five server-validated shipments.</p>
        <div className="stars" aria-label="Two earned stars">
          ★★☆
        </div>
        <p>Complete · All orders correct · Extra challenge available later</p>
        <button
          onClick={async () => {
            await loadMap();
            setScreen("map");
          }}
        >
          Back to map
        </button>
      </main>
    );
  if (screen === "teacher")
    return (
      <main>
        <header>
          <h1>Teacher evidence</h1>
          <span>Fictional development account</span>
        </header>
        <section className="report">
          <h2>Ava</h2>
          <p>
            {report.students[0].submittedN} submitted orders ·{" "}
            {report.students[0].eventuallyCorrectN} accepted shipments
          </p>
          <table>
            <caption>Stored shipment evidence</caption>
            <thead>
              <tr>
                <th>Target</th>
                <th>Crates</th>
                <th>Saved</th>
              </tr>
            </thead>
            <tbody>
              {report.students[0].evidence.map((row: any, index: number) => (
                <tr key={index}>
                  <td>{row.target.toLocaleString()}</td>
                  <td>{row.vector.join(", ")}</td>
                  <td>{row.accepted ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    );
  const order = attempt.activeOrder;
  const total = quantities.reduce(
    (sum, amount, index) => sum + amount * places[index].value,
    0,
  );
  const moveQuantityFocus = (nextIndex: number) =>
    document.getElementById(`quantity-${nextIndex}`)?.focus();
  const quantityShortcutDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "Tab" && event.shiftKey && index > 0) {
      event.preventDefault();
      shiftTabUsed.current = true;
      moveQuantityFocus(index - 1);
    }
  };
  const quantityShortcutUp = (event: React.KeyboardEvent, index: number) => {
    if (event.key === "Shift") {
      if (!shiftTabUsed.current && index < places.length - 1)
        moveQuantityFocus(index + 1);
      shiftTabUsed.current = false;
    }
  };
  const objective =
    order.distinctRepresentations === 2
      ? "Build two different crate representations of this target."
      : order.minimumRequired
        ? "Use the fewest crates with the open machines."
        : order.exactTypes
          ? `Use exactly ${order.exactTypes} crate sizes.`
          : order.allowed.length < 6
            ? `Use only: ${order.allowed.map((value: number) => value.toLocaleString()).join(", ")}.`
            : order.canonicalRequired
              ? "Use normal place value: 0–9 crates of each size."
              : "Build this target with the open machines.";
  if (attempt.status === "paused")
    return (
      <main className="results">
        <h1>Mission paused</h1>
        <p>
          Your draft is kept on this device and your saved order is ready to
          resume.
        </p>
        <button onClick={() => changeAttemptState("resume")}>
          Resume mission
        </button>
        <button
          className="secondary"
          onClick={async () => {
            await loadMap();
            setScreen("map");
          }}
        >
          Back to map
        </button>
      </main>
    );
  return (
    <main>
      <header>
        <h1>Place Value Factory</h1>
        <span>Shipment {attempt.shippedSlots + 1} of 5</span>
      </header>
      {attempt.writerTabId !== tabId && (
        <aside className="takeover" role="status">
          <p>This attempt is open in another tab.</p>
          <button onClick={takeOver}>Take over this attempt</button>
        </aside>
      )}
      <section className="current-order" aria-labelledby="order-heading">
        <p id="order-heading">
          CURRENT ORDER ·{" "}
          <span className="difficulty">{order.difficultyBand} practice</span>
        </p>
        <strong>{order.target.toLocaleString()}</strong>
        <p>{objective}</p>
      </section>
      <p className="monitor" aria-live="polite">
        Representation A totals <strong>{total.toLocaleString()}</strong>
      </p>
      <section
        className="machines"
        aria-label="Representation A place value machines"
      >
        {places.map((place, index) => (
          <article
            className={`machine machine-${index}`}
            key={place.value}
            aria-disabled={!order.allowed.includes(place.value)}
          >
            <h2>
              {place.icon} {place.name}
            </h2>
            <p>
              {place.value.toLocaleString()} each{" "}
              {!order.allowed.includes(place.value) &&
                "· Closed for this order"}
            </p>
            <label htmlFor={`quantity-${index}`}>Crate quantity</label>
            <div>
              <button
                aria-label={`Remove one ${place.name} crate`}
                disabled={saving || !order.allowed.includes(place.value)}
                onClick={() =>
                  setQuantities((q) =>
                    q.map((value, i) =>
                      i === index ? Math.max(0, value - 1) : value,
                    ),
                  )
                }
              >
                −
              </button>
              <input
                id={`quantity-${index}`}
                inputMode="numeric"
                type="number"
                min="0"
                max="999999"
                disabled={saving || !order.allowed.includes(place.value)}
                value={quantities[index]}
                onFocus={(event) => {
                  if (event.currentTarget.value === "0")
                    event.currentTarget.select();
                }}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isInteger(value) && value >= 0)
                    setQuantities((q) =>
                      q.map((amount, i) => (i === index ? value : amount)),
                    );
                }}
              />
              <button
                aria-label={`Add one ${place.name} crate`}
                disabled={saving || !order.allowed.includes(place.value)}
                onClick={() =>
                  setQuantities((q) =>
                    q.map((value, i) => (i === index ? value + 1 : value)),
                  )
                }
              >
                +
              </button>
            </div>
            {index < 5 && (
              <button
                className="exchange"
                disabled={
                  saving ||
                  quantities[index] < 1 ||
                  !order.allowed.includes(place.value) ||
                  !order.allowed.includes(places[index + 1].value)
                }
                onClick={() =>
                  setQuantities((q) =>
                    q.map((value, i) =>
                      i === index
                        ? value - 1
                        : i === index + 1
                          ? value + 10
                          : value,
                    ),
                  )
                }
              >
                Exchange 1 for 10 smaller crates
              </button>
            )}
          </article>
        ))}
      </section>
      {order.distinctRepresentations === 2 && (
        <section
          className="second-representation"
          aria-labelledby="representation-b-heading"
        >
          <h2 id="representation-b-heading">Representation B</h2>
          <p>
            Make a different valid crate vector. It must still total{" "}
            {order.target.toLocaleString()}.
          </p>
          <div>
            {places.map((place, index) => (
              <label key={place.value}>
                {place.name}
                <input
                  inputMode="numeric"
                  type="number"
                  min="0"
                  max="999999"
                  disabled={saving || !order.allowed.includes(place.value)}
                  value={quantitiesB[index]}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value >= 0)
                      setQuantitiesB((q) =>
                        q.map((amount, i) => (i === index ? value : amount)),
                      );
                  }}
                />
              </label>
            ))}
          </div>
        </section>
      )}
      <section className="controls">
        <button
          className="secondary"
          disabled={saving}
          onClick={() => {
            setUndo(quantities);
            setQuantities([0, 0, 0, 0, 0, 0]);
          }}
        >
          Clear all
        </button>
        <button
          className="secondary"
          disabled={!undo || saving}
          onClick={() => {
            if (undo) setQuantities(undo);
          }}
        >
          Undo
        </button>
        <button className="ship" disabled={saving} onClick={ship}>
          {saving ? "Saving…" : "Ship order"}
        </button>
        <button
          className="secondary"
          disabled={saving}
          onClick={() => changeAttemptState("pause")}
        >
          Pause mission
        </button>
      </section>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </main>
  );
}
function feedback(code: string) {
  return (
    (
      {
        UNDERPRODUCTION: "You need more crates.",
        OVERPRODUCTION: "That is too many crates.",
        STANDARD_REQUIRED: "The total matches; use 0–9 crates at each place.",
        MACHINE_UNAVAILABLE: "That machine is closed.",
      } as Record<string, string>
    )[code] ?? "Try adjusting your crates."
  );
}
createRoot(document.getElementById("root")!).render(<App />);
