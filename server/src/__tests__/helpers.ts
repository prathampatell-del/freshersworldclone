import bcrypt from 'bcryptjs';
import request from 'supertest';
import type { Express } from 'express';
import { pool, initSchema } from '../db/schema';

export async function resetDatabase() {
  await initSchema();
  // Order matters because of FKs.
  await pool.query(`
    TRUNCATE TABLE
      company_reviews, bookmarks, job_alerts, applications,
      jobs, companies, courses, users
    RESTART IDENTITY CASCADE
  `);
}

export async function closeDatabase() {
  await pool.end();
}

export interface SeedUser {
  id: number;
  email: string;
  role: 'jobseeker' | 'employer' | 'admin';
  password: string;
  name: string;
}

export async function createUser(overrides: Partial<SeedUser> = {}): Promise<SeedUser> {
  const password = overrides.password ?? 'Password123';
  const email = overrides.email ?? `user${Math.random().toString(36).slice(2, 8)}@test.dev`;
  const role = overrides.role ?? 'jobseeker';
  const name = overrides.name ?? 'Test User';
  const hash = await bcrypt.hash(password, 4);
  // Seed a fake resume URL for jobseekers so apply-flow tests don't need to
  // wire up an actual file upload. Tests that exercise the missing-resume
  // path can override this via setUserResume.
  const resumeUrl = role === 'jobseeker' ? '/uploads/resumes/test-resume.pdf' : null;
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, resume_url)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [email, hash, role, name, resumeUrl]
  );
  return { id: rows[0].id, email, password, role, name };
}

export async function setUserResume(userId: number, resumeUrl: string | null) {
  await pool.query('UPDATE users SET resume_url = $1 WHERE id = $2', [resumeUrl, userId]);
}

export async function createCompany(userId: number, name = 'Acme Corp'): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO companies (user_id, name, industry, location, is_verified)
     VALUES ($1, $2, 'IT', 'Bangalore', TRUE) RETURNING id`,
    [userId, name]
  );
  return rows[0].id;
}

export async function createJob(companyId: number, overrides: Record<string, unknown> = {}): Promise<number> {
  const job = {
    title: 'Software Engineer',
    description: 'A solid entry-level role.',
    type: 'fulltime',
    category: 'IT',
    location: 'Bangalore',
    salary_min: 400000,
    salary_max: 600000,
    experience_min: 0,
    experience_max: 1,
    qualifications: 'B.Tech',
    skills_required: '["Java"]',
    openings: 1,
    deadline: null,
    is_active: true,
    is_featured: false,
    ...overrides,
  };
  const { rows } = await pool.query(
    `INSERT INTO jobs (company_id, title, description, type, category, location, salary_min, salary_max,
       experience_min, experience_max, qualifications, skills_required, openings, deadline, is_active, is_featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
    [
      companyId, job.title, job.description, job.type, job.category, job.location, job.salary_min,
      job.salary_max, job.experience_min, job.experience_max, job.qualifications, job.skills_required,
      job.openings, job.deadline, job.is_active, job.is_featured,
    ]
  );
  return rows[0].id;
}

export async function login(app: Express, email: string, password: string) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`);
  const cookie = res.headers['set-cookie'];
  return { token: res.body.token as string, cookie: Array.isArray(cookie) ? cookie : [cookie as string] };
}
