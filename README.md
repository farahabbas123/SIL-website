# Step Into INTL Law — Web

```
web/
├── frontend/     Static site (HTML, CSS, JS) — served by the backend
└── backend/      Express + SQLite API (auth, sessions, profile)
```

The backend serves the frontend directly, so in normal use you only run **one** server.

## 1. Install dependencies

```bash
cd web/backend
npm install
```

> If `npm install` fails while building `better-sqlite3` or `bcrypt` (native modules), retry with:
> `npm install --ignore-scripts` — both ship prebuilt binaries, so the build step usually isn't needed.

## 2. Create the test account

```bash
npm run seed
```

Creates a sign-in-ready account:

| Email | Password |
|---|---|
| `1@gmail.com` | `1` |

This is a dev convenience only — the `/api/signup` form still enforces an 8-character minimum for real accounts.

## 3. Run the server

```bash
npm start
```

Open **http://localhost:3000** — this serves the frontend *and* the API from the same origin.

## 4. Run the backend tests

```bash
npm test
```

Runs an 18-test Jest + Supertest suite against an isolated in-memory database (`tests/auth.test.js`), covering signup, login, logout, profile fetch/update, and password change — including the failure cases (wrong password, duplicate email, short password, unauthenticated requests).

## How sign-in connects to the frontend

1. `signin.html` posts to `/api/signup` or `/api/login`. On success the server starts a cookie session and the page redirects to `profile.html`.
2. `profile.html` calls `GET /api/profile` on load. If there's no valid session, it redirects back to `signin.html`.
3. From the profile page, users can update their name/email (`PUT /api/profile`) or change their password (`PUT /api/profile/password`), and sign out (`POST /api/logout`).
4. Every other page checks `/api/profile` in the background and swaps the nav's "Sign In" link for the user's first name when a session is active.

## Notes / next steps

- Sessions currently use Express's default in-memory store — fine for development, but swap in a persistent store (e.g. `connect-sqlite3`, Redis) before deploying, since restarting the server logs everyone out.
- Set a real `SESSION_SECRET` environment variable in production instead of the fallback in `app.js`.
- `database.db` is created automatically in `web/backend/` on first run.
