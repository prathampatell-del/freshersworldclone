import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, badRequest, conflict, notFound } from '../utils/http';
import { parseId, parsePagination, requireFields } from '../utils/validate';
import { ParamBuilder } from '../utils/sql';

const router = Router();

const COMPANY_UPDATE_FIELDS = [
  'name', 'logo_url', 'website', 'industry', 'size', 'description', 'location',
] as const;

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, industry } = req.query as Record<string, string>;
  const { page, limit, offset } = parsePagination(req.query, { page: 1, limit: 12, max: 50 });

  const pb = new ParamBuilder();
  const conditions: string[] = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(`(c.name ILIKE ${pb.push(like)} OR c.description ILIKE ${pb.push(like)})`);
  }
  if (industry) conditions.push(`c.industry = ${pb.push(industry)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM companies c ${where}`,
    pb.params
  );

  const companies = (await pool.query(`
    SELECT c.*, COUNT(j.id)::int AS open_jobs
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = TRUE
    ${where}
    GROUP BY c.id
    ORDER BY c.is_verified DESC, c.rating DESC
    LIMIT ${pb.push(limit)} OFFSET ${pb.push(offset)}
  `, pb.params)).rows;

  res.json({ companies, total: count, page, pages: Math.max(1, Math.ceil((count as number) / limit)) });
}));

router.get('/:id', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(`
    SELECT c.*, COUNT(j.id)::int AS open_jobs
    FROM companies c
    LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active = TRUE
    WHERE c.id = $1
    GROUP BY c.id
  `, [id]);
  const company = rows[0];
  if (!company) throw notFound('Company not found');

  const [jobs, reviews] = await Promise.all([
    pool.query(`
      SELECT id, title, location, type, salary_min, salary_max,
             experience_min, experience_max, created_at, deadline
      FROM jobs WHERE company_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC LIMIT 10
    `, [id]),
    pool.query(`
      SELECT r.*, u.name AS user_name
      FROM company_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.company_id = $1
      ORDER BY r.created_at DESC LIMIT 20
    `, [id]),
  ]);

  res.json({ company, jobs: jobs.rows, reviews: reviews.rows });
}));

router.post('/', authenticate, requireRole('employer'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const existing = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
  if (existing) throw conflict('Company profile already exists');

  const body = req.body ?? {};
  requireFields(body, ['name']);

  const { rows } = await pool.query(`
    INSERT INTO companies (user_id, name, logo_url, website, industry, size, description, location)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING id, name, industry, location, created_at
  `, [
    req.user!.id, body.name, body.logo_url || null, body.website || null,
    body.industry || null, body.size || null, body.description || null, body.location || null,
  ]);

  res.status(201).json(rows[0]);
}));

router.put('/:id', authenticate, requireRole('employer', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  let companyRow;
  if (req.user!.role === 'admin') {
    const r = await pool.query('SELECT id FROM companies WHERE id = $1', [id]);
    companyRow = r.rows[0];
  } else {
    const r = await pool.query('SELECT id FROM companies WHERE id = $1 AND user_id = $2', [id, req.user!.id]);
    companyRow = r.rows[0];
  }
  if (!companyRow) throw notFound('Company not found or not owned by you');

  const pb = new ParamBuilder();
  const setClauses: string[] = [];
  for (const key of COMPANY_UPDATE_FIELDS) {
    if (req.body?.[key] === undefined) continue;
    setClauses.push(`${key} = ${pb.push(req.body[key])}`);
  }
  if (!setClauses.length) throw badRequest('No valid fields to update');

  await pool.query(`UPDATE companies SET ${setClauses.join(', ')} WHERE id = ${pb.push(id)}`, pb.params);
  res.json({ message: 'Updated', id });
}));

router.post('/:id/reviews', authenticate, requireRole('jobseeker'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { rating, title, review, pros, cons } = req.body ?? {};
  const ratingNum = typeof rating === 'number' ? rating : Number(rating);
  if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw badRequest('Rating must be between 1 and 5');
  }

  const exists = await pool.query('SELECT 1 FROM companies WHERE id = $1', [id]);
  if (!exists.rows[0]) throw notFound('Company not found');

  try {
    await pool.query(`
      INSERT INTO company_reviews (company_id, user_id, rating, title, review, pros, cons)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
    `, [id, req.user!.id, Math.round(ratingNum), title || null, review || null, pros || null, cons || null]);

    const { rows: [agg] } = await pool.query(
      `SELECT AVG(rating)::float AS avg, COUNT(*)::int AS cnt
       FROM company_reviews WHERE company_id = $1`,
      [id]
    );
    await pool.query(
      'UPDATE companies SET rating = $1, review_count = $2 WHERE id = $3',
      [agg.avg, agg.cnt, id]
    );

    res.status(201).json({ message: 'Review posted', rating: agg.avg, review_count: agg.cnt });
  } catch (e) {
    if ((e as { code?: string }).code === '23505') throw conflict('You have already reviewed this company');
    throw e;
  }
}));

export default router;
