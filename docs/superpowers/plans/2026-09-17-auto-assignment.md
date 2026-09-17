# Content Review Auto-Assignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make approved suggestion/request posts automatically create traceable pending-assignment affairs, then provide a complete three-tab assignment workbench that moves assigned affairs directly into processing.

**Architecture:** Add explicit audit, publication, and handling fields to posts while retaining the legacy `status` field for compatibility. Represent pending assignments as real affair records with `status: '待分办'`, and update the management workflow to mutate those records rather than deriving a queue from approved posts.

**Tech Stack:** Static HTML, CSS, browser JavaScript, localStorage-backed `PrototypeData`, Lucide icons.

## Global Constraints

- Keep the existing restrained red management-console visual language.
- Do not add a handler confirmation or receipt step.
- Suggestion and request posts always enter assignment after content approval; business-exchange posts do not.
- Preserve existing local demo data through read-time migration.
- Update frontend cache query strings after JavaScript or CSS changes.
- Do not commit unless the user explicitly requests it.

---

### Task 1: Add the separated state model and data migration

**Files:**
- Modify: `prototype-data.js`

**Interfaces:**
- Produces: post fields `contentAuditStatus`, `publishStatus`, and `handlingStatus`.
- Produces: affair records with `status: '待分办'` and `assignmentState: '待分办'`.
- Consumes: existing `posts`, `affairs`, `flowSnapshot`, and legacy `status` values.

- [ ] **Step 1: Add deterministic legacy-state derivation helpers**

Implement helpers that map current post and affair records to the three new post states without deleting legacy fields.

- [ ] **Step 2: Migrate loaded localStorage records**

During `read()`, backfill the three post fields, normalize old confirmation/receipt affair states to `办理中`, and ensure every pending affair has events and a creation timestamp.

- [ ] **Step 3: Update public-post visibility**

Make `isPublicPost()` use `contentAuditStatus` and `publishStatus`; processing progress must no longer hide an otherwise approved public post.

- [ ] **Step 4: Run syntax validation**

Run:

```bash
node --check prototype-data.js
```

Expected: exit code 0.

### Task 2: Create pending affairs during content approval

**Files:**
- Modify: `管理端原型设计/workflow.js`

**Interfaces:**
- Consumes: the separated post state fields from Task 1.
- Produces: helper `createPendingAffair(post, data, reviewedAt)` returning the created/existing affair.
- Produces: audit records that include the generated affair number.

- [ ] **Step 1: Add affair-number and pending-affair helpers**

Generate a unique `SX-YYYYMM-NNN` number and initialize source, audit, publication, handling, timing, and flow-snapshot fields.

- [ ] **Step 2: Update single-item approval**

For suggestion/request posts, set content audit to approved, preserve public/private publication state, create the pending affair once, and show the affair number in the success message. For business exchange, only update publication state.

- [ ] **Step 3: Update batch approval**

Apply the same rules to every selected post without creating duplicate affairs.

- [ ] **Step 4: Update review labels and queues**

Use `contentAuditStatus` for pending/processed queues and use `publishStatus` for content-state badges.

- [ ] **Step 5: Run syntax validation**

Run:

```bash
node --check '管理端原型设计/workflow.js'
```

Expected: exit code 0.

### Task 3: Rebuild the assignment workbench around real affairs

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`

**Interfaces:**
- Consumes: pending affair records created by Task 2.
- Produces: tabs `待分办`, `已分办`, and `答复审核`.
- Produces: assignment form action `assign-save` that updates an existing affair by affair id.

- [ ] **Step 1: Replace legacy tab state and derived candidates**

Remove `历史待登记`; count and render affairs by assignment status.

- [ ] **Step 2: Add assignment summary metrics and filters**

Show pending, processing, answer-review, near-deadline, and returned counts. Add keyword, business type, priority, and creation-time filtering for the pending list.

- [ ] **Step 3: Build the pending-assignment table**

Render affair number/title, business type, publication mode, audit time, priority, waiting time, and the `查看并分办` action.

- [ ] **Step 4: Build the split assignment form**

Show read-only source content and audit context on the left; show department, handler, cooperating department, priority, deadline, requirements, and feedback mode on the right.

- [ ] **Step 5: Update assign-save**

Validate required fields and department ownership, then update the pending affair to `办理中`, set assignment metadata, append an event, notify the handler, and preserve the original post publication state.

- [ ] **Step 6: Style the workbench and responsive modal**

Use dense tables, restrained summary metrics, a two-column assignment modal, and a single-column fallback below 900 px.

### Task 4: Remove confirmation/receipt semantics and verify the complete flow

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `prototype-data.js`
- Modify: `管理端原型设计/index.html`

**Interfaces:**
- Consumes: normalized `办理中` affairs.
- Produces: direct reassignment semantics and cache-busted assets.

- [ ] **Step 1: Remove confirmation and receipt actions from visible workflows**

Treat legacy `待承办确认` and `转办待接收` records as processing records after migration. Do not render `确认办理` or `接收办理` controls.

- [ ] **Step 2: Change transfer behavior to request/direct reassignment**

The handler submits a transfer reason; the prototype records the change and immediately updates the responsible handler without a receipt state.

- [ ] **Step 3: Synchronize reply-review and closure handling states**

Submitting a draft sets `handlingStatus: '待答复审核'`; returning it sets `退回修改`; approval sets `已办结` without changing publication mode except for the reply visibility result.

- [ ] **Step 4: Update cache versions and run static checks**

Run:

```bash
node --check prototype-data.js
node --check '管理端原型设计/workflow.js'
node --check '管理端原型设计/app.js'
git diff --check
```

Expected: all commands exit with code 0.

- [ ] **Step 5: Run browser acceptance checks**

Verify these visible outcomes at desktop and the existing 736x929 in-app viewport:

1. Approving a suggestion/request displays a generated affair number and increments `待分办`.
2. Approving business exchange creates no affair.
3. The assignment workbench has exactly the three agreed tabs.
4. The assignment form validates and moves an affair directly to `办理中`.
5. No `待承办确认`, `转办待接收`, `确认办理`, or `接收办理` UI remains.
6. The browser console has no errors or warnings.
