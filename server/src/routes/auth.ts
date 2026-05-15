import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/schema';
import { authenticate, cookieOptions, signToken, AuthRequest } from '../middleware/auth';
import { asyncHandler, badRequest, conflict, notFound, unauthorized } from '../utils/http';
import { requireFields, safeJsonArray, validEmail } from '../utils/validate';

const router = Router();

const ALLOWED_ROLES = ['jobseeker', 'employer'] as const;
const MIN_PASSWORD = 6;
const MAX_NAME = 100;

router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role = 'jobseeker', phone, location } = req.body ?? {};
  requireFields(req.body ?? {}, ['email', 'password', 'name']);

  if (!validEmail(email)) throw badRequest('Invalid email address');
  if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
    throw badRequest(`Password must be at least ${MIN_PASSWORD} characters`);
  }
  if (typeof name !== 'string' || name.length > MAX_NAME) {
    throw badRequest('Name must be 1–100 characters');
  }
  if (!ALLOWED_ROLES.includes(role)) throw badRequest('Invalid role');

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows[0]) throw conflict('Email already registered');

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role, name, phone, location)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, email, role, name, phone, location, experience_years, created_at`,
    [email.toLowerCase(), hash, role, name.trim(), phone || null, location || null]
  );
  const user = rows[0];
  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.cookie('token', token, cookieOptions());
  res.status(201).json({
    token,
    user: { ...user, skills: [], education: [] },
  });
}));

router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  requireFields(req.body ?? {}, ['email', 'password']);
  if (!validEmail(email)) throw badRequest('Invalid email address');

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  // Constant-ish: compare against a placeholder hash to avoid easy user enumeration timing
  const placeholderHash = '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidi';
  const valid = await bcrypt.compare(password as string, user?.password_hash ?? placeholderHash);
  if (!user || !valid) throw unauthorized('Invalid credentials');

  const token = signToken({ id: user.id, role: user.role, email: user.email });
  res.cookie('token', token, cookieOptions());
  const { password_hash: _ignored, skills, education, ...safeUser } = user;
  res.json({
    token,
    user: {
      ...safeUser,
      skills: safeJsonArray(skills),
      education: safeJsonArray(education),
    },
  });
}));

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { ...cookieOptions(), maxAge: 0 });
  res.json({ message: 'Logged out' });
});

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

export default router;
