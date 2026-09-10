# Frontend — Step Into INTL Law

Static HTML / CSS / JS. No build step, no framework. Markup, styling, and behaviour are kept in separate files.

The backend (`../backend/`) serves this folder directly. Run `npm start` in `backend/` and open **http://localhost:3000** — don't open the `.html` files as `file://`, because the auth-aware nav, sign-in, and profile pages all `fetch` the API and need the same origin.

## Pages

| File | Page | Notes |
|---|---|---|
| `index.html` | Homepage | Hero dot-globe + animated jobs/scholarships map preview (canvas, in `main.js`) |
| `about.html` | About Us | Mission, values, team |
| `portfolios.html` | Portfolios | Careers / Academic / Community |
| `scholarships.html` | Postgraduate Opportunities board | Renders live from `GET /api/v1/opportunities` (`scholarships.js`); filter tabs operate on the fetched rows |
| `contact.html` | Contact form | Posts to `POST /api/v1/contact` (`main.js`) — persisted server-side and emailed to the team |
| `signin.html` | Sign In / Create Account | Tabbed; real calls to `/api/login` and `/api/signup`. Google button is a placeholder. |
| `profile.html` | Profile | View/edit name + email, change password, delete account, sign out |

Every page links `styles.css` and `main.js` by relative path, so `frontend/` must stay together as a folder.

## JavaScript

| File | Loaded on | Responsibility |
|---|---|---|
| `main.js` | every page | Mobile nav toggle, fade-in-on-scroll, homepage canvas animations, the contact form (`POST /api/v1/contact`), and the **auth-aware nav** — on load it calls `GET /api/v1/users/me` and, if signed in, swaps the "Sign In" link for the user's first name → `profile.html`. Fails silently if the backend is down. |
| `scholarships.js` | `scholarships.html` | Fetches `GET /api/v1/opportunities`, renders each row, and wires the filter tabs against the rendered rows (loading/error states included). |
| `signin.js` | `signin.html` | Tab switching, form validation, `POST /api/v1/auth/login` + `POST /api/v1/auth/register`, inline error banner, redirect to `profile.html` on success. Also redirects to `profile.html` immediately if a session already exists. |
| `profile.js` | `profile.html` | Loads the user via `GET /api/v1/users/me` (redirects to `signin.html` on `401`), then wires: details form → `PUT /api/v1/users/me`, password form → `PUT /api/v1/users/me/password`, sign out → `POST /api/v1/auth/logout`, delete → `DELETE /api/v1/users/me` (with a `confirm()` prompt). |

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

## Still front-end only

Every page now talks to the real backend. Not yet built: an admin UI for editing opportunities or reviewing contact messages — the API endpoints exist (`PROJECT-DOCS.md §3.2`), but nothing in `frontend/` calls them yet.
