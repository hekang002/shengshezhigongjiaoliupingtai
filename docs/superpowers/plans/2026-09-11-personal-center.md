# 个人中心 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在职工端通知公告下增加个人中心，并集中提供我的发言、我的事项、我的互动和账号设置。

**Architecture:** 沿用现有 `app.js` 的状态驱动字符串渲染，在职工端导航增加 `profile` 视图，新增个人中心渲染函数和 mock 数据；沿用现有 `styles.css` 的平台色彩和断点，不引入依赖或拆分文件。

**Tech Stack:** 原生 HTML、CSS、JavaScript、Lucide 图标、Node.js 语法检查。

## Global Constraints

- 仅修改职工端，不改变承办、管理和领导视图。
- 个人中心默认 Tab 为“我的发言”。
- 页面保持深灰、供销红、金色、米白风格，避免过度设计。
- 732px 宽度下不得出现横向溢出。
- 交互使用 mock 数据和现有 toast，不接入后端。

### Task 1: 接入个人中心状态与导航

**Files:**
- Modify: `原型优化设计/app.js:208,239,404,440`

**Interfaces:**
- Consumes: 现有 `state.workspaceView`、`setState` 和 `renderWorkspaceContent`。
- Produces: `workspaceView = 'profile'`、`personalTab` 和 `AppPrototype.setPersonalTab(personalTab)`。

- [x] **Step 1: Extend state and staff navigation**

在 `state` 中增加 `personalTab: 'posts'`，在职工端导航数组中将 `['profile', '个人中心', 'user-round']` 放到通知公告数组之后。

- [x] **Step 2: Route the new view**

在 `renderWorkspaceContent()` 中增加职工端 `profile` 分支，指向 `renderPersonalCenter()`。

- [x] **Step 3: Add the tab action**

在 `window.AppPrototype` 中增加：

```js
setPersonalTab(personalTab) {
  setState({ personalTab });
}
```

- [x] **Step 4: Run syntax verification**

Run: `node --check "原型优化设计/app.js"`

Expected: command exits with code 0 and prints no syntax error.

### Task 2: Add personal-center mock data and rendering

**Files:**
- Modify: `原型优化设计/app.js` near the existing `homeNotices` and `renderNoticePage` definitions

**Interfaces:**
- Consumes: `portalPosts`, `homeNotices`, `state.personalTab`, `state.session`。
- Produces: `renderPersonalCenter()` and four visible tabs: `posts`, `affairs`, `interactions`, `settings`。

- [x] **Step 1: Define current-user mock records**

Add three current-user post ids `[1, 8, 16]`, two affair records, four interaction records, and account-setting display data. Render author as “我（张晓雨）” while retaining the source post title and category.

- [x] **Step 2: Render the profile header and summary**

Render page heading “个人中心”, user name/department/masked phone, account status, and four summary values: `3` 条我的发言、`2` 项办理中、`8` 条收到回复、`6` 条未读通知。

- [x] **Step 3: Render the tab body**

Render the selected tab with simple list rows. For posts show category filters and post status; for affairs show current status and latest update; for interactions show action type and status; for settings show read-only account fields and buttons that call `AppPrototype.notify()`.

- [x] **Step 4: Add the tab action buttons**

Each tab button calls `AppPrototype.setPersonalTab('posts'|'affairs'|'interactions'|'settings')` and applies an `active` class to the selected tab.

- [x] **Step 5: Run syntax verification**

Run: `node --check "原型优化设计/app.js"`

Expected: command exits with code 0 and prints no syntax error.

### Task 3: Style and verify responsive behavior

**Files:**
- Modify: `原型优化设计/styles.css` near the knowledge-page styles and responsive rules

**Interfaces:**
- Consumes: `personal-*` classes emitted by `renderPersonalCenter()`。
- Produces: desktop and narrow-screen layouts matching existing platform styles.

- [x] **Step 1: Add desktop styles**

Style the personal header, summary grid, tab bar, list rows, status labels and settings rows using existing `--line`, `--muted`, `--red`, `--red-pale`, `--gold` and neutral colors. Keep border radius at the existing small values.

- [x] **Step 2: Add narrow-screen rules**

At the existing narrow breakpoints, collapse the profile header and summary to one column or two stable columns, allow the tab bar to scroll horizontally, and set `min-width: 0` on text containers.

- [x] **Step 3: Validate the user flow**

Open `http://127.0.0.1:4173/`, log in with `staff / 123456`, click “个人中心”, and verify the default “我的发言” tab plus all four tabs.

- [x] **Step 4: Validate width safety**

At 732px viewport, verify `document.documentElement.scrollWidth <= window.innerWidth` and confirm personal post rows do not overflow.

- [x] **Step 5: Review changed files**

Run: `git diff -- "原型优化设计/app.js" "原型优化设计/styles.css"`

Expected: only the requested personal-center navigation, view, mock data, styling, and plan/spec files are changed.
