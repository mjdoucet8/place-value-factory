# API contracts - Place Value Factory V1

Contract v1.0 | Baseline with additive map summary clarification | 23 September 2026

The local fictional runtime implements a subset of these endpoints. This document remains the target contract; an entry here is not proof that its route or behavior has passed acceptance. Prefix /api/v1. All game routes below start /games/place-value-factory unless stated otherwise.

## Conventions and shared types

JSON camelCase, opaque UUID strings, UTC ISO timestamps. Role/resource authorization on every route; IDs never authorize access. No client-submitted totals, mastery, stars, efficiency or unlocks are trusted. Reject unknown input fields.

```typescript
type Representation = [number, number, number, number, number, number];
// In order: 100000, 10000, 1000, 100, 10, 1.
// Runtime: integer 0..999999 each; no coercion from strings.
type Mode = 'standard' | 'single' | 'restricted' | 'forbidden'
  | 'minimum' | 'exactTypes' | 'twoWays' | 'repack';
type Command = {
  commandId: string; expectedRevision: number; leaseEpoch: number;
};
type OrderPublic = {
  id: string; attemptId: string; slotIndex: number;
  replacementIndex: number; role: 'main' | 'transfer';
  target: number; mode: Mode; allowed: number[]; forbidden: number[];
  canonicalRequired: boolean; exactTypes: number | null;
  distinctRepresentations: 1 | 2; minimumRequired: boolean;
  primarySkill: string; skillIds: string[]; difficultyBand: string;
  configVersion: string; engineVersion: string;
  sourceRepresentation: Representation | null;
};
// seed, witness and minimum answer stay server-side until appropriate feedback/help.
type Validation = {
  schemaValid: true; valueMatches: boolean; restrictionsMet: boolean;
  objectiveMet: boolean; shipmentAccepted: boolean;
  representedTotals: number[]; crateCounts: number[];
  minimumCrates: number | null; feedbackCode: string;
  feedbackParams: Record<string, number | string>;
  misconceptionCandidates: string[];
};
type Snapshot = {
  attemptId: string; revision: number; leaseEpoch: number;
  leaseExpiresAt: string; writerTabId: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  levelId: string; kind: 'path' | 'practice' | 'replay';
  configVersion: string; activeOrder: OrderPublic | null;
  shippedSlots: number; skippedOrders: number; correctedSlots: number;
  acknowledgedCommandIds: string[]; achievedTier: string;
};
type MutationResult = {
  commandId: string; committedAt: string; snapshot: Snapshot;
  validation?: Validation; result?: AttemptResult;
};
type AttemptResult = {
  attemptId: string; completed: boolean; shipped: number;
  submittedOrders: number; firstObjectiveCorrect: number;
  firstValueCorrect: number; eventuallyCorrect: number;
  correctedSlots: number; skippedOrders: number;
  bestStreak: number; efficiency: number; mainStars: 0 | 2;
  transferStar: boolean; bestLevelStars: number;
  newlyUnlockedLevelIds: string[]; newlyEarnedTier: string | null;
  skillChanges: SkillSummary[]; policyVersion: string;
};
type SkillSummary = {
  skillId: string; score: number | null; sampleN: number;
  independentFirstN: number; distinctAttemptN: number;
  status: 'unknown' | 'emerging' | 'developing' | 'secure';
  needsRefresh: boolean; practiceSuggested: boolean;
  lastEvidenceAt: string | null;
};
```

Mode is a display/category label; flags define validation. Only published supported combinations accepted. Allowed is sorted descending, unique and nonempty; forbidden is its complement within the six denominations. exactTypes is null or 2/3. Standard implies canonicalRequired=true; single implies one allowed value; twoWays implies distinctRepresentations=2. Repack supplies read-only canonical source and obeys explicit allowed types; may combine with minimum. Input/public spec consistency is validated on server publication.

Validation minimumCrates is populated only after a correct-valued ordinary shipment for optional comparison or after a minimum challenge is completed/H3 requested; do not leak the answer on every wrong submission. Feedback can invite fewer crates without revealing the minimum. All feedback is safe structured data mapped to UI copy.

## Authentication and shared platform

| Method/path | Request | Success / authorization |
| --- | --- | --- |
| POST /auth/student/session | {classCode,username,pin} strings; pin exactly 6 digits | 200 {principal:{id,role:'student',classId},csrfToken}; rotates secure session cookie |
| POST /auth/teacher/session | provider adapter payload; local development {username,password} | 200 principal and csrfToken; provider finalized in PA-01 |
| GET /auth/session | none | principal or 401; no PIN/hash |
| DELETE /auth/session | CSRF token | 204; session revoked |

