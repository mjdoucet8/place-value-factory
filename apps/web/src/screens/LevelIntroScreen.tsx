import type { SelectedLevel, Settings } from "../models.js";
import { Mascot } from "../components/FactoryArt.js";

type Props = {
  level: SelectedLevel;
  settings: Settings;
  starting: boolean;
  onStart: () => void;
  onBack: () => void;
};

export function LevelIntroScreen({
  level,
  settings,
  starting,
  onStart,
  onBack,
}: Props) {
  return (
    <main className="intro-screen">
      <header>
        <h1>Level {level.id.replace("level-", "")}</h1>
        <span>{level.zoneName}</span>
      </header>
      <section className="intro-card">
        <Mascot pose="welcome" className="intro-mascot" />
        <p className="eyebrow">Stage {level.stage} mission</p>
        <h2>{level.title}</h2>
        <p>
          Complete five orders. There is no time limit, and you can pause or
          resume at any point.
        </p>
        <dl className="mission-facts">
          <div>
            <dt>Factory mode</dt>
            <dd>
              {settings.pressure === "calm" ? "Calm" : "Busy (cosmetic only)"}
            </dd>
          </div>
          <div>
            <dt>Motion</dt>
            <dd>{settings.reducedMotion ? "Reduced" : "Standard"}</dd>
          </div>
          <div>
            <dt>Restrictions</dt>
            <dd>
              Every closed machine and extra objective will be shown before you
              ship.
            </dd>
          </div>
        </dl>
        <aside className="example-card" aria-label="Practice example">
          <strong>Example only</strong>
          <p>
            Ten crates of 100 represent 1,000. Examples never count toward
            mastery.
          </p>
        </aside>
        <div className="controls">
          <button disabled={starting} onClick={onStart}>
            {starting
              ? "Starting…"
              : level.status === "completed"
                ? "Replay level"
                : "Start mission"}
          </button>
          <button className="secondary" onClick={onBack}>
            Back to map
          </button>
        </div>
      </section>
    </main>
  );
}
