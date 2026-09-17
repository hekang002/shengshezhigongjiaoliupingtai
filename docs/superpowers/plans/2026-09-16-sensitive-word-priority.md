# Sensitive Word Priority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add maintainable risk levels and categories to the sensitive-word library and enforce high-risk blocking versus medium/low-risk review.

**Architecture:** Extend the shared prototype data model so both portals read the same rule metadata. Keep policy derived from risk level to avoid contradictory configuration, then expose filters and fields in the existing management workflow.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, browser localStorage.

## Global Constraints

- Preserve the existing red desktop management visual language.
- High risk blocks submission; medium risk enters priority review; low risk enters normal review.
- Do not restore protected-list management to the sensitive-word page.

---

### Task 1: Shared rule model and migration

**Files:**
- Modify: `prototype-data.js`

- [ ] Add `category` and `riskLevel` to default rules.
- [ ] Backfill persisted rules without overwriting user-maintained values.
- [ ] Keep matching behavior compatible with existing `blockedWord` consumers.

### Task 2: Management UI and editing

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`

- [ ] Add search, category, risk, scope, and status filters.
- [ ] Show category, risk level, derived handling policy, hit count, and status in the table.
- [ ] Add category and risk level to the add/edit modal and save operation.
- [ ] Add clear visual hierarchy for high, medium, and low risk.

### Task 3: Staff submission behavior and verification

**Files:**
- Modify: `app.js`
- Modify: `index.html`
- Modify: `管理端原型设计/index.html`

- [ ] Reject posts and comments immediately when a high-risk rule matches.
- [ ] Route medium/low comment matches to review with a recorded review priority.
- [ ] Run JavaScript syntax checks and verify filters, modal editing, and submission behavior in a browser.
