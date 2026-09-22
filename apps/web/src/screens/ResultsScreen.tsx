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
  const stars = result?.bestLevelStars ?? 2;
  return (
    <main className="results">
      <p className="eyebrow">Saved factory record</p>
      <h1>Level complete!</h1>
      <p>{result?.shipped ?? 5} server-validated shipments saved.</p>
      <dl className="result-counters">
        <div>
          <dt>First try</dt>
          <dd>
            {result?.firstObjectiveCorrect ?? 0}/{result?.shipped ?? 5}
          </dd>
        </div>
        <div>
          <dt>Eventually correct</dt>
          <dd>
            {result?.eventuallyCorrect ?? 0}/{result?.shipped ?? 5}
          </dd>
        </div>
        <div>
          <dt>Best streak</dt>
          <dd>{result?.bestStreak ?? 0}</dd>
        </div>
        <div>
          <dt>This-level efficiency</dt>
          <dd>{result?.efficiency ?? 100}%</dd>
        </div>
      </dl>
      <div className="stars" aria-label={`${stars} earned stars`}>
        {stars === 3 ? "★★★" : "★★☆"}
      </div>
      {result?.skillStatuses?.length > 0 && (
        <section className="result-skills">
          <h2>Skills practiced</h2>
          <ul>
            {result.skillStatuses.map((skill: any) => (
              <li key={skill.skillId}>
                {skill.skillId}: {skill.status} ({skill.sampleN} orders)
              </li>
            ))}
          </ul>
        </section>
      )}
      {result?.transferStar ? (
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
    </main>
  );
}
