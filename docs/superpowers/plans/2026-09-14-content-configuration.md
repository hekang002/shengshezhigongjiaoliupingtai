# Content Configuration Implementation Plan

> **For agentic workers:** Implement in the current session, checking each cross-portal workflow in a browser.

**Goal:** Add configurable posting categories and sensitive-word blocking shared by management and staff prototypes.

**Architecture:** Version-tolerant shared demo data provides categories and word rules. Management pages edit those records; staff publishing and commenting consume them before persisting submissions.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, localStorage.

## Global Constraints

- Reuse the single staff login and red management UI.
- Do not delete existing localStorage records or replace existing navigation pages.
- Blocked text is not persisted; this is not server-side content moderation.

---

### Task 1: Shared configuration data

**Files:** Modify `prototype-data.js`.

- [x] Seed three staff posting categories and the system-owned 回音壁 category plus a harmless demonstration rule.
- [x] Hydrate existing persisted data without resetting business records; expose active category and matching helpers.

### Task 2: Management configuration pages

**Files:** Modify `管理端原型设计/app.js`, `管理端原型设计/workflow.js`, `管理端原型设计/index.html`.

- [x] Add the bottom sidebar group for platform and content roles, removing duplicate content-role links.
- [x] Implement category add/edit/enable/sort and sensitive-rule add/edit/enable with shared saves and operation log entries.

### Task 3: Staff publishing and blocking

**Files:** Modify `app.js`, `styles.css`, `index.html`.

- [x] Replace the placeholder posting command with a working category/title/body dialog and submission.
- [x] Block sensitive text in posts and comments before writing shared data; send accepted posts to the existing review queue.
- [x] Verify management configuration changes affect the staff form and both rejection/acceptance paths.
