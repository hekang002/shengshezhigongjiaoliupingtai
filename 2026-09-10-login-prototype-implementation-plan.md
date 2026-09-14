# Login and Approval Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Build a standalone browser-ready HTML prototype for login, registration, password reset, administrator approval, and four role-specific mock workbenches.

**Architecture:** `index.html` provides one semantic application root and loads a local stylesheet and script. `app.js` owns in-memory account records, authentication validation, approval state changes, and screen rendering. `styles.css` owns responsive presentation, using the reference platform's charcoal, civic-red, white, and muted-gold visual system.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript, Lucide browser icon bundle loaded from CDN.

## Global Constraints

- Output is self-contained in `原型优化设计` and opens by double-clicking `index.html`.
- No backend, build tooling, API, or persistent storage is used.
- Use account/password and mobile/SMS login, each protected by a refreshable four-character graphic code.
- Registration requires phone, password, confirmation, and SMS code; registrations start pending and may not log in until an administrator approves them.
- Password reset is available only to approved accounts.
- Mock records reset to seeded data on browser refresh.
- This iteration targets a 1440px-wide desktop browser; mobile responsive adaptation is explicitly out of scope.

---

### Task 1: Establish the Standalone Application Shell

**Files:**
- Create: `原型优化设计/index.html`
- Create: `原型优化设计/styles.css`
- Create: `原型优化设计/app.js`

**Interfaces:**
- Produces: `<main id="app">`, `window.AppPrototype`, `render()`.
- Consumes: Lucide UMD global when the browser can reach the CDN; UI must remain usable when the icon bundle is unavailable.

- [x] **Step 1: Create semantic shell and local asset links**

```html
<body>
  <main id="app" aria-live="polite"></main>
  <div id="toast" role="status" aria-live="polite"></div>
  <script src="app.js"></script>
</body>
```

- [x] **Step 2: Add responsive layout tokens and baseline styles**

```css
:root { --brand: #b52c2f; --ink: #202224; --canvas: #f5f4f1; --line: #dedfdb; }
* { box-sizing: border-box; }
body { margin: 0; min-width: 320px; background: var(--canvas); }
```

- [x] **Step 3: Add `render()` and invoke it after state initialization**

```js
function render() {
  document.getElementById('app').innerHTML = state.screen === 'workspace'
    ? renderWorkspace()
    : renderAuth();
  window.lucide?.createIcons?.();
}
render();
```

- [x] **Step 4: Open `index.html` and verify the root renders with no JavaScript errors**

Run: `open 原型优化设计/index.html`
Expected: A browser shows a nonblank application canvas.

### Task 2: Implement Authentication, Registration, and Reset State

**Files:**
- Modify: `原型优化设计/app.js`

**Interfaces:**
- Consumes: `state`, `render()`, `showToast(message)`.
- Produces: `refreshCaptcha()`, `submitLogin()`, `submitRegistration()`, `submitReset()`, `sendSms()`.

- [x] **Step 1: Seed approved and non-approved mock accounts**

```js
const accounts = [
  { id: 'staff', phone: '13800002026', password: '123456', role: 'staff', name: '张晓雨', status: 'approved' },
  { id: 'handler', phone: '13600002026', password: '123456', role: 'handler', name: '陈凯', status: 'approved' },
  { id: 'admin', phone: '13500002026', password: '123456', role: 'admin', name: '王敏', status: 'approved' },
  { id: 'leader', phone: '18800002026', password: '123456', role: 'leader', name: '李建国', status: 'approved' },
  { id: 'pending', phone: '13900002026', password: '123456', role: 'staff', name: '周宁', status: 'pending' },
  { id: 'rejected', phone: '13700002026', password: '123456', role: 'staff', name: '孙晨', status: 'rejected' }
];
```

- [x] **Step 2: Validate each form before mutating state**

```js
function validatePassword(value) { return typeof value === 'string' && value.length >= 6; }
function validatePhone(value) { return /^1\d{10}$/.test(value.replace(/\s/g, '')); }
function validateSms(value) { return value === '202608'; }
function validateCaptcha(value) { return value.toUpperCase() === state.captcha; }
```

- [x] **Step 3: Make registration insert a pending account and reset require approved status**

```js
accounts.push({ id: `app-${Date.now()}`, phone, password, role: 'staff', name: '新注册职工', status: 'pending' });
setState({ view: 'login', message: '申请已提交，等待管理员审核' });
```

- [x] **Step 4: Manually verify the eight validation paths**

Run: Open `index.html`, submit invalid phone, incorrect CAPTCHA, incorrect password, pending account, rejected account, invalid registration, successful registration, and a password reset for an approved account.
Expected: Each failure retains the form and displays a targeted error; valid actions update the matching mock state.

### Task 3: Render the Auth Screens and Role Launcher

