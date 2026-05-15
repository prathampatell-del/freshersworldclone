import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, badRequest, forbidden, notFound } from '../utils/http';
import { parseId, parsePagination, safeJsonArray } from '../utils/validate';
import { ParamBuilder } from '../utils/sql';

const router = Router();

const VALID_STATUSES = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];

router.get('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit, offset } = parsePagination(req.query);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  if (status && !VALID_STATUSES.includes(status)) throw badRequest('Invalid status filter');

  if (req.user!.role === 'jobseeker') {
    const pb = new ParamBuilder();
    const userPh = pb.push(req.user!.id);
    const conditions = [`a.user_id = ${userPh}`];
    if (status) conditions.push(`a.status = ${pb.push(status)}`);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM applications a ${where}`,
      pb.params
    );

    const applications = (await pool.query(`
      SELECT a.*, j.title AS job_title, j.type AS job_type, j.location AS job_location,
             c.name AS company_name, c.logo_url AS company_logo
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ${where}
      ORDER BY a.applied_at DESC
      LIMIT ${pb.push(limit)} OFFSET ${pb.push(offset)}
    `, pb.params)).rows;

    res.json({ applications, total: count, page, pages: Math.max(1, Math.ceil((count as number) / limit)) });
    return;
  }

  if (req.user!.role === 'employer' || req.user!.role === 'admin') {
    const company = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
    if (req.user!.role !== 'admin' && !company) {
      res.json({ applications: [], total: 0, page: 1, pages: 1 });
      return;
    }

    const pb = new ParamBuilder();
    const conditions: string[] = [];
    if (req.user!.role !== 'admin') conditions.push(`j.company_id = ${pb.push(company.id)}`);
    if (req.query.job_id) conditions.push(`a.job_id = ${pb.push(parseId(req.query.job_id, 'job_id'))}`);
    if (status) conditions.push(`a.status = ${pb.push(status)}`);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM applications a JOIN jobs j ON a.job_id = j.id ${where}`,
      pb.params
    );

    const applications = (await pool.query(`
      SELECT a.*, j.title AS job_title, j.company_id,
             u.name AS applicant_name, u.email AS applicant_email,
             u.phone AS applicant_phone, u.location AS applicant_location,
             u.resume_url, u.skills AS applicant_skills, u.experience_years
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.applied_at DESC
      LIMIT ${pb.push(limit)} OFFSET ${pb.push(offset)}
    `, pb.params)).rows;

    applications.forEach(a => { a.applicant_skills = safeJsonArray(a.applicant_skills); });
    res.json({ applications, total: count, page, pages: Math.max(1, Math.ceil((count as number) / limit)) });
    return;
  }

  throw forbidden();
}));

router.put('/:id/status', authenticate, requireRole('employer', 'admin'), asyncHandler(async (req: AuthRequest, res: Response) => {
  const id = parseId(req.params.id);
  const { status } = req.body ?? {};
  if (!VALID_STATUSES.includes(status)) throw badRequest('Invalid status');

  const { rows } = await pool.query(
    `SELECT a.id, c.user_id AS company_user_id
     FROM applications a
     JOIN jobs j ON a.job_id = j.id
     JOIN companies c ON j.company_id = c.id
     WHERE a.id = $1`,
    [id]
  );
  const app = rows[0];
  if (!app) throw notFound('Application not found');

  if (req.user!.role !== 'admin' && app.company_user_id !== req.user!.id) {
    throw forbidden('You do not own this application');
  }

  await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, id]);
  res.json({ message: 'Status updated', id, status });
}));

export default router;
