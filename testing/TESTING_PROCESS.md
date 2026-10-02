# Testing Process — SIL Website

This document defines how the Step Into INTL Law (SIL) website is tested across the frontend
(static pages in [`frontend/`](../frontend)) and backend (Express API in
[`backend/src/`](../backend/src)). It covers four areas: frontend testing, backend testing,
restrictions/validation rules, and exception handling. Automated backend tests live in
[`backend/tests/`](../backend/tests) (Jest + Supertest, run with `npm test` inside `backend/`).

---

## 1. Frontend Testing

Frontend testing covers the static pages in `frontend/` — `index.html`, `about.html`,
`contact.html`, `portfolios.html`, `scholarships.html`, `signin.html`, `profile.html` — and the
scripts that drive them (`main.js`, `scholarships.js`, `signin.js`, `profile.js`).

### A. Page and Navigation Testing

- All pages load without console errors and with working relative links (CSS, JS, images).
- Nav links/buttons between pages (`index`, `about`, `contact`, `portfolios`, `scholarships`,
  `signin`, `profile`) work and highlight the current page where applicable.
- `profile.html` redirects to `signin.html` (or shows a signed-out state) when there is no active
  session, since it depends on `GET /api/v1/users/me`.
- Browser back/forward works correctly after navigating between pages and after sign-in/sign-out.
- Sign-in/sign-out state is reflected consistently across pages (e.g. nav shows "Profile" vs
  "Sign in").

### B. Form Validation Testing

Forms: sign-in/register (`signin.html` + `signin.js`), contact (`contact.html`), profile edit
(`profile.html` + `profile.js`).

- Required fields (email, password, contact name/email/message) cannot be submitted empty.
- Email fields are validated against the same shape the backend expects
  (`local@domain.tld`, see `rules.email` in
  [`backend/src/middleware/validate.js`](../backend/src/middleware/validate.js)) so client and
  server agree on what's valid.
- Password fields enforce the backend's minimum length before submitting, so users get instant
  feedback instead of waiting on a 400 response.