Normalize classCode/username with trim and consistent lowercase; preserve PIN leading zeros. Generic 401 INVALID_CREDENTIALS; 429 TRY_LATER with retryAfterSeconds; no username existence detail. Teacher login's provider-specific payload is a foundation decision, not a fabricated universal SSO API.

## Student game reads

| Method/path | Response |
| --- | --- |
| GET /profile | {studentAlias,gameKey,highestUnlockedLevelId,achievedTier,totalStars,maxStars:90,settings,revision,activeAttemptId} |
| GET /map | {configVersion,zones:[{id,name,levels:[{id,title,status,stars,prerequisiteSummary}]}],profileRevision,highestUnlockedLevelId,lastCompletedEfficiency:number\|null} |
| GET /levels/:levelId | {id,title,stage,zoneId,goals,orderCount:5,example,restrictions,eligible,practiceNeeded,configVersion} |
| GET /attempts/:attemptId | Snapshot; owns attempt |
| GET /attempts/:attemptId/orders/current | {order:OrderPublic|null,revision}; does not generate/advance |
| GET /attempts/:attemptId/results | AttemptResult if completed; 409 NOT_COMPLETE otherwise |
| GET /progress | {skills:SkillSummary[],completedLevelIds,achievedTier,nextPracticeSkillIds} |

Routes infer profile from principal, never accept another student's ID. Map/loading failures leave a retry action. Read-only snapshots expose only that student's acknowledged command IDs, not secret keys from others.

## Mutations and state transitions

All game mutations below use Idempotency-Key=commandId and CSRF/origin validation. Existing-attempt writes require Command plus tabId. Start uses commandId, profileRevision and tabId (no lease exists yet). Receipts are actor-scoped and payload-hashed. Same key/body replays exact original response; different body 409. Receipt lookup after authorization, before revision check. Store receipts while the attempt/evidence is retained, so a late duplicate cannot create a new answer.

| Method/path | Request beyond Command/tabId | Success and rules |
| --- | --- | --- |
| POST /attempts | {commandId,profileRevision,tabId,levelId,kind} | 201 Snapshot and first order; 200 existing active attempt instead of duplicate; locked level 409 LEVEL_LOCKED |
| POST /attempts/:id/resume | no extra fields | 200 MutationResult; active/paused only, checks writer lease |
| POST /attempts/:id/orders/:orderId/responses | {representationA,representationB:null or vector,activeMs} | 200 MutationResult with Validation; wrong answer persisted too; activeMs bounded 0..86400000, diagnostic only |
| POST /attempts/:id/orders/:orderId/hints | {step:'H1'|'H2'|'H3'} | 200 MutationResult plus {hint:{code,params,workedExample?}}; immutable support event, does not advance |
| POST /attempts/:id/orders/:orderId/skip | no extras | 200 MutationResult; requires ≥2 prior wrong submissions; evidence 0; replacement same slot issued on next |
| POST /attempts/:id/next | no extras | 200 MutationResult with newly issued order; previous must be shipped/skipped; after fifth main shipment activeOrder null |
| POST /attempts/:id/pause | no extras | 200 MutationResult; status paused; local draft remains client-side |
| POST /attempts/:id/abandon | {acknowledgeUnsaved:boolean} | 200 MutationResult; closes unfinished attempt; no fabricated completion |
| POST /attempts/:id/complete | no extras | 200 MutationResult + AttemptResult; five shipped main slots required; atomic stars/unlocks |
| POST /attempts/:id/transfer | no extras | 200 MutationResult + transfer order; completed main attempt only; one optional transfer order active at a time |
| POST /attempts/:id/lease/heartbeat | Command + tabId | 200 {leaseEpoch,leaseExpiresAt}; renews same lease, does not increment game revision |
| POST /attempts/:id/lease/takeover | {commandId,expectedRevision,tabId} | 200 Snapshot; increments leaseEpoch and revision; old epoch invalid |
| PATCH /profile/settings | {commandId,profileRevision,settings:{sound,reducedMotion,pressure,textScale}} | 200 profile settings/revision; allowlisted values only |

