# Step Into INTL Law — Website

A single place for students and graduates to find international-law opportunities — scholarships, postgraduate study, careers, and community resources.

```
SIL-website/
├── frontend/     Static site (HTML, CSS, JS) — served by the backend
├── backend/      Layered Express + SQLite API (auth + roles, opportunities board, migrations)
├── PROJECT-DOCS.md      Full spec + implementation status (single source of truth)
└── SIL-Website-Spec.md  Original website specification
```

The backend serves the frontend directly, so in normal use you run **one** server and open one URL.

## Overview Frontend

### Main page
<img width="2234" height="1265" alt="image" src="https://github.com/user-attachments/assets/7f1c55a1-52e3-4ddf-a0f0-2a6e610f1857" />

### About us
<img width="2256" height="1267" alt="image" src="https://github.com/user-attachments/assets/1404ab77-be59-4eeb-88d8-3864d02a7202" />

### Sign/Login in
<img width="2254" height="1282" alt="image" src="https://github.com/user-attachments/assets/31c7c804-1fbf-44a6-a90b-7ad2136a468b" />


## Quickstart

Requires **Node.js 22 LTS or newer** (24 recommended). See [backend/README.md](backend/README.md#requirements).

```bash
cd backend
npm install --ignore-scripts
cp .env.example .env
npm run seed        # test login 1@gmail.com / 1  +  admin admin@sil.test / admin1234
npm start
```

Then open **http://localhost:3000** — this serves the site *and* the API from the same origin. (`--ignore-scripts` skips a native build step that isn't needed — `better-sqlite3` ships a prebuilt binary. Details in [backend/README.md](backend/README.md#troubleshooting).)

> Opening the `.html` files directly from `frontend/` (`file://`) will load the pages but **auth won't work** — the sign-in, profile, and nav all make `fetch` calls that need the same-origin server. Always go through `http://localhost:3000`.

## Per-area docs

| Doc | Covers |
|---|---|
| [backend/README.md](backend/README.md) | Architecture (route→controller→service→repository), REST API, DB schema + migrations, **troubleshooting** |
| [frontend/README.md](frontend/README.md) | Pages, the JS files, how each page talks to the API, design tokens |
| [PROJECT-DOCS.md](PROJECT-DOCS.md) | Everything: overview, navigation, backend goals + status, data structures, dev priority |

## Status

Phase 1 — core site + backend built. Auth (register / login / logout / password reset / email verification), the profile lifecycle, user roles (`user` / `admin`), and full CRUD for the Postgraduate Opportunities board are wired to a real versioned API (`/api/v1`) with a migration system and 42 passing tests. Still front-end-only: the Contact form, and the `scholarships.html` board rendering (its API endpoint + seed data now exist — wiring the page to them is next). See [PROJECT-DOCS.md §13](PROJECT-DOCS.md).
