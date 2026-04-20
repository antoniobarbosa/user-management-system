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
- **Session-based auth**: the browser stores the session id in an **HttpOnly cookie** (same-site requests use **`credentials: 'include'`**); the backend reads **`Cookie`** first, then optional **`x-session-id`** for API clients.
- **Next.js rewrites** (`/api/*` → `API_URL/api/*`) so the browser talks to the same origin as the app, **avoiding CORS** for normal browser usage. The backend can still enforce **`CORS_ORIGIN`** for direct API access.

### Spec compliance notes

A few non-obvious design choices are **direct readings of the challenge spec** rather than REST conventions. Calling them out here so they are easy to evaluate:

- **Sign-up returns `{ user, session }` and sets the cookie in the same request.** The spec states *"after signing-in, or **signing-up**, a user session should be established"* and *"consider the id received in the **sign in/sign up response** as an actual session identifier"*. Splitting this into a separate `POST /sessions` would violate the contract and break the Part 1 auto-login flow.
- **`x-session-id` header is accepted alongside the cookie.** The spec literally says *"all further requests to the backend should include the given identifier"*. The header is the canonical transport for non-browser clients; the HttpOnly cookie is an **additional** security layer for the SPA, not a replacement.
- **`POST /api/users` serves both sign-up and admin user-creation.** Part 0 lists *"Create a new user"* as a domain functionality, Part 1 requires sign-up to establish a session, and Part 2 requires the admin dashboard to create users **without being logged out**. The endpoint detects an existing session cookie and only issues a new session when no operator is authenticated, so a single endpoint satisfies all three requirements coherently.
- **No `PATCH /api/users/me/email`.** The spec does not include a change-email use case; the `UserEmail` child entity is already modelled to support one when the product calls for it.

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

Base path: **`/api`** (and **`/health`**).

**Session (browser):** successful **`POST /api/users`** (sign-up, when no session cookie is already present) and **`POST /api/auth/signin`** set an **HttpOnly** session cookie (`__Host-session` in production with **Secure**; plain `session` in local dev over HTTP). The SPA sends **`credentials: 'include'`** so the cookie is attached automatically. The **`x-session-id`** header is still accepted **as required by the spec** (*"all further requests to the backend should include the given identifier"*) and remains the transport for non-browser API clients.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | No | Health check. |
| `POST` | `/api/users` | No | Register a new user (sign-up) **and** establish a session in the same request, as required by the spec (*"after signing-up, a user session should be established"*, *"the id received in the sign-up response is the session identifier"*). Response body: **`{ user, session }`** — `session` is `null` when the new user is **inactive** (e.g. operator-created). A session **cookie** is set only when a new session is created **and** the request did not already carry a session cookie (so admins creating users from the dashboard are not logged out). |
| `POST` | `/api/auth/signin` | No | Sign in with email and password; returns session JSON and sets the session **cookie**. |
| `GET` | `/api/users/me` | Yes | Returns the authenticated user (from session cookie or `x-session-id`). |
| `GET` | `/api/users` | Yes | List users. Query: **`page`** (default `1`), **`limit`** (default `6`). Response includes `data` and `meta` (pagination). |
| `GET` | `/api/users/:id` | Yes | Get a single user by id. |
| `PATCH` | `/api/users/:id` | Yes | Update user fields (name, status, login counter, etc.). |
| `DELETE` | `/api/users/:id` | Yes | Delete a user. |
| `DELETE` | `/api/sessions/current` | Yes | Terminate the **current** session (from cookie / header) and clear the session cookie. |
| `DELETE` | `/api/sessions/:id` | Yes | Terminate a session by id; clears the cookie when it matches the current session. |
| `DELETE` | `/api/test/cleanup` | No* | Deletes all users whose email ends with `@e2e.test`. **Only registered when `NODE_ENV=test`.** |

\*Intended for automated e2e cleanup, not for production.

## Future Improvements

This section lists **conscious tradeoffs** rather than forgotten work. For each item the rationale (scope, spec, or layer ownership) is stated explicitly, followed by what a production rollout would look like.

### Security & Auth

- **Rate limiting on sign-in.** Not implemented at the app layer because brute-force protection is a **cross-cutting infrastructure concern** better solved at the edge (API gateway, WAF, or a plugin like `@fastify/rate-limit` fronted by Redis) so that limits are shared across horizontally-scaled instances. Implementing it in-process with an in-memory counter would give a false sense of security and would not survive a restart or a second replica.
- **CSRF protection.** Skipped because the threat model is a **same-origin admin panel**: the SPA reaches the API through a Next.js rewrite, and the session cookie is set with **`SameSite=Lax`** and the **`__Host-`** prefix, which already blocks cross-site form posts for state-changing requests. A double-submit token or `@fastify/csrf-protection` would be added the moment the API is consumed from a different origin or embedded in third-party surfaces.
- **Session expiration (idle / absolute TTL).** The spec defines `createdAt` and `terminatedAt` only, so the domain model reflects that. Expiry is currently enforced at the **cookie layer** via `maxAge`; a production-ready version would add an `expiresAt` column plus a sweeper job (or a Redis TTL) and reject expired sessions in the auth middleware.
- **Role-based access control (RBAC).** The spec explicitly states **“assume the logged-in user is an administrator”**, so modelling roles and permissions would be scope creep. The hook already exists: the auth middleware attaches `request.session` to the request, so gating routes with a `requireRole("admin")` decorator is a small addition once roles become a real requirement.
- **HttpOnly cookie + `x-session-id` hybrid.** The browser session lives in an **HttpOnly, Secure, SameSite=Lax** cookie, which is the right default for a web SPA. The `x-session-id` header is accepted as a fallback so the same API can serve non-browser clients (CLI, tests, mobile) without them needing to manage cookie jars, and so **local development across ports** (frontend `3000`, backend `3001`) keeps working when browsers refuse cross-port cookies. In production behind a single origin, the cookie path is the one exercised.

### Architecture & Code Quality

- **Schema validation at the HTTP boundary.** Deliberately not added (e.g. Zod/`@fastify/type-provider`) because validation already lives in the **application layer validators** and in the **`Email` value object**, keeping a single source of truth for domain invariants. A JSON-Schema layer at the route level would add a second place to keep in sync; it would pay off once the API is published to external clients and OpenAPI generation becomes a requirement.
- **Integration tests for repositories.** Current coverage is **Vitest** units over domain/application and **Playwright E2E** over the HTTP boundary end-to-end, which brackets the repository layer from both sides. A Testcontainers-based integration suite against real Postgres would be the next step to catch Prisma-mapping regressions that mocks cannot see; it was deferred to keep the test matrix fast in CI.
- **Email update flow.** The spec covers sign-up, sign-in, list, edit profile fields, and delete — **no change-email use case**. The domain is already prepared for it (`UserEmail` is modelled as a separate aggregate child with `isPrimary`), so adding a verify-then-swap flow is mechanical once the product calls for it.
- **Frontend component tests (React Testing Library).** E2E already asserts user-visible behaviour; component tests would give faster feedback on presentational logic and would be the next addition as the UI grows.

### Scalability & Operations

- JWT with refresh tokens (if stateless sessions become a requirement across multiple services).
- Data Mapper layer to fully decouple domain entities from Prisma-shaped rows.
- Unit of Work pattern for multi-aggregate transactions.
- OAuth providers (Google, etc.).
- Sortable columns and server-side filtering in the user table.
- Kubernetes deployment (replacing the single-droplet Compose setup) once horizontal scale is needed.