Transfer clarification: reject starting a transfer while another active/paused attempt exists for this profile; block starting another attempt while a transfer order is active. Reacquire a writer lease on the completed attempt before transfer edits. Main attempt stays completed; transfer order is a separate optional role on it. responses/hints/next accept a completed attempt only for its active transfer order. An accepted transfer response atomically sets transferStar=true and recomputes LevelBest; it never changes main shippedSlots, main accuracy or main efficiency. Failed transfer can be retried indefinitely; skip/abandon-transfer clears the optional order without erasing main result. Use POST /attempts/:id/transfer/abandon with Command/tabId, returning MutationResult. A later /transfer creates a new replacementIndex. Transfer evidence participates normally but is filtered separately in default teacher reports. Existing completed result endpoints return its current transferStar plus unchanged main snapshot metrics.

There is no direct save-progression route: successful response/complete/transfer calculates progress transactionally. An authenticated state snapshot is the progression-save acknowledgment. A queued support event can precede a response; sync sequentially and assign expectedRevision from the preceding acknowledgment before its first transmission. Once sent, freeze the complete payload and key. A definite 409 conflict requires GET reconciliation; only create a new key/rebased command after confirming the old key was not committed and that the same order is still unresolved. Never rewrite a previously transmitted payload under its old key. Do not trust client hint-use booleans. A same-tab resume after lease expiry reacquires under a transaction and increments leaseEpoch. If there was no intervening writer and the order/revision still match, reconcile and rebase unsent local work to the new epoch. If another tab took over, old drafts are never silently merged. Heartbeat uses a fresh commandId each time and retains the same game revision. An abandoned attempt cannot be completed or receive new responses.

## Concrete request/response examples

The IDs below are synthetic labels for documentation; generated runtime IDs are UUIDs.

```json
{
  "commandId": "example-command-001",
  "expectedRevision": 7,
  "leaseEpoch": 2,
  "tabId": "example-tab-A",
  "representationA": [0, 52, 0, 95, 0, 21],
  "representationB": null,
  "activeMs": 52000
}
```

For stored target 529521 and allowed [10000,100,1], validation is:

```json
{
  "schemaValid": true,
  "valueMatches": true,
  "restrictionsMet": true,
  "objectiveMet": true,
  "shipmentAccepted": true,
  "representedTotals": [529521],
  "crateCounts": [168],
  "minimumCrates": 168,
  "feedbackCode": "SHIPMENT_CORRECT",
  "feedbackParams": {},
  "misconceptionCandidates": []
}
```

The containing MutationResult has original commandId, committedAt and a revision-8 snapshot. A stale request with a new key gets 409 REVISION_CONFLICT and currentRevision. Identical retry of example-command-001 returns the original revision-8 response even if current state is newer; client then GETs latest snapshot and does not roll its state backward.

## Teacher roster and reports

All teacher routes are outside the game prefix where shown. Class ownership/membership is checked; cross-tenant object access yields 404. Student self-access never grants teacher routes.

| Method/path | Request/query | Success |
| --- | --- | --- |
| GET /teacher/classes | none | {classes:[{id,name,timezone,studentCount}]} |
| POST /teacher/classes | {commandId,name,timezone} | 201 class; authenticated teacher is owner |
| GET /teacher/classes/:id/students | cursor, limit 1..100 | {students:[{id,alias,username,enabled}],nextCursor} |
| POST /teacher/classes/:id/students | {commandId,alias,username} | 201 {student,oneTimePin}; never log/cache PIN in shared data |
| POST /teacher/students/:id/reset-pin | {commandId} | 200 {oneTimePin}; invalidate prior sessions |
| PATCH /teacher/students/:id/access | {commandId,enabled} | 200 student access; revocation immediate |
| PATCH /teacher/classes/:id/access | {commandId,enabled} | 200 class access; disable all student game writes |
| PATCH /teacher/classes/:id/archive | {commandId} | 200 {id,enabled:false,archivedAt}; permanently blocks new student activity in V1, preserves teacher reports |
| POST /teacher/students/:id/level-access | {commandId,levelId,enabled,reasonCode} | 200 override; audit, no fabricated mastery/certification |
| GET /teacher/classes/:id/games/place-value-factory/report | from,to ISO date; cursor; limit≤100; includeTransfer=false | class report described below |
| GET /teacher/students/:id/games/place-value-factory/report | same date filters | individual report and SkillSummary[] |
| GET /teacher/orders/:id/evidence | none | exact stored order, first/final responses, supports, candidates or evidenceUnavailable |

Roster/teacher mutations are idempotent by actor+commandId; they use resource row locking instead of game leases. PIN-reset receipt is access-protected and short-lived (5 minutes); after expiry a retry returns RESET_COMPLETED_PIN_NOT_REDISPLAYABLE rather than resetting again. An explicit new reset command creates a new PIN. Teacher provisioning itself remains platform/operational responsibility.

