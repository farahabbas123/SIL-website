# Step Into INTL Law — Project Documentation

**Step Into INTL Law (SIL) — Website & Backend**

| | |
|---|---|
| **Status** | Phase 1 in progress — core site + auth backend built |
| **Team** | Farah, Min *(Technology)* |
| **Last updated** | 2026 |

This document combines everything previously split across `SIL-Website-Spec.md`, the per-area READMEs and the backend goals brief into a single reference. Shorter task-focused docs live in [`README.md`](README.md), [`backend/README.md`](backend/README.md), and [`frontend/README.md`](frontend/README.md).

---

## Contents

1. [Website Overview](#1-website-overview)
2. [Website Navigation](#2-website-navigation)
3. [Backend Goals](#3-backend-goals)
4. [Postgraduate Opportunities Board](#4-postgraduate-opportunities-board)
5. [Data Structure](#5-data-structure)
6. [Contact Form](#6-contact-form)
7. [Authentication & Profile](#7-authentication--profile)
8. [Design System](#8-design-system)
9. [Project Structure](#9-project-structure)
10. [Running the Project](#10-running-the-project)
11. [How Sign-In Connects to the Frontend](#11-how-sign-in-connects-to-the-frontend)
12. [Development Priority](#12-development-priority)
13. [Notes / Next Steps](#13-notes--next-steps)

---

## 1. Website Overview

The Step Into INTL Law website gives students and graduates a single place to find international-law opportunities — scholarships, postgraduate study, careers, and community resources.

**Design direction:** clean and professional, following SIL branding, with **dark navy blue** as the primary colour and a **gold accent** for highlights, calls to action, and "closing soon" flags.

**Top priority:** a **Scholarships / Postgraduate Opportunities Board** where users can browse and filter opportunities, then click through to the official provider's website to apply.

> **Important:** Users never apply for scholarships *through* the SIL website. Applications are often long and provider-specific, so every listing links out to the official university or organisation page instead of hosting a form on-site.

---

## 2. Website Navigation

| Item | Notes |
|---|---|
| **Step Into INTL Law logo** | Links to homepage |
| **About Us** | Mission, values, team |
| **Portfolios** | Dropdown with three sub-pages: **Careers · Academic · Community** |
| **Jobs Board** | Graduate roles & internships |
| **Postgraduate Opportunities** | Scholarships board (see §4) |
| **Contact** | Contact form + details |
| **Sign In** | Opens auth UI — automatically becomes the user's name once signed in |
| **Join Us** | CTA — links to Contact / recruitment |

---

## 3. Backend Goals

The original brief for the backend, with current implementation status against each item.

### 3.1 Set up the backend server

| Task | Status |
|---|---|
| Create the backend project structure | ✅ Layered — `src/{config,db,lib,middleware,routes,modules}` (route → controller → service → repository → DB). Full tree + rationale in [`backend/README.md`](backend/README.md). |
| Set up the server using a framework | ✅ Node.js + Express 5 |
| Configure environment variables and server settings | ✅ `src/config/index.js` centralises every setting; `dotenv` loads `.env` (`.env.example` provided) |

`server.js` is thin — load `.env`, run pending migrations, listen. All wiring lives in `src/app.js`, imported directly by tests so no port is opened. Root `app.js` / `database.js` / `seed.js` remain as one-line shims for backward compatibility.

### 3.2 Create the API

Versioned under **`/api/v1`** (unversioned `/api` is an alias). Every response uses one envelope:

```jsonc
{ "success": true,  "data": { … }, "message"?: "…", "meta"?: { … } }
{ "success": false, "error": { "code": "…", "message": "…", "details"?: [ … ] } }
```

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` · `/api/v1/test` | No | Health checks |
| `POST` | `/api/v1/auth/register` | No | Create an account (also signs in) |
| `POST` | `/api/v1/auth/login` · `/logout` | No · session | Start / end a session |
| `POST` | `/api/v1/auth/password-reset` (+ `/confirm`) | No | Request a reset token, then set a new password |
| `POST` | `/api/v1/auth/verify-email` (+ `/confirm`) | session · No | Request an email-verification token, then confirm |
| `GET`/`PUT`/`PATCH`/`DELETE` | `/api/v1/users/me` | session | Fetch / update / delete own account |
| `PUT` | `/api/v1/users/me/password` | session | Change password (requires current password) |
| `GET` | `/api/v1/users` · `/users/:id` | admin | List / view users |
| `PATCH` | `/api/v1/users/:id/role` | admin | Set a user's role |
| `GET` | `/api/v1/opportunities` (+ `/:id`) | No | Public board; filters `?type=`, `?soon=true` |
| `POST`/`PUT`/`PATCH`/`DELETE` | `/api/v1/opportunities` (+ `/:id`) | admin | Manage listings |

All of `GET`, `POST`, `PUT`, `PATCH`, `DELETE` are implemented and covered by the test suites (`tests/auth.test.js`, `tests/opportunities.test.js`, `tests/users.admin.test.js` — 42 tests).

### 3.3 Database integration

| Task | Status |
|---|---|
| Choose and configure a database | ✅ SQLite via `better-sqlite3` (file-based, zero external services). Only the repository layer touches it, so a swap stays localised. |
| Design the tables | ✅ `users`, `opportunities`, `user_tokens`, `_migrations` — see §5 |
| Connect the backend to the database | ✅ `src/db/connection.js` (WAL + foreign keys on), configurable via `DB_FILE` |
| Migrations | ✅ `src/db/migrate.js` applies ordered `src/db/migrations/*.sql`; runs on `npm start` and `npm run migrate` |
| Seed / test data | ✅ `npm run seed` — idempotent test user, admin user, and ~6 sample opportunities |
| Implement CRUD operations | ✅ Users (register / fetch / update / password / delete) and Opportunities (list / get / create / update / delete), each split repository → service → controller |

### 3.4 Connect frontend → backend

| Task | Status |
|---|---|
| Replace hard-coded/mock data with real API requests | ✅ Sign in, sign up, and profile pages call `/api/v1/*`; site nav checks `/api/v1/users/me` on load |
| Send user input from forms to the backend | ✅ Sign up, sign in, profile edit, password change, delete account |
| Display backend responses on the frontend | ✅ Profile details, error messages (`error.message`), success confirmations |
| Handle loading and error states | ✅ "Loading your profile…" state, inline error banners, disabled/"Please wait…" buttons |

**Not yet connected to the backend:** the Contact form (§6) and the Postgraduate Opportunities board (§4). The board's `GET /api/v1/opportunities` endpoint now exists and is seeded — wiring `scholarships.html` to it (replacing the static rows) is the next step. See [§13](#13-notes--next-steps).

---

## 4. Postgraduate Opportunities Board

**Priority feature.**

The scholarship/opportunities board is built as a **reusable listing system** — not one-off HTML per scholarship — so new entries can be added by editing data, not code.

### Each listing includes

| Field | Example |
|---|---|
| `name` | Rhodes Scholarship |
| `location` | University of Oxford, UK |
| `type` | Postgraduate (Research) |
| `closingDate` | 3 August 2027 |
| `url` | Official provider application page |

### Filters

Users can filter the board by:

- All
- Undergraduate
- Postgraduate (Coursework)
- Postgraduate (Research)
- Short Course / Study Tour
- Other

### Behaviour

- Every card/row is fully clickable and opens the official provider website in a new tab.
- Listings closing soon are visually flagged using the SIL **gold accent** colour.

Currently the board reads from a static list in `scholarships.html`. Swapping this for real API data is a Phase 2 item — see §5.

---

## 5. Data Structure

Schema is defined by ordered migrations in `backend/src/db/migrations/`. Full column list in [`backend/README.md`](backend/README.md#database-schema).

### opportunities (backend — implemented)

```text
opportunities
├── id           — INTEGER pk
├── name         — TEXT
├── location     — TEXT
├── type         — TEXT, CHECK in (undergraduate | postgrad-coursework | postgrad-research | short-course | other)
├── closing_date — TEXT, ISO 'YYYY-MM-DD', nullable (rolling intake)
├── url          — TEXT, official provider page
├── created_by   — INTEGER, FK → users(id) ON DELETE SET NULL
├── created_at / updated_at — TEXT
```

`closingSoon` is **computed** by the API (within `SOON_THRESHOLD_DAYS`, default 30) — not stored. The frontend board still renders a static list in `scholarships.html`; pointing it at `GET /api/v1/opportunities` is the next step.

### users (backend — implemented)

```text
users
├── id             — INTEGER pk
├── name           — TEXT
├── email          — TEXT, unique
├── password_hash  — TEXT (bcrypt — never stored or returned in plain text)
├── role           — TEXT, 'user' | 'admin' (default 'user')
├── email_verified — INTEGER, 0 | 1
└── created_at / updated_at — TEXT
```

### user_tokens (backend — implemented)

Single-use, expiring tokens for password reset and email verification. Only the SHA-256 hash of each token is stored.

---

## 6. Contact Form

A front-end contact form with the following fields:

- Name
- Email
- Subject
- Message

On submit, an on-page confirmation message appears (no page reload).

**Current scope:** front-end only — no backend, no email delivery yet. Wiring it to a real inbox or an `/api/contact` endpoint is a Phase 2 item.

---

## 7. Authentication & Profile

### Sign in / Create account (`signin.html`)

- **Sign In** tab and **Create Account** tab
- Real requests to `POST /api/login` and `POST /api/signup`
- Inline error messages (wrong password, duplicate email, password too short, etc.)
- Redirects to `profile.html` on success — and redirects there automatically if a session already exists
- **Google Sign-In** button remains a visual OAuth placeholder (not wired up)
- A test account is pre-seeded for convenience — see §10

### Profile page (`profile.html`)

Added once auth was working, per the brief: *"once the sign-in passes, I want a profile page for the user which shows user detail and allows the user to change password and other information."*

- Loads the signed-in user via `GET /api/profile`; redirects to `signin.html` if there's no valid session
- **Profile details** card — edit name and email (`PUT`/`PATCH /api/profile`)
- **Change password** card — current password + new password + confirm (`PUT /api/profile/password`)
- **Danger zone** — delete account (`DELETE /api/profile`), with a confirmation prompt
- **Sign out** button (`POST /api/logout`)
- The site nav shows the user's first name instead of "Sign In" whenever a session is active (checked in `main.js` on every page)

---

## 8. Design System

Keeping these consistent across every page keeps the site feeling like one product instead of several separate pages.

| Token | Value | Use |
|---|---|---|
| Navy 950 | `#060c1e` | Page background |
| Navy 900 | `#0a1229` | Section background (alt) |
| Navy 800 | `#0e1c3f` | Card hover / panel |
| Navy 700 | `#152a56` | Borders on dark panels |
| Ivory | `#eef1f7` | Primary text |
| Ivory Dim | `#b9c3d9` | Secondary/body text |
| Gold | `#c9a227` | Accent, CTAs, "closing soon" flag |
| Display font | Fraunces | Headings |
| Body font | Inter | Paragraphs, UI text |
| Mono/label font | IBM Plex Mono | Eyebrows, tags, nav labels |

---

## 9. Project Structure

```text
SIL-website/
├── README.md                — quickstart + doc map
├── PROJECT-DOCS.md          — this file
├── SIL-Website-Spec.md      — original website specification
├── frontend/
│   ├── README.md             Frontend guide (pages, JS, API calls)
│   ├── index.html            Homepage
│   ├── about.html            About Us
│   ├── portfolios.html       Portfolios (Careers / Academic / Community)
│   ├── scholarships.html     Postgraduate Opportunities board
│   ├── contact.html          Contact form
│   ├── signin.html           Sign In / Create Account
│   ├── profile.html          Profile — view/edit details, change password, delete account
│   ├── styles.css            Shared design system + all page styles
│   ├── main.js               Shared behaviour (nav, filters, contact form, animations, auth-aware nav)
│   ├── signin.js              Sign in / sign up API calls
│   └── profile.js             Profile page API calls
└── backend/
    ├── README.md              Backend guide (architecture, API, schema, troubleshooting)
    ├── server.js              Entry: load .env → run migrations → listen
    ├── app.js / database.js / seed.js   thin back-compat shims → src/
    ├── src/
    │   ├── app.js             Express assembly (middleware → routes → 404 → errors)
    │   ├── config/            All env-derived settings
    │   ├── db/                connection, migrate.js, migrations/*.sql, seed.js
    │   ├── lib/               ApiError, response envelope, asyncHandler, mailer
    │   ├── middleware/        cors, requestLogger, requireAuth, requireRole, validate, errorHandler
    │   ├── routes/            v1 router (mounts modules + /health)
    │   └── modules/
    │       ├── auth/          register / login / logout / password-reset / verify-email
    │       ├── users/         /me self-service + admin management  (model·repo·service·controller)
    │       └── opportunities/ public board + admin CRUD           (model·repo·service·controller)
    ├── package.json / package-lock.json / .env.example
    └── tests/                 auth · opportunities · users.admin  (42 tests)
```

Every `.html` file links to `styles.css` and its JS via relative paths, so the `frontend/` folder must stay together. The backend serves `frontend/` directly, so in normal use only one server needs to run.

---

## 10. Running the Project

**Requires Node.js 22 LTS or newer** (Node 24 recommended). `better-sqlite3@13` bundles N-API prebuilt binaries, so no compiler is needed — but `npm install` still runs an implicit `node-gyp` build that fails without a C++ toolchain. On Windows, install with:

```bash
cd backend
npm install --ignore-scripts
```

`--ignore-scripts` skips that build; the bundled prebuilt (and `bcrypt`'s) load fine at runtime. Other install failures (broken global `npm`, wrong Node version) are covered in [`backend/README.md`](backend/README.md#troubleshooting).

### Configure environment variables

```bash
cp .env.example .env
```

Defaults work for local development — adjust `SESSION_SECRET` before deploying. Full variable list in `.env.example`.

### Seed the database

```bash
npm run seed
```

Idempotent. Creates:

| Email | Password | Role |
|---|---|---|
| `1@gmail.com` | `1` | user |
| `admin@sil.test` | `admin1234` | admin |

…plus ~6 sample opportunities. Dev convenience only — `/api/v1/auth/register` still enforces an 8-character minimum.

### Run the server

```bash
npm start
```

Applies any pending migrations, then serves the frontend *and* the API at **http://localhost:3000** from the same origin. (`npm run dev` adds `--watch`.)

### Run the tests

```bash
npm test
```

42 Jest + Supertest tests across `tests/auth.test.js`, `tests/opportunities.test.js`, and `tests/users.admin.test.js`, each against a fresh in-memory database — covering register/login/logout, the profile lifecycle (`PUT`/`PATCH`/`DELETE`), password change, password reset, opportunity CRUD with `type`/`soon` filters, role enforcement (`401`/`403`), and the standard error envelope.

---

## 11. How Sign-In Connects to the Frontend

1. `signin.html` posts to `/api/v1/auth/register` or `/api/v1/auth/login`. On success the server starts a cookie session and the page redirects to `profile.html`.
2. `profile.html` calls `GET /api/v1/users/me` on load. If there's no valid session, it redirects back to `signin.html`.
3. From the profile page, users can update their name/email (`PUT`/`PATCH /api/v1/users/me`), change their password (`PUT /api/v1/users/me/password`), delete their account (`DELETE /api/v1/users/me`), or sign out (`POST /api/v1/auth/logout`).
4. Every other page checks `/api/v1/users/me` in the background and swaps the nav's "Sign In" link for the user's first name when a session is active.
5. Responses follow the standard envelope, so the frontend reads `body.data.user` on success and `body.error.message` on failure.

---

## 12. Development Priority

### Phase 1 — Core Website

1. ✅ Responsive website structure
2. ✅ Navigation and routing
3. ✅ Homepage
4. ✅ About Us
5. ✅ Portfolio pages
6. ✅ Jobs Board
7. ✅ **Postgraduate Opportunities Board** (static data)
8. ✅ Filtering functionality
9. ✅ External opportunity links
10. ✅ Contact form (front-end only)
11. ✅ Sign In / Create Account UI — **now connected to a real backend**
12. ✅ Profile page (view/edit details, change password, delete account)
13. ✅ Backend server, database, and REST API (§3)

### Phase 2 — Future Development

1. Persistent session store (see §13) for production deployment
2. Move opportunities (§4) into the database, served via `GET /api/opportunities`
3. Admin management system for adding/editing opportunities
4. Opportunity submission form (for organisations/universities)
5. Wire the Contact form to a real endpoint / email delivery
6. Advanced filtering (domestic-only, age, etc.)
7. Interactive map (jobs + scholarships by location)
8. Real Google OAuth (currently a placeholder button)
9. Additional scholarship resources ("find out more" / tips & tricks pages)

---

## 13. Notes / Next Steps

- **Sessions** currently use Express's default in-memory store — fine for development, but swap in a persistent store (e.g. `connect-sqlite3`, Redis) before deploying, since restarting the server logs everyone out.
- Set a real, unique `SESSION_SECRET` in `.env` before deploying anywhere public — never reuse the example value.
- `database.db` is created automatically in `backend/` on first run; it's git-ignored, so each environment starts fresh unless you run `npm run seed` again.
- The Postgraduate Opportunities board and Contact form are the two remaining pieces of the frontend still using static/front-end-only data — natural next targets now that the auth backend pattern (routes → tests → frontend fetch calls) is established.
