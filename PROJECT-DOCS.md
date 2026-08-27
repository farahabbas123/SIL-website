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
| Create the backend project structure | ✅ `backend/` — `app.js`, `server.js`, `database.js`, `seed.js`, `tests/` |
| Set up the server using a framework | ✅ Node.js + Express |
| Configure environment variables and server settings | ✅ `dotenv` loads a `.env` file (`.env.example` provided) for `PORT`, `SESSION_SECRET`, `DB_FILE`, `NODE_ENV` |

`server.js` is intentionally thin — it just loads environment variables and starts listening. All routes live in `app.js` so the app can be imported directly into tests without opening a real port.

### 3.2 Create the API

REST endpoints for the frontend, returning consistent JSON (`{ message }`, `{ error }`, or `{ user }` / `{ user, message }` shapes throughout).

| Method | Endpoint | Auth required | Purpose |
|---|---|---|---|
| `GET` | `/api/test` | No | Health check |
| `POST` | `/api/signup` | No | Create an account (also signs the user in) |
| `POST` | `/api/login` | No | Sign in |
| `POST` | `/api/logout` | Yes | End the session |
| `GET` | `/api/profile` | Yes | Fetch the signed-in user's own record |
| `PUT` / `PATCH` | `/api/profile` | Yes | Update name / email (both methods share one handler) |
| `PUT` | `/api/profile/password` | Yes | Change password (requires current password) |
| `DELETE` | `/api/profile` | Yes | Delete the account and end the session |

All of `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` are implemented and covered by tests.

### 3.3 Database integration

| Task | Status |
|---|---|
| Choose and configure a database | ✅ SQLite via `better-sqlite3` (file-based, zero external services) |
| Design the required tables | ✅ `users` table — see §5 |
| Connect the backend to the database | ✅ `database.js`, configurable via `DB_FILE` |
| Implement CRUD operations | ✅ **Create** (signup), **Read** (profile fetch, login lookup), **Update** (profile edit, password change), **Delete** (account deletion) |

### 3.4 Connect frontend → backend

| Task | Status |
|---|---|
| Replace hard-coded/mock data with real API requests | ✅ Sign in, sign up, and profile pages call the real API; site nav checks `/api/profile` on load |
| Send user input from forms to the backend | ✅ Sign up, sign in, profile edit, password change, delete account |
| Display backend responses on the frontend | ✅ Profile details, error messages, success confirmations |
| Handle loading and error states | ✅ "Loading your profile…" state, inline error banners, disabled/"Please wait…" buttons during submission |

**Not yet connected to the backend:** the Contact form (§6) and the Postgraduate Opportunities board (§4) still use front-end-only logic / static data — see [§13 Notes / Next Steps](#13-notes--next-steps).

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

### Opportunities (frontend — currently static)

```text
Opportunity
├── name          — string
├── location      — string
├── type          — enum (undergraduate | postgrad-coursework | postgrad-research | short-course | other)
├── closingDate   — string (display) or ISO date (for sorting/soon-flag logic)
└── url           — string (absolute URL)
```

**v1:** static data (hard-coded in `scholarships.html`).
**v2:** move into the database and serve via a `GET /api/opportunities` endpoint (see §13).

### Users (backend — implemented)

```text
users
├── id             — INTEGER, primary key, autoincrement
├── name           — TEXT, required
├── email          — TEXT, required, unique
└── password_hash  — TEXT, required (bcrypt, 12 rounds — never stored or returned in plain text)
```

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
    ├── README.md              Backend guide (setup, API, troubleshooting)
    ├── app.js                 Express app + all routes
    ├── server.js               Loads .env and starts the server
    ├── database.js              SQLite connection + schema
    ├── seed.js                   Creates the test account
    ├── package.json
    ├── package-lock.json
    ├── .env.example
    └── tests/
        └── auth.test.js         21-test Jest + Supertest suite
```

Every `.html` file links to `styles.css` and its JS via relative paths, so the `frontend/` folder must stay together. The backend serves `frontend/` directly, so in normal use only one server needs to run.

---

## 10. Running the Project

**Requires Node.js 22 LTS or newer** — `better-sqlite3@13` declares `engines.node >= 22` and neither builds nor runs on older Node.

### Install dependencies

```bash
cd backend
npm install
```

> Install failing? Most causes (wrong Node version, a broken global `npm`, native-build errors) are covered in the Troubleshooting section of [`backend/README.md`](backend/README.md#troubleshooting).

### Configure environment variables

```bash
cp .env.example .env
```

Defaults work fine for local development — adjust `SESSION_SECRET` before deploying anywhere real.

### Create the test account

```bash
npm run seed
```

Creates a sign-in-ready account:

| Email | Password |
|---|---|
| `1@gmail.com` | `1` |

This is a dev convenience only — the `/api/signup` form still enforces an 8-character minimum for real accounts.

### Run the server

```bash
npm start
```

Open **http://localhost:3000** — this serves the frontend *and* the API from the same origin.

### Run the backend tests

```bash
npm test
```

Runs a 21-test Jest + Supertest suite against an isolated in-memory database (`tests/auth.test.js`), covering signup, login, logout, profile fetch/update (`PUT` and `PATCH`), password change, and account deletion — including failure cases (wrong password, duplicate email, short password, unauthenticated requests).

---

## 11. How Sign-In Connects to the Frontend

1. `signin.html` posts to `/api/signup` or `/api/login`. On success the server starts a cookie session and the page redirects to `profile.html`.
2. `profile.html` calls `GET /api/profile` on load. If there's no valid session, it redirects back to `signin.html`.
3. From the profile page, users can update their name/email (`PUT`/`PATCH /api/profile`), change their password (`PUT /api/profile/password`), delete their account (`DELETE /api/profile`), or sign out (`POST /api/logout`).
4. Every other page checks `/api/profile` in the background and swaps the nav's "Sign In" link for the user's first name when a session is active.

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
