# Back-office User Management System

## Overview

This project is a **back-office web application** for managing users: create accounts, list and paginate users, edit profiles and status, and remove users. It includes a **session-based authentication** flow (sign-up, sign-in, sign-out) and a dashboard built for operators.

The codebase is a **monorepo** with a **Fastify + Prisma** API and a **Next.js** SPA. The backend follows **DDD** (domain, application, infrastructure layers) and is covered by **Vitest** unit tests; the frontend uses **Playwright** for end-to-end tests.

## Live Demo

https://usermgmt.antoniobarbosa.me

## Tech Stack

### Backend

- Node.js 22, TypeScript 5, Fastify
- Prisma ORM + PostgreSQL
- DDD (Domain-Driven Design)
- TDD (Test-Driven Development)
- Vitest (unit tests)

### Frontend

- Next.js 15 (App Router)
- TypeScript, Tailwind CSS
- Zustand (state management)
- Playwright (e2e tests)

### Infrastructure

- Docker + Docker Compose
- DigitalOcean Droplet
- Cloudflare (SSL/DNS)
- GitHub Actions (CI/CD)

## Architecture

The backend is organised in three layers:

| Layer | Responsibility |
|--------|------------------|
| **Domain** | Entities, value objects, domain errors, and **repository interfaces** (no framework imports). |
| **Application** | Use cases implemented as **services** (e.g. `UserService`, `SessionService`), orchestrating domain rules and repositories. |
| **Infrastructure** | **Concrete repositories** (Prisma), HTTP controllers/routes, middleware (auth, errors), and database connection. |

**Key decisions**

- **User as aggregate root** with owned **UserEmail** records (primary email and uniqueness enforced at the persistence layer).
- **Email** modelled as a **value object** in the domain where validation and invariants apply.
- **Repository pattern** so application code depends on interfaces; Prisma stays in infrastructure.
- **Session-based auth**: the client sends **`x-session-id`** on API requests; the backend resolves the session and user.
- **Next.js rewrites** (`/api/*` → `API_URL/api/*`) so the browser talks to the same origin as the app, **avoiding CORS** for normal browser usage. The backend can still enforce **`CORS_ORIGIN`** for direct API access.

## Getting Started

### Prerequisites

- **Node.js 22+**
- **Docker** and **Docker Compose** (recommended for Postgres and full stack)

### Running with Docker (recommended)

```bash
cp .env.example .env
# Edit .env: DB_USER, DB_PASSWORD, PORT, API_URL, CORS_ORIGIN (see below)
docker compose up --build
```

- **Frontend**: mapped to port **80** → `http://localhost` (see `docker-compose.yml`).
- **Backend API**: host port defaults to **`PORT`** (e.g. `3001`).
- **Database**: Postgres runs **only on the internal Docker network** (no host port published).

### Running locally (development)

**1. Database**

Run Postgres (Docker example):

```bash
docker run --name usermgmt-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=usermgmt -p 5432:5432 -d postgres:16-alpine
```

**2. Backend**

```bash
cd backend
cp .env.example .env   # set DATABASE_URL, etc.
npm install
npx prisma migrate dev  # first time / schema changes
npm run dev
```

**3. Frontend**

```bash
cd frontend
# e.g. echo 'API_URL=http://localhost:3001' > .env.local
npm install
npm run dev
```

Open `http://localhost:3000` (or the port Next.js prints).

## Environment Variables

Values in **`.env.example`** at the repo root are intended for **Docker Compose** (copy to `.env` in the same directory).

| Variable | Description |
|----------|-------------|
| `DB_USER` | PostgreSQL user created in the `db` service. |
| `DB_PASSWORD` | PostgreSQL password for `DB_USER`. |
| `PORT` | Host and container port for the **backend** HTTP server (default `3001` in Compose). |
| `API_URL` | Base URL the **frontend** uses at build/runtime to proxy `/api` (e.g. `http://backend:3001` inside Compose). |
| `CORS_ORIGIN` | Allowed browser origin(s) for the API when called **directly**; comma-separated list if multiple. |

Compose also interpolates **`POSTGRES_DB`** (optional; defaults to `usermgmt`) and builds **`DATABASE_URL`** for the backend from `DB_USER`, `DB_PASSWORD`, and the database name.

For **local backend** development, use **`backend/.env`** (see `backend/.env.example`) with a `DATABASE_URL` pointing at your Postgres instance.

For **local frontend** development, set **`API_URL`** in **`frontend/.env.local`** so `next.config.ts` can configure the `/api` rewrite.

## Testing

### Unit tests (backend)

```bash
cd backend && npm test
```

### E2E tests (frontend)

```bash
cd frontend && npm run test:e2e
```

**Note:** Playwright can start the Next.js dev server from `playwright.config.ts`. The **API** must be reachable at the URL configured for the tests (typically `http://localhost:3001`). For optional **e2e DB cleanup**, run the backend with **`NODE_ENV=test`** so `DELETE /api/test/cleanup` is registered (see backend `index.ts`).

## CI/CD

| Workflow | When | What it does |
|----------|------|----------------|
| **CI** (`.github/workflows/ci.yml`) | Every **push** and **pull_request** on any branch | Backend `npm install`, **`npm test`**, then **Docker builds** for backend and frontend images. |
| **CD** (`.github/workflows/cd.yml`) | After **CI succeeds** on a **push** to **`main`** | SSH to the DigitalOcean droplet (via `appleboy/ssh-action`), **`git pull origin main`**, **`docker compose up -d --build`**. |

Configure GitHub **secrets**: `DROPLET_HOST`, `DROPLET_USER`, `DROPLET_SSH_KEY`. Adjust the deploy script path in `cd.yml` if the repo is not cloned at `~/user-management-system` on the server.

## API Endpoints

Base path: **`/api`** (and **`/health`**). Protected routes expect header **`x-session-id: <session-id>`** unless noted.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check. |
| `POST` | `/api/users` | No | Register a new user (sign-up). |
| `POST` | `/api/auth/signin` | No | Sign in with email and password; returns a new session. |
| `POST` | `/api/sessions` | No | Create a session for a given `userId` (used after sign-up). |
| `GET` | `/api/users` | Yes | List users. Query: **`page`** (default `1`), **`limit`** (default `6`). Response includes `data` and `meta` (pagination). |
| `GET` | `/api/users/:id` | Yes | Get a single user by id. |
| `PATCH` | `/api/users/:id` | Yes | Update user fields (name, status, login counter, etc.). |
| `DELETE` | `/api/users/:id` | Yes | Delete a user. |
| `DELETE` | `/api/sessions/:id` | Yes | Terminate (invalidate) a session. |
| `DELETE` | `/api/test/cleanup` | No* | Deletes all users whose email ends with `@e2e.test`. **Only registered when `NODE_ENV=test`.** |

\*Intended for automated e2e cleanup, not for production.

## Future Improvements

- JWT with refresh tokens
- Session expiration
- OAuth providers (Google)
- Data Mapper layer to decouple domain from Prisma
- Unit of Work pattern for multi-aggregate transactions
- Integration tests for repositories
- React Testing Library for component tests
- Sortable columns in user table
- Role-based access control
- Kubernetes deployment for production scale
- Rate limiting on sign-in endpoint
