# 审核与发布状态拆分 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将内容审核结果与发布结果改为两个独立状态和操作。

**Architecture:** 继续使用 `contentAuditStatus` 和 `publishStatus` 两个已有字段。审核仅更新前者，显式发布操作仅更新后者；职工端从两个字段合成可读进度。

**Tech Stack:** Vanilla JavaScript, HTML, localStorage prototype data.

## Global Constraints

- 保留建言献策和心声诉求审核通过后自动生成待分办事项的逻辑。
- 审核通过不自动改为已发布。
- 发布和私密发布不改变审核状态。

---

### Task 1: 管理端审核与发布操作

**Files:**
- Modify: `管理端原型设计/workflow.js`

- [x] 将单条及批量审核改为只写入审核结果和未发布状态。
- [x] 增加“发布”与“私密发布”操作，并记录审计日志。
- [x] 修改列表、详情和确认弹窗文案。

### Task 2: 职工端进度展示

**Files:**
- Modify: `app.js`

- [x] 业务交流进度同时读取审核状态和发布状态。
- [x] 区分“审核通过·未发布”、“审核通过·已发布”和“审核通过·私密发布”。

### Task 3: 缓存与验证

**Files:**
- Modify: `index.html`
- Modify: `管理端原型设计/index.html`

- [x] 更新脚本缓存版本。
- [x] 运行 JavaScript 语法检查和浏览器操作验证。
