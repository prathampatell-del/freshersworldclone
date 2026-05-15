import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { closeDatabase, createCompany, createJob, createUser, login, resetDatabase } from './helpers';

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

describe('GET /api/jobs', () => {
  it('returns paginated jobs with company info', async () => {
    const employer = await createUser({ role: 'employer' });
    const companyId = await createCompany(employer.id);
    for (let i = 0; i < 3; i++) await createJob(companyId, { title: `Role ${i}` });

    const res = await request(app).get('/api/jobs?limit=2');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.jobs).toHaveLength(2);
    expect(res.body.pages).toBe(2);
    expect(res.body.jobs[0].company_name).toBe('Acme Corp');
    expect(res.body.jobs[0].skills_required).toEqual(['Java']);
  });

  it('filters by job type and rejects unknown types', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    await createJob(companyId, { title: 'A', type: 'fulltime' });
    await createJob(companyId, { title: 'B', type: 'internship' });

    const ok = await request(app).get('/api/jobs?type=internship');
    expect(ok.status).toBe(200);
    expect(ok.body.total).toBe(1);
    expect(ok.body.jobs[0].title).toBe('B');

    const bad = await request(app).get('/api/jobs?type=alien');
    expect(bad.status).toBe(400);
  });

  it('caps pagination limit', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    await createJob(companyId);
    const res = await request(app).get('/api/jobs?limit=9999');
    expect(res.status).toBe(200);
    // Pagination clamps to 50 max — should not bubble an absurd value.
    expect(res.body.jobs.length).toBeLessThanOrEqual(50);
  });

  it('falls back to defaults on garbage pagination params', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    await createJob(companyId);
    const res = await request(app).get('/api/jobs?page=abc&limit=xyz');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(1);
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns the job and similar jobs', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);
    await createJob(companyId, { title: 'Similar' });

    const res = await request(app).get(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    expect(res.body.job.id).toBe(jobId);
    expect(Array.isArray(res.body.similar)).toBe(true);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/jobs/9999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid id', async () => {
    const res = await request(app).get('/api/jobs/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/jobs', () => {
  it('creates a job for an employer who has a company', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const { cookie } = await login(app, emp.email, emp.password);

    const res = await request(app)
      .post('/api/jobs')
      .set('Cookie', cookie)
      .send({
        title: 'Frontend Engineer',
        description: 'React role',
        category: 'IT',
        location: 'Pune',
        skills_required: ['React', 'TypeScript'],
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Frontend Engineer');
    expect(typeof res.body.id).toBe('number');

    // The job is associated with the employer's company.
    expect(companyId).toBeGreaterThan(0);
  });

  it('rejects employer without a company profile', async () => {
    const emp = await createUser({ role: 'employer' });
    const { cookie } = await login(app, emp.email, emp.password);
    const res = await request(app)
      .post('/api/jobs')
      .set('Cookie', cookie)
      .send({ title: 'X', description: 'Y', category: 'IT', location: 'NA' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/company profile/i);
  });

  it('rejects jobseekers', async () => {
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);
    const res = await request(app).post('/api/jobs').set('Cookie', cookie).send({});
    expect(res.status).toBe(403);
  });

  it('requires the core fields', async () => {
    const emp = await createUser({ role: 'employer' });
    await createCompany(emp.id);
    const { cookie } = await login(app, emp.email, emp.password);
    const res = await request(app).post('/api/jobs').set('Cookie', cookie).send({ title: 'Only title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/description|category|location/i);
  });
});

describe('PUT /api/jobs/:id', () => {
  it('lets the owning employer update their job', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);
    const { cookie } = await login(app, emp.email, emp.password);

    const res = await request(app).put(`/api/jobs/${jobId}`).set('Cookie', cookie).send({ title: 'Updated' });
    expect(res.status).toBe(200);

    const detail = await request(app).get(`/api/jobs/${jobId}`);
    expect(detail.body.job.title).toBe('Updated');
  });

  it('prevents an employer from updating someone else’s job', async () => {
    const ownerEmp = await createUser({ role: 'employer', email: 'owner@a.com' });
    const ownerCompany = await createCompany(ownerEmp.id);
    const jobId = await createJob(ownerCompany);

    const otherEmp = await createUser({ role: 'employer', email: 'other@a.com' });
    await createCompany(otherEmp.id, 'Other Co');
    const { cookie } = await login(app, otherEmp.email, otherEmp.password);

    const res = await request(app).put(`/api/jobs/${jobId}`).set('Cookie', cookie).send({ title: 'Hijack' });
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not owned|not found/i);
  });
});

describe('DELETE /api/jobs/:id', () => {
  it('prevents employers from deactivating jobs they do not own', async () => {
    const owner = await createUser({ role: 'employer', email: 'owner@x.com' });
    const ownerCompany = await createCompany(owner.id);
    const jobId = await createJob(ownerCompany);

    const other = await createUser({ role: 'employer', email: 'sneaky@x.com' });
    await createCompany(other.id, 'Sneaky Co');
    const { cookie } = await login(app, other.email, other.password);

    const res = await request(app).delete(`/api/jobs/${jobId}`).set('Cookie', cookie);
    expect(res.status).toBe(404);

    // The job should still be active.
    const detail = await request(app).get(`/api/jobs/${jobId}`);
    expect(detail.body.job.is_active).toBe(true);
  });
});

describe('POST /api/jobs/:id/apply', () => {
  it('records an application for a jobseeker', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);

    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);

    const res = await request(app)
      .post(`/api/jobs/${jobId}/apply`)
      .set('Cookie', cookie)
      .send({ cover_letter: 'Pick me!' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  it('rejects duplicate applications', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);

    await request(app).post(`/api/jobs/${jobId}/apply`).set('Cookie', cookie);
    const dup = await request(app).post(`/api/jobs/${jobId}/apply`).set('Cookie', cookie);
    expect(dup.status).toBe(409);
  });

  it('blocks employers from applying', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);
    const { cookie } = await login(app, emp.email, emp.password);
    const res = await request(app).post(`/api/jobs/${jobId}/apply`).set('Cookie', cookie);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/jobs/:id/bookmark', () => {
  it('toggles a bookmark on/off', async () => {
    const emp = await createUser({ role: 'employer' });
    const companyId = await createCompany(emp.id);
    const jobId = await createJob(companyId);
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);

    const first = await request(app).post(`/api/jobs/${jobId}/bookmark`).set('Cookie', cookie);
    expect(first.status).toBe(200);
    expect(first.body.bookmarked).toBe(true);

    const second = await request(app).post(`/api/jobs/${jobId}/bookmark`).set('Cookie', cookie);
    expect(second.body.bookmarked).toBe(false);
  });

  it('returns 404 when bookmarking a non-existent job', async () => {
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);
    const res = await request(app).post('/api/jobs/9999/bookmark').set('Cookie', cookie);
    expect(res.status).toBe(404);
  });
});
