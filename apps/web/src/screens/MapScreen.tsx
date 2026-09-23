import type { LevelSummary, SelectedLevel } from "../models.js";
import { FactoryArt, Mascot } from "../components/FactoryArt.js";
import { studentSkillLabel } from "../studentCopy.js";

type Props = {
  map: any;
  progress: any;
  activeAttempt: any;
  onSettings: () => void;
  onProgress: () => void;
  onResume: () => void;
  onPractice: () => void;
  onSelectLevel: (level: SelectedLevel) => void;
};

export function MapScreen(props: Props) {
  return (
    <main className="map-screen">
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
      <aside className="map-welcome" aria-label="Factory guide">
        <Mascot pose="welcome" />
        <p>Choose a bright building to begin your next factory mission.</p>
      </aside>
      {props.activeAttempt && (
        <section className="resume-banner" aria-labelledby="resume-heading">
          <h2 id="resume-heading">Mission ready to resume</h2>
          <p>
            Level {props.activeAttempt.levelId?.replace("level-", "")} ·
            shipment {props.activeAttempt.shippedSlots + 1} of 5
          </p>
          <button onClick={props.onResume}>Resume saved mission</button>
        </section>
      )}
      {props.progress?.nextPracticeSkillId && (
        <section className="practice-card">
          <h2>Practice recommendation</h2>
          <p>
            Build more evidence for{" "}
            <strong>
              {studentSkillLabel(props.progress.nextPracticeSkillId)}
            </strong>{" "}
            before your next stage opens.
          </p>
          <button onClick={props.onPractice}>Start practice</button>
        </section>
      )}
      {props.map?.zones.map((zone: any) => {
        const artName = zone.name.toLowerCase().replaceAll(" ", "-");
        const statuses = zone.levels.map((level: LevelSummary) => level.status);
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
            packing: "cosmetic-shelves",
            warehouse: "cosmetic-crane",
            shipping: "cosmetic-loading-bay",
            lab: "cosmetic-lab-equipment",
          } as Record<string, string>
        )[artName];
        return (
          <section className="map" data-zone-state={zoneState} key={zone.id}>
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
              <ol aria-label={`${zone.name} levels`}>
                {zone.levels.map((level: LevelSummary) => (
                  <li key={level.id} data-status={level.status}>
                    <strong>
                      Level {level.id.replace("level-", "")}: {level.title}
                    </strong>
                    <small>
                      Stage {level.stage} · {level.status}
                    </small>
                    {level.status === "unlocked" ? (
                      <button
                        onClick={() =>
                          props.onSelectLevel({ ...level, zoneName: zone.name })
                        }
                      >
                        View mission
                      </button>
                    ) : level.status === "completed" ? (
                      <button
                        className="secondary"
                        onClick={() =>
                          props.onSelectLevel({ ...level, zoneName: zone.name })
                        }
                      >
                        Replay mission
                      </button>
                    ) : (
                      <span>{level.prerequisiteSummary}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      })}
    </main>
  );
}