ClassReport shape: {classId,timezone,from,to,asOf,students:[{studentId,alias,currentLevelId,achievedTier,submittedN,firstObjectiveCorrectN,firstValueCorrectN,eventuallyCorrectN,correctionSuccessN,firstWrongN,primaryPracticeSkillId,lastActivityAt,skills:SkillSummary[]}],nextCursor}. Return counts; frontend computes displayed fractions consistently. IndividualReport adds completedLevelIds, misconceptionCounts with unique order denominators, supportCounts, representativeOrderIds and per-skill last5/previous5 trend when n≥10. Date windows are class-local start inclusive/end exclusive, converted server-side to UTC; default last 7 days including today. Empty counts remain explicit zeros with null percentage.

## Typed errors and limits

```json
{
  "error": {
    "code": "REVISION_CONFLICT",
    "message": "Progress changed. Reloading your saved work.",
    "requestId": "example-request",
    "retryable": false,
    "currentRevision": 9
  }
}
```

Codes include INVALID_CREDENTIALS, SESSION_EXPIRED, ACCESS_DISABLED, NOT_FOUND, INVALID_INPUT, CONFIG_INVALID, LEVEL_LOCKED, NOT_COMPLETE, ORDER_NOT_ACTIVE, REVISION_CONFLICT, LEASE_LOST, IDEMPOTENCY_CONFLICT, TRY_LATER and SAVE_UNAVAILABLE. Do not expose SQL, stack traces or another student's identifiers. Body limit baseline 32KB for game commands. Bounded arrays and lengths; no arbitrary nested client configuration. Mathematical errors use Validation under HTTP 200, not this transport error envelope.

## Contract acceptance

Schema and golden tests for every route; first wrong and corrected response remain separate; unauthorized IDs return no data; duplicate start/complete/transfer yields no extra evidence or stars; hint ordering survives reconnect; stale lease rejected; new config does not mutate existing order; teacher count queries match response history. Version changes require AGENTS.md contract workflow and a migration plan.

## RC-07 additive integrity metadata (local checkpoint)

New issued order records carry `attemptId`, `slotIndex`, `replacementIndex`, `role`, `configVersion`, `engineVersion`, `forbidden`, and `skillIds`. Historical v1-local records may omit these fields and remain interpreted from their stored mathematical spec; never regenerate a historical order. Stored `seed` is server-only and must be removed from public snapshots. Witnesses are validated at issuance and never published as order answers.

Persistent certifications identify completed stage gates (`stage-1` through `stage-6`), independently of the displayed `achievedTier`. See RC07-CERT in DECISIONS.md. Stage 6 is the only Factory Master award; teacher overrides open an explicit level without completing prerequisites or earning a certificate.

Report details add nullable accuracy fractions, `evidenceLabel`, `pendingN`, `supportCounts`, `misconceptionCounts`, `trends`, `representativeOrderIds`, and exact first/final response history. Class and individual reports use the same reconstruction; no submitted orders means null fractions and “No evidence”. `includeTransfer=true` includes optional transfer in the requested report; default excludes it. Date-only `from`/`to` use class-local midnight with an exclusive end. Current skill statuses remain based on full committed learning history; trend and response counts use the selected report window. Candidate flags are deterministic observations, not diagnoses.

Current HTTP shape is additive to v1.0: class rows and the individual report include `certifications`, `firstObjectiveAccuracy`, `firstValueAccuracy`, `eventualAccuracy`, `correctionAccuracy`, `pendingN`, `supportCounts`, `misconceptionCounts`, `trends`, `representativeOrderIds`, and `evidence[]`. Each evidence row carries the stored order target and first/final response records, including original crate vectors and validation flags. Date filters are optional and default to the last seven class-local days; `includeTransfer` accepts only `true` or `false`. Student access to teacher reports is denied, and a teacher outside the class receives 404. Migration 008 stores practice schedules and override integrity without rewriting historical order specs.

## V1 operations addition

`GET /teacher/classes` includes nullable `archivedAt`. The archive mutation uses the same teacher ownership, session, origin, CSRF and idempotency requirements as other roster mutations. Archive revokes student sessions and cannot be undone by the access toggle. Migration 009 adds the timestamp and a non-PII operations audit; migration 010 adds a configured backup-expiry marker on deletion. Student deletion and retention run only through a guarded local operations command, not a browser endpoint; school policy and operational roles remain pending. Existing client response fields are unchanged.

