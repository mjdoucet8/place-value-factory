import { Mascot } from "../components/FactoryArt.js";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type {
  ReportPageV2,
  ReportEvidence,
} from "../../../../packages/contracts/src/index.js";
import { api } from "../api.js";
import { formatNumber } from "../formatNumber.js";

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
  return Array.isArray(value)
    ? value
        .map((item) => (typeof item === "number" ? formatNumber(item) : item))
        .join(", ")
    : "—";
}

export function TeacherScreen({
  report,
  loading = false,
  filters,
  children,
}: {
  report: any;
  loading?: boolean;
  filters?: Filters;
  children?: ReactNode;
}) {
  const students = [...(report?.students ?? [])].sort(
    (a, b) =>
      a.alias.localeCompare(b.alias) || a.studentId.localeCompare(b.studentId),
  );
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const detailRevision = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [detail, setDetail] = useState<ReportPageV2<ReportEvidence> | null>(
    null,
  );
  useEffect(() => {
    if (detail) detailHeading.current?.focus();
  }, [detail]);
  const [detailError, setDetailError] = useState("");
  const [detailBusy, setDetailBusy] = useState(false);
  useEffect(() => {
    detailRevision.current = null;
    setSelectedId(null);
    setCursors([null]);
    setPageIndex(0);
    setDetail(null);
    setDetailError("");
  }, [report]);
  const cursor = cursors[pageIndex];
  useEffect(() => {
    if (!selectedId || report?.version !== 2) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailBusy(true);
    setDetailError("");
    const params = new URLSearchParams({
      from: report.from,
      to: report.to,
      includeTransfer: String(report.includeTransfer ?? false),
    });
    const path = `/v2/teacher/students/${selectedId}/games/place-value-factory`;
    const load = async () => {
      if (cursor) params.set("cursor", cursor);
      else {
        if (!detailRevision.current) {
          const summary = await api(`${path}/summary?${params}`, {
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          detailRevision.current = String(summary.viewRevision);
        }
        params.set("viewRevision", detailRevision.current);
      }
      const data = await api(`${path}/evidence?${params}`, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted) setDetail(data);
    };
    void load()
      .catch((error) => {
        if (!controller.signal.aborted) setDetailError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setDetailBusy(false);
      });
    return () => controller.abort();
  }, [selectedId, cursor, report]);
  const selectStudent = (id: string) => {
    detailRevision.current = null;
    setSelectedId(selectedId === id ? null : id);
    setCursors([null]);
    setPageIndex(0);
    setDetail(null);
    setDetailError("");
  };
  return (
    <main data-report-observed={report?.asOf}>
      <header>
        <h1>Teacher evidence</h1>
        <span>Classroom workspace</span>
      </header>
      <Mascot pose="instruct" className="teacher-mascot" />
      {children}
      {filters ? (
        <form
          className="report-filters"
          onSubmit={(event) => {
            event.preventDefault();
            filters.apply();
          }}
        >
          <label>
            From{" "}
            <input
              type="date"
              value={filters.from}
              onChange={(event) => filters.setFrom(event.target.value)}
            />
          </label>
          <label>
            To (exclusive){" "}
            <input
              type="date"
              value={filters.to}
              onChange={(event) => filters.setTo(event.target.value)}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={filters.includeTransfer}
              onChange={(event) =>
                filters.setIncludeTransfer(event.target.checked)
              }
            />{" "}
            Include transfer
          </label>
          <button type="submit">Apply report filters</button>
          <button type="button" onClick={filters.apply}>
            Refresh report
          </button>
        </form>
      ) : null}
      {report ? (
        <p>
          Report window: {report.from?.slice(0, 10)} to{" "}
          {report.to?.slice(0, 10)} (end exclusive, {report.timezone})
        </p>
      ) : null}
      {report?.version === 2 && students.length ? (
        <section
          className="report-overview"
          aria-label="Class learning summary"
        >
          <p>
            Summaries viewed at {new Date(report.asOf).toLocaleString()}. Open a
            student’s evidence to see every stored question and answer.
          </p>
          <p className="table-hint">
            Scroll the summary table sideways to reach the evidence buttons.
          </p>
          <div
            className="table-region"
            role="region"
            aria-label="Class learning summary table"
            tabIndex={0}
          >
            <table>
              <caption>Class learning summary</caption>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Path level / tier</th>
                  <th>First objective accuracy</th>
                  <th>Skills</th>
                  <th>Practice need</th>
                  <th>Last activity</th>
                  <th>Submitted</th>
                  <th>Shipped</th>
                  <th>Corrected</th>
                  <th>Pending</th>
                  <th>Evidence</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student: any) => (
                  <tr key={student.studentId}>
                    <th scope="row">{student.alias}</th>
                    <td>
                      {student.currentLevelId}
                      <br />
                      {student.achievedTier}
                    </td>
                    <td>
                      {student.firstObjectiveAccuracy === null
                        ? "No evidence"
                        : `${formatNumber(student.firstObjectiveCorrectN)}/${formatNumber(student.submittedN)} (${formatNumber(Math.round(student.firstObjectiveAccuracy * 100))}%)`}
                    </td>
                    <td>
                      {formatNumber(
                        student.skills?.filter(
                          (skill: any) => skill.status === "secure",
                        ).length ?? 0,
                      )}
                      /{formatNumber(student.skills?.length ?? 0)} secure
                    </td>
                    <td>
                      {student.primaryPracticeSkillId ??
                        "No current practice need"}
                    </td>
                    <td>
                      {student.lastActivityAt
                        ? new Date(student.lastActivityAt).toLocaleString()
                        : "No activity"}
                    </td>
                    <td data-submitted>{formatNumber(student.submittedN)}</td>
                    <td>{formatNumber(student.eventuallyCorrectN)}</td>
                    <td>{formatNumber(student.correctionSuccessN)}</td>
                    <td>{formatNumber(student.pendingN)}</td>
                    <td>
                      <button
                        aria-expanded={selectedId === student.studentId}
                        onClick={() => selectStudent(student.studentId)}
                      >
                        View evidence for {student.alias}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {loading && report ? (
        <p role="status">Refreshing teacher summaries…</p>
      ) : null}
      {!report ? (
        <p role="status">
          {loading
            ? "Loading teacher summaries…"
            : "No report loaded. Choose a class or use Refresh report to try again."}
        </p>
      ) : !students.length ? (
        <section className="empty-state">
          <Mascot pose="welcome" className="state-mascot" />
          <h2>No students yet</h2>
          <p>Issue student access to see learning evidence here.</p>
        </section>
      ) : (
        students
          .filter(
            (student: any) =>
              report.version !== 2 || student.studentId === selectedId,
          )
          .map((student: any) => (
            <section
              className="report"
              key={student.studentId ?? student.alias}
            >
              <h2 ref={detailHeading} tabIndex={-1}>
                {student.alias}
              </h2>
              <p>
                {student.currentLevelId} · {student.achievedTier} ·{" "}
                {student.evidenceLabel}
              </p>
              <p>
                {formatNumber(student.submittedN)} submitted orders ·{" "}
                {formatNumber(student.eventuallyCorrectN)} accepted shipments
              </p>
              <p>
                {formatNumber(student.firstObjectiveCorrectN)} first objective successes ·{" "}
                {formatNumber(student.correctionSuccessN)} corrected · {formatNumber(student.pendingN)}{" "}
                pending
              </p>
              <p>
                First value accuracy:{" "}
                {student.firstValueAccuracy === null
                  ? "No evidence"
                  : `${formatNumber(student.firstValueCorrectN)}/${formatNumber(student.submittedN)} (${formatNumber(Math.round(student.firstValueAccuracy * 100))}%)`}
                . Correction success:{" "}
                {student.correctionAccuracy === null
                  ? "No first-wrong orders"
                  : `${formatNumber(student.correctionSuccessN)}/${formatNumber(student.firstWrongN)} (${formatNumber(Math.round(student.correctionAccuracy * 100))}%)`}
                .
              </p>
              <p>
                Practice need:{" "}
                {student.primaryPracticeSkillId ?? "No current practice need"}.
                Completed path levels:{" "}
                {student.completedLevelIds?.join(", ") || "None yet"}.
              </p>
              <details>
                <summary>Support and possible patterns</summary>
                <p>
                  Orders with H1: {formatNumber(student.supportCounts?.H1 ?? 0)}; H2:{" "}
                  {formatNumber(student.supportCounts?.H2 ?? 0)}; H3:{" "}
                  {formatNumber(student.supportCounts?.H3 ?? 0)}.
                </p>
                {student.misconceptionCounts?.filter(
                  (item: any) => item.showPattern,
                ).length ? (
                  <ul>
                    {student.misconceptionCounts
                      .filter((item: any) => item.showPattern)
                      .map((item: any) => (
                        <li key={item.code}>
                          Possible{" "}
                          {item.code.toLowerCase().replaceAll("_", " ")} pattern
                          in {formatNumber(item.orderN)} of {formatNumber(item.targetedN)} targeted orders.
                          Review the stored answers; this is a candidate
                          pattern.
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p>No repeated candidate pattern in this window.</p>
                )}
              </details>
              <details>
                <summary>
                  Skill progress ({formatNumber(student.skills?.length ?? 0)})
                </summary>
                <ul>
                  {student.skills?.map((skill: any) => (
                    <li key={skill.skillId}>
                      {skill.skillId}: {skill.status}, {formatNumber(skill.sampleN)} eligible
                      orders
                      {skill.score === null
                        ? ""
                        : `, ${Math.round(skill.score * 100)}%`}
                      {skill.needsRefresh ? "; refresh suggested" : ""}
                      {student.trends?.find(
                        (item: any) => item.skillId === skill.skillId,
                      )?.trend
                        ? `; ${student.trends.find((item: any) => item.skillId === skill.skillId).trend}`
                        : "; more evidence needed for a trend"}
                    </li>
                  ))}
                </ul>
              </details>
              {report.version !== 2 || selectedId === student.studentId ? (
                <>
                  {report.version === 2 ? (
                    <div aria-live="polite">
                      {detailBusy ? (
                        <p role="status">Loading stored evidence…</p>
                      ) : null}
                      {detailError ? (
                        <p role="alert">
                          {detailError} Use Refresh report to try again with the
                          same filters.
                        </p>
                      ) : null}
                      {detail ? (
                        <p>
                          Page {formatNumber(pageIndex + 1)} · {formatNumber(detail.evidence.length)} of{" "}
                          {formatNumber(detail.totalN)} records · Viewed at{" "}
                          {new Date(detail.asOf).toLocaleTimeString()}
                        </p>
                      ) : null}
                      {detail?.totalN === 0 ? (
                        <p>No submitted orders in this date range.</p>
                      ) : null}
                    </div>
                  ) : null}
                  <p className="table-hint">
                    Scroll the answer table sideways to view every column.
                  </p>
                  <div
                    className="table-region"
                    role="region"
                    aria-label={`Stored order evidence for ${student.alias}`}
                    tabIndex={0}
                  >
                    <table>
                      <caption>
                        Stored question and first/final answers for{" "}
                        {student.alias}
                      </caption>
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>First answer</th>
                          <th>Final answer</th>
                          <th>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(report.version === 2
                          ? (detail?.evidence ?? [])
                          : (student.evidence ?? [])
                        ).map((row: any) => (
                          <tr key={row.orderId} data-order-id={row.orderId}>
                            <td>
                              <details>
                                <summary>
                                  {formatNumber(row.target)} ·{" "}
                                  {row.firstResponse?.order?.primarySkill ??
                                    "Order"}
                                </summary>
                                <p>
                                  Allowed machines:{" "}
                                  {row.firstResponse?.order?.allowed
                                    ?.map((place: number) =>
                                      formatNumber(place),
                                    )
                                    .join(", ") ?? "—"}
                                </p>
                                {row.firstResponse?.order
                                  ?.sourceRepresentation ? (
                                  <p>
                                    Source crates:{" "}
                                    {vector(
                                      row.firstResponse.order
                                        .sourceRepresentation,
                                    )}
                                  </p>
                                ) : null}
                                <p>
                                  Objective:{" "}
                                  {row.firstResponse?.order?.canonicalRequired
                                    ? "normal place value"
                                    : row.firstResponse?.order?.minimumRequired
                                      ? "fewest crates"
                                      : row.firstResponse?.order?.exactTypes
                                        ? `exactly ${row.firstResponse.order.exactTypes} types`
                                        : row.firstResponse?.order
                                              ?.distinctRepresentations === 2
                                          ? "two different answers"
                                          : "correct total with allowed machines"}
                                </p>
                              </details>
                            </td>
                            <td>
                              {vector(row.firstResponse?.representationA)}
                              {row.firstResponse?.representationB
                                ? ` / ${vector(row.firstResponse.representationB)}`
                                : ""}
                              <br />
                              <small>
                                {row.firstResponse?.validation?.valueMatches
                                  ? "Value correct"
                                  : "Value incorrect"}
                                ;{" "}
                                {row.firstResponse?.validation?.objectiveMet
                                  ? "objective met"
                                  : "objective missed"}
                              </small>
                            </td>
                            <td>
                              {vector(row.finalResponse?.representationA)}
                              {row.finalResponse?.representationB
                                ? ` / ${vector(row.finalResponse.representationB)}`
                                : ""}
                              <br />
                              <small>
                                {row.finalResponse?.validation?.objectiveMet
                                  ? "Objective met"
                                  : "Objective missed"}
                              </small>
                            </td>
                            <td>
                              {row.status}
                              <br />
                              <small>
                                Support:{" "}
                                {row.supports
                                  ?.map(
                                    (event: any) =>
                                      `${event.step} (${new Date(event.at).toLocaleString()})`,
                                  )
                                  .join(", ") || "None"}
                              </small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {report.version === 2 ? (
                    <nav aria-label={`Evidence pages for ${student.alias}`}>
                      <button
                        disabled={detailBusy || pageIndex === 0}
                        onClick={() => {
                          setDetail(null);
                          setPageIndex((n) => n - 1);
                        }}
                      >
                        Previous evidence page
                      </button>
                      <button
                        disabled={detailBusy || !detail?.nextCursor}
                        onClick={() => {
                          const nextCursor = detail?.nextCursor;
                          if (!nextCursor) return;
                          setCursors((values) => [
                            ...values.slice(0, pageIndex + 1),
                            nextCursor,
                          ]);
                          setDetail(null);
                          setPageIndex((n) => n + 1);
                        }}
                      >
                        Next evidence page
                      </button>
                    </nav>
                  ) : null}
                </>
              ) : null}
            </section>
          ))
      )}
    </main>
  );
}
