# Backend — Step Into INTL Law API

Node.js + Express + SQLite (`better-sqlite3`), organised as a small layered application. Handles accounts, cookie-session auth with roles, the profile lifecycle, and CRUD for the Postgraduate Opportunities board. Also serves the `../frontend/` site as static files, so only this one server runs.

## Architecture

```
Request
  → route        (src/modules/<x>/<x>.routes.js)      URL + method + middleware
  → controller   (src/modules/<x>/<x>.controller.js)  read req, call service, send envelope
  → service      (src/modules/<x>/<x>.service.js)     business rules, throws ApiError
  → repository   (src/modules/<x>/<x>.repository.js)  the only place that runs SQL
  → database     (src/db/connection.js)               better-sqlite3
```

```
backend/
├── server.js                     entry: load .env → run migrations → listen
├── src/
│   ├── app.js                    express assembly (middleware → routes → 404 → error handler)
│   ├── config/index.js           all env-derived settings, one place
│   ├── db/
│   │   ├── connection.js         better-sqlite3 singleton (pragmas: WAL, foreign_keys)
│   │   ├── migrate.js            runner — applies migrations/*.sql, tracks them in _migrations
│   │   ├── migrations/           001_users … 004_user_tokens  (plain .sql, run in order)
│   │   └── seed.js               idempotent test + admin users and sample opportunities
│   ├── lib/
│   │   ├── ApiError.js           the one error type thrown on purpose
│   │   ├── response.js           sendOk() / sendError() — the standard envelope
│   │   ├── asyncHandler.js       forwards async errors to the error handler
│   │   └── mailer.js             DEV STUB — logs instead of emailing
│   ├── middleware/
│   │   ├── cors.js  requestLogger.js  requireAuth.js  requireRole.js
│   │   ├── validate.js           tiny body validator (rules + validateBody + partial)
│   │   └── errorHandler.js       notFoundHandler + errorHandler
│   ├── routes/index.js           v1 router — mounts modules + /health
│   └── modules/
│       ├── auth/    register, login, logout, password-reset, verify-email, token service
│       ├── users/   /me self-service + admin user management; model + repo + service
│       └── opportunities/  public board + admin CRUD; model + repo + service
├── tests/  auth.test.js  opportunities.test.js  users.admin.test.js
└── app.js · database.js · seed.js   thin shims re-exporting from src/ (back-compat)
```

## Requirements

