import type { LevelSummary, SelectedLevel } from "../models.js";
import { FactoryArt, Mascot } from "../components/FactoryArt.js";
import { studentSkillLabel } from "../studentCopy.js";
import { formatNumber } from "../formatNumber.js";
import { useLayoutEffect, useRef, useState } from "react";

type Props = {
  map: any;
  progress: any;
  unlockingZone?: string | null;
  starting: boolean;
  activeAttempt: any;
  onSettings: () => void;
  onProgress: () => void;
  onResume: () => void;
  onSelectLevel: (level: SelectedLevel) => void;
};

export function MapScreen(props: Props) {
  const [view, setView] = useState<"world" | "list">("world");
  const [lockedNotice, setLockedNotice] = useState("");
  const screenRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const routeRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (view !== "world") return;
    const screen = screenRef.current;
    const viewport = viewportRef.current;
    const route = routeRef.current;
    if (!screen || !viewport || !route) return;
    if (window.scrollY) window.scrollTo(0, 0);
    const fit = () => {
      screen.style.setProperty("--map-screen-height", `${Math.max(0, window.innerHeight - screen.getBoundingClientRect().top)}px`);
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      route.style.width = `${Math.max(1050, width)}px`;
      const scale = Math.min(1, width / route.offsetWidth, height / route.offsetHeight);
      route.style.transform = `scale(${scale})`;
      route.style.left = `${(width - route.offsetWidth * scale) / 2}px`;
      route.style.top = `${(height - route.offsetHeight * scale) / 2}px`;
    };
    const observer = new ResizeObserver(fit);
    observer.observe(viewport);
    observer.observe(route);
    window.addEventListener("resize", fit);
    fit();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", fit);
      for (const property of ["width", "transform", "left", "top"]) {
        route.style.removeProperty(property);
      }
    };
  }, [view]);
  const levels: LevelSummary[] =
    props.map?.zones.flatMap((zone: any) => zone.levels) ?? [];
  const currentId = props.map?.highestUnlockedLevelId;
  const stars = levels.reduce((sum, level) => sum + level.stars, 0);
  return (
    <main ref={screenRef} className="map-screen" data-map-view={view}>
      <header>
        <h1>Factory Map</h1>
        <nav aria-label="Student tools">
          <button className="secondary" onClick={props.onProgress}>
            Progress
          </button>
          <button className="secondary" onClick={props.onSettings}>
            Settings
          </button>
        </nav>
      </header>
      <div className="map-tools">
        <p className="map-current-level">
          Current level{" "}
          <strong>{currentId?.replace("level-", "") ?? "1"}</strong> ·{" "}
          {props.map?.achievedTier ?? "Trainee"}
        </p>
        <aside className="map-welcome" aria-label="Factory guide">
          <Mascot pose="welcome" />
          <p>
            Choose an open level on the factory route to begin your next
            mission.
          </p>
        </aside>
        <div role="group" aria-label="Map presentation">
          <button
            className="secondary"
            aria-pressed={view === "world"}
            onClick={() => setView("world")}
          >
            Factory world
          </button>
          <button
            className="secondary"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            Level list
          </button>
        </div>
      </div>
      {props.activeAttempt && (
        <section className="resume-banner" aria-labelledby="resume-heading">
          <h2 id="resume-heading">Mission ready to resume</h2>
          <p>
            Level {props.activeAttempt.levelId?.replace("level-", "")} ·
            shipment {formatNumber(props.activeAttempt.shippedSlots + 1)} of 5
          </p>
          <button onClick={props.onResume}>Resume saved mission</button>
        </section>
      )}
      {lockedNotice ? (
        <p className="map-lock-notice" role="status">
          {lockedNotice}
        </p>
      ) : null}
      <div className="map-layout">
        <div className="route-viewport" ref={viewportRef}>
        <div
          ref={routeRef}
          className="factory-route"
          aria-label="Five-zone factory route"
          aria-busy={props.starting}
        >
          {view === "world" && (
            <div className="map-scenery" aria-hidden="true">
              <FactoryArt asset="prop-shipment" className="map-prop map-prop-incoming" />
              <FactoryArt asset="prop-waiting-pallet" className="map-prop map-prop-packing-stock" />
              <FactoryArt asset="prop-waiting-pallet" className="map-prop map-prop-receiving-stock" />
              <FactoryArt asset="prop-pipes-gauge" className="map-prop map-prop-utilities" />
              <FactoryArt asset="prop-conveyor" className="map-prop map-prop-transfer-belt" />
              <FactoryArt asset="prop-shipment" className="map-prop map-prop-transfer-crate" />
              <FactoryArt asset="cosmetic-shelves" className="map-prop map-prop-central-storage" />
              <FactoryArt asset="prop-activity-light" className="map-prop map-prop-lab-tools" />
              <FactoryArt asset="prop-waiting-pallet" className="map-prop map-prop-outgoing-stock" />
            </div>
          )}
          <svg
            className="world-route"
            viewBox="0 0 1000 700"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M150 215 C300 215 300 215 490 215 S850 215 855 310 L855 500 C855 590 620 590 490 590 S260 590 160 545" />
          </svg>
          {props.map?.zones.map((zone: any) => {
            const artName = zone.name.toLowerCase().replaceAll(" ", "-");
            const statuses = zone.levels.map(
              (level: LevelSummary) => level.status,
            );
            const zoneState = statuses.every(
              (status: string) => status === "completed",
            )
              ? "completed"
              : statuses.some((status: string) => status === "unlocked")
                ? "available"
                : "locked";
            const cosmetic = (
              {
                receiving: "cosmetic-sign",
                packing: "cosmetic-crane",
                warehouse: "cosmetic-shelves",
                shipping: "cosmetic-loading-bay",
                lab: "cosmetic-lab-equipment",
              } as Record<string, string>
            )[artName];
            return (
              <section
                className="map"
                data-zone={artName}
                data-zone-state={zoneState}
                data-zone-unlocking={
                  props.unlockingZone === artName ? "true" : undefined
                }
                key={zone.id}
              >
                {props.unlockingZone === artName ? (
                  <span className="zone-unlock-badge" role="status">
                    {zone.name} Station unlocked!
                  </span>
                ) : null}
                <div className="zone-illustration" aria-hidden="true">
                  <FactoryArt
                    asset={`zone-${artName}`}
                    className="zone-building"
                    height={768}
                    loading="lazy"
                    width={768}
                  />
                  {cosmetic && zoneState === "completed" && (
                    <FactoryArt
                      asset={cosmetic}
                      className="zone-cosmetic"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="zone-content">
                  <h2>{zone.name}</h2>
                  <ol
                    className={view === "world" ? "level-nodes" : "level-list"}
                    aria-label={`${zone.name} levels`}
                  >
                    {zone.levels.map((level: LevelSummary) => (
                      <li
                        key={level.id}
                        data-status={level.status}
                        data-current={level.id === currentId}
                      >
                        {view === "world" ? (
                          <>
                            <button
                              className="level-node"
                              aria-current={
                                level.id === currentId ? "step" : undefined
                              }
                              data-locked={level.status === "locked"}
                              disabled={props.starting}
                              aria-label={`${level.status === "locked" ? "Locked" : level.status === "completed" ? "Replay mission" : "View mission"} — Level ${level.id.replace("level-", "")}: ${level.title}${level.status === "locked" ? `. ${level.prerequisiteSummary}` : ""}`}
                              onClick={() =>
                                level.status === "locked"
                                  ? setLockedNotice(
                                      `Level ${level.id.replace("level-", "")}: ${level.prerequisiteSummary}`,
                                    )
                                  : props.onSelectLevel({
                                      ...level,
                                      zoneName: zone.name,
                                    })
                              }
                            >
                              <span>{level.id.replace("level-", "")}</span>
                              <span className="node-lock" aria-hidden="true">
                                {level.status === "locked"
                                  ? "🔒"
                                  : level.status === "completed"
                                    ? "✓"
                                    : ""}
                              </span>
                            </button>
                            {level.stars > 0 ? (
                              <span
                                className="node-stars"
                                aria-label={`${level.stars} earned stars`}
                              >
                                {"★".repeat(level.stars)}
                              </span>
                            ) : null}
                            {level.id === currentId ? (
                              <small className="here-label">You are here</small>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <strong>
                              Level {level.id.replace("level-", "")}:{" "}
                              {level.title}
                            </strong>
                            <small>
                              Stage {level.stage} · {level.status}
                            </small>
                            {level.status === "unlocked" ? (
                              <button
                                disabled={props.starting}
                                onClick={() =>
                                  props.onSelectLevel({
                                    ...level,
                                    zoneName: zone.name,
                                  })
                                }
                              >
                                View mission
                              </button>
                            ) : level.status === "completed" ? (
                              <button
                                className="secondary"
                                disabled={props.starting}
                                onClick={() =>
                                  props.onSelectLevel({
                                    ...level,
                                    zoneName: zone.name,
                                  })
                                }
                              >
                                Replay mission
                              </button>
                            ) : (
                              <span>{level.prerequisiteSummary}</span>
                            )}
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            );
          })}
        </div>
        </div>
        <aside className="map-summary" aria-label="Factory progress summary">
          <h2>Your factory</h2>
          <dl>
            <div>
              <dt>Total stars</dt>
              <dd>{formatNumber(stars)} / 90</dd>
            </div>
            <div>
              <dt>Levels completed</dt>
              <dd>
                {formatNumber(levels.filter((level) => level.status === "completed").length)}{" "}
                / 30
              </dd>
            </div>
            <div>
              <dt>Last completed level efficiency</dt>
              <dd>
                {props.map?.lastCompletedEfficiency == null
                  ? "No completed level yet"
                  : `${formatNumber(props.map.lastCompletedEfficiency)}%`}
              </dd>
            </div>
          </dl>
          <h3>Skills practiced</h3>
          <ul>
            {(props.progress?.skills ?? [])
              .filter((skill: any) => skill.sampleN > 0)
              .map((skill: any) => (
                <li key={skill.skillId}>{studentSkillLabel(skill.skillId)}</li>
              ))}
          </ul>
          {!props.progress?.skills?.some((skill: any) => skill.sampleN > 0) ? (
            <p>Your first shipment starts your learning story.</p>
          ) : null}
          <h3>Certifications earned</h3>
          <p>
            {props.map?.certifications?.length
              ? props.map.certifications.join(" · ")
              : "Keep practicing to earn your first certification."}
          </p>
        </aside>
      </div>
    </main>
  );
}