**Files:**
- Modify: `原型优化设计/app.js`
- Modify: `原型优化设计/styles.css`

**Interfaces:**
- Consumes: `state.view` values `login`, `register`, `reset`; validation functions from Task 2.
- Produces: `renderAuth()`, `renderLoginForm()`, `renderRegisterForm()`, `renderResetForm()`, `prefillRole(role)`.

- [x] **Step 1: Create the dual-column login template**

```js
function renderAuth() {
  return `<div class="auth-shell"><section class="brand-panel">...</section><section class="form-panel">${renderAuthForm()}</section></div>`;
}
```

- [x] **Step 2: Add forms and an exclusive password/SMS segmented control**

```html
<div class="auth-tabs" role="tablist">
  <button role="tab" aria-selected="true">账号密码登录</button>
  <button role="tab" aria-selected="false">短信验证码登录</button>
</div>
```

- [x] **Step 3: Add CAPTCHA refresh and all in-flow navigation commands**

```html
<button class="captcha" type="button" onclick="AppPrototype.refreshCaptcha()">A7K3</button>
<button class="text-button" type="button" onclick="AppPrototype.setView('reset')">忘记密码</button>
<button class="text-button" type="button" onclick="AppPrototype.setView('register')">注册账号</button>
```

- [x] **Step 4: Add four role cards that prefill account, password, and CAPTCHA**

```js
function prefillRole(role) {
  const account = accounts.find((item) => item.role === role && item.status === 'approved');
  setState({ view: 'login', loginMode: 'password', username: account.id, password: account.password });
}
```

- [x] **Step 5: Verify at 1440px width**

Run: Use a browser screenshot at `1440x900`.
Expected: The two distinct columns, all fields, actions, and role cards remain fully visible without horizontal scrolling.

### Task 4: Implement Four Role Workbenches and Account Review

**Files:**
- Modify: `原型优化设计/app.js`
- Modify: `原型优化设计/styles.css`

**Interfaces:**
- Consumes: approved `state.session`, `accounts`, and role key `staff | handler | admin | leader`.
- Produces: `renderWorkspace()`, `renderRoleContent(role)`, `approveAccount(id)`, `rejectAccount(id)`, `logout()`.

- [x] **Step 1: Define role-specific mock metrics and content lists**

```js
const dashboards = {
  staff: { title: '职工工作台', metrics: [['待办提醒', '3'], ['我的发言', '12'], ['收到回复', '8'], ['已办结事项', '6']] },
  handler: { title: '承办工作台', metrics: [['待办理事项', '12'], ['即将超期', '3'], ['答复草稿', '5'], ['本月办结', '28']] },
  admin: { title: '管理工作台', metrics: [['待审核内容', '8'], ['待分办事项', '6'], ['平台用户', '2,468'], ['今日访问', '386']] },
  leader: { title: '领导视图', metrics: [['运行事项', '86'], ['闭环办结率', '92.6%'], ['热点议题', '14'], ['重点事项', '5']] }
};
```

- [x] **Step 2: Render a quiet desktop workbench with sidebar, topbar, metrics, and content panel**

```js
function renderWorkspace() {
  return `<div class="workspace role-${state.session.role}">${renderTopbar()}${renderSidebar()}<main class="workspace-main">${renderRoleContent(state.session.role)}</main></div>`;
}
```

- [x] **Step 3: Add an account-review panel available only for the admin role**

```js
function approveAccount(id) {
  const account = accounts.find((item) => item.id === id);
  if (account) account.status = 'approved';
  render();
}
```

- [x] **Step 4: Verify role switching, approval, login, and logout**

Run: Sign in as `admin`, approve `13900002026`, log out, sign in as that phone with `123456`, switch each role in the workspace, and log out.
Expected: The approved phone can access the staff workbench; each switch changes metrics and modules; logout returns to login.

### Task 5: Run Browser Acceptance Checks and Record Delivery Notes

**Files:**
- Modify: `原型优化设计/2026-09-10-login-design.md`

**Interfaces:**
- Consumes: completed `index.html`, `styles.css`, and `app.js`.
- Produces: a checked final verification entry in the design document.

- [x] **Step 1: Serve the directory over a local HTTP server**

```sh
python3 -m http.server 4173 --directory '原型优化设计'
```

- [x] **Step 2: Use browser automation for the key path**

```text
Open http://127.0.0.1:4173/index.html; load the admin role; approve 13900002026; log out; login by account/password with 13900002026 / 123456; capture a desktop screenshot.
```

- [x] **Step 3: Check for horizontal overflow and console errors**

```js
document.documentElement.scrollWidth <= window.innerWidth
```

- [x] **Step 4: Append the verified run behavior to the design document**

```markdown
## Delivery verification

Verified locally: the standalone prototype opened via HTTP, registration and review behavior changed only in memory, and the 1440px desktop layout showed no horizontal overflow.
```
