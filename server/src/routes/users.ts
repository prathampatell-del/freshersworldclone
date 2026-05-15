import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, badRequest, notFound } from '../utils/http';
import { parseId, parsePagination, safeJsonArray } from '../utils/validate';
import { ParamBuilder } from '../utils/sql';

const router = Router();

const PROFILE_UPDATE_FIELDS = [
  'name', 'phone', 'location', 'experience_years',
  'resume_url', 'profile_photo', 'bio', 'skills', 'education',
] as const;

router.get('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    `SELECT id, email, role, name, phone, location, experience_years, resume_url,
            profile_photo, bio, skills, education, created_at
     FROM users WHERE id = $1`,
    [req.user!.id]
  );
  const user = rows[0];
  if (!user) throw notFound('User not found');
  res.json({
    ...user,
    skills: safeJsonArray(user.skills),
    education: safeJsonArray(user.education),
  });
}));

router.put('/me', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const pb = new ParamBuilder();
  const setClauses: string[] = [];

  for (const key of PROFILE_UPDATE_FIELDS) {
    if (req.body?.[key] === undefined) continue;
    let value: unknown = req.body[key];
    if (key === 'skills' || key === 'education') {
      if (!Array.isArray(value)) throw badRequest(`${key} must be an array`);
      value = JSON.stringify(value);
    }
    if (key === 'experience_years') {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 60) throw badRequest('experience_years must be 0–60');
      value = Math.floor(n);
    }
    setClauses.push(`${key} = ${pb.push(value)}`);
  }
  if (!setClauses.length) throw badRequest('No valid fields to update');

  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  await pool.query(
    `UPDATE users SET ${setClauses.join(', ')} WHERE id = ${pb.push(req.user!.id)}`,
    pb.params
  );
  res.json({ message: 'Profile updated' });
}));

router.get('/me/bookmarks', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, offset } = parsePagination(req.query);

  const { rows: [{ count }] } = await pool.query(
    'SELECT COUNT(*)::int AS count FROM bookmarks WHERE user_id = $1',
    [req.user!.id]
  );

  const bookmarks = (await pool.query(`
    SELECT j.*, c.name AS company_name, c.logo_url AS company_logo,
           c.is_verified AS company_verified, c.rating AS company_rating,
           b.created_at AS bookmarked_at
    FROM bookmarks b
    JOIN jobs j ON b.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user!.id, limit, offset])).rows;

  bookmarks.forEach(j => {
    j.skills_required = safeJsonArray(j.skills_required);
    j.is_bookmarked = true;
  });
  res.json({ bookmarks, total: count, page, pages: Math.max(1, Math.ceil((count as number) / limit)) });
}));

router.get('/me/alerts', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rows } = await pool.query(
    'SELECT * FROM job_alerts WHERE user_id = $1 ORDER BY created_at DESC',
    [req.user!.id]
  );
  res.json(rows);
}));

router.post('/me/alerts', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { keywords, location, category, job_type, frequency = 'daily' } = req.body ?? {};
  if (!keywords && !location && !category && !job_type) {
    throw badRequest('At least one of keywords, location, category, or job_type is required');
  }
  if (!['daily', 'weekly'].includes(frequency)) throw badRequest('frequency must be daily or weekly');

  const { rows } = await pool.query(
    `INSERT INTO job_alerts (user_id, keywords, location, category, job_type, frequency)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [req.user!.id, keywords || null, location || null, category || null, job_type || null, frequency]
  );
  res.status(201).json(rows[0]);
}));

router.delete('/me/alerts/:id', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const result = await pool.query(
    'DELETE FROM job_alerts WHERE id = $1 AND user_id = $2',
    [id, req.user!.id]
  );
  if (result.rowCount === 0) throw notFound('Alert not found');
  res.json({ message: 'Alert deleted', id });
}));

export default router;
