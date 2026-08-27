# Step Into INTL Law — Website

A single place for students and graduates to find international-law opportunities — scholarships, postgraduate study, careers, and community resources.

```
SIL-website/
├── frontend/     Static site (HTML, CSS, JS) — served by the backend
├── backend/      Express + SQLite API (auth, sessions, profile)
├── PROJECT-DOCS.md      Full spec + implementation status (single source of truth)
└── SIL-Website-Spec.md  Original website specification
```

The backend serves the frontend directly, so in normal use you run **one** server and open one URL.

## Quickstart

Requires **Node.js 22 LTS or newer** (`node -v`) — `better-sqlite3` won't build or run on older Node. See [backend/README.md](backend/README.md#requirements).

```bash
cd backend
npm install
cp .env.example .env
npm run seed        # creates a test login: 1@gmail.com / 1
npm start
```

Then open **http://localhost:3000** — this serves the site *and* the API from the same origin.

> Opening the `.html` files directly from `frontend/` (`file://`) will load the pages but **auth won't work** — the sign-in, profile, and nav all make `fetch` calls that need the same-origin server. Always go through `http://localhost:3000`.

## Per-area docs

| Doc | Covers |
|---|---|
| [backend/README.md](backend/README.md) | Install, env vars, seed, run, tests, the REST API, DB schema, **troubleshooting** |
| [frontend/README.md](frontend/README.md) | Pages, the JS files, how each page talks to the API, design tokens |
| [PROJECT-DOCS.md](PROJECT-DOCS.md) | Everything: overview, navigation, backend goals + status, data structures, dev priority |

## Status

Phase 1 — core site + auth backend built. Sign in / create account / profile / password change / delete account are wired to a real API. The Postgraduate Opportunities board and Contact form are still front-end-only (static data) — see [PROJECT-DOCS.md §13](PROJECT-DOCS.md).
