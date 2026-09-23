import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import {
  PLACES,
  type Screen,
  type SelectedLevel,
  type Settings,
} from "./models.js";
import { LoginScreen } from "./screens/LoginScreen.js";
import { MapScreen } from "./screens/MapScreen.js";
import { LevelIntroScreen } from "./screens/LevelIntroScreen.js";
import { ProgressScreen } from "./screens/ProgressScreen.js";
import { SettingsScreen } from "./screens/SettingsScreen.js";
import { ResultsScreen } from "./screens/ResultsScreen.js";
import { TeacherScreen } from "./screens/TeacherScreen.js";
import { GameScreen } from "./screens/GameScreen.js";
import { StateGallery } from "./screens/StateGallery.js";

const places = PLACES;

const api = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`/api/v1${path}`, {
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
const deviceStorage = {
  read(key: string) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Storage is an optional recovery enhancement, not an interaction requirement.
    }
  },
};
const pathFor = (screen: Screen, attempt?: any, level?: SelectedLevel) => {
  if (screen === "login") return "/student/login";
  if (screen === "map") return "/games/place-value-factory";
  if (screen === "level-intro")
    return `/games/place-value-factory/levels/${level?.id ?? "level-1"}`;
  if (screen === "progress") return "/games/place-value-factory/progress";
  if (screen === "settings") return "/games/place-value-factory/settings";
  if (screen === "results")
    return `/games/place-value-factory/attempts/${attempt?.attemptId ?? "current"}/results`;
  if (screen === "game")
    return `/games/place-value-factory/attempts/${attempt?.attemptId ?? "current"}`;
  if (screen === "teacher")
    return "/teacher/classes/class-demo/games/place-value-factory";
  return "/dev/place-value-factory/states";
};

