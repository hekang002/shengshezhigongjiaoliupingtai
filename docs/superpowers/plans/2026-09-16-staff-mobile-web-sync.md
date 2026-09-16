# Staff Mobile Web Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adapt current staff Web business changes to mobile without restoring removed homepage blocks.

**Architecture:** Reuse shared data, renderers, and AppPrototype actions from `app.js`. Add only mobile composition and responsive presentation in `mobile.js` and `styles.css`, preserving desktop behavior.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, Lucide icons, Playwright CLI.

## Global Constraints

- Mobile home must not restore notification announcements.
- Mobile home must not restore personal affairs or progress.
- Keep the bottom navigation and single-column mobile information architecture.
- Do not alter desktop-only navigation and sticky utility layout.

---

### Task 1: Synchronize mobile business entry points

**Files:**
- Modify: `mobile.js`

**Interfaces:**
- Consumes: `renderPolicyQuestionTools()`, `renderPersonalCenter()`, `renderPortalPost()`, shared state and AppPrototype actions.
- Produces: Mobile policy question tools, mobile personal center flows, and media-aware content rendering.

- [x] Add policy question tools to the mobile FAQ tab.
- [x] Keep the mobile home renderer free of notification and progress blocks.
- [x] Ensure shared personal and progress actions remain reachable from the mobile personal page.
- [x] Run `node --check mobile.js`.

### Task 2: Adapt shared dialogs and content for narrow screens

**Files:**
- Modify: `styles.css`

**Interfaces:**
- Consumes: Existing shared policy question, progress, media, favorite, and interaction markup.
- Produces: Mobile-safe sizing, scrolling, button placement, and image presentation.

- [x] Add mobile overrides for question tools and dialogs.
- [x] Add mobile-safe progress detail and personal content rules.
- [x] Verify no horizontal overflow in the mobile workspace.

### Task 3: End-to-end verification

**Files:**
- Verify: `app.js`, `mobile.js`, `index.html`, `styles.css`

**Interfaces:**
- Consumes: Completed mobile adaptation.
- Produces: Syntax and browser verification results.

- [x] Run `node --check app.js` and `node --check mobile.js`.
- [x] Enter the staff mobile view and verify home exclusions.
- [x] Verify policy question and personal progress flows.
- [x] Check browser console errors and capture screenshots where useful.
