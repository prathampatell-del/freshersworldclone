import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, badRequest, conflict, notFound } from '../utils/http';
import { parseId, parsePagination, parseOptionalInt, requireFields, safeJsonArray } from '../utils/validate';
import { ParamBuilder } from '../utils/sql';

const router = Router();

const JOB_TYPES = ['fulltime', 'internship', 'walkin', 'govt'];

const JOB_UPDATE_FIELDS = [
  'title', 'description', 'type', 'category', 'location',
  'salary_min', 'salary_max', 'experience_min', 'experience_max',
  'qualifications', 'skills_required', 'openings', 'is_active', 'deadline',
] as const;

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, location, type, category, salary_min, salary_max, experience, featured } =
    req.query as Record<string, string>;
  const { page, limit, offset } = parsePagination(req.query);

  const pb = new ParamBuilder();
  const conditions: string[] = ['j.is_active = TRUE'];

  if (q) {
    const like = `%${q}%`;
    conditions.push(`(j.title ILIKE ${pb.push(like)} OR j.description ILIKE ${pb.push(like)} OR j.category ILIKE ${pb.push(like)})`);
  }
  if (location) conditions.push(`j.location ILIKE ${pb.push(`%${location}%`)}`);
  if (type) {
    if (!JOB_TYPES.includes(type)) throw badRequest('Invalid job type');
    conditions.push(`j.type = ${pb.push(type)}`);
  }
  if (category) conditions.push(`j.category = ${pb.push(category)}`);
  const minSalary = parseOptionalInt(salary_min);
  if (minSalary !== undefined) conditions.push(`j.salary_min >= ${pb.push(minSalary)}`);
  const maxSalary = parseOptionalInt(salary_max);
  if (maxSalary !== undefined) conditions.push(`j.salary_max <= ${pb.push(maxSalary)}`);
  const exp = parseOptionalInt(experience);
  if (exp !== undefined) conditions.push(`j.experience_min <= ${pb.push(exp)}`);
  if (featured === 'true') conditions.push('j.is_featured = TRUE');

  const where = `WHERE ${conditions.join(' AND ')}`;
  const countQuery = await pool.query(`SELECT COUNT(*)::int AS count FROM jobs j ${where}`, pb.params);
  const total = countQuery.rows[0].count as number;

  const limitPh = pb.push(limit);
  const offsetPh = pb.push(offset);
  const jobs = (await pool.query(`
    SELECT j.*, c.name AS company_name, c.logo_url AS company_logo,
           c.rating AS company_rating, c.is_verified AS company_verified
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    ${where}
    ORDER BY j.is_featured DESC, j.created_at DESC
    LIMIT ${limitPh} OFFSET ${offsetPh}
  `, pb.params)).rows;

  if (req.user?.id && jobs.length) {
    const ids = jobs.map(j => j.id);
    const { rows: bookmarks } = await pool.query<{ job_id: number }>(
      'SELECT job_id FROM bookmarks WHERE user_id = $1 AND job_id = ANY($2::int[])',
      [req.user.id, ids]
    );
    const bookmarked = new Set(bookmarks.map(b => b.job_id));
    jobs.forEach(j => { j.is_bookmarked = bookmarked.has(j.id); });
  }

  jobs.forEach(j => { j.skills_required = safeJsonArray(j.skills_required); });

  res.json({ jobs, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/categories', asyncHandler(async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT category, COUNT(*)::int AS count
     FROM jobs WHERE is_active = TRUE
     GROUP BY category ORDER BY count DESC`
  );
  res.json(rows);
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(`
    SELECT j.*, c.name AS company_name, c.logo_url AS company_logo, c.rating AS company_rating,
           c.is_verified AS company_verified, c.size AS company_size, c.industry AS company_industry,
           c.description AS company_description, c.website AS company_website, c.location AS company_location
    FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = $1
  `, [id]);
  const job = rows[0];
  if (!job) throw notFound('Job not found');

  job.skills_required = safeJsonArray(job.skills_required);
  await pool.query('UPDATE jobs SET views = views + 1 WHERE id = $1', [job.id]);

  if (req.user?.id) {
    const [{ rows: bm }, { rows: app }] = await Promise.all([
      pool.query('SELECT 1 FROM bookmarks WHERE user_id = $1 AND job_id = $2', [req.user.id, job.id]),
      pool.query('SELECT 1 FROM applications WHERE user_id = $1 AND job_id = $2', [req.user.id, job.id]),
    ]);
    job.is_bookmarked = bm.length > 0;
    job.has_applied = app.length > 0;
  }

  const similar = (await pool.query(`
    SELECT j.id, j.title, j.location, j.type, j.salary_min, j.salary_max, j.created_at,
           c.name AS company_name, c.logo_url AS company_logo
    FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.is_active = TRUE AND j.id != $1 AND (j.category = $2 OR j.type = $3)
    LIMIT 5
  `, [job.id, job.category, job.type])).rows;

  res.json({ job, similar });
}));

router.post('/', authenticate, requireRole('employer', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const company = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
  if (!company) throw badRequest('Create a company profile first');

  const body = req.body ?? {};
  requireFields(body, ['title', 'description', 'category', 'location']);

  const type = body.type ?? 'fulltime';
  if (!JOB_TYPES.includes(type)) throw badRequest('Invalid job type');

  const salaryMin = parseOptionalInt(body.salary_min);
  const salaryMax = parseOptionalInt(body.salary_max);
  if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
    throw badRequest('salary_min cannot exceed salary_max');
  }
  const experienceMin = parseOptionalInt(body.experience_min) ?? 0;
  const experienceMax = parseOptionalInt(body.experience_max) ?? 2;
  if (experienceMin > experienceMax) throw badRequest('experience_min cannot exceed experience_max');

  const openings = parseOptionalInt(body.openings) ?? 1;
  if (openings < 1) throw badRequest('openings must be at least 1');

  const skills = Array.isArray(body.skills_required) ? body.skills_required.map(String) : [];

  const { rows } = await pool.query(`
    INSERT INTO jobs (company_id, title, description, type, category, location, salary_min, salary_max,
      experience_min, experience_max, qualifications, skills_required, openings, deadline)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    RETURNING id, title, type, category, location, created_at
  `, [
    company.id, body.title, body.description, type, body.category, body.location,
    salaryMin ?? null, salaryMax ?? null, experienceMin, experienceMax,
    body.qualifications || null, JSON.stringify(skills), openings, body.deadline || null,
  ]);

  res.status(201).json(rows[0]);
}));

async function loadOwnedJob(userId: number, role: string, jobId: number) {
  if (role === 'admin') {
    const { rows } = await pool.query('SELECT id, company_id FROM jobs WHERE id = $1', [jobId]);
    return rows[0];
  }
  const { rows } = await pool.query(
    `SELECT j.id, j.company_id FROM jobs j
     JOIN companies c ON j.company_id = c.id
     WHERE j.id = $1 AND c.user_id = $2`,
    [jobId, userId]
  );
  return rows[0];
}

router.put('/:id', authenticate, requireRole('employer', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const job = await loadOwnedJob(req.user!.id, req.user!.role, id);
  if (!job) throw notFound('Job not found or not owned by you');

  const pb = new ParamBuilder();
  const setClauses: string[] = [];

  for (const key of JOB_UPDATE_FIELDS) {
    if (req.body?.[key] === undefined) continue;
    let value: unknown = req.body[key];
    if (key === 'skills_required') {
      if (!Array.isArray(value)) throw badRequest('skills_required must be an array');
      value = JSON.stringify(value.map(String));
    }
    if (key === 'type' && !JOB_TYPES.includes(value as string)) throw badRequest('Invalid job type');
    setClauses.push(`${key} = ${pb.push(value)}`);
  }
  if (!setClauses.length) throw badRequest('No valid fields to update');

  await pool.query(`UPDATE jobs SET ${setClauses.join(', ')} WHERE id = ${pb.push(id)}`, pb.params);
  res.json({ message: 'Updated', id });
}));

router.delete('/:id', authenticate, requireRole('employer', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const job = await loadOwnedJob(req.user!.id, req.user!.role, id);
  if (!job) throw notFound('Job not found or not owned by you');
  await pool.query('UPDATE jobs SET is_active = FALSE WHERE id = $1', [id]);
  res.json({ message: 'Job deactivated', id });
}));

router.post('/:id/apply', authenticate, requireRole('jobseeker'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('SELECT id FROM jobs WHERE id = $1 AND is_active = TRUE', [id]);
  if (!rows[0]) throw notFound('Job not found');

  const seeker = await pool.query('SELECT resume_url FROM users WHERE id = $1', [req.user!.id]);
  if (!seeker.rows[0]?.resume_url) {
    throw badRequest('Please upload your resume from your profile before applying.');
  }

  try {
    const { rows: appRows } = await pool.query(
      `INSERT INTO applications (job_id, user_id, cover_letter)
       VALUES ($1,$2,$3) RETURNING id, status, applied_at`,
      [id, req.user!.id, typeof req.body?.cover_letter === 'string' ? req.body.cover_letter : null]
    );
    res.status(201).json(appRows[0]);
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw conflict('You have already applied to this job');
    throw e;
  }
}));

router.post('/:id/bookmark', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  // Confirm the job exists to avoid orphan bookmarks
  const exists = await pool.query('SELECT 1 FROM jobs WHERE id = $1', [id]);
  if (!exists.rows[0]) throw notFound('Job not found');

  const existing = await pool.query(
    'SELECT id FROM bookmarks WHERE user_id = $1 AND job_id = $2',
    [req.user!.id, id]
  );
  if (existing.rows[0]) {
    await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND job_id = $2', [req.user!.id, id]);
    res.json({ bookmarked: false });
    return;
  }
  await pool.query('INSERT INTO bookmarks (user_id, job_id) VALUES ($1,$2)', [req.user!.id, id]);
  res.json({ bookmarked: true });
}));

export default router;
