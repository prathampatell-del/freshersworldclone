import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const { q, industry, page = '1', limit = '12' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };
  const conditions: string[] = [];

  if (q) conditions.push(`(c.name ILIKE ${$(`%${q}%`)} OR c.description ILIKE ${$(`%${q}%`)})`);
  if (industry) conditions.push(`c.industry = ${$(industry)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) as count FROM companies c ${where}`, p);
  const total = parseInt(count);

  const limitPh = `$${p.length + 1}`;
  const offsetPh = `$${p.length + 2}`;
  const companies = (await pool.query(`
    SELECT c.*, COUNT(j.id) as open_jobs
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = TRUE
    ${where}
    GROUP BY c.id
    ORDER BY c.is_verified DESC, c.rating DESC
    LIMIT ${limitPh} OFFSET ${offsetPh}
  `, [...p, pageSize, offset])).rows;

  res.json({ companies, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  const company = (await pool.query(`
    SELECT c.*, COUNT(j.id) as open_jobs
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = TRUE
    WHERE c.id = $1
    GROUP BY c.id
  `, [parseInt(req.params.id as string)])).rows[0];

  if (!company) {
    res.status(404).json({ error: 'Company not found' });
    return;
  }

  const jobs = (await pool.query(`
    SELECT id, title, location, type, salary_min, salary_max, experience_min, experience_max, created_at, deadline
    FROM jobs WHERE company_id = $1 AND is_active = TRUE
    ORDER BY created_at DESC LIMIT 10
  `, [company.id])).rows;

  const reviews = (await pool.query(`
    SELECT r.*, u.name as user_name
    FROM company_reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.company_id = $1
    ORDER BY r.created_at DESC LIMIT 20
  `, [company.id])).rows;

  res.json({ company, jobs, reviews });
});

router.post('/', authenticate, requireRole('employer'), async (req: AuthRequest, res: Response) => {
  const existing = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
  if (existing) {
    res.status(409).json({ error: 'Company profile already exists' });
    return;
  }

  const { name, logo_url, website, industry, size, description, location } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Company name is required' });
    return;
  }

  const { rows } = await pool.query(`
    INSERT INTO companies (user_id, name, logo_url, website, industry, size, description, location)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
  `, [req.user!.id, name, logo_url || null, website || null, industry || null, size || null, description || null, location || null]);

  res.status(201).json({ id: rows[0].id });
});

router.put('/:id', authenticate, requireRole('employer', 'admin'), async (req: AuthRequest, res: Response) => {
  const company = (await pool.query('SELECT id FROM companies WHERE id = $1 AND user_id = $2', [parseInt(req.params.id as string), req.user!.id])).rows[0];
  if (!company && req.user!.role !== 'admin') {
    res.status(404).json({ error: 'Not found or unauthorized' });
    return;
  }

  const allowed = ['name', 'logo_url', 'website', 'industry', 'size', 'description', 'location'];
  const setClauses: string[] = [];
  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };

  for (const key of allowed) {
    if (req.body[key] !== undefined) setClauses.push(`${key} = ${$(req.body[key])}`);
  }

  if (!setClauses.length) {
    res.status(400).json({ error: 'No valid fields' });
    return;
  }

  await pool.query(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = ${$(parseInt(req.params.id as string))}`, p);
  res.json({ message: 'Updated' });
});

router.post('/:id/reviews', authenticate, requireRole('jobseeker'), async (req: AuthRequest, res: Response) => {
  const { rating, title, review, pros, cons } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating (1-5) is required' });
    return;
  }
  try {
    await pool.query(`
      INSERT INTO company_reviews (company_id, user_id, rating, title, review, pros, cons)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [parseInt(req.params.id as string), req.user!.id, rating, title || null, review || null, pros || null, cons || null]);

    const { rows: [avg] } = await pool.query(
      'SELECT AVG(rating) as avg, COUNT(*) as cnt FROM company_reviews WHERE company_id = $1',
      [parseInt(req.params.id as string)]
    );
    await pool.query('UPDATE companies SET rating = $1, review_count = $2 WHERE id = $3', [
      parseFloat(avg.avg), parseInt(avg.cnt), parseInt(req.params.id as string)
    ]);

    res.status(201).json({ message: 'Review posted' });
  } catch (e: any) {
    if (e.code === '23505') {
      res.status(409).json({ error: 'Already reviewed' });
    } else throw e;
  }
});

export default router;
