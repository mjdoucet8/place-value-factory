import { useRef, useState } from "react";
import { GameScreen } from "./GameScreen.js";
import { MapScreen } from "./MapScreen.js";
import { LevelIntroScreen } from "./LevelIntroScreen.js";
import { ProgressScreen } from "./ProgressScreen.js";
import { ResultsScreen } from "./ResultsScreen.js";
import { Mascot } from "../components/FactoryArt.js";
import {
  GAME_FIXTURES,
  INTRO_FIXTURE,
  MAP_FIXTURE,
  PROGRESS_FIXTURE,
  RESULTS_FIXTURES,
} from "../visualFixtures.js";

const noop = () => undefined;
const states = [
  "map",
  "map-resume",
  "level-intro",
  "progress",
  ...Object.keys(GAME_FIXTURES),
  "results-two",
  "results-three",
  "loading",
  "error",
  "empty",
];

export function StateGallery() {
  const [state, setState] = useState(
    new URLSearchParams(window.location.search).get("fixture") ?? "map",
  );
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0]);
  const [quantitiesB, setQuantitiesB] = useState([0, 0, 0, 0, 0, 0]);
  const [undo, setUndo] = useState<number[] | null>(null);
  const helpTrigger = useRef<HTMLButtonElement>(null);
  const helpDialog = useRef<HTMLDivElement>(null);
  const choose = (value: string) => {
    setState(value);
    window.history.replaceState({}, "", `?fixture=${value}`);
  };
  let preview;
  if (state === "map" || state === "map-resume")
    preview = (
      <MapScreen
        map={MAP_FIXTURE}
        progress={PROGRESS_FIXTURE}
        activeAttempt={
          state === "map-resume" ? GAME_FIXTURES.calm.attempt : null
        }
        onSettings={noop}
        onProgress={noop}
        onResume={noop}
        onSelectLevel={noop}
      />
    );
  else if (state === "level-intro")
    preview = (
      <LevelIntroScreen
        level={INTRO_FIXTURE}
        settings={{
          sound: false,
          reducedMotion: false,
          pressure: "calm",
          textScale: "normal",
        }}
        starting={false}
        onStart={noop}
        onBack={noop}
      />
    );
  else if (state === "progress")
    preview = (
      <ProgressScreen
        progress={PROGRESS_FIXTURE}
        onPractice={noop}
        onBack={noop}
      />
    );
  else if (state === "results-two" || state === "results-three")
    preview = (
      <ResultsScreen
        result={
          state === "results-two"
            ? RESULTS_FIXTURES.two
            : RESULTS_FIXTURES.three
        }
        onTransfer={noop}
        onReplay={noop}
        onNext={noop}
        onProgress={noop}
        onMap={noop}
      />
    );
  else if (state === "loading")
    preview = (
      <main>
        <section className="loading-state" aria-busy="true">
          <Mascot pose="instruct" className="state-mascot" />
          <h1>Loading the factory…</h1>
          <div className="skeleton" />
          <div className="skeleton short" />
        </section>
      </main>
    );
  else if (state === "error")
    preview = (
      <main>
        <section className="error-state" role="alert">
          <Mascot pose="encourage" className="state-mascot" />
          <h1>The factory could not connect</h1>
          <p>
            Your work is still in this tab. Try again when the connection
            returns.
          </p>
          <button>Try again</button>
        </section>
      </main>
    );
  else if (state === "empty")
    preview = (
      <main>
        <section className="empty-state">
          <Mascot pose="welcome" className="state-mascot" />
          <h1>No learning evidence yet</h1>
          <p>Complete a shipment to begin the progress record.</p>
        </section>
      </main>
    );
  else {
    const fixture = GAME_FIXTURES[state] ?? GAME_FIXTURES.calm;
    preview = (
      <div data-pressure={fixture.pressure ?? "calm"}>
        <GameScreen
          attempt={fixture.attempt}
          quantities={quantities}
          quantitiesB={quantitiesB}
          undo={undo}
          notice={fixture.notice ?? ""}
          help="H1: Think about groups of ten."
          helpOpen={fixture.helpOpen ?? false}
          saving={fixture.saving ?? false}
          pending={false}
          pendingConflict={false}
          busy={fixture.pressure === "busy"}
          storageUnavailable={fixture.storageUnavailable ?? false}
          tabId="fixture-tab"
          helpTrigger={helpTrigger}
          helpDialog={helpDialog}
          setQuantities={setQuantities}
          setQuantitiesB={setQuantitiesB}
          setUndo={setUndo}
          onHelpOpen={noop}
          onHelpClose={noop}
          onHelp={noop}
          onTakeOver={noop}
          onShip={noop}
          onRetryPending={noop}
          onSkip={noop}
          onPause={noop}
          onResume={noop}
          onMap={noop}
        />
      </div>
    );
  }
  return (
    <>
      <aside className="fixture-toolbar">
        <label>
          Visual state
          <select
            aria-label="Visual state"
            value={state}
            onChange={(event) => choose(event.target.value)}
          >
            {states.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <span>Deterministic development fixtures · no student data</span>
      </aside>
      {preview}
    </>
  );
}
