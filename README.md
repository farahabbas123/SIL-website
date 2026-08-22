# SIL Website

**Step Into INTL Law (SIL) Website**

## Team

### Technology Members
- Farah
- Min

---

## 1. Website Overview

The Step Into INTL Law website will provide students and graduates with access to international law-related opportunities, including scholarships, postgraduate opportunities, careers, and community resources.

The website should have a clean, professional design that follows the **Step Into INTL Law branding**, with **dark blue** as the primary colour.

A major priority is the development of a **Scholarships / Postgraduate Opportunities Board**, allowing users to browse and filter opportunities and then visit the official provider website to apply.

> **Important:** Users will not apply for scholarships directly through the SIL website. Scholarship applications can be complex and intensive, so each opportunity should link to the official university or organisation website.

---

## 2. Website Navigation

The main navigation should include:

- **Step Into INTL Law logo**

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

**Priority feature**

The scholarship/opportunities board should be implemented as a reusable listing system.

Each opportunity should contain:

- Name
- Location / University
- Type
- Closing date
- External URL

### Filters

Users should be able to filter by:

- All
- Undergraduate
- Postgraduate Coursework
- Postgraduate Research
- Short Course / Study Tour
- Other

Each listing/card must be clickable and link to the official provider website.

Upcoming closing dates should be visually highlighted using the SIL gold accent colour.

---

## 4. Data Structure

The opportunity data should use a consistent structure so that new scholarships can be added easily.

Example:

```text
Opportunity
├── name
├── location
├── type
├── closingDate
└── url
```

The initial version can use static data. A database/backend can be added later.

---

## 5. Contact Form

Implement a front-end contact form containing:

- Name
- Email
- Subject
- Message

After submission, display a confirmation message.

**Initial version:** front-end only; no backend required.

---

## 6. Authentication UI

Create a Sign In / Create Account interface.

Include:

- Sign In tab
- Create Account tab
- Google Sign-In button as an OAuth placeholder

**Initial version:** UI only. Real authentication can be implemented later.

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

1. Backend/database
2. Admin management system
3. Authentication
4. Opportunity submission
5. Advanced filtering
6. Maps
7. OAuth
8. Additional scholarship resources

---