import { studentSkillLabel, studentSkillStatus } from "../studentCopy.js";

type Props = {
  result: any;
  onTransfer: () => void;
  onReplay: () => void;
  onNext: () => void;
  onProgress: () => void;
  onMap: () => void;
};

export function ResultsScreen({
  result,
  onTransfer,
  onReplay,
  onNext,
  onProgress,
  onMap,
}: Props) {
  const practice = result?.mainStars === 0;
  const stars = result?.bestLevelStars ?? 2;
  return (
    <main className="results-screen">
      <FactoryArt asset="effect-celebration" className="celebration-effect" />
      <div className="results-hero">
        <Mascot pose="celebrate" className="results-mascot" />
        <div className="results-heading">
          <p className="eyebrow">{practice ? "Practice complete" : "Mission complete"}</p>
          <h1>{practice ? "Great practicing!" : "Level complete!"}</h1>
          <p>
            Great work! You packed {result?.shipped ?? 5} orders for this
            mission.
          </p>
          {!practice && (
            <>
              <div className="stars" aria-label={`${stars} earned stars`}>
                <span aria-hidden="true">{stars === 3 ? "★★★" : "★★☆"}</span>
              </div>
              <p className="star-meaning">
                Two stars for finishing your mission ·{" "}
                {stars === 3
                  ? "Extra challenge complete"
                  : "Extra challenge still to try"}
              </p>
            </>
          )}
        </div>
      </div>
      <div className="results-panels">
        <section className="results-card" aria-label="Mission results">
          <dl className="result-counters">
            <div>
              <dt>First try</dt>
              <dd>
                {result?.firstObjectiveCorrect ?? 0}/
                {result?.submittedOrders ?? result?.shipped ?? 5}
              </dd>
            </div>
            <div>
              <dt>Orders solved</dt>
              <dd>
                {result?.eventuallyCorrect ?? 0}/
                {result?.submittedOrders ?? result?.shipped ?? 5}
              </dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd>{result?.bestStreak ?? 0}</dd>
            </div>
            <div>
              <dt>Factory score</dt>
              <dd>{result?.efficiency ?? 100}%</dd>
            </div>
          </dl>
        </section>
        {result?.skillStatuses?.length > 0 && (
          <section className="result-skills results-card">
            <h2>Skills practiced</h2>
            <ul>
              {result.skillStatuses.map((skill: any) => (
                <li key={skill.skillId}>
                  {studentSkillLabel(skill.skillId)}:{" "}
                  {studentSkillStatus(skill.status)} ({skill.sampleN}{" "}
                  {skill.sampleN === 1 ? "order" : "orders"})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="results-next">
        {practice ? (
          <p role="status">Practice builds your skills. Your map stars stay the same.</p>
        ) : result?.transferStar ? (
          <p role="status">Extra challenge complete — third star saved.</p>
        ) : (
          <button onClick={onTransfer}>Try the extra challenge</button>
        )}
        <div className="controls">
          {result?.newlyUnlockedLevelIds?.length > 0 && (
            <button onClick={onNext}>Play next level</button>
          )}
          <button className="secondary" onClick={onReplay}>
            Try again
          </button>
          <button className="secondary" onClick={onProgress}>
            View progress
          </button>
          <button className="secondary" onClick={onMap}>
            Back to map
          </button>
        </div>
      </div>
    </main>
  );
}
import { FactoryArt, Mascot } from "../components/FactoryArt.js";
