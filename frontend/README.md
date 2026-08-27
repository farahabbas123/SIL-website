# Frontend — Step Into INTL Law

Static HTML / CSS / JS. No build step, no framework. Markup, styling, and behaviour are kept in separate files.

The backend (`../backend/`) serves this folder directly. Run `npm start` in `backend/` and open **http://localhost:3000** — don't open the `.html` files as `file://`, because the auth-aware nav, sign-in, and profile pages all `fetch` the API and need the same origin.

## Pages

| File | Page | Notes |
|---|---|---|
| `index.html` | Homepage | Hero dot-globe + animated jobs/scholarships map preview (canvas, in `main.js`) |
| `about.html` | About Us | Mission, values, team |
| `portfolios.html` | Portfolios | Careers / Academic / Community |
| `scholarships.html` | Postgraduate Opportunities board | Static listing rows + filter tabs. **Not yet backed by the API.** |
| `contact.html` | Contact form | Front-end only — shows an on-page confirmation, sends nothing |
| `signin.html` | Sign In / Create Account | Tabbed; real calls to `/api/login` and `/api/signup`. Google button is a placeholder. |
| `profile.html` | Profile | View/edit name + email, change password, delete account, sign out |

Every page links `styles.css` and `main.js` by relative path, so `frontend/` must stay together as a folder.

## JavaScript

| File | Loaded on | Responsibility |
|---|---|---|
| `main.js` | every page | Mobile nav toggle, fade-in-on-scroll, homepage canvas animations, scholarship filter tabs, contact-form demo submit, and the **auth-aware nav** — on load it calls `GET /api/profile` and, if signed in, swaps the "Sign In" link for the user's first name → `profile.html`. Fails silently if the backend is down. |
| `signin.js` | `signin.html` | Tab switching, form validation, `POST /api/login` + `POST /api/signup`, inline error banner, redirect to `profile.html` on success. Also redirects to `profile.html` immediately if a session already exists. |
| `profile.js` | `profile.html` | Loads the user via `GET /api/profile` (redirects to `signin.html` on `401`), then wires: details form → `PUT /api/profile`, password form → `PUT /api/profile/password`, sign out → `POST /api/logout`, delete → `DELETE /api/profile` (with a `confirm()` prompt). |

All API calls use `credentials: 'same-origin'` so the session cookie rides along. See the endpoint table in [backend/README.md](../backend/README.md).

## Styling

`styles.css` holds the shared design system and every page's styles. Tokens (full table in [PROJECT-DOCS.md §8](../PROJECT-DOCS.md)):

| | Value | Use |
|---|---|---|
| Navy 950 | `#060c1e` | Page background |
| Navy 900 / 800 / 700 | `#0a1229` / `#0e1c3f` / `#152a56` | Alt sections, panels, borders |
| Ivory / Ivory Dim | `#eef1f7` / `#b9c3d9` | Primary / secondary text |
| Gold | `#c9a227` | Accent, CTAs, "closing soon" flag |
| Fonts | Fraunces / Inter / IBM Plex Mono | Headings / body / labels |

## Not yet wired to the backend

- **Scholarships board** — reads a static list in `scholarships.html`; filter logic is in `main.js`. Phase 2: `GET /api/opportunities`.
- **Contact form** — `main.js` just shows `.form-success` and resets. Phase 2: `POST /api/contact` or email delivery.
