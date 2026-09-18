# 承办工作台消息提醒实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除“草稿与通知”菜单，将消息提示收归承办工作台，并将“已办事项”改为“已办结事项”。

**Architecture:** 复用 `handlerMessages()` 的事项消息生成逻辑，在 `handlerBoard()` 的右侧消息提醒区以卡片呈现。通过新的 `handler-workbench-notice` 动作打开对应页面；草稿操作保留在 `handlerHandling()`。

**Tech Stack:** 原生 JavaScript、HTML 字符串模板、现有 CSS、PrototypeData、Playwright CLI。

## Global Constraints

- 不修改“事项分办”及其页签。
- 草稿只在“办理反馈”中编辑。
- 已办事项菜单改为“已办结事项”。
- 保留现有脏工作区，不提交。

### Task 1: 菜单和工作台提醒

**Files:**
- Modify: `管理端原型设计/app.js`
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`
- Modify: `管理端原型设计/index.html`

- [x] 删除 `handlerNav` 中的 `handler-messages` 菜单项，并将 `handler-answers` 显示为“已办结事项”。
- [x] 复用事项消息生成逻辑，在工作台右侧显示消息提醒卡片。
- [x] 增加提醒点击跳转：办理类消息进入“办理反馈”，已办结消息进入“已办结事项”。
- [x] 添加消息提醒的卡片布局和响应式样式。
- [x] 更新资源缓存版本。

### Task 2: 验收

- [x] `node --check` 通过。
- [x] `git diff --check` 通过。
- [x] 验证菜单只保留工作台、办理反馈、已办结事项。
- [x] 验证工作台提醒和点击跳转。
