# Organization Tree Implementation Plan

> **For agentic workers:** Implement and verify the scoped prototype in this session.

**Goal:** Replace the static organization list with a searchable and editable tree table matching the supplied desktop reference.

**Architecture:** Add a flat organization collection to the shared prototype data with safe migration. Render the tree and edit modals inside the existing management workflow; keep filter, collapse, and dropdown state in memory while write operations persist to localStorage and audit.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, localStorage, Playwright CLI.

## Global Constraints

- Maintain the existing red management UI and single staff login.
- Never reset existing localStorage data during migration.
- The organization view is a prototype, not real authorization or personnel synchronization.

---

### Task 1: Data and tree rendering

**Files:** Modify `prototype-data.js` and `管理端原型设计/workflow.js`.

- [ ] Add representative provincial, department, direct-enterprise, and municipal nodes and migrate existing browser data.
- [ ] Render reference-style filters, hierarchy, status tags, toolbar, and row operations with escaped user values.
- [ ] Verify root/child rendering, collapse/expand, filtering and reset.

### Task 2: Editing and verification

**Files:** Modify `管理端原型设计/workflow.js`, `管理端原型设计/styles.css`, and `管理端原型设计/index.html`.

- [ ] Implement add, edit, add-child and guarded delete with input validation and audit records.
- [ ] Match existing red visual language, version static assets, and verify behavior on desktop with Playwright.
