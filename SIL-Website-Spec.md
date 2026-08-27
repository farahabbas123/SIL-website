# SIL Website

**Step Into INTL Law (SIL) — Website Specification**

| | |
|---|---|
| **Status** | Draft — Phase 1 in progress |
| **Team** | Farah, Min *(Technology)* |
| **Last updated** | 2026 |

---

## Contents

1. [Website Overview](#1-website-overview)
2. [Website Navigation](#2-website-navigation)
3. [Postgraduate Opportunities Board](#3-postgraduate-opportunities-board)
4. [Data Structure](#4-data-structure)
5. [Contact Form](#5-contact-form)
6. [Authentication UI](#6-authentication-ui)
7. [Design System](#7-design-system)
8. [File Structure](#8-file-structure)
9. [Development Priority](#9-development-priority)

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
| **Postgraduate Opportunities** | Scholarships board (see §3) |
| **Contact** | Contact form + details |
| **Sign In** | Opens auth UI |
| **Join Us** | CTA — links to Contact / recruitment |

---

## 3. Postgraduate Opportunities Board

**Priority feature.**

The scholarship/opportunities board should be built as a **reusable listing system** — not one-off HTML per scholarship — so new entries can be added by editing data, not code.

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
- Listings closing soon are visually flagged using the SIL **gold accent** colour, so time-sensitive opportunities stand out at a glance.

---

## 4. Data Structure

Opportunities should share one consistent shape so new entries are simple to add — ideally from a spreadsheet or CMS later, without touching layout code.

```text
Opportunity
├── name          — string
├── location      — string
├── type          — enum (undergraduate | postgrad-coursework | postgrad-research | short-course | other)
├── closingDate   — string (display) or ISO date (for sorting/soon-flag logic)
└── url            — string (absolute URL)
```

**v1:** static data (hard-coded array / JSON file).
**v2:** swap the data source for a database or CMS without changing the rendering logic.

---

## 5. Contact Form

A front-end contact form with the following fields:

- Name
- Email
- Subject
- Message

On submit, show an on-page confirmation message (no page reload).

**v1 scope:** front-end only — no backend, no email delivery yet. Wiring it to an actual inbox is a Phase 2 item.

---

## 6. Authentication UI

A Sign In / Create Account interface with:

- **Sign In** tab
- **Create Account** tab
- **Google Sign-In** button as an OAuth placeholder

**v1 scope:** UI and interaction states only (tab switching, form validation, success/error styling). Real authentication, session handling, and OAuth are Phase 2.

---

## 7. Design System

Keeping these consistent across every page keeps the site feeling like one product instead of six separate pages.

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

## 8. File Structure

The codebase keeps markup, styling, and behaviour in separate files so each can be edited independently:

```text
siil-site/
├── index.html          — Homepage
├── about.html           — About Us
├── portfolios.html      — Portfolios (Careers / Academic / Community)
├── scholarships.html    — Postgraduate Opportunities board
├── contact.html         — Contact form
├── signin.html          — Sign In / Create Account
├── styles.css           — Shared design system + all page styles
└── main.js              — Shared behaviour (nav, filters, forms, animations)
```

Every `.html` file links to `styles.css` and `main.js` via relative paths, so the folder must stay together when shared or deployed.

---

## 9. Development Priority

### Phase 1 — Core Website

1. Responsive website structure
2. Navigation and routing
3. Homepage
4. About Us
5. Portfolio pages
6. Jobs Board
7. **Postgraduate Opportunities Board**
8. Filtering functionality
9. External opportunity links
10. Contact form
11. Sign In / Create Account UI

### Phase 2 — Future Development

1. Backend / database
2. Admin management system
3. Real authentication (sessions, OAuth)
4. Opportunity submission form (for organisations/universities)
5. Advanced filtering (domestic-only, age, etc.)
6. Interactive map (jobs + scholarships by location)
7. Additional scholarship resources ("find out more" / tips & tricks pages)
