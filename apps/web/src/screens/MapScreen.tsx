import type { LevelSummary, SelectedLevel } from "../models.js";

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
    <main>
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
            <strong>{props.progress.nextPracticeSkillId}</strong> before your
            next stage gate.
          </p>
          <button onClick={props.onPractice}>Start practice</button>
        </section>
      )}
      {props.map?.zones.map((zone: any) => (
        <section className="map" key={zone.id}>
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
        </section>
      ))}
    </main>
  );
}
