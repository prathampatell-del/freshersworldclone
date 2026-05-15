import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, resetDatabase } from './helpers';

const app = createApp();

beforeAll(async () => resetDatabase());
afterAll(async () => closeDatabase());

describe('miscellaneous endpoints', () => {
  it('serves /api/health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 JSON for unknown /api/* paths', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
