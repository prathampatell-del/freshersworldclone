import { Router, Response } from 'express';
import { pool } from '../db/schema';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { page = '1', limit = '10', status } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, parseInt(limit));
  const offset = (pageNum - 1) * pageSize;

  if (req.user!.role === 'jobseeker') {
    const p: any[] = [req.user!.id];
    const $ = (v: any) => { p.push(v); return `$${p.length}`; };
    const conditions = ['a.user_id = $1'];
    if (status) conditions.push(`a.status = ${$(status)}`);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows: [{ count }] } = await pool.query(`SELECT COUNT(*) as count FROM applications a ${where}`, p);
    const total = parseInt(count);

    const apps = (await pool.query(`
      SELECT a.*, j.title as job_title, j.type as job_type, j.location as job_location,
             c.name as company_name, c.logo_url as company_logo
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN companies c ON j.company_id = c.id
      ${where}
      ORDER BY a.applied_at DESC
      LIMIT $${p.length + 1} OFFSET $${p.length + 2}
    `, [...p, pageSize, offset])).rows;

    res.json({ applications: apps, total, page: pageNum, pages: Math.ceil(total / pageSize) });

  } else if (req.user!.role === 'employer') {
    const company = (await pool.query('SELECT id FROM companies WHERE user_id = $1', [req.user!.id])).rows[0];
    if (!company) {
      res.json({ applications: [], total: 0, page: 1, pages: 0 });
      return;
    }

    const p: any[] = [company.id];
    const $ = (v: any) => { p.push(v); return `$${p.length}`; };
    const conditions = ['j.company_id = $1'];
    const jobId = req.query.job_id as string;
    if (jobId) conditions.push(`a.job_id = ${$(parseInt(jobId))}`);
    if (status) conditions.push(`a.status = ${$(status)}`);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id ${where}`, p
    );
    const total = parseInt(count);

    const apps = (await pool.query(`
      SELECT a.*, j.title as job_title, u.name as applicant_name, u.email as applicant_email,
             u.phone as applicant_phone, u.location as applicant_location, u.resume_url,
             u.skills as applicant_skills, u.experience_years
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON a.user_id = u.id
      ${where}
      ORDER BY a.applied_at DESC
      LIMIT $${p.length + 1} OFFSET $${p.length + 2}
    `, [...p, pageSize, offset])).rows;

    apps.forEach(a => { a.applicant_skills = JSON.parse(a.applicant_skills || '[]'); });
    res.json({ applications: apps, total, page: pageNum, pages: Math.ceil(total / pageSize) });
  } else {
    res.status(403).json({ error: 'Forbidden' });
  }
});

router.put('/:id/status', authenticate, requireRole('employer', 'admin'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  await pool.query('UPDATE applications SET status = $1 WHERE id = $2', [status, parseInt(req.params.id as string)]);
  res.json({ message: 'Status updated' });
});

export default router;
