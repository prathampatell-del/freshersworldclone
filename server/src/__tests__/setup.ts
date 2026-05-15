import dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

const localEnv = join(process.cwd(), '.env.test');
if (existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
} else {
  dotenv.config();
}

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_freshersworld_at_least_16_chars';

// Tests target a dedicated database. Default points at a local Postgres named
// `freshersworld_test` — override via TEST_DATABASE_URL or DATABASE_URL if needed.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL
  || process.env.DATABASE_URL
  || 'postgresql://postgres:postgres@localhost/freshersworld_test';
