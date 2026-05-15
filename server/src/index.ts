import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { initSchema } from './db/schema';
import { seedDatabase } from './db/seed';

const PORT = Number(process.env.PORT) || 3001;

async function start() {
  await initSchema();
  await seedDatabase();
  const app = createApp({ serveStatic: true });
  app.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('[server] failed to start:', err);
  process.exit(1);
});
