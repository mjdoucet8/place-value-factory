import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApiServer } from '../../apps/server/src/index.js';

const studentHeaders = { 'content-type': 'application/json', 'x-session': 'student-ava' };
let server: ReturnType<typeof createApiServer>;
let baseUrl = '';
let dataDirectory = '';

beforeEach(async () => {
  dataDirectory = await mkdtemp(join(tmpdir(), 'place-value-factory-'));
  server = createApiServer(join(dataDirectory, 'development.json'));
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
});

afterEach(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await rm(dataDirectory, { recursive: true, force: true });
});

async function request(path: string, body?: unknown, headers: Record<string, string> = studentHeaders) {
  const response = await fetch(`${baseUrl}${path}`, { method: body === undefined ? 'GET' : 'POST', headers, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: response.status, body: await response.json() as any };
}

function canonical(target: number) {
  const values = [100000, 10000, 1000, 100, 10, 1];
  let remaining = target;
  return values.map((value) => { const quantity = Math.floor(remaining / value); remaining %= value; return quantity; });
}

describe('fictional-data command safety', () => {
  it('replays the original response for a duplicate command without adding a second response', async () => {
    const start = await request('/games/place-value-factory/attempts', { commandId: 'start-1', profileRevision: 0, tabId: 'tab-a', levelId: 'level-1' }, { ...studentHeaders, 'idempotency-key': 'start-1' });
    expect(start.status).toBe(201);
    const order = start.body.activeOrder;
    const command = { commandId: 'response-1', expectedRevision: start.body.revision, leaseEpoch: start.body.leaseEpoch, tabId: 'tab-a', representationA: canonical(order.target), representationB: null, activeMs: 100 };
    const headers = { ...studentHeaders, 'idempotency-key': 'response-1' };
    const first = await request(`/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`, command, headers);
    const replay = await request(`/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`, command, headers);
    expect(first.status).toBe(200);
    expect(replay).toEqual(first);
    const current = await request(`/games/place-value-factory/attempts/${start.body.attemptId}`);
    expect(current.body.shippedSlots).toBe(1);
    expect(current.body.revision).toBe(1);
  });

  it('rejects altered duplicate payloads, stale revisions, and a second active writer', async () => {
    const start = await request('/games/place-value-factory/attempts', { commandId: 'start-2', profileRevision: 0, tabId: 'tab-a', levelId: 'level-1' }, { ...studentHeaders, 'idempotency-key': 'start-2' });
    const order = start.body.activeOrder;
    const responsePath = `/games/place-value-factory/attempts/${start.body.attemptId}/orders/${order.id}/responses`;
    const command = { commandId: 'response-2', expectedRevision: 0, leaseEpoch: 1, tabId: 'tab-a', representationA: canonical(order.target), representationB: null };
    expect((await request(responsePath, command, { ...studentHeaders, 'idempotency-key': 'response-2' })).status).toBe(200);
    expect((await request(responsePath, { ...command, activeMs: 50 }, { ...studentHeaders, 'idempotency-key': 'response-2' })).body.error.code).toBe('IDEMPOTENCY_CONFLICT');
    expect((await request(responsePath, { ...command, commandId: 'stale-1' }, { ...studentHeaders, 'idempotency-key': 'stale-1' })).body.error.code).toBe('REVISION_CONFLICT');
    expect((await request(responsePath, { ...command, commandId: 'writer-2', expectedRevision: 1, tabId: 'tab-b' }, { ...studentHeaders, 'idempotency-key': 'writer-2' })).body.error.code).toBe('LEASE_LOST');
  });

  it('takes over a lease explicitly and rejects the old epoch', async () => {
    const start = await request('/games/place-value-factory/attempts', { commandId: 'start-3', profileRevision: 0, tabId: 'tab-a', levelId: 'level-1' }, { ...studentHeaders, 'idempotency-key': 'start-3' });
    const takeover = await request(`/games/place-value-factory/attempts/${start.body.attemptId}/lease/takeover`, { commandId: 'takeover-1', expectedRevision: 0, leaseEpoch: 1, tabId: 'tab-b' }, { ...studentHeaders, 'idempotency-key': 'takeover-1' });
    expect(takeover.body.snapshot).toMatchObject({ writerTabId: 'tab-b', leaseEpoch: 2, revision: 1 });
    const oldWriter = await request(`/games/place-value-factory/attempts/${start.body.attemptId}/orders/${start.body.activeOrder.id}/responses`, { commandId: 'old-writer', expectedRevision: 0, leaseEpoch: 1, tabId: 'tab-a', representationA: canonical(start.body.activeOrder.target), representationB: null }, { ...studentHeaders, 'idempotency-key': 'old-writer' });
    expect(oldWriter.body.error.code).toBe('LEASE_LOST');
  });
});
