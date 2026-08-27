# Backend — Step Into INTL Law API

Node.js + Express + SQLite (`better-sqlite3`). Handles account creation, sign-in, cookie sessions, and the profile CRUD endpoints. Also serves the `../frontend/` site as static files, so only this one server needs to run.

```
backend/
├── app.js          Express app + all routes (imported by tests, no port opened)
├── server.js       Loads .env, starts app.listen()
├── database.js     SQLite connection + schema (users table)
├── seed.js         Creates the dev test account; also exported for tests
├── .env.example    Copy to .env
└── tests/
    └── auth.test.js   21-test Jest + Supertest suite
```

`server.js` is deliberately thin — all routes live in `app.js` so the suite can `require('../app')` without binding a real port.

## Requirements

**Node.js 22 LTS or newer** (check with `node -v`). `better-sqlite3@13` declares `"engines": { "node": ">=22" }` — on Node 20 or older there is no matching prebuilt binary, so `npm install` tries to compile it from source (needs a C++ toolchain) and, even if a binary is forced in, it **segfaults at runtime**. Node 22 fixes this and ships a clean `npm`. See [Troubleshooting](#troubleshooting).

## Setup

```bash
cd backend
npm install
cp .env.example .env
```

Defaults in `.env` work as-is for local development. Change `SESSION_SECRET` to a long random value before deploying anywhere real.

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `SESSION_SECRET` | `dev-secret-change-me` (fallback in `app.js`) | Signs session cookies |
| `DB_FILE` | `./database.db` | SQLite file. Tests override to `:memory:` |
| `NODE_ENV` | `development` | Set to `production` when deploying |

## Everyday commands

| Command | What it does |
|---|---|
| `npm run seed` | Creates a sign-in-ready account — **`1@gmail.com` / `1`**. Dev only; skips the 8-char rule that `/api/signup` enforces. Safe to re-run (no-ops if it exists). |
| `npm start` | Starts the server. Open http://localhost:3000 — frontend + API, same origin. |
| `npm test` | Runs the 21-test Jest + Supertest suite against an in-memory DB. |

`database.db` is created automatically on first run and is git-ignored, so each environment starts empty until you run `npm run seed`.

## API

Base URL `http://localhost:3000`. All request/response bodies are JSON. Responses are consistently shaped: `{ message }`, `{ error }`, or `{ user }` / `{ user, message }`. `password_hash` is never returned.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/test` | – | Health check → `{ message: "Backend is working!" }` |
| `POST` | `/api/signup` | – | Create account (`name`, `email`, `password` ≥ 8). Signs the user in on success. `409` if email taken. |
| `POST` | `/api/login` | – | Sign in (`email`, `password`). `401` on bad credentials. |
| `POST` | `/api/logout` | ✅ | Destroys the session, clears the `connect.sid` cookie. |
| `GET` | `/api/profile` | ✅ | The signed-in user's own record. `401` if not signed in. |
| `PUT` / `PATCH` | `/api/profile` | ✅ | Update `name` + `email` (both methods share one handler). `409` if the new email belongs to another account. |
| `PUT` | `/api/profile/password` | ✅ | `currentPassword` + `newPassword` (≥ 8). `401` if the current password is wrong. |
| `DELETE` | `/api/profile` | ✅ | Deletes the account and ends the session. |

Auth is a signed cookie session (`express-session`, 1-day `maxAge`, `httpOnly`). "✅ Auth" routes return `401 { error: "You must be signed in to do that." }` without a valid session.

### `users` table

```
id             INTEGER  primary key, autoincrement
name           TEXT     required
email          TEXT     required, unique
password_hash  TEXT     required — bcrypt, 12 rounds
```

## Troubleshooting

### First: check your Node version

```bash
node -v
```

If it's **below 22**, that's very likely your real problem — upgrade to Node 22 LTS (or 24) from <https://nodejs.org> and re-run `npm install`. A fresh Node install also replaces a broken `npm` (next section), so this one step often clears several errors at once. After upgrading, delete any half-built install first:

```bash
rm -rf node_modules
npm install
```

On Node 20 or older you'll see one of these, all from the same `better-sqlite3` / Node-version mismatch:

- `npm error gyp ERR! find VS ... You need to install the latest version of Visual Studio` — no prebuilt binary matches your Node, so it fell back to compiling from source and there's no C++ toolchain. Installing Visual Studio Build Tools is **not** the fix; upgrading Node is.
- `Segmentation fault` when running `node seed.js` / `npm start` / `npm test` — a binary built for a newer Node ABI was loaded anyway and crashed.
- `npm warn EBADENGINE ... required: { node: '>=22' }, current: { node: 'v20.x' }` — the explicit warning for the above.

### `npm install` fails with `Cannot find module 'cacache'` (or another npm-internal module)

This is **npm itself being broken**, not this project. Nothing installs, so every follow-up command fails downstream:

- `npm run seed` → `MODULE_NOT_FOUND` on `require('bcrypt')` — because `node_modules/` was never created
- `npm start` → `MODULE_NOT_FOUND` on `require('dotenv')` — same reason
- `npm test` → `'jest' is not recognized` — `jest` lives in `node_modules/.bin/`

**Best fix:** reinstall Node.js 22 LTS from <https://nodejs.org> — it ships a fresh, complete `npm`. Then verify with `npm -v` and run `npm install`.

**If you can't reinstall right now — let Corepack fetch a clean npm:**

```bash
COREPACK_INTEGRITY_KEYS=0 corepack prepare npm@11.5.2 --activate
COREPACK_INTEGRITY_KEYS=0 corepack npm install
```

`corepack` ships with Node; `corepack npm …` runs a freshly downloaded, complete npm regardless of the broken copy on your `PATH`. `COREPACK_INTEGRITY_KEYS=0` is needed only if the Corepack bundled with an older Node is too stale to verify the download signature (`Cannot find matching keyid`). On Windows PowerShell, set the variable first: `$env:COREPACK_INTEGRITY_KEYS = "0"`. Once `corepack npm install` succeeds you can use plain `npm start` / `npm test`.

**Why it broke:** a single npm-internal module vanishing from an otherwise-intact install is almost always antivirus or a disk cleaner quarantining it. Check your security tool's protection history for a removed file under `…\npm\node_modules\cacache\…`, restore it, and add your Node install folder to its exclusions — otherwise it'll happen again after any reinstall. Also remove any stale global npm override so the bundled npm is used again:

- Windows: `Remove-Item -Recurse -Force "$env:APPDATA\npm\node_modules\npm"`
- macOS/Linux: `rm -rf "$(npm root -g)/npm"`

### `npm install` fails while **building** `bcrypt` on a supported Node

`bcrypt` ships prebuilt binaries, so the compile step is usually unnecessary:

```bash
npm install --ignore-scripts
```

(Don't use this to work around the `better-sqlite3` / Node-version issue above — with `--ignore-scripts` it gets no binary at all and fails at `require()`.)

### `Error: listen EADDRINUSE: address already in use :::3000`

Another process (often an earlier `npm start` that didn't exit) holds the port. Either stop it, or run on a different port:

```bash
PORT=3001 npm start
```

### Sign-in / profile pages say "Could not reach the server"

The backend isn't running, or you opened the page as a `file://` path. Start `npm start` and use `http://localhost:3000`.

### Everyone gets logged out when the server restarts

Expected — sessions use the default in-memory store. Swap in a persistent store (`connect-sqlite3`, Redis) before deploying. See [PROJECT-DOCS.md §13](../PROJECT-DOCS.md).

### Start over with a clean database

```bash
rm database.db && npm run seed
```
