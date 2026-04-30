import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  const { q, category, free, featured, page = '1', limit = '12' } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * pageSize;

  const p: any[] = [];
  const $ = (v: any) => { p.push(v); return `$${p.length}`; };
  const conditions: string[] = [];

  if (q) conditions.push(`(title ILIKE ${$(`%${q}%`)} OR description ILIKE ${$(`%${q}%`)})`);
  if (category) conditions.push(`category = ${$(category)}`);
  if (free === 'true') conditions.push('price = 0');
  if (featured === 'true') conditions.push('is_featured = TRUE');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) as count FROM courses ${where}`, p);
  const total = parseInt(count);

  const courses = (await pool.query(`
    SELECT * FROM courses ${where} ORDER BY is_featured DESC, rating DESC, enrollments DESC
    LIMIT $${p.length + 1} OFFSET $${p.length + 2}
  `, [...p, pageSize, offset])).rows;

  res.json({ courses, total, page: pageNum, pages: Math.ceil(total / pageSize) });
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const course = (await pool.query('SELECT * FROM courses WHERE id = $1', [parseInt(req.params.id as string)])).rows[0];
  if (!course) { res.status(404).json({ error: 'Course not found' }); return; }
  res.json(course);
});

export default router;
