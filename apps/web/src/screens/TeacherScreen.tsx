import { Mascot } from "../components/FactoryArt.js";
import type { ReactNode } from "react";

type Filters = {
  from: string;
  to: string;
  includeTransfer: boolean;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  setIncludeTransfer: (value: boolean) => void;
  apply: () => void;
};

function vector(value: unknown) {
  return Array.isArray(value) ? value.join(", ") : "—";
}

export function TeacherScreen({
  report,
  filters,
  children,
}: {
  report: any;
  filters?: Filters;
  children?: ReactNode;
}) {
  const students = report?.students ?? [];
  return (
    <main>
      <header>
        <h1>Teacher evidence</h1>
        <span>Classroom workspace</span>
      </header>
      <Mascot pose="instruct" className="teacher-mascot" />
      {children}
      {filters ? (
        <form className="report-filters" onSubmit={(event) => { event.preventDefault(); filters.apply(); }}>
          <label>From <input type="date" value={filters.from} onChange={(event) => filters.setFrom(event.target.value)} /></label>
          <label>To (exclusive) <input type="date" value={filters.to} onChange={(event) => filters.setTo(event.target.value)} /></label>
          <label><input type="checkbox" checked={filters.includeTransfer} onChange={(event) => filters.setIncludeTransfer(event.target.checked)} /> Include transfer</label>
          <button type="submit">Apply report filters</button>
        </form>
      ) : null}
      {report ? <p>Report window: {report.from?.slice(0, 10)} to {report.to?.slice(0, 10)} (end exclusive, {report.timezone})</p> : null}
      {!students.length ? (
        <section className="empty-state">
          <Mascot pose="welcome" className="state-mascot" />
          <h2>No students yet</h2>
          <p>Issue student access to see learning evidence here.</p>
        </section>
      ) : (
        students.map((student: any) => (
          <section className="report" key={student.studentId ?? student.alias}>
            <h2>{student.alias}</h2>
            <p>{student.currentLevelId} · {student.achievedTier} · {student.evidenceLabel}</p>
            <p>{student.submittedN} submitted orders · {student.eventuallyCorrectN} accepted shipments</p>
            <p>{student.firstObjectiveCorrectN} first objective successes · {student.correctionSuccessN} corrected · {student.pendingN} pending</p>
            <details>
              <summary>Skill progress ({student.skills?.length ?? 0})</summary>
              <ul>{student.skills?.map((skill: any) => <li key={skill.skillId}>{skill.skillId}: {skill.status}, {skill.sampleN} eligible orders{skill.score === null ? "" : `, ${Math.round(skill.score * 100)}%`}</li>)}</ul>
            </details>
            <p className="table-hint">Scroll the answer table sideways to view every column.</p>
            <div className="table-region" role="region" aria-label={`Stored order evidence for ${student.alias}`} tabIndex={0}>
              <table>
                <caption>Stored question and first/final answers for {student.alias}</caption>
                <thead><tr><th>Question</th><th>First answer</th><th>Final answer</th><th>Result</th></tr></thead>
                <tbody>
                  {(student.evidence ?? []).map((row: any) => (
                    <tr key={row.orderId}>
                      <td><details><summary>{row.target.toLocaleString()} · {row.firstResponse?.order?.primarySkill ?? "Order"}</summary>
                        <p>Allowed machines: {row.firstResponse?.order?.allowed?.map((place: number) => place.toLocaleString()).join(", ") ?? "—"}</p>
                        {row.firstResponse?.order?.sourceRepresentation ? <p>Source crates: {vector(row.firstResponse.order.sourceRepresentation)}</p> : null}
                        <p>Objective: {row.firstResponse?.order?.canonicalRequired ? "normal place value" : row.firstResponse?.order?.minimumRequired ? "fewest crates" : row.firstResponse?.order?.exactTypes ? `exactly ${row.firstResponse.order.exactTypes} types` : row.firstResponse?.order?.distinctRepresentations === 2 ? "two different answers" : "correct total with allowed machines"}</p>
                      </details></td>
                      <td>{vector(row.firstResponse?.representationA)}{row.firstResponse?.representationB ? ` / ${vector(row.firstResponse.representationB)}` : ""}<br /><small>{row.firstResponse?.validation?.valueMatches ? "Value correct" : "Value incorrect"}; {row.firstResponse?.validation?.objectiveMet ? "objective met" : "objective missed"}</small></td>
                      <td>{vector(row.finalResponse?.representationA)}{row.finalResponse?.representationB ? ` / ${vector(row.finalResponse.representationB)}` : ""}<br /><small>{row.finalResponse?.validation?.objectiveMet ? "Objective met" : "Objective missed"}</small></td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </main>
  );
}
