# Sidebar Accordion Implementation Plan

> **For agentic workers:** Implement and verify the changes in the current session.

**Goal:** Show only first-level navigation by default and reveal second-level modules on click for every management role.

**Architecture:** Store one expanded group in `state`, render all navigation groups through a single accordion template, and synchronize the expanded group with page navigation. Use existing role navigation definitions and page router.

**Tech Stack:** Vanilla JavaScript, CSS, static HTML.

## Global Constraints

- Retain existing role-specific menu entries and the staff portal login.
- Do not change business data or workflow actions.
- Desktop management sidebar continues using the existing red visual language.

---

### Task 1: Navigation behavior

**Files:** Modify `管理端原型设计/app.js`.

- [x] Replace the special-case System Settings toggle with a single expanded group shared by all navigation groups.
- [x] Make opening a group close the previous group and make a second click collapse it.
- [x] Keep the selected group's children visible after selecting a page; synchronize programmatic navigation and reset on role changes.

### Task 2: Styling and verification

**Files:** Modify `管理端原型设计/styles.css` and `管理端原型设计/README.md`.

- [x] Style the first-level rows, nested rows, active indicator, and expansion chevron using existing red and dark sidebar tokens.
- [x] Check default collapse, group switching, child navigation, role switching, and button expansion state in a desktop browser.
