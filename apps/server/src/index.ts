import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateLevelOrder, validateRepresentation } from '../../../packages/game-engine/src/index.js';
import { LEVELS, levelById } from '../../../packages/config/src/index.js';

const port = Number(process.env.PORT ?? 3101);
const dataPath = resolve(process.cwd(), 'db/local-development.json');
type Attempt = { id: string; studentId: string; levelId: string; seed: number; slot: number; activeOrder?: ReturnType<typeof generateLevelOrder>; responses: any[]; completed: boolean; createdAt: string };
type Store = { attempts: Attempt[] };
const students = [{ id: 'student-ava', username: 'ava', pin: '123456', alias: 'Ava', classCode: 'FACTORY5' }];
const teachers = [{ id: 'teacher-dev', username: 'teacher', password: 'factory-demo' }];

async function store(): Promise<Store> { try { return JSON.parse(await readFile(dataPath, 'utf8')); } catch { return { attempts: [] }; } }
async function save(value: Store) { await mkdir(dirname(dataPath), { recursive: true }); await writeFile(dataPath, JSON.stringify(value, null, 2)); }
function send(response: ServerResponse, status: number, body?: unknown, origin?: string) {
  // The development adapter uses a header token rather than cookies. A permissive
  // local CORS policy keeps loopback host aliases from breaking test accounts.
  response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type,x-session' });
  response.end(body === undefined ? undefined : JSON.stringify(body));
}
async function json(request: IncomingMessage): Promise<any> { let body = ''; for await (const chunk of request) body += chunk; return body ? JSON.parse(body) : {}; }
function principal(request: IncomingMessage) { const value = request.headers['x-session']; if (value === 'student-ava') return { id: 'student-ava', role: 'student' as const }; if (value === 'teacher-dev') return { id: 'teacher-dev', role: 'teacher' as const }; return null; }
function mapFor(attempts: Attempt[]) {
  const completed = new Set(attempts.filter((attempt) => attempt.completed).map((attempt) => attempt.levelId));
  const highest = Math.max(0, ...LEVELS.filter((level) => completed.has(level.id)).map((level) => level.ordinal));
  const zones = [...new Set(LEVELS.map((level) => level.zone))].map((zone) => ({ id: zone.toLowerCase(), name: zone, levels: LEVELS.filter((level) => level.zone === zone).map((level) => ({ id: level.id, title: level.title, stage: level.stage, status: completed.has(level.id) ? 'completed' : level.ordinal <= highest + 1 ? 'unlocked' : 'locked', stars: completed.has(level.id) ? 2 : 0, prerequisiteSummary: level.ordinal <= highest + 1 ? 'Ready to practice' : `Complete Level ${level.ordinal - 1} first` })) }));
  return { configVersion: 'v1-local', zones, highestUnlockedLevelId: `level-${Math.min(30, highest + 1)}` };
}

