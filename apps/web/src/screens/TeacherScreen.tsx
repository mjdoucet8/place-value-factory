import { Mascot } from "../components/FactoryArt.js";
import type { ReactNode } from "react";

export function TeacherScreen({
  report,
  children,
}: {
  report: any;
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
      {!students.length ? (
        <section className="empty-state">
          <Mascot pose="welcome" className="state-mascot" />
          <h2>No evidence yet</h2>
          <p>Student evidence will appear after a committed response.</p>
        </section>
      ) : (
        students.map((student: any) => (
          <section className="report" key={student.studentId ?? student.alias}>
            <h2>{student.alias ?? "Ava"}</h2>
            <p>
              {student.submittedN} submitted orders ·{" "}
              {student.eventuallyCorrectN} accepted shipments
            </p>
            <div
              className="table-region"
              role="region"
              aria-label="Stored shipment evidence"
              tabIndex={0}
            >
              <table>
                <caption>Stored shipment evidence</caption>
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Crates</th>
                    <th>Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {student.evidence.map((row: any, index: number) => (
                    <tr key={index}>
                      <td>{row.target.toLocaleString()}</td>
                      <td>{row.vector.join(", ")}</td>
                      <td>{row.accepted ? "Yes" : "No"}</td>
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
