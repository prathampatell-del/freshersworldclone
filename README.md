# FreshersWorld Clone

A full-stack clone of [Freshersworld.com](https://www.freshersworld.com) — India's leading job portal for fresh graduates, students, and early-career professionals.

---

## Features

### For Job Seekers
- Search and filter jobs by title, location, category, salary, and experience
- Browse internships, walk-in drives, and government jobs
- Apply to jobs with a cover letter
- Save jobs to bookmarks
- Track application status in real time
- Set up job alerts by keyword, category, or location
- Write company reviews and read ratings

### For Employers
- Post job listings with full details (skills, salary, deadline, openings)
- Manage incoming applications
- Update applicant status (pending → reviewed → shortlisted → hired → rejected)
- View applicant profiles, contact details, and cover letters

### General
- Company profiles with open jobs, ratings, and employee reviews
- Courses & certifications directory
- Responsive design — works on mobile and desktop
- JWT authentication with role-based access (jobseeker / employer / admin)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Database | PostgreSQL (via node-postgres) |
| Auth | JWT stored in HTTP-only cookies |
| Icons | Lucide React |
| Routing | React Router v6 |
| HTTP Client | Axios |

---

## Project Structure

```
freshersworld-clone/
├── src/                    # React frontend source
│   ├── api/                # Axios API client + per-resource functions
│   ├── components/         # Shared UI components
│   │   ├── layout/         # Navbar, Footer
│   │   └── ui/             # Badge, Pagination, Toast, Skeleton
│   ├── contexts/           # AuthContext (auth state + JWT)
│   ├── pages/              # Route-level pages
│   │   ├── auth/           # Login, Register
│   │   ├── dashboard/      # Jobseeker dashboard pages
│   │   └── employer/       # Employer dashboard pages
│   └── types/              # Shared TypeScript interfaces
├── server/                 # Express backend
│   └── src/
│       ├── db/             # PostgreSQL schema + seed data
│       ├── middleware/     # JWT auth middleware
│       └── routes/         # API route handlers
├── public/                 # Static assets
├── index.html              # Vite entry point
├── package.json            # Single package.json for the whole project
├── vite.config.ts          # Vite config with API proxy
├── tsconfig.json           # TypeScript config for frontend
└── tsconfig.server.json    # TypeScript config for server
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+

### Installation

```bash
git clone <your-repo-url>
cd freshersworld-clone
npm install
```

### Running in Development

```bash
npm run dev
```

This starts both the backend (port `3001`) and frontend (port `5173`) together.

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001/api |

> The database is created and seeded automatically on first run.

### Individual Commands

```bash
npm run dev:server   # Backend only
npm run dev:client   # Frontend only
npm run build        # Production build
npm run start        # Run production server
```

---

## Demo Accounts

All demo accounts use the password: **`password123`**

| Role | Email |
|---|---|
| Job Seeker | seeker1@gmail.com |
| Employer (TCS) | employer1@tcs.com |
| Employer (Infosys) | employer2@infosys.com |
| Employer (Amazon) | employer6@amazon.com |

---

## API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account (jobseeker or employer) |
| POST | `/api/auth/login` | Login, returns JWT cookie |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |

### Jobs
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs` | List/search jobs (filters: q, location, type, category, salary, experience) |
| GET | `/api/jobs/:id` | Job detail + similar jobs |
| POST | `/api/jobs` | Post a job (employer) |
| PUT | `/api/jobs/:id` | Update job (employer) |
| POST | `/api/jobs/:id/apply` | Apply to a job (jobseeker) |
| POST | `/api/jobs/:id/bookmark` | Toggle bookmark |

### Companies
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/companies` | List companies |
| GET | `/api/companies/:id` | Company profile + jobs + reviews |
| POST | `/api/companies` | Create company profile (employer) |
| POST | `/api/companies/:id/reviews` | Submit a review |

### Applications
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/applications` | My applications (jobseeker) or received (employer) |
| PUT | `/api/applications/:id/status` | Update status (employer) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Get profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users/me/bookmarks` | Saved jobs |
| GET | `/api/users/me/alerts` | Job alerts |
| POST | `/api/users/me/alerts` | Create alert |
| DELETE | `/api/users/me/alerts/:id` | Delete alert |

### Courses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List/filter courses |
| GET | `/api/courses/:id` | Course detail |

---

## Seeded Data

The database is pre-populated with realistic data on first run:

- **20 jobs** across IT, Analytics, Finance, Marketing, HR, Banking, BPO — including full-time, internships, walk-ins, and government roles
- **7 companies** — TCS, Infosys, Wipro, HCL, Cognizant, Amazon, Flipkart
- **10 courses** — from Udemy, Coursera, Google, AWS, NPTEL
- Sample applications, bookmarks, and company reviews

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost/freshersworld
JWT_SECRET=your_secret_key_here
PORT=3001
```

Create the database before first run:

```bash
createdb freshersworld
# or: sudo -u postgres createdb freshersworld
```

---

## Pages

| Route | Description |
|---|---|
| `/` | Home — hero search, featured jobs, companies, courses |
| `/jobs` | Job listings with search and filters |
| `/jobs/:id` | Job detail with apply flow |
| `/internships` | Internship listings |
| `/walkin` | Walk-in drive listings |
| `/govt-jobs` | Government job listings |
| `/companies` | Company directory |
| `/companies/:id` | Company profile |
| `/courses` | Courses & certifications |
| `/login` | Login |
| `/register` | Register as jobseeker or employer |
| `/dashboard` | Jobseeker dashboard |
| `/dashboard/applications` | Application tracker |
| `/dashboard/bookmarks` | Saved jobs |
| `/dashboard/alerts` | Job alert management |
| `/employer/dashboard` | Employer dashboard |
| `/employer/post-job` | Post a new job |
| `/employer/applications` | Manage received applications |
| `/profile` | Edit profile |