function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    window.location.pathname.startsWith("/dev/") ? "state-gallery" : "login",
  );
  const [session, setSession] = useState("");
  const [attempt, setAttempt] = useState<any>();
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0]);
  const [quantitiesB, setQuantitiesB] = useState([0, 0, 0, 0, 0, 0]);
  const [undo, setUndo] = useState<number[] | null>(null);
  const [notice, setNotice] = useState("");
  const [help, setHelp] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [report, setReport] = useState<any>();
  const [resultData, setResultData] = useState<any>();
  const [settings, setSettings] = useState<Settings>({
    sound: false,
    reducedMotion: false,
    pressure: "calm",
    textScale: "normal",
  });
  const [map, setMap] = useState<any>();
  const [progress, setProgress] = useState<any>();
  const [selectedLevel, setSelectedLevel] = useState<SelectedLevel>();
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [classCode, setClassCode] = useState("FACTORY5");
  const [username, setUsername] = useState("ava");
  const [pin, setPin] = useState("123456");
  const [teacherPassword, setTeacherPassword] = useState("factory-demo");
  const [showPin, setShowPin] = useState(false);
  const shiftTabUsed = useRef(false);
  const reconciled = useRef(new Set<string>());
  const helpTrigger = useRef<HTMLButtonElement>(null);
  const helpDialog = useRef<HTMLDivElement>(null);
  const tabId = useRef(crypto.randomUUID()).current;
  const navigate = (
    next: Screen,
    options: { replace?: boolean; attempt?: any; level?: SelectedLevel } = {},
  ) => {
    setScreen(next);
    const path = pathFor(
      next,
      options.attempt ?? attempt,
      options.level ?? selectedLevel,
    );
    window.history[options.replace ? "replaceState" : "pushState"](
      {},
      "",
      path,
    );
  };
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/student/login") setScreen("login");
      else if (path.endsWith("/progress")) setScreen("progress");
      else if (path.endsWith("/settings")) setScreen("settings");
      else if (path.endsWith("/results")) setScreen("results");
      else if (path.includes("/levels/")) setScreen("level-intro");
      else if (path.includes("/attempts/")) setScreen("game");
      else if (path.startsWith("/teacher/")) setScreen("teacher");
      else if (path.startsWith("/dev/")) setScreen("state-gallery");
      else setScreen("map");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (window.location.pathname.startsWith("/dev/")) return;
    void api("/auth/session")
      .then(async (data) => {
        if (data.principal.role === "teacher") {
          setSession("teacher-dev");
          setReport(
            await api(
              "/teacher/classes/class-demo/games/place-value-factory/report",
              { headers: { "x-session": "teacher-dev" } },
            ),
          );
          navigate("teacher", { replace: true });
          return;
        }
        if (data.principal.role !== "student") return;
        setSession("student-ava");
        const profile = await api("/profile");
        setSettings(profile.settings);
        const requestedPath = window.location.pathname;
        const requestedResultAttempt = requestedPath.match(
          /\/attempts\/([^/]+)\/results$/,
        )?.[1];
        if (requestedResultAttempt) {
          const [savedAttempt, savedResult] = await Promise.all([
            api(
              `/games/place-value-factory/attempts/${requestedResultAttempt}`,
            ),
            api(
              `/games/place-value-factory/attempts/${requestedResultAttempt}/results`,
            ),
          ]);
          setAttempt(savedAttempt);
          setResultData(savedResult);
          navigate("results", { replace: true, attempt: savedAttempt });
          return;
        }
        if (profile.activeAttemptId) {
          const active = await api(
            `/games/place-value-factory/attempts/${profile.activeAttemptId}`,
          );
          setAttempt(active);
          navigate("game", { replace: true, attempt: active });
        } else {
          const loaded = await loadMap();
          const requestedLevelId = requestedPath.match(
            /\/levels\/(level-\d+)/,
          )?.[1];
          if (requestedLevelId) {
            for (const zone of loaded.map.zones) {
              const level = zone.levels.find(
                (item: any) => item.id === requestedLevelId,
              );
              if (level) {
                const selected = { ...level, zoneName: zone.name };
                setSelectedLevel(selected);
                navigate("level-intro", { replace: true, level: selected });
                return;
              }
            }
          }
          if (requestedPath.endsWith("/progress"))
            navigate("progress", { replace: true });
          else if (requestedPath.endsWith("/settings"))
            navigate("settings", { replace: true });
          else navigate("map", { replace: true });
        }
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.pressure = settings.pressure;
    document.documentElement.dataset.motion = settings.reducedMotion
      ? "reduced"
      : "standard";
    document.documentElement.dataset.textScale = settings.textScale;
  }, [settings]);
  useEffect(() => {
    if (screen === "game") {
      const saved = deviceStorage.read(
        `pvf:draft:${attempt?.attemptId}:${attempt?.activeOrder?.id}`,
      );
      if (saved) {
        try {
          setQuantities(JSON.parse(saved));
        } catch {
          deviceStorage.remove(
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
    setHelp("");
    setHelpOpen(false);
  }, [attempt?.activeOrder?.id]);
  useEffect(() => {
    if (!helpOpen) return;
    const dialog = helpDialog.current;
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), [href], input:not([disabled])",
      ) ?? []),
    ];
    const close = () => {
      setHelpOpen(false);
      requestAnimationFrame(() => helpTrigger.current?.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
      if (event.key === "Tab") {
        const targets = focusable();
        if (!targets.length) return;
        const first = targets[0];
        const last = targets.at(-1)!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => focusable()[0]?.focus());
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);
  useEffect(() => {
    if (screen === "game" && attempt?.activeOrder)
      if (
        !deviceStorage.write(
          `pvf:draft:${attempt.attemptId}:${attempt.activeOrder.id}`,
          JSON.stringify(quantities),
        )
      )
        setStorageUnavailable(true);
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
    const raw = deviceStorage.read(key);
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      const command =
        pending.payload ??
        (() => {
          const { orderId, ...legacy } = pending;
          return { ...legacy, activeMs: 0 };
        })();
      setNotice("Checking a saved shipment…");
      void api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${pending.orderId}/responses`,
        {
          method: "POST",
          headers: {
            "x-session": session,
            "idempotency-key": command.commandId,
          },
          body: JSON.stringify(command),
        },
      )
        .then((data) => {
          deviceStorage.remove(key);
          setAttempt(data.snapshot);
          setNotice(
            data.validation.shipmentAccepted
              ? "Saved shipment restored."
              : feedback(data.validation.feedbackCode),
          );
        })
        .catch((error) => {
          reconciled.current.delete(key);
          setNotice(
            `Saved shipment is waiting for a connection — ${(error as Error).message}`,
          );
        });
    } catch {
      deviceStorage.remove(key);
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
    return { map: nextMap, progress: nextProgress };
  };
  const openSettings = async () => {
    try {
      const profile = await api("/profile", {
        headers: { "x-session": session },
      });
      setSettings(profile.settings);
      navigate("settings");
    } catch (error) {
      setNotice(`Could not load settings — ${(error as Error).message}`);
    }
  };
  const saveSettings = async () => {
    try {
      await api("/profile/settings", {
        method: "PATCH",
        headers: { "x-session": session },
        body: JSON.stringify({ settings }),
      });
      document.documentElement.dataset.textScale = settings.textScale;
      document.documentElement.dataset.motion = settings.reducedMotion
        ? "reduced"
        : "standard";
      setNotice(
        "Settings saved. They never change the math, stars, or mastery.",
      );
      navigate("map");
    } catch (error) {
      setNotice(`Could not save settings — ${(error as Error).message}`);
    }
  };
  const login = async (teacher = false) => {
    try {
      await api(teacher ? "/auth/teacher/session" : "/auth/student/session", {
        method: "POST",
        body: JSON.stringify(
          teacher
            ? { username: "teacher", password: teacherPassword }
            : { classCode, username, pin },
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
        navigate("teacher");
      } else {
        const profile = await api("/profile", {
          headers: { "x-session": "student-ava" },
        });
        setSettings(profile.settings);
        if (profile.activeAttemptId) {
          const active = await api(
            `/games/place-value-factory/attempts/${profile.activeAttemptId}`,
            { headers: { "x-session": "student-ava" } },
          );
          setAttempt(active);
        }
        await loadMap();
        navigate("map");
      }
    } catch (error) {
      setNotice((error as Error).message);
    }
  };
  const start = async (
    levelId = "level-1",
    kind: "path" | "practice" = "path",
  ) => {
    setStarting(true);
    const commandId = crypto.randomUUID();
    try {
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
      navigate("game", { attempt: data });
    } catch (error) {
      setNotice(`Could not start — ${(error as Error).message}`);
    } finally {
      setStarting(false);
    }
  };
  const ship = async () => {
    if (saving) return;
    setSaving(true);
    setNotice("Saving your shipment…");
    const commandId = crypto.randomUUID();
    try {
      // This live tab owns the first send. A fresh page load performs recovery
      // from the stored command, avoiding a second concurrent send here.
      reconciled.current.add(`pvf:pending:${attempt.attemptId}`);
      const payload = {
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
      };
      const pendingStored = deviceStorage.write(
        `pvf:pending:${attempt.attemptId}`,
        JSON.stringify({
          orderId: attempt.activeOrder.id,
          payload,
        }),
      );
      if (!pendingStored) setStorageUnavailable(true);
      if (!pendingStored)
        setNotice(
          "Device storage is unavailable. Keep this tab open while this shipment is saving; a refresh cannot restore it.",
        );
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${attempt.activeOrder.id}/responses`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify(payload),
        },
      );
      deviceStorage.remove(`pvf:pending:${attempt.attemptId}`);
      deviceStorage.remove(
        `pvf:draft:${attempt.attemptId}:${attempt.activeOrder.id}`,
      );
      setNotice(
        data.validation.feedbackCode === "SHIPMENT_CORRECT"
          ? "Saved — shipment accepted."
          : feedback(data.validation.feedbackCode),
      );
      setAttempt(data.snapshot);
      if (data.result) {
        setResultData(data.result);
        navigate("results", { attempt: data.snapshot });
      } else if (data.validation.shipmentAccepted) {
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
        navigate("map");
      }
    } catch (error) {
      setNotice(`Could not ${action} — ${(error as Error).message}`);
    }
  };
  const skipOrder = async () => {
    const commandId = crypto.randomUUID();
    setSaving(true);
    try {
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${attempt.activeOrder.id}/skip`,
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
      setQuantities([0, 0, 0, 0, 0, 0]);
      setQuantitiesB([0, 0, 0, 0, 0, 0]);
      setUndo(null);
      setNotice(
        "A replacement order is ready. It does not add mastery evidence.",
      );
    } catch (error) {
      setNotice(
        `Could not skip — ${(error as Error).message}. Skip unlocks after two saved attempts.`,
      );
    } finally {
      setSaving(false);
    }
  };
  const requestHelp = async () => {
    const steps = ["H1", "H2", "H3"] as const;
    const current = steps.indexOf(attempt.currentHintStep);
    const step = steps[Math.min(current + 1, steps.length - 1)];
    const commandId = crypto.randomUUID();
    setSaving(true);
    try {
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/orders/${attempt.activeOrder.id}/hints`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            step,
            expectedRevision: attempt.revision,
            leaseEpoch: attempt.leaseEpoch,
            tabId,
          }),
        },
      );
      setAttempt(data.snapshot);
      setHelp(
        `${step}: ${data.hint.params.message}${data.hint.workedExample ? ` Example: ${data.hint.workedExample.target.toLocaleString()}.` : ""}`,
      );
    } catch (error) {
      setNotice(`Could not get help — ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };
  const startTransfer = async () => {
    const commandId = crypto.randomUUID();
    try {
      const data = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}/transfer`,
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
      setQuantities([0, 0, 0, 0, 0, 0]);
      setQuantitiesB([0, 0, 0, 0, 0, 0]);
      setNotice("Extra challenge ready. It is optional and untimed.");
      navigate("game", { attempt: data.snapshot });
    } catch (error) {
      setNotice(
        `Could not start the extra challenge — ${(error as Error).message}`,
      );
    }
  };
  const chooseLevel = (level: SelectedLevel) => {
    setSelectedLevel(level);
    setNotice("");
    navigate("level-intro", { level });
  };
  const findLevel = (levelId: string): SelectedLevel | undefined => {
    for (const zone of map?.zones ?? []) {
      const level = zone.levels.find((item: any) => item.id === levelId);
      if (level) return { ...level, zoneName: zone.name };
    }
    return undefined;
  };
  const returnToMap = async () => {
    await loadMap();
    navigate("map");
  };
  if (screen === "state-gallery") return <StateGallery />;
  if (screen === "login")
    return (
      <LoginScreen
        classCode={classCode}
        username={username}
        pin={pin}
        teacherPassword={teacherPassword}
        showPin={showPin}
        notice={notice}
        onClassCode={setClassCode}
        onUsername={setUsername}
        onPin={setPin}
        onTeacherPassword={setTeacherPassword}
        onTogglePin={() => setShowPin((value) => !value)}
        onStudentLogin={() => void login(false)}
        onTeacherLogin={() => void login(true)}
      />
    );
  if (screen === "map")
    return (
      <MapScreen
        map={map}
        progress={progress}
        activeAttempt={
          attempt && attempt.status !== "completed" ? attempt : null
        }
        onSettings={() => void openSettings()}
        onProgress={() => navigate("progress")}
        onResume={() => navigate("game", { attempt })}
        onPractice={() =>
          void start(map?.highestUnlockedLevelId ?? "level-1", "practice")
        }
        onSelectLevel={chooseLevel}
      />
    );
  if (screen === "level-intro" && selectedLevel)
    return (
      <LevelIntroScreen
        level={selectedLevel}
        settings={settings}
        starting={starting}
        onStart={() => void start(selectedLevel.id)}
        onBack={() => navigate("map")}
      />
    );
  if (screen === "progress")
    return (
      <ProgressScreen
        progress={progress}
        onPractice={() =>
          void start(map?.highestUnlockedLevelId ?? "level-1", "practice")
        }
        onBack={() => navigate("map")}
      />
    );
  if (screen === "settings")
    return (
      <SettingsScreen
        settings={settings}
        onChange={setSettings}
        onSave={() => void saveSettings()}
        onBack={() => navigate("map")}
      />
    );
  if (screen === "results")
    return (
      <ResultsScreen
        result={resultData}
        onTransfer={() => void startTransfer()}
        onReplay={() => {
          const level = findLevel(attempt.levelId);
          if (level) chooseLevel(level);
        }}
        onNext={() => {
          const level = findLevel(resultData?.newlyUnlockedLevelIds?.[0]);
          if (level) chooseLevel(level);
          else void returnToMap();
        }}
        onProgress={() => navigate("progress")}
        onMap={() => void returnToMap()}
      />
    );
  if (screen === "teacher") return <TeacherScreen report={report} />;
  if (screen === "game" && attempt)
    return (
      <GameScreen
        attempt={attempt}
        quantities={quantities}
        quantitiesB={quantitiesB}
        undo={undo}
        notice={notice}
        help={help}
        helpOpen={helpOpen}
        saving={saving}
        busy={settings.pressure === "busy"}
        storageUnavailable={storageUnavailable}
        tabId={tabId}
        helpTrigger={helpTrigger}
        helpDialog={helpDialog}
        setQuantities={setQuantities}
        setQuantitiesB={setQuantitiesB}
        setUndo={setUndo}
        onHelpOpen={() => setHelpOpen(true)}
        onHelpClose={() => {
          setHelpOpen(false);
          requestAnimationFrame(() => helpTrigger.current?.focus());
        }}
        onHelp={() => void requestHelp()}
        onTakeOver={() => void takeOver()}
        onShip={() => void ship()}
        onSkip={() => void skipOrder()}
        onPause={() => void changeAttemptState("pause")}
        onResume={() => void changeAttemptState("resume")}
        onMap={() => void returnToMap()}
      />
    );
  return (
    <main>
      <section className="loading-state" aria-busy="true">
        <h1>Loading the factory…</h1>
        <p>Preparing your saved screen.</p>
      </section>
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
