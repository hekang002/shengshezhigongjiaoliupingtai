# 承办接收与转办闭环 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让建言献策和心声诉求在敏感词场景下仍可进入办理，并通过承办人接收与转办接收完成责任闭环。

**Architecture:** 在现有 `affairs` 记录上增加当前责任账号、待转办信息和接收状态；`workflow.js` 统一渲染承办页面和更新流转。内容状态继续控制公开展示，办理状态单独控制事项流转。

**Tech Stack:** 原生 HTML、CSS、JavaScript、PrototypeData localStorage、Playwright CLI。

## Global Constraints

- 不新增登录页，不新增移动端，继续复用职工端红色桌面视觉。
- 管理员与承办负责人使用同一组 `handler-*` 页面。
- 敏感词只影响帖子公开和人工复核，不影响建言献策、心声诉求进入办理候选。
- 未接收事项不得更新办理进度、答复草稿、延期或正式答复。

---

### Task 1: 事项数据与候选队列

**Files:** `管理端原型设计/workflow.js`, `prototype-data.js`

- [x] 为历史事项补齐 `assignmentState`、`assigneeId`、`initialOwner` 和 `transfer` 默认值。
- [x] 分办候选允许建言献策、心声诉求的已发布、私密发布和待审核帖子。
- [x] 新建事项时进入 `待承办确认`，保存初始承办部门、承办人和流转事件。

### Task 2: 接收与转办交互

**Files:** `管理端原型设计/workflow.js`, `管理端原型设计/app.js`

- [x] 事项详情显示当前承办部门、承办人和接收状态。
- [x] 当前承办人可以确认办理或打开转办表单；目标承办人只能在转办待接收时点击接收办理。
- [x] 接收前隐藏进度、答复、延期操作；接收后恢复现有办理操作。
- [x] 办理列表和提醒列表显示待承办确认、转办待接收、当前承办人。

### Task 3: 验证与文档

**Files:** `管理端原型设计/README.md`, `docs/superpowers/plans/2026-09-14-handler-accept-transfer.md`

- [x] 运行四个脚本的 `node --check`。
- [x] 用独立 Playwright 会话验证敏感帖子可分办、初始承办人接收、转办待接收、目标接收和接收前不可回复。
- [x] 验证管理员与承办负责人共用同一页面且无控制台错误。
