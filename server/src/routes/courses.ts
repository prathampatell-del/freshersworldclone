import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler, notFound } from '../utils/http';
import { parseId, parsePagination } from '../utils/validate';
import { ParamBuilder } from '../utils/sql';

const router = Router();

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { q, category, free, featured } = req.query as Record<string, string>;
  const { page, limit, offset } = parsePagination(req.query, { page: 1, limit: 12, max: 50 });

  const pb = new ParamBuilder();
  const conditions: string[] = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(`(title ILIKE ${pb.push(like)} OR description ILIKE ${pb.push(like)})`);
  }
  if (category) conditions.push(`category = ${pb.push(category)}`);
  if (free === 'true') conditions.push('price = 0');
  if (featured === 'true') conditions.push('is_featured = TRUE');

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows: [{ count }] } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM courses ${where}`,
    pb.params
  );

  const courses = (await pool.query(`
    SELECT * FROM courses ${where}
    ORDER BY is_featured DESC, rating DESC, enrollments DESC
    LIMIT ${pb.push(limit)} OFFSET ${pb.push(offset)}
  `, pb.params)).rows;

  res.json({ courses, total: count, page, pages: Math.max(1, Math.ceil((count as number) / limit)) });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
  if (!rows[0]) throw notFound('Course not found');
  res.json(rows[0]);
}));

export default router;
