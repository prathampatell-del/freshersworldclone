import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'jobseeker',
      name TEXT NOT NULL,
      phone TEXT,
      location TEXT,
      experience_years INTEGER DEFAULT 0,
      resume_url TEXT,
      profile_photo TEXT,
      bio TEXT,
      skills TEXT DEFAULT '[]',
      education TEXT DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      logo_url TEXT,
      website TEXT,
      industry TEXT,
      size TEXT,
      description TEXT,
      location TEXT,
      is_verified BOOLEAN DEFAULT FALSE,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'fulltime',
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      experience_min INTEGER DEFAULT 0,
      experience_max INTEGER DEFAULT 2,
      qualifications TEXT,
      skills_required TEXT DEFAULT '[]',
      openings INTEGER DEFAULT 1,
      is_active BOOLEAN DEFAULT TRUE,
      is_featured BOOLEAN DEFAULT FALSE,
      deadline DATE,
      views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      job_id INTEGER REFERENCES jobs(id),
      user_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      cover_letter TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(job_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      job_id INTEGER REFERENCES jobs(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, job_id)
    );

    CREATE TABLE IF NOT EXISTS job_alerts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      keywords TEXT,
      location TEXT,
      category TEXT,
      job_type TEXT,
      frequency TEXT DEFAULT 'daily',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_reviews (
      id SERIAL PRIMARY KEY,
      company_id INTEGER REFERENCES companies(id),
      user_id INTEGER REFERENCES users(id),
      rating INTEGER NOT NULL,
      title TEXT,
      review TEXT,
      pros TEXT,
      cons TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      provider TEXT,
      category TEXT,
      description TEXT,
      duration TEXT,
      price INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      enrollments INTEGER DEFAULT 0,
      thumbnail_url TEXT,
      url TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
