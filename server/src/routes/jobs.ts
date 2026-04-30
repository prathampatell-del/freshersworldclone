import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, async (req: AuthRequest, res: Response) => {
  const {
    q, location, type, category, salary_min, salary_max,
    experience, page = '1', limit = '10', featured
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };
  const conditions: string[] = ['j.is_active = TRUE'];

  if (q) {
    const like = `%${q}%`;
    conditions.push(`(j.title ILIKE ${$(like)} OR j.description ILIKE ${$(like)} OR j.category ILIKE ${$(like)})`);
  }
  if (location) conditions.push(`j.location ILIKE ${$(`%${location}%`)}`);
  if (type) conditions.push(`j.type = ${$(type)}`);
  if (category) conditions.push(`j.category = ${$(category)}`);
  if (salary_min) conditions.push(`j.salary_min >= ${$(parseInt(salary_min))}`);
  if (salary_max) conditions.push(`j.salary_max <= ${$(parseInt(salary_max))}`);
  if (experience !== undefined) conditions.push(`j.experience_min <= ${$(parseInt(experience))}`);
  if (featured === 'true') conditions.push('j.is_featured = TRUE');

  const where = `WHERE ${conditions.join(' AND ')}`;

  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) as count FROM jobs j ${where}`, p);
  const total = parseInt(count);

  const limitPh = `$${p.length + 1}`;
  const offsetPh = `$${p.length + 2}`;
  const jobs = (await pool.query(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.rating as company_rating, c.is_verified as company_verified
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    ${where}
    ORDER BY j.is_featured DESC, j.created_at DESC
    LIMIT ${limitPh} OFFSET ${offsetPh}
  `, [...p, pageSize, offset])).rows;

  const userId = req.user?.id;
  if (userId) {
    const bookmarked = (await pool.query('SELECT job_id FROM bookmarks WHERE user_id = $1', [userId])).rows as { job_id: number }[];
    const bookmarkSet = new Set(bookmarked.map(b => b.job_id));
    jobs.forEach(j => { j.is_bookmarked = bookmarkSet.has(j.id); });
  }

  jobs.forEach(j => { j.skills_required = JSON.parse(j.skills_required || '[]'); });

  res.json({ jobs, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.get('/categories', async (_req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT category, COUNT(*) as count FROM jobs WHERE is_active = TRUE GROUP BY category ORDER BY count DESC`
  );
  res.json(rows);
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const job = (await pool.query(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo, c.rating as company_rating,
           c.is_verified as company_verified, c.size as company_size, c.industry as company_industry,
           c.description as company_description, c.website as company_website, c.location as company_location
    FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = $1
  `, [parseInt(req.params.id)])).rows[0];

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  job.skills_required = JSON.parse(job.skills_required || '[]');
  await pool.query('UPDATE jobs SET views = views + 1 WHERE id = $1', [job.id]);

  const userId = req.user?.id;
  if (userId) {
    const bookmark = (await pool.query('SELECT id FROM bookmarks WHERE user_id = $1 AND job_id = $2', [userId, job.id])).rows[0];
    job.is_bookmarked = !!bookmark;
    const applied = (await pool.query('SELECT id FROM applications WHERE user_id = $1 AND job_id = $2', [userId, job.id])).rows[0];
    job.has_applied = !!applied;
  }

  const similar = (await pool.query(`
    SELECT j.id, j.title, j.location, j.type, j.salary_min, j.salary_max, j.created_at,
           c.name as company_name, c.logo_url as company_logo
    FROM jobs j LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.is_active = TRUE AND j.id != $1 AND (j.category = $2 OR j.type = $3)
    LIMIT 5
  `, [job.id, job.category, job.type])).rows;

  res.json({ job, similar });
});

router.post('/', authenticate, requireRole('employer', 'admin'), async (req: AuthRequest, res: Response) => {
  const company = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
  if (!company) {
    res.status(400).json({ error: 'Create a company profile first' });
    return;
  }

  const {
    title, description, type = 'fulltime', category, location,
    salary_min, salary_max, experience_min = 0, experience_max = 2,
    qualifications, skills_required = [], openings = 1, deadline
  } = req.body;

  if (!title || !description || !category || !location) {
    res.status(400).json({ error: 'title, description, category, location are required' });
    return;
  }

  const { rows } = await pool.query(`
    INSERT INTO jobs (company_id, title, description, type, category, location, salary_min, salary_max,
      experience_min, experience_max, qualifications, skills_required, openings, deadline)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id
  `, [
    company.id, title, description, type, category, location,
    salary_min || null, salary_max || null, experience_min, experience_max,
    qualifications || null, JSON.stringify(skills_required), openings, deadline || null
  ]);

  res.status(201).json({ id: rows[0].id });
});

router.put('/:id', authenticate, requireRole('employer', 'admin'), async (req: AuthRequest, res: Response) => {
  const job = (await pool.query(`
    SELECT j.id FROM jobs j
    JOIN companies c ON j.company_id = c.id
    WHERE j.id = $1 AND c.user_id = $2
  `, [parseInt(req.params.id), req.user!.id])).rows[0];

  if (!job && req.user!.role !== 'admin') {
    res.status(404).json({ error: 'Job not found or unauthorized' });
    return;
  }

  const allowed = ['title', 'description', 'type', 'category', 'location', 'salary_min', 'salary_max',
    'experience_min', 'experience_max', 'qualifications', 'skills_required', 'openings', 'is_active', 'deadline'];
  const setClauses: string[] = [];
  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const val = key === 'skills_required' ? JSON.stringify(req.body[key]) : req.body[key];
      setClauses.push(`${key} = ${$(val)}`);
    }
  }

  if (!setClauses.length) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }

  await pool.query(`UPDATE jobs SET ${setClauses.join(', ')} WHERE id = ${$(parseInt(req.params.id))}`, p);
  res.json({ message: 'Updated' });
});

router.delete('/:id', authenticate, requireRole('employer', 'admin'), async (req: AuthRequest, res: Response) => {
  await pool.query('UPDATE jobs SET is_active = FALSE WHERE id = $1', [parseInt(req.params.id)]);
  res.json({ message: 'Job deactivated' });
});

router.post('/:id/apply', authenticate, requireRole('jobseeker'), async (req: AuthRequest, res: Response) => {
  const job = (await pool.query('SELECT id FROM jobs WHERE id = $1 AND is_active = TRUE', [parseInt(req.params.id)])).rows[0];
  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO applications (job_id, user_id, cover_letter) VALUES ($1,$2,$3) RETURNING id',
      [parseInt(req.params.id), req.user!.id, req.body.cover_letter || null]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (e: any) {
    if (e.code === '23505') {
      res.status(409).json({ error: 'Already applied' });
    } else {
      throw e;
    }
  }
});

router.post('/:id/bookmark', authenticate, async (req: AuthRequest, res: Response) => {
  const existing = (await pool.query('SELECT id FROM bookmarks WHERE user_id = $1 AND job_id = $2', [req.user!.id, parseInt(req.params.id)])).rows[0];
  if (existing) {
    await pool.query('DELETE FROM bookmarks WHERE user_id = $1 AND job_id = $2', [req.user!.id, parseInt(req.params.id)]);
    res.json({ bookmarked: false });
  } else {
    await pool.query('INSERT INTO bookmarks (user_id, job_id) VALUES ($1,$2)', [req.user!.id, parseInt(req.params.id)]);
    res.json({ bookmarked: true });
  }
});

export default router;
