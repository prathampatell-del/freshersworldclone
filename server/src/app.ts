import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import authRouter from './routes/auth';
import jobsRouter from './routes/jobs';
import companiesRouter from './routes/companies';
import applicationsRouter from './routes/applications';
import usersRouter from './routes/users';
import coursesRouter from './routes/courses';
import { HttpError } from './utils/http';

export interface CreateAppOptions {
  /**
   * When true, mounts the built React client at the root.
   * In tests this is disabled so the SPA fallback does not swallow 404 JSON responses.
   */
  serveStatic?: boolean;
}

export function createApp(opts: CreateAppOptions = {}) {
  const app = express();

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/jobs', jobsRouter);
  app.use('/api/companies', companiesRouter);
  app.use('/api/applications', applicationsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/courses', coursesRouter);

  // Any unknown /api/* path is a 404 — handle before the SPA fallback.
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Endpoint not found' }));

  if (opts.serveStatic) {
    // dist/server/app.js → dist/ contains the built client
    const clientDist = path.join(__dirname, '..');
    const indexPath = path.join(clientDist, 'index.html');
    if (fs.existsSync(indexPath)) {
      app.use(express.static(clientDist));
      app.use((_req: Request, res: Response) => res.sendFile(indexPath));
    }
  }

  // Central error handler — converts known HttpError into structured responses
  // and falls back to 500 for unexpected errors.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message, ...(err.details ? { details: err.details } : {}) });
      return;
    }
    if (process.env.NODE_ENV !== 'test') {
      // eslint-disable-next-line no-console
      console.error('[server] unhandled error:', err);
    }
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