## Reporting v2 — approved summary and paginated evidence boundary

Additive prefix `/api/v2`; v1 report/evidence endpoints and shapes remain unchanged. Authorization is mandatory on every request, including cursors; foreign/deleted classes or students return 404. Responses are private `no-store`. Common query: `from`, `to` (same class-local date semantics and inclusive/exclusive conversion as v1), `includeTransfer=false`. Unknown/repeated parameters, invalid limits and malformed/cross-context cursors return 422.

- `GET /teacher/classes/:id/games/place-value-factory/summary`: returns `{version:2,classId,timezone,from,to,asOf,students,nextCursor}`. Each student retains all v1 summary fields (counts, pending/corrected/null accuracy, support and candidate counts, skills/trends, progress/certifications, representative IDs) except `evidence`, plus `viewRevision`. Roster sorted by student ID ascending; `limit` 1..100 defaults 100, `cursor` uses the same bound paging rules. No silent roster truncation: follow `nextCursor`.
- `GET /teacher/students/:id/games/place-value-factory/summary`: returns common metadata plus the complete student summary and `viewRevision`.
- `GET /teacher/students/:id/games/place-value-factory/evidence`: returns `{version:2,studentId,timezone,from,to,asOf,viewRevision,totalN,evidence,nextCursor}`. `limit` 1..100 defaults 25. Evidence entries are the exact v1 entries, including immutable question/spec, first/final response, supports and status. Sort by first response UTC timestamp ascending, then order ID ascending; equal timestamps cannot skip or duplicate an order. Initial `viewRevision` may bind the read to a selected summary. `cursor` binds actor, resource, normalized date window, transfer inclusion, limit, revision and last key. Cursors confer no access.

Consistency: repeatable read within each PostgreSQL request; optimistic revision checking between requests. Any activity/correction/deletion affecting the selected view changes its revision. A stale requested revision/cursor returns 409 `REPORT_CHANGED` with clear refresh guidance, never a silently mixed page. A refresh reissues summaries and resets evidence to page one with the same filters. The client retains page cursors for Previous/Next, cancels obsolete requests after selection/filter changes, and labels loading/errors/empty states. All orders can be traversed at a stable revision. New activity is visible after explicit refresh; an already displayed view is labelled with its observation time. There is no cached report response; transactional response facts described below are read on each request, so deletion/restore affects the next read directly.

Performance acceptance: the approved primary workflow covers class summaries, student selection and successive evidence pages during the unchanged historical classroom load, with separate p95 <500 ms checks for profile/start/answer/retry/summary/detail. Browser usable-summary and opened-evidence timing is measured. `test:sustained` retains the original full-detail v1 benchmark and its original threshold; its actual outcome is reported separately, not relabelled as v2 success.

Session logout: `DELETE /auth/session` revokes an authenticated secure session and expires both cookie paths. It also clears the development cookie and returns 204 for an already-ended session, allowing a lost logout response to be retried. Active secure sessions still require the existing CSRF/origin checks. Saved missions, answers and preferences are unchanged.

Session compatibility: newly issued cookies use `Path=/api` to authenticate both versions; login/logout also expire the former `/api/v1` cookie. The authenticated v1 session bootstrap upgrades an existing narrower-path cookie and expires the old cookie without changing the server session. Origin/CSRF/HttpOnly/SameSite policy and server-side session validity are unchanged.

Read-model implementation update (migration 011): response-derived per-order facts are now maintained synchronously by database triggers to avoid repeating full historical aggregation for every summary. Raw responses remain authoritative. Inserts, corrections, row updates/deletes, transaction rollback and cascades update facts atomically; supports and skill evidence remain direct reads. Migration backfills existing records. An explicit administrator `SELECT pvf_rebuild_report_orders();` rebuilds the derived table from responses while blocking concurrent response writes for the maintenance transaction. No HTTP rebuild endpoint is exposed. Encrypted backup/restore parity includes this table and trigger behavior. Each derived order has a change token included in view revisions. Response updates/deletes and explicit rebuilds therefore invalidate open cursors even when counts are unchanged; teachers refresh after maintenance. There is no stale report-response cache or time-based invalidation.


## 29 September 2026 — issuance engine metadata

New orders carry `engineVersion: "xorshift32-v2"` following correction of practice random-range mapping to the existing V1 specification. The xorshift stream itself is unchanged. Stored historical orders retain their original version and full spec; replay/report/resume read those immutable records. No request/response shape, scoring policy or schema migration changes.