const server = createServer(async (request, response) => {
  try {
    const origin = request.headers.origin;
    if (request.method === 'OPTIONS') return send(response, 204, undefined, origin);
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/student/session') {
      const body = await json(request); const student = students.find((s) => s.classCode === String(body.classCode).trim().toUpperCase() && s.username === String(body.username).trim().toLowerCase() && s.pin === body.pin);
      return student ? send(response, 200, { principal: { id: student.id, role: 'student', classId: 'class-demo' }, csrfToken: 'local-dev' }) : send(response, 401, { error: { code: 'INVALID_CREDENTIALS', message: 'Those login details did not match.' } });
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/teacher/session') {
      const body = await json(request); const teacher = teachers.find((t) => t.username === body.username && t.password === body.password);
      return teacher ? send(response, 200, { principal: { id: teacher.id, role: 'teacher' }, csrfToken: 'local-dev' }) : send(response, 401, { error: { code: 'INVALID_CREDENTIALS', message: 'Those login details did not match.' } });
    }
    const actor = principal(request); if (!actor) return send(response, 401, { error: { code: 'SESSION_EXPIRED', message: 'Please sign in.' } });
    if (request.method === 'GET' && url.pathname === '/api/v1/games/place-value-factory/map' && actor.role === 'student') return send(response, 200, mapFor((await store()).attempts.filter((attempt) => attempt.studentId === actor.id)));
    if (request.method === 'POST' && url.pathname === '/api/v1/games/place-value-factory/attempts' && actor.role === 'student') {
      const body = await json(request); const state = await store(); let attempt = state.attempts.find((item) => item.studentId === actor.id && !item.completed);
      const requestedLevel = levelById(body.levelId ?? 'level-1'); const completed = new Set(state.attempts.filter((item) => item.studentId === actor.id && item.completed).map((item) => item.levelId)); const highest = Math.max(0, ...LEVELS.filter((level) => completed.has(level.id)).map((level) => level.ordinal));
      if (!requestedLevel || requestedLevel.ordinal > highest + 1) return send(response, 409, { error: { code: 'LEVEL_LOCKED', message: 'Complete the earlier level first.' } });
      if (!attempt) { const seed = 71 + requestedLevel.ordinal; attempt = { id: crypto.randomUUID(), studentId: actor.id, levelId: requestedLevel.id, seed, slot: 0, activeOrder: generateLevelOrder(requestedLevel.id, seed, 0, 'easy'), responses: [], completed: false, createdAt: new Date().toISOString() }; state.attempts.push(attempt); await save(state); }
      return send(response, 201, snapshot(attempt));
    }
    const match = url.pathname.match(/^\/api\/v1\/games\/place-value-factory\/attempts\/([^/]+)(?:\/orders\/([^/]+)\/responses|\/results)?$/);
    if (match && actor.role === 'student') {
      const state = await store(); const attempt = state.attempts.find((item) => item.id === match[1] && item.studentId === actor.id); if (!attempt) return send(response, 404, { error: { code: 'NOT_FOUND', message: 'Attempt not found.' } });
      if (request.method === 'GET' && url.pathname.endsWith('/results')) return attempt.completed ? send(response, 200, result(attempt)) : send(response, 409, { error: { code: 'NOT_COMPLETE' } });
      if (request.method === 'GET') return send(response, 200, snapshot(attempt));
      if (request.method === 'POST' && match[2]) {
        const body = await json(request); const order = orderFor(attempt); if (order.id !== match[2] || attempt.completed) return send(response, 409, { error: { code: 'ORDER_NOT_ACTIVE' } });
        const validation = validateRepresentation(order, body.representationA, body.representationB ?? null); attempt.responses.push({ order, representationA: body.representationA, validation, at: new Date().toISOString() });
        if (validation.shipmentAccepted) { attempt.slot += 1; if (attempt.slot === 5) attempt.completed = true; else attempt.activeOrder = generateLevelOrder(attempt.levelId, attempt.seed, attempt.slot, nextDifficulty(attempt)); }
        await save(state); return send(response, 200, { validation, snapshot: snapshot(attempt), result: attempt.completed ? result(attempt) : null });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/teacher/classes/class-demo/games/place-value-factory/report' && actor.role === 'teacher') {
      const state = await store(); const attempts = state.attempts.filter((item) => item.studentId === 'student-ava'); const responses = attempts.flatMap((item) => item.responses as any[]);
      return send(response, 200, { classId: 'class-demo', students: [{ studentId: 'student-ava', alias: 'Ava', currentLevelId: attempts.some((item) => item.completed) ? 'level-2' : 'level-1', submittedN: responses.length, eventuallyCorrectN: responses.filter((item) => item.validation.shipmentAccepted).length, evidence: responses.map((item) => ({ target: item.order.target, vector: item.representationA, accepted: item.validation.shipmentAccepted })) }] });
    }
    send(response, 404, { error: { code: 'NOT_FOUND', message: 'Route not found.' } });
  } catch { send(response, 422, { error: { code: 'INVALID_INPUT', message: 'Request could not be processed.' } }, request.headers.origin); }
});

function nextDifficulty(attempt: Attempt): 'easy' | 'medium' | 'hard' {
  const defaults: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard', 'easy', 'medium'];
  const recent = attempt.responses.slice(-2);
  return recent.length === 2 && recent.every((response) => !response.validation.shipmentAccepted) ? 'easy' : defaults[attempt.slot];
}
function orderFor(attempt: Attempt) { return attempt.activeOrder ?? generateLevelOrder(attempt.levelId, attempt.seed, attempt.slot, nextDifficulty(attempt)); }
function snapshot(attempt: Attempt) { return { attemptId: attempt.id, status: attempt.completed ? 'completed' : 'active', shippedSlots: attempt.slot, activeOrder: attempt.completed ? null : orderFor(attempt) }; }
function result(attempt: Attempt) { return { attemptId: attempt.id, completed: true, shipped: 5, eventuallyCorrect: 5, firstObjectiveCorrect: attempt.responses.filter((item: any) => item.validation.shipmentAccepted).length, efficiency: 100, mainStars: 2, evidence: attempt.responses }; }
server.listen(port, () => console.log(`Place Value Factory API listening on http://localhost:${port}`));
