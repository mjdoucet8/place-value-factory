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
import { ProgressScreen } from "./screens/ProgressScreen.js";
import { ResultsScreen } from "./screens/ResultsScreen.js";
import { TeacherWorkspace } from "./screens/TeacherWorkspace.js";
import { api, ApiError } from "./api.js";
import { GameScreen } from "./screens/GameScreen.js";
import { StateGallery } from "./screens/StateGallery.js";
import { outbox, type PendingGameCommand } from "./outbox.js";
import { formatNumber } from "./formatNumber.js";
import { claimAttempt, sendAttemptCommand } from "./attemptSession.js";
import { defaultStudentLogin } from "./loginDefaults.js";

const places = PLACES;
declare const __PVF_DEVELOPMENT__: boolean;

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
const pathFor = (screen: Screen, attempt?: any) => {
  if (screen === "login") return "/student/login";
  if (screen === "map") return "/games/place-value-factory";
  if (screen === "progress") return "/games/place-value-factory/progress";
  if (screen === "results")
    return `/games/place-value-factory/attempts/${attempt?.attemptId ?? "current"}/results`;
  if (screen === "game")
    return `/games/place-value-factory/attempts/${attempt?.attemptId ?? "current"}`;
  if (screen === "teacher") return "/teacher/classes";
  return "/dev/place-value-factory/states";
};

