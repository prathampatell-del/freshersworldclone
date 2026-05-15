import path from 'path';
import fs from 'fs';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import {
  closeDatabase, createCompany, createJob, createUser, login,
  resetDatabase, setUserResume,
} from './helpers';
import { RESUMES_DIR } from '../utils/uploads';

const app = createApp();

beforeAll(async () => resetDatabase());
beforeEach(async () => resetDatabase());
afterAll(async () => closeDatabase());

function tmpFile(name: string, contents: Buffer): string {
  const filePath = path.join(RESUMES_DIR, `__tmp__${name}`);
  fs.writeFileSync(filePath, contents);
  return filePath;
}

describe('resume upload', () => {
  it('rejects apply when the seeker has no resume', async () => {
    const employer = await createUser({ role: 'employer', email: 'emp@x.com' });
    const companyId = await createCompany(employer.id);
    const jobId = await createJob(companyId);

    const seeker = await createUser({ role: 'jobseeker', email: 's@x.com' });
    await setUserResume(seeker.id, null);
    const { cookie } = await login(app, seeker.email, seeker.password);

    const res = await request(app).post(`/api/jobs/${jobId}/apply`).set('Cookie', cookie);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/resume/i);
  });

  it('rejects non-PDF/DOC uploads', async () => {
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);

    const filePath = tmpFile('not-a-resume.txt', Buffer.from('hello'));
    try {
      const res = await request(app)
        .post('/api/users/me/resume')
        .set('Cookie', cookie)
        .attach('resume', filePath);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/PDF|DOC/i);
    } finally {
      fs.unlinkSync(filePath);
    }
  });

  it('accepts a PDF upload and updates the user record', async () => {
    const seeker = await createUser({ role: 'jobseeker' });
    await setUserResume(seeker.id, null);
    const { cookie } = await login(app, seeker.email, seeker.password);

    // Minimal valid PDF header is enough for multer's mimetype check.
    const fakePdf = tmpFile('cv.pdf', Buffer.from('%PDF-1.4\n%EOF', 'utf-8'));
    try {
      const res = await request(app)
        .post('/api/users/me/resume')
        .set('Cookie', cookie)
        .attach('resume', fakePdf, { contentType: 'application/pdf', filename: 'cv.pdf' });

      expect(res.status).toBe(200);
      expect(res.body.resume_url).toMatch(/^\/uploads\/resumes\//);

      const me = await request(app).get('/api/users/me').set('Cookie', cookie);
      expect(me.body.resume_url).toBe(res.body.resume_url);

      // Cleanup the upload that multer wrote
      const uploaded = path.join(RESUMES_DIR, path.basename(res.body.resume_url));
      if (fs.existsSync(uploaded)) fs.unlinkSync(uploaded);
    } finally {
      if (fs.existsSync(fakePdf)) fs.unlinkSync(fakePdf);
    }
  });

  it('clears the resume on DELETE', async () => {
    const seeker = await createUser({ role: 'jobseeker' });
    const { cookie } = await login(app, seeker.email, seeker.password);

    const res = await request(app).delete('/api/users/me/resume').set('Cookie', cookie);
    expect(res.status).toBe(200);

    const me = await request(app).get('/api/users/me').set('Cookie', cookie);
    expect(me.body.resume_url).toBeNull();
  });

  it('requires authentication on the upload endpoint', async () => {
    const res = await request(app).post('/api/users/me/resume');
    expect(res.status).toBe(401);
  });
});
