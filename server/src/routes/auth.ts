import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/schema';
import { authenticate, signToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, password, name, role = 'jobseeker', phone, location } = req.body;
  if (!email || !password || !name) {
    res.status(400).json({ error: 'Email, password and name are required' });
    return;
  }
  if (!['jobseeker', 'employer'].includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  const existing = (await pool.query('SELECT id FROM users WHERE email = $1', [email])).rows[0];
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, role, name, phone, location) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [email, hash, role, name, phone || null, location || null]
  );
  const id = rows[0].id;
  const token = signToken({ id, role, email });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  res.json({ token, user: { id, email, name, role } });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }
  const user = (await pool.query('SELECT * FROM users WHERE email = $1', [email])).rows[0];
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
  const { password_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = (await pool.query(
    'SELECT id, email, role, name, phone, location, experience_years, resume_url, profile_photo, bio, skills, education, created_at FROM users WHERE id = $1',
    [req.user!.id]
  )).rows[0];
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  user.skills = JSON.parse(user.skills || '[]');
  user.education = JSON.parse(user.education || '[]');
  res.json(user);
});

export default router;
