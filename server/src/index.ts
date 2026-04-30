import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initSchema } from './db/schema';
import { seedDatabase } from './db/seed';
import authRouter from './routes/auth';
import jobsRouter from './routes/jobs';
import companiesRouter from './routes/companies';
import applicationsRouter from './routes/applications';
import usersRouter from './routes/users';
import coursesRouter from './routes/courses';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/users', usersRouter);
app.use('/api/courses', coursesRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initSchema();
  await seedDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
