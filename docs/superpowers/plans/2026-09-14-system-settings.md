# System Settings Implementation Plan

> **For agentic workers:** Implement in the current session and verify each navigation and page change before finishing.

**Goal:** Group the platform administrator's five governance pages under System Settings without changing the other roles.

**Architecture:** Keep the existing static HTML and JavaScript page router. The parent sidebar item controls only navigation expansion; its children route to distinct page renderers backed by the existing prototype data where available.

**Tech Stack:** HTML, CSS, vanilla JavaScript, browser localStorage.

## Global Constraints

- Desktop management prototype, no management login page.
- Preserve the staff portal red visual language and existing cross-portal demo data.
- Do not represent client-side demonstration settings as real authorization or security controls.

---

### Task 1: Sidebar hierarchy

**Files:** Modify `管理端原型设计/app.js` and `管理端原型设计/styles.css`.

- [x] Replace the platform governance links with an independent Statistics link and expandable System Settings parent.
- [x] Render five nested links with active styling; reset the expanded state when switching roles.
- [x] Check the nested navigation and verify the non-platform dispatch menu remains unchanged.

### Task 2: Distinct pages

**Files:** Modify `管理端原型设计/workflow.js` and `管理端原型设计/README.md`.

- [x] Map users, organization, permissions, logs, and audit to distinct pages.
- [x] Preserve registration review and audit records, label static organizational and security data as prototype examples.
- [x] Verify syntax and browser flows on the shared-origin static server.