function App() {
  const loginDefaults = defaultStudentLogin();
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
  const [resultData, setResultData] = useState<any>();
  const [settings, setSettings] = useState<Settings>({
    sound: false,
    reducedMotion: false,
    pressure: "calm",
    textScale: "normal",
  });
  const [map, setMap] = useState<any>();
  const [progress, setProgress] = useState<any>();
  const [unlockingZone, setUnlockingZone] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [shipmentMotion, setShipmentMotion] = useState<
    "idle" | "departing" | "arriving"
  >("idle");
  const [factoryAlert, setFactoryAlert] = useState(false);
  const factoryAlertTimer = useRef<number | null>(null);
  const [pendingLocal, setPendingLocal] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [classCode, setClassCode] = useState(loginDefaults.classCode);
  const [username, setUsername] = useState(loginDefaults.username);
  const [pin, setPin] = useState(loginDefaults.pin);
  const [teacherPassword, setTeacherPassword] = useState(
    __PVF_DEVELOPMENT__ ? "factory-demo" : "",
  );
  const [teacherUsername, setTeacherUsername] = useState(
    __PVF_DEVELOPMENT__ ? "teacher" : "",
  );
  const [showPin, setShowPin] = useState(false);
  const reconciled = useRef(new Set<string>());
  const restoredHelp = useRef("");
  const restoredOrder = useRef("");
  const helpTrigger = useRef<HTMLButtonElement>(null);
  const helpDialog = useRef<HTMLDivElement>(null);
  const tabId = useRef(crypto.randomUUID()).current;
  async function sendPending(command: PendingGameCommand) {
    const suffix = command.kind === "response" ? "responses" : "hints";
    return sendAttemptCommand(
      `/games/place-value-factory/attempts/${command.attemptId}/orders/${command.orderId}/${suffix}`,
      {
        method: "POST",
        headers: { "idempotency-key": command.payload.commandId },
        body: JSON.stringify(command.payload),
      },
      tabId,
      async (payload) => {
        const replacement = { ...command, payload };
        try {
          await outbox.put(replacement, command.payload.commandId);
        } catch (error) {
          if ((error as Error).message.includes("earlier command")) throw error;
          setStorageUnavailable(true);
        }
        command.payload = payload;
      },
    );
  }
  const gameCommand = (path: string, options: RequestInit) =>
    sendAttemptCommand(path, options, tabId);

  const navigate = (
    next: Screen,
    options: { replace?: boolean; attempt?: any } = {},
  ) => {
    setScreen(next);
    const path = pathFor(next, options.attempt ?? attempt);
    window.history[options.replace ? "replaceState" : "pushState"](
      {},
      "",
      path,
    );
  };
  const reconcileRejectedPending = async (
    error: unknown,
    pending: PendingGameCommand,
  ) => {
    if (
      !(error instanceof ApiError) ||
      !["LEASE_LOST", "REVISION_CONFLICT", "ORDER_NOT_ACTIVE"].includes(
        error.code,
      )
    )
      return false;
    const current = await api(
      `/games/place-value-factory/attempts/${pending.attemptId}`,
    );
    if (!current.activeOrder && current.status === "completed") {
      const result = await api(
        `/games/place-value-factory/attempts/${current.attemptId}/results`,
      );
      setResultData(result);
      navigate("results", { attempt: current });
    }
    setAttempt(current);
    if (current.activeOrder?.id !== pending.orderId) {
      await outbox.remove(pending);
      setPendingLocal(false);
      setNotice(
        "This order has already moved forward. Your saved progress is up to date.",
      );
    } else {
      setPendingLocal(true);
      setNotice(
        "Your crates are saved on this device. Choose Try saving again to finish.",
      );
    }
    return true;
  };
  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (!session && !path.startsWith("/dev/")) {
        navigate("login", { replace: true });
        return;
      }
      if (loggingOut) {
        navigate("map", { replace: true });
        return;
      }
      if (path === "/student/login") setScreen("login");
      else if (path.endsWith("/progress")) setScreen("progress");
      else if (path.endsWith("/settings")) navigate("map", { replace: true });
      else if (path.endsWith("/results")) setScreen("results");
      else if (path.includes("/levels/")) setScreen("map");
      else if (path.includes("/attempts/")) setScreen("game");
      else if (path.startsWith("/teacher/")) setScreen("teacher");
      else if (path.startsWith("/dev/")) setScreen("state-gallery");
      else setScreen("map");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [session, loggingOut]);
  useEffect(() => {
    if (window.location.pathname.startsWith("/dev/")) return;
    void api("/auth/session")
      .then(async (data) => {
        if (data.principal.role === "teacher") {
          setSession(data.principal.id);
          navigate("teacher", { replace: true });
          return;
        }
        if (data.principal.role !== "student") return;
        setSession(data.principal.id);
        let restoredResultAttemptId: string | null = null;
        try {
          for (const command of await outbox.list(data.principal.id)) {
            try {
              const replay = await sendPending(command);
              await outbox.remove(command);
              setNotice(
                command.kind === "response"
                  ? "Saved shipment restored."
                  : "Saved help restored.",
              );
              if (command.kind === "hint")
                restoredHelp.current = replay.hint.params.message;
              if (replay.result) restoredResultAttemptId = command.attemptId;
            } catch {
              setNotice(
                "A shipment is waiting to save. Open its mission to retry.",
              );
            }
          }
        } catch {
          setStorageUnavailable(true);
        }
        const profile = await api("/profile");
        setSettings(profile.settings);
        const requestedPath = window.location.pathname;
        const requestedResultAttempt =
          requestedPath.match(/\/attempts\/([^/]+)\/results$/)?.[1] ??
          restoredResultAttemptId;
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
                await start(level.id, "path", loaded.map.profileRevision);
                return;
              }
            }
          }
          if (requestedPath.endsWith("/progress"))
            navigate("progress", { replace: true });
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
    if (screen !== "map" || !unlockingZone) return;
    const timer = window.setTimeout(() => setUnlockingZone(null), 2200);
    return () => window.clearTimeout(timer);
  }, [screen, unlockingZone]);
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
      const orderKey = `${attempt?.attemptId}:${attempt?.activeOrder?.id}`;
      if (!saved && restoredOrder.current !== orderKey) {
        setQuantities([0, 0, 0, 0, 0, 0]);
        setQuantitiesB([0, 0, 0, 0, 0, 0]);
      }
      restoredOrder.current = orderKey;
      requestAnimationFrame(() =>
        document.getElementById("quantity-0")?.focus(),
      );
    }
  }, [screen, attempt?.attemptId, attempt?.activeOrder?.id]);
  useEffect(() => {
    setHelp(restoredHelp.current);
    restoredHelp.current = "";
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
    if (screen !== "game" || !attempt?.attemptId || !session) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      void claimAttempt(attempt.attemptId, tabId)
        .then(async (current) => {
          if (!active) return;
          if (!current.activeOrder && current.status === "completed") {
            const result = await api(
              `/games/place-value-factory/attempts/${current.attemptId}/results`,
            );
            if (!active) return;
            setResultData(result);
            navigate("results", { attempt: current });
          }
          setAttempt((previous: any) =>
            previous?.attemptId === current.attemptId &&
            previous.revision <= current.revision
              ? current
              : previous,
          );
        })
        .catch(() => undefined); // Actions also reacquire and provide normal save/retry feedback.
    };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [screen, attempt?.attemptId, session, tabId]);
  useEffect(() => {
    if (screen !== "game" || !attempt?.activeOrder) return;
    const heartbeat = () => {
      if (
        document.visibilityState === "hidden" ||
        attempt.writerTabId !== tabId
      )
        return;
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
            current?.attemptId === attempt.attemptId &&
            current.leaseEpoch === attempt.leaseEpoch &&
            current.writerTabId === tabId
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
    if (screen !== "game" || !attempt?.attemptId || !session) return;
    const key = `pvf:pending:${attempt.attemptId}`;
    if (reconciled.current.has(key)) return;
    reconciled.current.add(key);
    let active = true;
    setSaving(true);
    void (async () => {
      let pending: PendingGameCommand | null = null;
      try {
        pending = await outbox.get(session, attempt.attemptId);
        const legacy = deviceStorage.read(key);
        if (!pending && legacy) {
          const previous = JSON.parse(legacy);
          const payload = previous.payload ?? {
            ...previous,
            activeMs: 0,
          };
          delete payload.orderId;
          pending = {
            id: `${session}:${attempt.attemptId}`,
            studentId: session,
            attemptId: attempt.attemptId,
            orderId: previous.orderId,
            kind: "response",
            payload,
            queuedAt: new Date().toISOString(),
          };
          await outbox.put(pending);
          deviceStorage.remove(key);
        }
        if (!pending || !active) return;
        setPendingLocal(true);
        setNotice("Checking your saved work…");
        const data = await sendPending(pending);
        await outbox.remove(pending);
        if (!active) return;
        setPendingLocal(false);
        const current = await api(
          `/games/place-value-factory/attempts/${attempt.attemptId}`,
        );
        setAttempt(current);
        if (data.result) {
          setResultData(data.result);
          navigate("results", { attempt: current });
        } else if (pending.kind === "hint") {
          setHelp(data.hint.params.message);
          setNotice("Saved help restored.");
        } else {
          setNotice(
            data.validation.shipmentAccepted
              ? "Saved shipment restored."
              : feedback(data.validation.feedbackCode),
          );
        }
      } catch (error) {
        if (active) {
          const handled = pending
            ? await reconcileRejectedPending(error, pending).catch(() => false)
            : false;
          if (!handled) {
            setPendingLocal(Boolean(pending));
            if (!pending) setStorageUnavailable(true);
            setNotice(
              `Your work is waiting to save — ${(error as Error).message}`,
            );
          }
        }
      } finally {
        if (active) setSaving(false);
      }
    })();
    return () => {
      active = false;
    };
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
  const logout = async () => {
    if (loggingOut || starting) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      await api("/auth/session", { method: "DELETE" });
      // Saved missions, drafts and pending shipments remain available on sign-in.
      setSession("");
      setAttempt(undefined);
      setMap(undefined);
      setProgress(undefined);
      setResultData(undefined);
      setQuantities([0, 0, 0, 0, 0, 0]);
      setQuantitiesB([0, 0, 0, 0, 0, 0]);
      setUndo(null);
      setNotice("");
      setHelp("");
      setHelpOpen(false);
      setPendingLocal(false);
      setStorageUnavailable(false);
      setSaving(false);
      setShipmentMotion("idle");
      setUnlockingZone(null);
      setFactoryAlert(false);
      if (factoryAlertTimer.current !== null)
        window.clearTimeout(factoryAlertTimer.current);
      reconciled.current.clear();
      restoredHelp.current = "";
      setClassCode("");
      setUsername("");
      setPin("");
      setTeacherUsername("");
      setTeacherPassword("");
      setShowPin(false);
      setSettings({
        sound: false,
        reducedMotion: false,
        pressure: "calm",
        textScale: "normal",
      });
      navigate("login", { replace: true });
    } catch {
      setLogoutError(
        "Could not log out. Please check your connection and try again.",
      );
    } finally {
      setLoggingOut(false);
    }
  };
  const login = async (teacher = false) => {
    setNotice("");
    try {
      const signedIn = await api(
        teacher ? "/auth/teacher/session" : "/auth/student/session",
        {
          method: "POST",
          body: JSON.stringify(
            teacher
              ? { username: teacherUsername, password: teacherPassword }
              : { classCode, username, pin },
          ),
        },
      );
      setSession(signedIn.principal.id);
      if (teacher) {
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
  async function start(
    levelId = "level-1",
    kind: "path" | "practice" = "path",
    profileRevision = map?.profileRevision ?? 0,
  ) {
    if (starting) return;
    setStarting(true);
    const commandId = crypto.randomUUID();
    try {
      const data = await api("/games/place-value-factory/attempts", {
        method: "POST",
        headers: { "x-session": session, "idempotency-key": commandId },
        body: JSON.stringify({
          commandId,
          profileRevision,
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
  }
  const ship = async () => {
    if (saving || pendingLocal) return;
    if (factoryAlertTimer.current !== null)
      window.clearTimeout(factoryAlertTimer.current);
    setFactoryAlert(false);
    setSaving(true);
    setNotice("");
    const commandId = crypto.randomUUID();
    let pending: PendingGameCommand | null = null;
    let persisted = false;
    try {
      let older: PendingGameCommand | null = null;
      try {
        older = await outbox.get(session, attempt.attemptId);
      } catch {
        setStorageUnavailable(true);
      }
      if (older && older.payload.tabId !== tabId) {
        try {
          const replay = await sendPending(older);
          await outbox.remove(older);
          const current = await api(
            `/games/place-value-factory/attempts/${attempt.attemptId}`,
          );
          setAttempt(current);
          if (replay.result) {
            setResultData(replay.result);
            navigate("results", { attempt: current });
          } else
            setNotice(
              "Saved work was restored. Review this order before shipping.",
            );
          return;
        } catch (error) {
          if (
            !(error instanceof ApiError) ||
            !["LEASE_LOST", "REVISION_CONFLICT", "ORDER_NOT_ACTIVE"].includes(
              error.code,
            )
          )
            throw error;
          const current = await api(
            `/games/place-value-factory/attempts/${attempt.attemptId}`,
          );
          if (current.writerTabId !== tabId) throw error;
          await outbox.remove(older);
          setAttempt(current);
          setNotice(
            "Your mission has moved forward. Review this order and press Ship again.",
          );
          return;
        }
      }
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
      pending = {
        id: `${session}:${attempt.attemptId}`,
        studentId: session,
        attemptId: attempt.attemptId,
        orderId: attempt.activeOrder.id,
        kind: "response",
        payload,
        queuedAt: new Date().toISOString(),
      };
      try {
        await outbox.put(pending);
        persisted = true;
        setPendingLocal(true);
      } catch (error) {
        if ((error as Error).message.includes("earlier command")) {
          setPendingLocal(true);
          throw error;
        }
        setStorageUnavailable(true);
        setNotice(
          "Device storage is unavailable. Keep this tab open while your shipment saves; a refresh cannot restore it.",
        );
      }
      const data = await sendPending(pending);
      if (persisted) await outbox.remove(pending);
      setPendingLocal(false);
      deviceStorage.remove(
        `pvf:draft:${attempt.attemptId}:${attempt.activeOrder.id}`,
      );
      setNotice(
        data.validation.feedbackCode === "SHIPMENT_CORRECT"
          ? ""
          : feedback(data.validation.feedbackCode),
      );
      if (data.validation.shipmentAccepted) {
        setShipmentMotion("departing");
        if (!settings.reducedMotion)
          await new Promise((resolve) => window.setTimeout(resolve, 650));
        setAttempt(data.snapshot);
        setQuantities([0, 0, 0, 0, 0, 0]);
        setQuantitiesB([0, 0, 0, 0, 0, 0]);
        if (data.result) {
          setShipmentMotion("idle");
          setResultData(data.result);
          navigate("results", { attempt: data.snapshot });
        } else {
          setShipmentMotion("arriving");
          if (!settings.reducedMotion)
            await new Promise((resolve) => window.setTimeout(resolve, 650));
          setShipmentMotion("idle");
        }
      } else {
        setAttempt(data.snapshot);
        setFactoryAlert(true);
        factoryAlertTimer.current = window.setTimeout(() => {
          setFactoryAlert(false);
          factoryAlertTimer.current = null;
        }, 1900);
      }
    } catch (error) {
      if (
        pending &&
        (await reconcileRejectedPending(error, pending).catch(() => false))
      )
        return;
      setNotice(
        persisted
          ? `Your shipment is waiting to save — ${(error as Error).message}`
          : `Could not prepare your shipment — ${(error as Error).message}`,
      );
    } finally {
      setSaving(false);
    }
  };
  const retryPending = async () => {
    if (saving || !attempt?.attemptId) return;
    setSaving(true);
    let pending: PendingGameCommand | null = null;
    try {
      pending = await outbox.get(session, attempt.attemptId);
      if (!pending) {
        setPendingLocal(false);
        setNotice("There is no shipment waiting on this device.");
        return;
      }
      setNotice("Checking your saved work…");
      const data = await sendPending(pending);
      await outbox.remove(pending);
      setPendingLocal(false);
      const current = await api(
        `/games/place-value-factory/attempts/${attempt.attemptId}`,
      );
      setAttempt(current);
      if (data.result) {
        setResultData(data.result);
        navigate("results", { attempt: current });
      } else if (pending.kind === "hint") {
        setHelp(data.hint.params.message);
        setNotice("Saved help restored.");
      } else {
        setNotice(
          data.validation.shipmentAccepted
            ? "Saved shipment restored."
            : feedback(data.validation.feedbackCode),
        );
      }
    } catch (error) {
      const handled = pending
        ? await reconcileRejectedPending(error, pending).catch(() => false)
        : false;
      if (!handled) {
        setPendingLocal(Boolean(pending));
        setNotice(`Your work is waiting to save — ${(error as Error).message}`);
      }
    } finally {
      setSaving(false);
    }
  };
  const changeAttemptState = async (action: "pause" | "resume") => {
    setSaving(true);
    try {
      const currentAttempt = attempt;
      const commandId = crypto.randomUUID();
      const data = await gameCommand(
        `/games/place-value-factory/attempts/${currentAttempt.attemptId}/${action}`,
        {
          method: "POST",
          headers: { "x-session": session, "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            expectedRevision: currentAttempt.revision,
            leaseEpoch: currentAttempt.leaseEpoch,
            tabId,
          }),
        },
      );
      setAttempt(data.snapshot);
      if (action === "pause") {
        await loadMap();
        navigate("map");
      } else setNotice("");
    } catch (error) {
      if (
        action === "pause" &&
        error instanceof ApiError &&
        error.code === "NOT_FOUND"
      ) {
        try {
          await loadMap();
          setAttempt(undefined);
          setQuantities([0, 0, 0, 0, 0, 0]);
          setQuantitiesB([0, 0, 0, 0, 0, 0]);
          setUndo(null);
          setNotice("");
          navigate("map");
          return;
        } catch (mapError) {
          setNotice(
            `Could not return to the map — ${(mapError as Error).message}`,
          );
          return;
        }
      }
      setNotice(`Could not ${action} — ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };
  const skipOrder = async () => {
    const commandId = crypto.randomUUID();
    setSaving(true);
    try {
      const data = await gameCommand(
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
    if (saving || pendingLocal) return;
    const steps = ["H1", "H2", "H3"] as const;
    const current = steps.indexOf(attempt.currentHintStep);
    const step = steps[Math.min(current + 1, steps.length - 1)];
    const commandId = crypto.randomUUID();
    setSaving(true);
    let persisted = false;
    try {
      const pending: PendingGameCommand = {
        id: `${session}:${attempt.attemptId}`,
        studentId: session,
        attemptId: attempt.attemptId,
        orderId: attempt.activeOrder.id,
        kind: "hint",
        payload: {
          commandId,
          step,
          expectedRevision: attempt.revision,
          leaseEpoch: attempt.leaseEpoch,
          tabId,
        },
        queuedAt: new Date().toISOString(),
      };
      try {
        await outbox.put(pending);
        persisted = true;
        setPendingLocal(true);
      } catch (error) {
        if ((error as Error).message.includes("earlier command")) {
          setPendingLocal(true);
          throw error;
        }
        setStorageUnavailable(true);
      }
      const data = await sendPending(pending);
      if (persisted) await outbox.remove(pending);
      setPendingLocal(false);
      setAttempt(data.snapshot);
      setHelp(
        `${step}: ${data.hint.params.message}${data.hint.workedExample ? ` Example: ${formatNumber(data.hint.workedExample.target)}.` : ""}`,
      );
    } catch (error) {
      setNotice(
        `${persisted ? "Your help request is waiting to save" : "Could not get help"} — ${(error as Error).message}`,
      );
    } finally {
      setSaving(false);
    }
  };
  const startTransfer = async () => {
    const commandId = crypto.randomUUID();
    try {
      const data = await gameCommand(
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
    setNotice("");
    void start(level.id);
  };
  const findLevel = (levelId: string): SelectedLevel | undefined => {
    for (const zone of map?.zones ?? []) {
      const level = zone.levels.find((item: any) => item.id === levelId);
      if (level) return { ...level, zoneName: zone.name };
    }
    return undefined;
  };
  const startNextMission = async () => {
    const levelId = resultData?.newlyUnlockedLevelIds?.[0];
    if (!levelId) return void returnToMap();
    try {
      const loaded = await loadMap();
      const level = loaded.map.zones
        .flatMap((zone: any) =>
          zone.levels.map((item: any) => ({ ...item, zoneName: zone.name })),
        )
        .find((item: any) => item.id === levelId);
      if (!level || level.status === "locked") {
        navigate("map");
        return;
      }
      await start(level.id, "path", loaded.map.profileRevision);
    } catch (error) {
      setNotice(
        `Could not open the next mission — ${(error as Error).message}`,
      );
      navigate("map");
    }
  };
  const returnToMap = async (unlockedZone?: string) => {
    await loadMap();
    setUnlockingZone(unlockedZone ?? null);
    navigate("map");
  };
  useEffect(() => {
    if (screen !== "game" || !pendingLocal) return;
    const onOnline = () => void retryPending();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [screen, pendingLocal, attempt?.attemptId, session, saving]);
  if (screen === "state-gallery") return <StateGallery />;
  if (screen === "login" || !session)
    return (
      <LoginScreen
        classCode={classCode}
        username={username}
        pin={pin}
        teacherPassword={teacherPassword}
        teacherUsername={teacherUsername}
        onTeacherUsername={setTeacherUsername}
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
        unlockingZone={unlockingZone}
        starting={starting || loggingOut}
        loggingOut={loggingOut}
        logoutError={logoutError}
        activeAttempt={
          attempt && attempt.status !== "completed" ? attempt : null
        }
        onLogout={() => void logout()}
        onProgress={() => navigate("progress")}
        onResume={() => navigate("game", { attempt })}
        onSelectLevel={chooseLevel}
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
  if (screen === "results")
    return (
      <ResultsScreen
        result={resultData}
        completedLevelId={attempt?.levelId}
        onTransfer={() => void startTransfer()}
        onReplay={() => {
          const level = findLevel(attempt.levelId);
          if (level) chooseLevel(level);
        }}
        onNext={() => void startNextMission()}
        onProgress={() => navigate("progress")}
        onMap={() => void returnToMap()}
      />
    );
  if (screen === "teacher") return <TeacherWorkspace />;
  if (screen === "game" && attempt?.activeOrder)
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
        shipmentMotion={shipmentMotion}
        factoryAlert={factoryAlert}
        pending={pendingLocal}
        busy={settings.pressure === "busy"}
        storageUnavailable={storageUnavailable}
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
        onShip={() => void ship()}
        onRetryPending={() => void retryPending()}
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
