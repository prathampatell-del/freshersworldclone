import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = (await pool.query(
    'SELECT id, email, role, name, phone, location, experience_years, resume_url, profile_photo, bio, skills, education, created_at FROM users WHERE id = $1',
    [req.user!.id]
  )).rows[0];
  if (!user) { res.status(404).json({ error: 'Not found' }); return; }
  user.skills = JSON.parse(user.skills || '[]');
  user.education = JSON.parse(user.education || '[]');
  res.json(user);
});

router.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const allowed = ['name', 'phone', 'location', 'experience_years', 'resume_url', 'profile_photo', 'bio', 'skills', 'education'];
  const setClauses: string[] = [];
  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const val = Array.isArray(req.body[key]) ? JSON.stringify(req.body[key]) : req.body[key];
      setClauses.push(`${key} = ${$(val)}`);
    }
  }
  if (!setClauses.length) { res.status(400).json({ error: 'No valid fields' }); return; }
  setClauses.push('updated_at = CURRENT_TIMESTAMP');
  await pool.query(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ${$(req.user!.id)}`, p);
  res.json({ message: 'Updated' });
});

router.get('/me/bookmarks', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * pageSize;

  const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) as count FROM bookmarks WHERE user_id = $1', [req.user!.id]);
  const total = parseInt(count);

  const bookmarks = (await pool.query(`
    SELECT j.*, c.name as company_name, c.logo_url as company_logo, b.created_at as bookmarked_at
    FROM bookmarks b
    JOIN jobs j ON b.job_id = j.id
    JOIN companies c ON j.company_id = c.id
    WHERE b.user_id = $1
    ORDER BY b.created_at DESC
    LIMIT $2 OFFSET $3
  `, [req.user!.id, pageSize, offset])).rows;

  bookmarks.forEach(j => { j.skills_required = JSON.parse(j.skills_required || '[]'); j.is_bookmarked = true; });
  res.json({ bookmarks, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.get('/me/alerts', authenticate, async (req: AuthRequest, res: Response) => {
  const alerts = (await pool.query('SELECT * FROM job_alerts WHERE user_id = $1 ORDER BY created_at DESC', [req.user!.id])).rows;
  res.json(alerts);
});

router.post('/me/alerts', authenticate, async (req: AuthRequest, res: Response) => {
  const { keywords, location, category, job_type, frequency = 'daily' } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO job_alerts (user_id, keywords, location, category, job_type, frequency) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [req.user!.id, keywords || null, location || null, category || null, job_type || null, frequency]
  );
  res.status(201).json({ id: rows[0].id });
});

router.delete('/me/alerts/:id', authenticate, async (req: AuthRequest, res: Response) => {
  await pool.query('DELETE FROM job_alerts WHERE id = $1 AND user_id = $2', [parseInt(req.params.id), req.user!.id]);
  res.json({ message: 'Alert deleted' });
});

export default router;
