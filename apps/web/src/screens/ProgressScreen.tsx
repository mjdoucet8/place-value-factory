import { studentSkillLabel, studentSkillStatus } from "../studentCopy.js";
import { Mascot } from "../components/FactoryArt.js";
import { formatNumber } from "../formatNumber.js";
type Props = { progress: any; onPractice: () => void; onBack: () => void };

export function ProgressScreen({ progress, onPractice, onBack }: Props) {
  return (
    <main>
      <header>
        <h1>Factory Progress</h1>
        <button className="secondary" onClick={onBack}>
          Back to map
        </button>
      </header>
      <section className="progress-summary">
        <Mascot pose="instruct" className="summary-mascot" />
        <h2>Learning evidence</h2>
        <p>
          {formatNumber(progress?.completedLevelIds?.length ?? 0)} levels complete. Take the
          time you need — careful thinking counts.
        </p>
        {progress?.nextPracticeSkillId && (
          <button onClick={onPractice}>
            Practice {studentSkillLabel(progress.nextPracticeSkillId)}
          </button>
        )}
      </section>
      <section className="skill-grid" aria-label="Skill evidence">
        {progress?.skills?.map((skill: any) => (
          <article key={skill.skillId} className="skill-card">
            <h2>{studentSkillLabel(skill.skillId)}</h2>
            <p className={`status-chip status-${skill.status}`}>
              {skill.needsRefresh
                ? "Try a quick refresher"
                : studentSkillStatus(skill.status)}
            </p>
            <p>
              {skill.sampleN === 0
                ? "Still gathering evidence"
                : `${formatNumber(skill.sampleN)} practice orders · ${formatNumber(skill.independentFirstN)} first-try solves`}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
