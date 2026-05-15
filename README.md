# FreshersWorld Clone

A full-stack clone of [Freshersworld.com](https://www.freshersworld.com) — an Indian job portal aimed at fresh graduates, students, and early-career professionals. Includes role-based dashboards for both job seekers and employers, a company directory, course listings, and a complete application workflow.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Variables](#environment-variables)
6. [Database Setup](#database-setup)
7. [Available Scripts](#available-scripts)
8. [Demo Accounts](#demo-accounts)
9. [API Reference](#api-reference)
10. [Testing](#testing)
11. [Architecture](#architecture)
12. [Known Limitations & Future Work](#known-limitations--future-work)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 14+ (`node-postgres` / `pg`) |
| Auth | JSON Web Tokens stored in HTTP-only cookies |
| Routing | React Router v7 |
| HTTP | Axios |
| Icons | Lucide React |
| Testing | Vitest, Supertest, React Testing Library, jsdom |

The whole project is managed by a single `package.json` so the frontend and backend share dependency installs, build, and test tooling.

---

## Features

### Job Seekers
- Search and filter jobs by title, location, category, salary, and experience.
- Browse internships, walk-in drives, and government opportunities.
- Apply to jobs with an optional cover letter.
- Bookmark jobs and view a personalized "Saved Jobs" list.
- Track application status (`pending → reviewed → shortlisted → hired/rejected`).
- Create job alerts based on keyword, category, location, or job type.
- Maintain a profile (skills, experience, resume URL, bio, education).
- Read and write company reviews.

### Employers
- Create a company profile and post detailed job listings.
- Manage incoming applications and update their statuses.
- View applicant profiles, contact details, and cover letters.
- Edit/deactivate only jobs that belong to their company (ownership-enforced server-side).

### Platform
- Public company directory with verification, ratings, and reviews.
- Curated course catalog from providers like Coursera, Udemy, NPTEL.
- Toast notifications, loading skeletons, error states, and empty states throughout.
- JWT auth with HTTP-only, `SameSite=Lax` cookies; `Secure` enabled in production.
- Central error handler returning consistent JSON shapes (`{ "error": "..." }`).
- Server-side request validation and pagination clamping.

---

## Project Structure

```
freshersworld-clone/
├── server/src/
│   ├── app.ts             # Express app factory (used by both prod start and tests)
│   ├── index.ts           # Production entrypoint: init schema, seed, listen
│   ├── db/
│   │   ├── schema.ts      # Pool + idempotent CREATE TABLE script
│   │   └── seed.ts        # Idempotent seed data
│   ├── middleware/
│   │   └── auth.ts        # JWT signing/verification, role guards, cookie options
│   ├── routes/            # auth, jobs, companies, applications, users, courses
│   ├── utils/             # http (HttpError + asyncHandler), validate, sql
│   └── __tests__/         # Server tests (Vitest + Supertest)
├── src/
│   ├── api/               # Axios client + per-resource API wrappers
│   ├── components/
│   │   ├── layout/        # Navbar, Footer
│   │   └── ui/            # Badge, Pagination, Skeleton, Toast, States
│   ├── contexts/          # AuthContext
│   ├── pages/             # Route-level pages (auth, dashboard, employer, ...)
│   ├── types/             # Shared TypeScript interfaces
│   └── __tests__/         # React component / page tests
├── architecture.md        # Deeper architectural notes & schema reference
├── vitest.config.ts       # Vitest projects (server: node, client: jsdom)
├── vite.config.ts         # Vite (frontend) build config
├── tsconfig.json          # Frontend TS config
├── tsconfig.server.json   # Backend TS config
└── package.json           # Single source of truth for scripts & deps
```

---

## Getting Started

### Prerequisites

- **Node.js 20+** (Node 25 is supported, see Testing notes)
- **npm 9+**
- **PostgreSQL 14+** running locally (or reachable via `DATABASE_URL`)

### Install

```bash
git clone <your-repo-url>
cd freshersworld-clone
npm install
```

### One-time DB setup

```bash
# Defaults expected: user "postgres" with password "postgres" on localhost
createdb -U postgres freshersworld
```

Or edit `.env` to point at a different connection string.

### Run in development

```bash
npm run dev
```

This starts the API on **http://localhost:3001** and the Vite dev server on **http://localhost:5173** with `/api` proxied to the backend. The first run creates the schema and inserts seed data automatically.

### Build & run for production

```bash
npm run build          # Type-checks, builds the React app, compiles the server
npm run start          # Serves the built React app + API from a single Express
```

---

## Environment Variables

Create a `.env` file in the project root. All variables are optional in development but `JWT_SECRET` is **required** in production.

| Variable | Purpose | Default (dev) |
|---|---|---|
| `DATABASE_URL` | Postgres connection string | `postgresql://postgres:postgres@localhost/freshersworld` |
| `JWT_SECRET` | HMAC secret for JWT signing (≥16 chars in prod) | A weak fallback that throws in `production` |
| `PORT` | API port | `3001` |
| `FRONTEND_URL` | Additional CORS origin (e.g. deployed frontend) | unset |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `TEST_DATABASE_URL` | Override for tests (otherwise `DATABASE_URL` is used) | `postgresql://postgres:postgres@localhost/freshersworld_test` |

---

## Database Setup

The application creates its schema on startup via `initSchema()` (see [server/src/db/schema.ts](server/src/db/schema.ts)). The seed in [server/src/db/seed.ts](server/src/db/seed.ts) only runs when the `users` table is empty, so it is safe to leave enabled across restarts.

Tables created:

`users`, `companies`, `jobs`, `applications`, `bookmarks`, `job_alerts`, `company_reviews`, `courses`.

See [architecture.md](architecture.md) for column-level detail and foreign keys.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Run backend (tsx watch) and Vite dev server concurrently |
| `npm run dev:server` | Backend only |
| `npm run dev:client` | Frontend only |
| `npm run build` | Type-check, build the React bundle, compile the server |
| `npm run start` | Run the compiled production server |
| `npm run typecheck` | Type-check both `tsconfig.json` and `tsconfig.server.json` without emitting |
| `npm test` | Run the full Vitest suite (server + client) |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:server` | Server tests only |
| `npm run test:client` | Client tests only |
| `npm run test:coverage` | Run tests with v8 coverage |
| `npm run db:test:setup` | Drop & re-create `freshersworld_test` (requires `psql`) |

---

## Demo Accounts

All seeded accounts share the password **`password123`**.

| Role | Email |
|---|---|
| Job Seeker | `seeker1@gmail.com` |
| Job Seeker | `seeker2@gmail.com` |
| Employer (TCS) | `employer1@tcs.com` |
| Employer (Infosys) | `employer2@infosys.com` |
| Employer (Amazon) | `employer6@amazon.com` |
| Admin | `admin@freshersworld.com` |

The login page exposes quick-fill buttons for the most common demo accounts.

---

## API Reference

All endpoints are prefixed with `/api`. Errors are returned as JSON with the shape `{ "error": "<message>" }` and an appropriate HTTP status. List endpoints return `{ "<resource>": [...], "total": N, "page": N, "pages": N }`.

### Auth (`/api/auth`)
| Method | Path | Notes |
|---|---|---|
| POST | `/register` | Body: `email, password, name, role?, phone?, location?` |
| POST | `/login` | Body: `email, password`. Sets `token` cookie (HTTP-only, `SameSite=Lax`) |
| POST | `/logout` | Clears the cookie |
| GET | `/me` | Requires auth |

### Jobs (`/api/jobs`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `q, location, type, category, salary_min, salary_max, experience, featured, page, limit` |
| GET | `/categories` | Active-job counts grouped by category |
| GET | `/:id` | Returns `{ job, similar }`; increments view count |
| POST | `/` | Employer (or admin). Requires an existing company profile |
| PUT | `/:id` | Owner employer or admin only |
| DELETE | `/:id` | Owner employer or admin only; soft-deletes (`is_active = false`) |
| POST | `/:id/apply` | Jobseeker only. Returns 409 if already applied |
| POST | `/:id/bookmark` | Auth required. Toggles bookmark |

### Companies (`/api/companies`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `q, industry, page, limit` |
| GET | `/:id` | Returns `{ company, jobs, reviews }` |
| POST | `/` | Employer. One profile per employer |
| PUT | `/:id` | Owner employer or admin |
| POST | `/:id/reviews` | Jobseeker. One review per company per user; recomputes rating |

### Applications (`/api/applications`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Jobseekers see their own; employers see applications to their own jobs; admins see all |
| PUT | `/:id/status` | Owner employer or admin only. Statuses: `pending, reviewed, shortlisted, rejected, hired` |

### Users (`/api/users`)
| Method | Path | Notes |
|---|---|---|
| GET | `/me` | Same as `/auth/me` |
| PUT | `/me` | Updates safe profile fields |
| GET | `/me/bookmarks` | Paginated saved jobs |
| GET | `/me/alerts` | Job alerts |
| POST | `/me/alerts` | At least one filter must be supplied |
| DELETE | `/me/alerts/:id` | Owner only |

### Courses (`/api/courses`)
| Method | Path | Notes |
|---|---|---|
| GET | `/` | Query: `q, category, free, featured, page, limit` |
| GET | `/:id` | Single course |

### Misc
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | `{ "status": "ok" }` |

---

## Testing

The suite uses Vitest with two projects:

- **`server`** — Node environment, hits a real Postgres database via Supertest.
- **`client`** — jsdom environment, React Testing Library.

### Test database

Server tests run against `freshersworld_test`. Create it once:

```bash
npm run db:test:setup
# or manually:
# createdb -U postgres freshersworld_test
```

Set `TEST_DATABASE_URL` to override the default connection string.

### Running

```bash
npm test                  # everything
npm run test:server       # backend only
npm run test:client       # frontend only
npm run test:coverage     # with coverage report
```

The current suite contains **57 tests** covering:

- Auth: register, login, logout, `me`, validation, duplicate email, weak password, invalid email, invalid role, unauthorized access.
- Jobs: filtering, pagination clamping, garbage param handling, 404/400, ownership on update/delete, duplicate apply (409), bookmark toggle, role restrictions.
- Applications: jobseeker vs employer views, status validation, ownership enforcement on status updates.
- Health & 404 routes.
- Components: `ProtectedRoute` (loading/redirect/role), `Pagination` (a11y, callbacks), `Login` (validation + server errors), `Register` (inline validation, mismatched passwords), `JobsList` (loading / empty / list / preset type).

### Node 25 note

Node 25 introduced an experimental `localStorage` that conflicts with jsdom. The test setup at [`src/__tests__/setup.ts`](src/__tests__/setup.ts) installs a deterministic in-memory shim so tests run cleanly on both Node 20 and Node 25.

---

## Architecture

See [architecture.md](architecture.md) for a system diagram, schema reference, request-flow notes, and a list of design trade-offs.

A few notable choices:

- **Single Express app factory** (`server/src/app.ts`) is shared between production startup and tests, so test coverage exercises the same code path as production.
- **Central error handler** converts `HttpError` instances into consistent JSON responses; unhandled errors return 500 without leaking internals.
- **Parameterized queries** everywhere — there is no ORM and no string concatenation of user input into SQL.
- **Ownership checks** happen server-side for every mutation (job updates, deletes, application status changes, company edits, alert deletes). The frontend `roles` prop is a UX hint only.
- **Cookies** use `httpOnly: true`, `sameSite: 'lax'`, and `secure: true` in production.

---

## Known Limitations & Future Work

The project is intentionally scoped as a portfolio-quality clone. The following are known gaps and good targets for future work:

- **No real email delivery.** Job alerts are stored but never sent — a worker process and SMTP/SES integration would be needed.
- **Resume uploads** are URL-only (no file storage). Adding S3 or local disk upload + parsing is a natural extension.
- **No rate limiting** on auth endpoints — a small `express-rate-limit` policy would harden login against brute force.
- **JWT refresh** is not implemented — tokens are valid for 7 days and there is no rotation.
- **Search** uses `ILIKE` rather than a Postgres full-text or pgroonga index — adequate for the seed data, not for production scale.
- **CI** is not configured. A minimal GitHub Actions workflow could run `npm run typecheck` and `npm test` on every push.
- **i18n / localization** is not addressed.
- **Admin UI** is a stretch goal; the `admin` role exists and has broader server permissions, but no dedicated screens are built.

Contributions and refinements are welcome.
