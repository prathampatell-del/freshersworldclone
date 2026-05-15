import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, createUser, resetDatabase } from './helpers';

const app = createApp();

beforeAll(async () => {
  await resetDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/auth/register', () => {
  it('creates a jobseeker account and sets a cookie', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'new@example.com',
      password: 'secret1234',
      name: 'New User',
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ email: 'new@example.com', role: 'jobseeker' });
    expect(res.body.token).toBeTypeOf('string');
    const cookies = res.headers['set-cookie'];
    expect(cookies?.[0]).toMatch(/token=/);
    expect(cookies?.[0]).toMatch(/HttpOnly/);
  });

  it('lowercases the email so duplicates are caught', async () => {
    await request(app).post('/api/auth/register').send({ email: 'Dup@ex.com', password: 'secret123', name: 'A' });
    const res = await request(app).post('/api/auth/register').send({ email: 'dup@EX.com', password: 'secret123', name: 'B' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered/i);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'secret123', name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.co', password: '12', name: 'X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects invalid roles', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'x@y.com', password: 'secret123', name: 'X', role: 'superadmin',
    });
    expect(res.status).toBe(400);
  });

  it('reports missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const user = await createUser({ email: 'login@example.com', password: 'mypassword' });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('returns 401 on wrong password without leaking which field is wrong', async () => {
    const user = await createUser({ email: 'wrongpw@example.com' });
    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 for unknown email with the same message', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user when authenticated', async () => {
    const user = await createUser({ email: 'me@example.com' });
    const loginRes = await request(app).post('/api/auth/login').send({ email: user.email, password: user.password });
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    const res = await request(app).get('/api/auth/me').set('Cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
    expect(res.body.skills).toEqual([]);
    expect(res.body.education).toEqual([]);
  });

  it('rejects requests with no cookie or token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']?.[0]).toMatch(/token=;/);
  });
});
