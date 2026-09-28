import { studentSkillLabel, studentSkillStatus } from "../studentCopy.js";
import { FactoryArt, Mascot } from "../components/FactoryArt.js";
import { formatNumber } from "../formatNumber.js";

type Props = {
  result: any;
  completedLevelId?: string;
  onTransfer: () => void;
  onReplay: () => void;
  onNext: () => void;
  onProgress: () => void;
  onMap: () => void;
};

export function ResultsScreen({
  result,
  completedLevelId,
  onTransfer,
  onReplay,
  onNext,
  onProgress,
  onMap,
}: Props) {
  const practice = result?.mainStars === 0;
  const stars = result?.bestLevelStars ?? 2;
  const stationTransition = (
    {
      "level-4": {
        completed: "Receiving Station",
        next: "Packing Station",
        nextLevelId: "level-5",
      },
      "level-9": {
        completed: "Packing Station",
        next: "Warehouse Station",
        nextLevelId: "level-10",
      },
      "level-15": {
        completed: "Warehouse Station",
        next: "Shipping Station",
        nextLevelId: "level-16",
      },
      "level-21": {
        completed: "Shipping Station",
        next: "Factory Lab",
        nextLevelId: "level-22",
      },
    } as Record<
      string,
      { completed: string; next: string; nextLevelId: string }
    >
  )[completedLevelId ?? ""];
  const stationUnlocked = Boolean(
    stationTransition &&
      result?.newlyUnlockedLevelIds?.includes(stationTransition.nextLevelId),
  );
  return (
    <main className="results-screen">
      <FactoryArt asset="effect-celebration" className="celebration-effect" />
      <div className="results-hero">
        <Mascot pose="celebrate" className="results-mascot" />
        <div className="results-heading">
          <p className="eyebrow">{practice ? "Practice complete" : "Mission complete"}</p>
          <h1>{practice ? "Great practicing!" : "Level complete!"}</h1>
          <p>
            Great work! You packed {formatNumber(result?.shipped ?? 5)} orders for this
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
                {formatNumber(result?.firstObjectiveCorrect ?? 0)}/
                {formatNumber(result?.submittedOrders ?? result?.shipped ?? 5)}
              </dd>
            </div>
            <div>
              <dt>Orders solved</dt>
              <dd>
                {formatNumber(result?.eventuallyCorrect ?? 0)}/
                {formatNumber(result?.submittedOrders ?? result?.shipped ?? 5)}
              </dd>
            </div>
            <div>
              <dt>Best streak</dt>
              <dd>{formatNumber(result?.bestStreak ?? 0)}</dd>
            </div>
            <div>
              <dt>Factory score</dt>
              <dd>{formatNumber(result?.efficiency ?? 100)}%</dd>
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
                  {studentSkillStatus(skill.status)} ({formatNumber(skill.sampleN)}{" "}
                  {skill.sampleN === 1 ? "order" : "orders"})
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
      <div className="results-next">
        {!practice && stationTransition ? (
          <section className="station-unlock" role="status">
            <h2>
              {stationUnlocked
                ? `${stationTransition.next} unlocked!`
                : `${stationTransition.completed} complete!`}
            </h2>
            <p>
              {stationUnlocked
                ? `Go back to the factory map to explore the new ${stationTransition.next} missions.`
                : `Go back to the factory map to practice any remaining skills and unlock the ${stationTransition.next}.`}
            </p>
          </section>
        ) : null}
        {practice ? (
          <p role="status">Practice builds your skills. Your map stars stay the same.</p>
        ) : result?.transferStar ? (
          <p role="status">Extra challenge complete — third star saved.</p>
        ) : (
          <button onClick={onTransfer}>Try the extra challenge</button>
        )}
        <div className="controls">
          {result?.newlyUnlockedLevelIds?.length > 0 && !stationTransition && (
            <button onClick={onNext}>Play next mission</button>
          )}
          <button className="secondary" onClick={onReplay}>
            Try again
          </button>
          <button className="secondary" onClick={onProgress}>
            View progress
          </button>
          <button className="secondary" onClick={onMap}>
            {stationUnlocked
              ? `Explore ${stationTransition.next}`
              : stationTransition
                ? "Return to factory map"
                : "Back to map"}
          </button>
        </div>
      </div>
    </main>
  );
}