- Field-level error messages returned by the API (`details: [{ field, message }]`, see
  [§4](#4-exception-handling)) are displayed next to the relevant field, not just as a generic
  banner.
- Successful submissions clear/reset the form and show a confirmation (e.g. contact form
  confirms the message was sent; sign-in redirects to profile).
- Re-submitting a form while a request is in flight is prevented (submit button disabled or
  debounced) so duplicate requests aren't fired.

### C. Interface Testing

- Buttons, inputs, and the scholarships/opportunities board render and respond to clicks/typing.
- `scholarships.js` correctly renders the list returned by `GET /api/v1/opportunities`, including
  an empty state when the list is empty and an error state when the request fails.
- Layout is checked at common breakpoints (mobile ~375px, tablet ~768px, desktop ~1280px+).
- Loading states are shown while a fetch is in flight (e.g. scholarships board, profile load),
  and disabled/loading states are cleared once the request resolves or fails.

### D. User Experience and Accessibility Testing

- Pages are navigable by keyboard alone (tab order, visible focus state, no keyboard traps).
- Form inputs have associated `<label>`s; error text is announced near the field it describes.
- Colour contrast is sufficient for body text, buttons, and links (WCAG AA as a baseline).
- Destructive or important actions (e.g. deleting a profile via `DELETE /api/v1/users/me`) give
  clear confirmation before and feedback after.

---

## 2. Backend Testing

The backend is an Express API under `/api/v1` (also mounted at `/api`), organised into modules:
`auth`, `users`, `opportunities`, `contact` (see
[`backend/src/routes/index.js`](../backend/src/routes/index.js)). Automated tests already exist
for each module in `backend/tests/` (`auth.test.js`, `users.admin.test.js`,
`opportunities.test.js`, `contact.test.js`) and run via `npm test` (Jest + Supertest,
`--runInBand`).

### A. API and Validation Testing

Covers every route below with both valid and invalid input:

| Module | Routes | Notes |
|---|---|---|
| `auth` | `POST /register`, `POST /login`, `POST /logout`, `POST /password-reset`, `POST /password-reset/confirm`, `POST /verify-email`, `POST /verify-email/confirm` | `logout` and `verify-email` require a session |
| `users` | `GET/PUT/PATCH/DELETE /me`, `PUT /me/password`, `GET /` (admin), `GET /:id` (admin), `PATCH /:id/role` (admin) | self-service routes need `requireAuth`; listing/role changes need `requireRole('admin')` |
| `opportunities` | `GET /`, `GET /:id` (public), `POST/PUT/PATCH/DELETE` (admin) | board is public-read, admin-write |
| `contact` | `POST /` (public), `GET /`, `GET /:id` (admin) | submission is public, listing is admin-only |

For each route, verify:

- Valid requests succeed and return the expected shape (see `sendOk`/`sendError` in
  [`backend/src/lib/response.js`](../backend/src/lib/response.js)).
- Missing/invalid body fields return `400 VALIDATION_ERROR` with per-field `details`
  (see `validateBody` in `middleware/validate.js`).
- Requests to authenticated routes without a session return `401 UNAUTHORIZED`.
- Requests to admin-only routes from a non-admin session return `403 FORBIDDEN`.
- Unknown IDs return `404 NOT_FOUND`.
- Malformed JSON bodies are rejected with `400 BAD_REQUEST` rather than crashing the process.

### B. Database Testing

The app uses `better-sqlite3` (see `backend/src/db/`, `backend/database.db`).

- Create/read/update/delete operations on users, opportunities, and contact submissions persist
  and read back correctly (covered by each module's `*.repository.js`).
- Unique constraints (e.g. duplicate email on register) surface as `409 CONFLICT`, not a raw
  SQLite error — `errorHandler.js` already translates `SQLITE_CONSTRAINT*` codes, but
  module-level services should translate expected conflicts explicitly where possible so the
  message is meaningful.
- Password hashes (bcrypt) are stored, never plaintext passwords; `GET /me` and `GET /:id`
  responses never include the password hash.
- Role changes (`PATCH /:id/role`) and account deletion (`DELETE /me`) are verified against the
  database after the request, not just the HTTP response.

### C. Business Logic Testing

- Registration: duplicate email is rejected; password is hashed before storage; role defaults to
  a non-admin role.
- Login: wrong password / unknown email both return a generic `401` (never reveal which part was
  wrong).
- Password reset / email verification: tokens are single-use and time-limited
  (`tokens.service.js`); confirming with an invalid or expired token is rejected.
- Opportunities: only admins can create/update/delete; public `GET` never exposes admin-only
  fields if any exist.
- Contact: only admins can list/read submissions; the public `POST` cannot be used to read other
  submissions back.
- Edge cases: empty strings vs missing fields, very long input, unexpected extra fields in the
  body, wrong types (e.g. number instead of string) — verify none of these crash the server or
  produce a `500`.

---

## 3. Restrictions and Validation Rules

These rules must hold on both the frontend (for UX) and the backend (as the source of truth —
see [`middleware/requireAuth.js`](../backend/src/middleware/requireAuth.js),
[`requireRole.js`](../backend/src/middleware/requireRole.js), and
[`validate.js`](../backend/src/middleware/validate.js)).

### A. User and Access Restrictions

- Users must be signed in (`requireAuth`) to access `/users/me*`, `logout`, and
  `verify-email`.
- Only `admin` role users (`requireRole('admin')`) can list all users, view a user by ID, change
  a user's role, write/update/delete opportunities, or list/read contact submissions.
- A signed-in user can only read/update/delete **their own** account via `/me` routes — there is
  no route that lets a non-admin act on another user's account.
- Required fields must be present before an action is accepted (enforced by each module's
  `*.validation.js` schema passed to `validateBody`).
- Unsupported or malformed input (wrong type, bad email/URL/date shape, out-of-range length) is
  rejected with `400`, never silently coerced or ignored.
- Server-side validation (`validateBody` + `*.validation.js`) is always enforced even though the
  frontend also validates — the frontend check is a convenience, not the security boundary.

### B. Security and Operational Restrictions

- Secrets (DB path, session secret, SMTP credentials — see `backend/src/config`) are read from
  environment variables, never committed or sent to the frontend.
- Error responses never leak stack traces, SQL, or file paths — `errorHandler.js` returns a fixed
  `INTERNAL_ERROR` message for anything that isn't an `ApiError`, and logs the real error
  server-side only (skipped in test env via `config.isTest`).
- Passwords are hashed with bcrypt before storage and are never included in any API response.
- Session cookies (`express-session`) should be configured `secure`/`httpOnly` appropriately for
  the deployed (HTTPS) environment — see `render.yaml` for the Render deployment config.
- HTTPS is used in all deployed environments; local HTTP is acceptable only for development.
- Rate limiting / basic abuse protection should be considered for `POST /auth/login`,
  `POST /auth/register`, and `POST /contact` since these are public, unauthenticated endpoints.

---

## 4. Exception Handling

All thrown application errors are instances of
[`ApiError`](../backend/src/lib/ApiError.js); anything else is treated as an unexpected failure.
The central handler is [`errorHandler.js`](../backend/src/middleware/errorHandler.js), wired in
after all routes alongside `notFoundHandler`.

### Standard error envelope

Every error response has the same shape (see `sendError` in `lib/response.js`):

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed.",
    "details": [{ "field": "email", "message": "email must be a valid email address" }]
  }
}
```

### ApiError factories → HTTP status

| Factory | Status | Code | Used when |
|---|---|---|---|
| `ApiError.badRequest()` | 400 | `BAD_REQUEST` | malformed request not covered by a validation schema |
| `ApiError.validation(details)` | 400 | `VALIDATION_ERROR` | `validateBody` schema failed |
| `ApiError.unauthorized()` | 401 | `UNAUTHORIZED` | no session (`requireAuth`/`requireRole`) |
| `ApiError.forbidden()` | 403 | `FORBIDDEN` | signed in but wrong role, or acting on another user's data |
| `ApiError.notFound()` | 404 | `NOT_FOUND` | unknown ID, or no matching route (`notFoundHandler`) |
| `ApiError.conflict()` | 409 | `CONFLICT` | duplicate/unique-constraint violation |
| *(unhandled error)* | 500 | `INTERNAL_ERROR` | anything not thrown as an `ApiError` — message is always generic |

### Rules to test

- Every route handler that can fail uses `asyncHandler` (see `lib/asyncHandler.js`) or explicit
  `try/catch` so a rejected promise reaches `errorHandler` instead of crashing the process.
- A thrown `ApiError` always produces the matching status/code/message above — never a 500.
- An unexpected error (e.g. a bug, a null reference) still returns a controlled `500
  INTERNAL_ERROR` response, not a stack trace or a hung request.
- `SQLITE_CONSTRAINT*` errors that reach the handler untranslated still produce `409 CONFLICT`,
  not `500`.
- Malformed JSON bodies produce `400 BAD_REQUEST`, not `500`.
- Server-side errors are logged (`console.error('[error]', err)`) except in the test environment,
  so failures are investigable without exposing internals to the client.

---

## Running the tests

```bash
cd backend
npm test
```

New tests go in `backend/tests/<module>.test.js` following the existing Jest + Supertest pattern.
Frontend testing is currently manual (see §1) — if/when it's automated, document the tool and
command here.
