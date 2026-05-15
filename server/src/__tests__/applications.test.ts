import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, createCompany, createJob, createUser, login, resetDatabase } from './helpers';
import { pool } from '../db/schema';

const app = createApp();

beforeAll(async () => resetDatabase());
beforeEach(async () => resetDatabase());
afterAll(async () => closeDatabase());

async function seedApplication(): Promise<{
  employer: Awaited<ReturnType<typeof createUser>>;
  seeker: Awaited<ReturnType<typeof createUser>>;
  jobId: number;
  applicationId: number;
}> {
  const employer = await createUser({ role: 'employer', email: `emp${Date.now()}@x.com` });
  const companyId = await createCompany(employer.id);
  const jobId = await createJob(companyId);
  const seeker = await createUser({ role: 'jobseeker', email: `s${Date.now()}@x.com` });
  const { rows } = await pool.query(
    `INSERT INTO applications (job_id, user_id, cover_letter) VALUES ($1,$2,'hi') RETURNING id`,
    [jobId, seeker.id]
  );
  return { employer, seeker, jobId, applicationId: rows[0].id };
}

describe('GET /api/applications (jobseeker view)', () => {
  it('returns the seeker’s applications', async () => {
    const { seeker } = await seedApplication();
    const { cookie } = await login(app, seeker.email, seeker.password);
    const res = await request(app).get('/api/applications').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications).toHaveLength(1);
    expect(res.body.applications[0].job_title).toBe('Software Engineer');
  });

  it('filters by status and validates the value', async () => {
    const { seeker } = await seedApplication();
    const { cookie } = await login(app, seeker.email, seeker.password);
    const bad = await request(app).get('/api/applications?status=alien').set('Cookie', cookie);
    expect(bad.status).toBe(400);
  });
});

describe('GET /api/applications (employer view)', () => {
  it('lists applications received against an employer’s jobs only', async () => {
    const { employer, jobId } = await seedApplication();
    const otherEmp = await createUser({ role: 'employer', email: 'other-emp@x.com' });
    const otherCompany = await createCompany(otherEmp.id, 'Other Co');
    const otherJob = await createJob(otherCompany);
    const otherSeeker = await createUser({ role: 'jobseeker', email: 'other-seeker@x.com' });
    await pool.query(`INSERT INTO applications (job_id, user_id) VALUES ($1, $2)`, [otherJob, otherSeeker.id]);

    const { cookie } = await login(app, employer.email, employer.password);
    const res = await request(app).get('/api/applications').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.applications.every((a: { job_id: number }) => a.job_id === jobId)).toBe(true);
    expect(res.body.applications).toHaveLength(1);
  });
});

describe('PUT /api/applications/:id/status', () => {
  it('lets the owning employer update status', async () => {
    const { employer, applicationId } = await seedApplication();
    const { cookie } = await login(app, employer.email, employer.password);
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Cookie', cookie)
      .send({ status: 'shortlisted' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('shortlisted');
  });

  it('blocks a foreign employer from updating an application that is not theirs', async () => {
    const { applicationId } = await seedApplication();
    const sneaky = await createUser({ role: 'employer', email: 'sneaky@x.com' });
    await createCompany(sneaky.id, 'Sneaky Co');
    const { cookie } = await login(app, sneaky.email, sneaky.password);
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Cookie', cookie)
      .send({ status: 'rejected' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/do not own/i);
  });

  it('rejects invalid status values', async () => {
    const { employer, applicationId } = await seedApplication();
    const { cookie } = await login(app, employer.email, employer.password);
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set('Cookie', cookie)
      .send({ status: 'banana' });
    expect(res.status).toBe(400);
  });

  it('returns 404 for missing application', async () => {
    const employer = await createUser({ role: 'employer' });
    await createCompany(employer.id);
    const { cookie } = await login(app, employer.email, employer.password);
    const res = await request(app)
      .put('/api/applications/9999/status')
      .set('Cookie', cookie)
      .send({ status: 'pending' });
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .put('/api/applications/1/status')
      .send({ status: 'pending' });
    expect(res.status).toBe(401);
  });
});