**Node.js 22 LTS or newer** (24 recommended; `package.json` sets `engines.node >= 22`). `better-sqlite3@13` bundles N-API prebuilt binaries so no C++ compiler is needed — but see the `--ignore-scripts` note below and in [Troubleshooting](#troubleshooting). On Node 20 or older the bundled binary is the wrong ABI and crashes at runtime.

## Setup

```bash
cd backend
npm install --ignore-scripts
cp .env.example .env
npm run seed
npm start
```

`--ignore-scripts` skips an implicit `node-gyp` build that fails on machines without the MSVC C++ toolchain; the bundled `better-sqlite3` / `bcrypt` prebuilts load fine without it. Plain `npm install` also works if you do have a compiler.

Defaults in `.env` work as-is for local development. Change `SESSION_SECRET` to a long random value before deploying. Full list of variables is in [`.env.example`](.env.example).

## Everyday commands

| Command | What it does |
|---|---|
| `npm run migrate` | Applies any pending `src/db/migrations/*.sql`. Runs automatically on `npm start` too. |
| `npm run seed` | Ensures a user **`1@gmail.com` / `1`**, an admin **`admin@sil.test` / `admin1234`**, and ~6 sample opportunities. Idempotent. |
| `npm start` | Migrates, then starts the server. Open http://localhost:3000 — frontend + API, same origin. |
| `npm run dev` | `npm start` with `node --watch` (restarts on file change). |
| `npm test` | Runs the Jest + Supertest suites against a fresh in-memory DB per file. |

`database.db` (+ its `-wal`/`-shm` sidecars) is created on first run and is git-ignored.

## API

Base URL `http://localhost:3000`. Canonical prefix **`/api/v1`** (unversioned `/api` is an alias). All bodies are JSON.

**Standard response envelope**

```jsonc
// success
{ "success": true, "data": { ... }, "message": "…"?, "meta": { ... }? }
// error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [ … ]? } }
```

`password_hash` is never returned. Error `code` values: `VALIDATION_ERROR`, `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/health` | – | `{ status, env, uptime, timestamp }` |
| `GET` | `/api/v1/test` | – | Legacy health check → `{ message: "Backend is working!" }` |
| `POST` | `/api/v1/auth/register` | – | Create account (`name`, `email`, `password` ≥ 8). Signs in on success. `409` if email taken. |
| `POST` | `/api/v1/auth/login` | – | Sign in (`email`, `password`). `401` on bad credentials. |
| `POST` | `/api/v1/auth/logout` | session | Destroy the session. |
| `POST` | `/api/v1/auth/password-reset` | – | Request a reset. Always `200` (no account enumeration). In non-prod the response includes `devToken`. |
| `POST` | `/api/v1/auth/password-reset/confirm` | – | `{ token, newPassword }` → set a new password. |
| `POST` | `/api/v1/auth/verify-email` | session | Send a verification token (dev: returned as `devToken`). |
| `POST` | `/api/v1/auth/verify-email/confirm` | – | `{ token }` → mark email verified. |
| `GET` | `/api/v1/users/me` | session | The signed-in user's own record. |
| `PUT` / `PATCH` | `/api/v1/users/me` | session | Update `name` + `email`. `409` if the email belongs to another account. |
| `PUT` | `/api/v1/users/me/password` | session | `{ currentPassword, newPassword }`. `401` if current password is wrong. |
| `DELETE` | `/api/v1/users/me` | session | Delete the account and end the session. |
| `GET` | `/api/v1/users` | **admin** | List all users. |
| `GET` | `/api/v1/users/:id` | **admin** | One user. |
| `PATCH` | `/api/v1/users/:id/role` | **admin** | `{ role: "user" \| "admin" }`. Can't demote yourself. |
| `GET` | `/api/v1/opportunities` | – | List. Filters: `?type=<enum>`, `?soon=true`. `meta.count` included. |
| `GET` | `/api/v1/opportunities/:id` | – | One listing. |
| `POST` | `/api/v1/opportunities` | **admin** | Create. |
| `PUT` / `PATCH` | `/api/v1/opportunities/:id` | **admin** | Replace / partially update. |
| `DELETE` | `/api/v1/opportunities/:id` | **admin** | Delete. |

Auth is a signed cookie session (`express-session`, 1-day `maxAge`, `httpOnly`, `sameSite=lax`). `session` routes → `401` without one; **admin** routes → `403` if the session user isn't an admin.

## Database schema

Schema is defined by ordered migrations in `src/db/migrations/`. Current shape:

```
users
  id INTEGER pk         name TEXT            email TEXT unique
  password_hash TEXT     — bcrypt, cost from BCRYPT_ROUNDS (default 12)
  role TEXT              — 'user' | 'admin'  (default 'user')
  email_verified INTEGER — 0 | 1
  created_at TEXT        updated_at TEXT

opportunities
  id INTEGER pk          name TEXT            location TEXT
  type TEXT              — CHECK in ('undergraduate','postgrad-coursework',
                            'postgrad-research','short-course','other')
  closing_date TEXT      — ISO 'YYYY-MM-DD', nullable (rolling intake)
  url TEXT               — official provider page
  created_by INTEGER     — FK → users(id) ON DELETE SET NULL
  created_at TEXT        updated_at TEXT

user_tokens             — single-use, expiring; only the SHA-256 hash is stored
  id INTEGER pk          user_id INTEGER FK → users(id) ON DELETE CASCADE
  type TEXT              — 'password_reset' | 'email_verify'
  token_hash TEXT        expires_at TEXT     used_at TEXT     created_at TEXT

_migrations             — which migration files have been applied
```

## Adding an entity

1. `src/db/migrations/00N_create_<thing>.sql` — the table.
2. `src/modules/<thing>/` — `model.js` (types + row→object mapper), `repository.js` (SQL only), `service.js` (rules, throws `ApiError`), `controller.js` (`asyncHandler` + `sendOk`), `validation.js`, `routes.js`.
3. Mount it in `src/routes/index.js`.
4. A `tests/<thing>.test.js` following `opportunities.test.js`.

## Troubleshooting

### `npm install` fails building `better-sqlite3` — `gyp ERR! find VS ... You need ... Visual Studio`

This is the common one on Windows. `better-sqlite3@13` **bundles** N-API prebuilt binaries (in `node_modules/better-sqlite3/prebuilds/`), so no compiler is actually needed — but `npm install` runs an *implicit* `node-gyp rebuild` step anyway, and that fails without the MSVC C++ toolchain.

**Fix — skip the build step; the bundled prebuilt loads fine at runtime:**

```bash
npm install --ignore-scripts
```

`bcrypt` also has bundled prebuilts (loaded via `node-gyp-build`), so `--ignore-scripts` is safe for the whole install here. Verify afterwards:

```bash
node -e "new (require('better-sqlite3'))(':memory:'); console.log('ok')"
```

If you'd rather build from source (not necessary), install "Visual Studio Build Tools" with the **Desktop development with C++** workload, then `npm install` normally.

### First check: Node version

```bash
node -v
```

Node **22 LTS or newer** (24 recommended). On Node 20 or older `better-sqlite3@13`'s bundled prebuilt is a wrong-ABI match and calling `new Database()` **segfaults** (`Segmentation fault` from `node seed.js` / `npm start` / `npm test`). `npm warn EBADENGINE ... required: { node: '>=22' }` is the up-front warning. Upgrade from <https://nodejs.org>; a fresh install also replaces a broken `npm` (below).

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
rm -f database.db database.db-wal database.db-shm
npm run seed
```

`npm run seed` runs the migrations first, so a fresh file is rebuilt from `src/db/migrations/` automatically.
