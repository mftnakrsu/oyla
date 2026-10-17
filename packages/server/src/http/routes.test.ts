import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { CreatePresentationResult, PresentationDto, QuestionDto } from '@oyla/shared';
import { afterEach, describe, expect, test } from 'vitest';
import type { BuiltApp } from '../app';
import { startTestApp } from '../test-helpers';

let built: BuiltApp | undefined;

afterEach(async () => {
  await built?.close();
  built = undefined;
});

async function start(overrides = {}) {
  built = await startTestApp(overrides);
  return built.app;
}

async function createPresentation(app: BuiltApp['app'], title = 'Retro') {
  const res = await app.inject({ method: 'POST', url: '/api/presentations', payload: { title } });
  expect(res.statusCode).toBe(201);
  return res.json<CreatePresentationResult>();
}

const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

describe('meta routes', () => {
  test('health and config', async () => {
    const app = await start({ createPassword: 'x', retentionDays: 7 });
    expect((await app.inject('/api/health')).json()).toEqual({ status: 'ok' });
    expect((await app.inject('/api/config')).json()).toEqual({
      createPasswordRequired: true,
      retentionDays: 7,
    });
  });

  test('unknown API routes return a JSON 404', async () => {
    const app = await start();
    const res = await app.inject('/api/nope');
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Not found' } });
  });

  test('responses carry security headers', async () => {
    const app = await start();
    const res = await app.inject('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});

describe('presentations', () => {
  test('full editing flow', async () => {
    const app = await start();
    const { id, adminToken, joinCode } = await createPresentation(app);
    const auth = bearer(adminToken);

    const added = await app.inject({
      method: 'POST',
      url: `/api/presentations/${id}/questions`,
      headers: auth,
      payload: { type: 'multiple-choice' },
    });
    expect(added.statusCode).toBe(201);
    const question = added.json<QuestionDto>();
    expect(question.type).toBe('multiple-choice');

    const second = (
      await app.inject({
        method: 'POST',
        url: `/api/presentations/${id}/questions`,
        headers: auth,
        payload: { type: 'scale', title: 'How was it?' },
      })
    ).json<QuestionDto>();

    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/presentations/${id}/questions/${question.id}`,
      headers: auth,
      payload: { title: 'Favourite colour?' },
    });
    expect(updated.json<QuestionDto>().title).toBe('Favourite colour?');

    const reordered = await app.inject({
      method: 'PUT',
      url: `/api/presentations/${id}/questions/order`,
      headers: auth,
      payload: { ids: [second.id, question.id] },
    });
    expect(reordered.json<PresentationDto>().questions.map((q) => q.id)).toEqual([
      second.id,
      question.id,
    ]);

    const renamed = await app.inject({
      method: 'PATCH',
      url: `/api/presentations/${id}`,
      headers: auth,
      payload: { title: 'Sprint review' },
    });
    expect(renamed.json<PresentationDto>()).toMatchObject({ title: 'Sprint review', joinCode });

    const reset = await app.inject({
      method: 'DELETE',
      url: `/api/presentations/${id}/questions/${question.id}/responses`,
      headers: auth,
    });
    expect(reset.statusCode).toBe(204);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/presentations/${id}/questions/${question.id}`,
      headers: auth,
    });
    expect(removed.statusCode).toBe(204);

    const fetched = await app.inject({ url: `/api/presentations/${id}`, headers: auth });
    expect(fetched.json<PresentationDto>().questions.map((q) => q.id)).toEqual([second.id]);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/presentations/${id}`,
      headers: auth,
    });
    expect(deleted.statusCode).toBe(204);
    expect((await app.inject({ url: `/api/presentations/${id}`, headers: auth })).statusCode).toBe(
      404,
    );
  });

  test('admin routes need the right token', async () => {
    const app = await start();
    const { id } = await createPresentation(app);
    const missing = await app.inject({ url: `/api/presentations/${id}` });
    expect(missing.statusCode).toBe(401);
    expect(missing.json().error.code).toBe('UNAUTHORIZED');
    const wrong = await app.inject({ url: `/api/presentations/${id}`, headers: bearer('nope') });
    expect(wrong.statusCode).toBe(401);
    const malformed = await app.inject({
      url: `/api/presentations/${id}`,
      headers: { authorization: 'Basic abc' },
    });
    expect(malformed.statusCode).toBe(401);
  });

  test('invalid bodies are rejected with VALIDATION_FAILED', async () => {
    const app = await start();
    const empty = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: '' },
    });
    expect(empty.statusCode).toBe(400);
    expect(empty.json().error.code).toBe('VALIDATION_FAILED');
    const notJson = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      headers: { 'content-type': 'application/json' },
      payload: '{nope',
    });
    expect(notJson.statusCode).toBe(400);
    expect(notJson.json().error.code).toBe('VALIDATION_FAILED');
    const { id, adminToken } = await createPresentation(app);
    const badType = await app.inject({
      method: 'POST',
      url: `/api/presentations/${id}/questions`,
      headers: bearer(adminToken),
      payload: { type: 'quiz' },
    });
    expect(badType.statusCode).toBe(400);
  });

  test('bodies over 64 KB are refused', async () => {
    const app = await start();
    const res = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: 'x', padding: 'y'.repeat(70_000) },
    });
    expect(res.statusCode).toBe(413);
    expect(res.json().error.code).toBe('VALIDATION_FAILED');
  });

  test('a configured create password is enforced', async () => {
    const app = await start({ createPassword: 'letmein' });
    const without = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: 'x' },
    });
    expect(without.statusCode).toBe(401);
    expect(without.json().error.code).toBe('CREATE_PASSWORD_REQUIRED');
    const wrong = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: 'x', password: 'guess' },
    });
    expect(wrong.statusCode).toBe(403);
    const right = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: 'x', password: 'letmein' },
    });
    expect(right.statusCode).toBe(201);
  });

  test('creating presentations is rate limited', async () => {
    const app = await start({ rateLimits: { apiPerMinute: 600, createPerHour: 2 } });
    await createPresentation(app);
    await createPresentation(app);
    const third = await app.inject({
      method: 'POST',
      url: '/api/presentations',
      payload: { title: 'x' },
    });
    expect(third.statusCode).toBe(429);
    expect(third.json().error.code).toBe('RATE_LIMITED');
  });
});

describe('behind a reverse proxy', () => {
  test('rate limits use the address the trusted proxy appended, not the spoofable first entry', async () => {
    const app = await start({ trustProxy: 1, rateLimits: { apiPerMinute: 600, createPerHour: 1 } });
    const create = (forwardedFor: string) =>
      app.inject({
        method: 'POST',
        url: '/api/presentations',
        headers: { 'x-forwarded-for': forwardedFor },
        payload: { title: 'x' },
      });
    expect((await create('1.1.1.1, 203.0.113.7')).statusCode).toBe(201);
    expect((await create('9.9.9.9, 203.0.113.7')).statusCode).toBe(429);
    expect((await create('198.51.100.4')).statusCode).toBe(201);
  });
});

describe('web app', () => {
  function webDist() {
    const dir = mkdtempSync(join(tmpdir(), 'oyla-web-'));
    mkdirSync(join(dir, 'assets'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>Oyla</title>');
    writeFileSync(join(dir, 'assets', 'app-abc123.js'), 'console.log(1)');
    return dir;
  }

  test('serves files and falls back to index.html for app routes', async () => {
    const app = await start({ webDistPath: webDist() });
    const home = await app.inject('/');
    expect(home.statusCode).toBe(200);
    expect(home.body).toContain('<title>Oyla</title>');
    expect(home.headers['cache-control']).toBe('no-cache');
    const deep = await app.inject('/join/123456');
    expect(deep.statusCode).toBe(200);
    expect(deep.body).toContain('<title>Oyla</title>');
    const asset = await app.inject('/assets/app-abc123.js');
    expect(asset.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    const api = await app.inject('/api/missing');
    expect(api.statusCode).toBe(404);
    expect(api.headers['content-type']).toContain('application/json');
  });

  test('static files are not rate limited', async () => {
    const app = await start({
      webDistPath: webDist(),
      rateLimits: { apiPerMinute: 1, createPerHour: 1 },
    });
    for (let i = 0; i < 5; i += 1) {
      expect((await app.inject('/assets/app-abc123.js')).statusCode).toBe(200);
    }
  });
});
