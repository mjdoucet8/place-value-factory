export function TeacherScreen({ report }: { report: any }) {
  const student = report?.students?.[0];
  return (
    <main>
      <header>
        <h1>Teacher evidence</h1>
        <span>Fictional development account</span>
      </header>
      {!student ? (
        <section className="empty-state">
          <h2>No evidence yet</h2>
          <p>Student evidence will appear after a committed response.</p>
        </section>
      ) : (
        <section className="report">
          <h2>{student.alias ?? "Ava"}</h2>
          <p>
            {student.submittedN} submitted orders · {student.eventuallyCorrectN}{" "}
            accepted shipments
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
      )}
    </main>
  );
}
