type Props = { progress: any; onPractice: () => void; onBack: () => void };
const friendlySkill = (id: string) =>
  id.replaceAll(".", " · ").replaceAll("_", " → ");

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
          {progress?.completedLevelIds?.length ?? 0} levels completed. Timing is
          never used for certification.
        </p>
        {progress?.nextPracticeSkillId && (
          <button onClick={onPractice}>
            Practice {friendlySkill(progress.nextPracticeSkillId)}
          </button>
        )}
      </section>
      <section className="skill-grid" aria-label="Skill evidence">
        {progress?.skills?.map((skill: any) => (
          <article key={skill.skillId} className="skill-card">
            <h2>{friendlySkill(skill.skillId)}</h2>
            <p className={`status-chip status-${skill.status}`}>
              {skill.needsRefresh ? "Needs refresh" : skill.status}
            </p>
            <p>
              {skill.sampleN === 0
                ? "Still gathering evidence"
                : `${skill.sampleN} eligible orders · ${skill.independentFirstN} independent first tries`}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
import { Mascot } from "../components/FactoryArt.js";
