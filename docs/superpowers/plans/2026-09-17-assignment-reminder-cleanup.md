# 事项分办职责收敛与催办 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除“公开与归档”模块，将答复方式收敛到答复审核，并为已分办事项增加可留痕的催办操作。

**Architecture:** 导航层移除独立归档入口；事项详情层按流程节点控制答复方式；已分办列表通过新催办弹窗写入事项、流转记录、承办通知和审计记录。催办只增加提醒元数据，不改变事项状态或页签分类。

**Tech Stack:** 原生 JavaScript、HTML 模板字符串、现有 `PrototypeData` 本地数据层。

## Global Constraints

- “事项办理”下仅保留“事项分办”。
- 已办结数据继续在“事项分办 > 已办结”中查看。
- 分办阶段不得选择答复方式。
- 催办不得改变事项状态、办理期限或页签分类。
- 催办说明必填，且必须生成通知和流转记录。

---

### Task 1: 收敛导航和答复方式

**Files:**
- Modify: `管理端原型设计/app.js`
- Modify: `管理端原型设计/workflow.js`
- Modify: `prototype-data.js`

**Interfaces:**
- Consumes: `navByRole.platform`、`form(type, id)`、`assign-save`、`answer-approve`。
- Produces: 单一“事项分办”导航；仅答复审核可选的 `feedback` 字段。

- [x] **Step 1: 删除独立归档入口和路由**

```js
['事项办理', [['handler-dispatch', '事项分办', 'git-pull-request-arrow']]]
```

移除 `handlerClosure()` 及 `routes` 中的 `'handler-closure': handlerClosure`。

- [x] **Step 2: 从分办表单和保存逻辑移除答复方式**

`assign-form` 不再渲染 `choose('答复方式', ...)`；`assign-save` 的 `Object.assign()` 不再读取 `readField('feedback')`。

- [x] **Step 3: 清理新事项默认答复方式**

```js
feedback: ''
```

事项详情仅在 `['已反馈', '已办结']` 状态展示最终答复方式；`待复核`仍由答复审核表单提供选择控件。

### Task 2: 增加已分办催办闭环

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/index.html`

**Interfaces:**
- Consumes: `assignmentAction(affair)`、`modal()`、`update()`、`data.handlerNotifications`。
- Produces: `affair-urge` 弹窗、`affair-urge-submit` 操作、事项催办元数据和承办通知。

- [x] **Step 1: 已分办行增加催办入口**

```js
if (assignmentTab === '已分办') {
  return button('查看详情', 'affair-detail', affair.id)
    + button(affair.courted ? '再次催办' : '催办', 'affair-urge', affair.id);
}
```

- [x] **Step 2: 增加催办确认弹窗**

```js
if (type === 'affair-urge' && affair) {
  return modal('发送催办 · ' + affair.id, summary + textarea('催办说明（必填）', 'urge-reason'), cancel + submit);
}
```

- [x] **Step 3: 保存催办并发送通知**

```js
affair.courted = true;
affair.courtedAt = time();
affair.courtedReason = reason;
affair.events.push({ text: `管理端催办：${reason}`, at: affair.courtedAt });
data.handlerNotifications.unshift({ id: `HMSG-${Date.now()}`, affairId: affair.id, assigneeId: affair.assigneeId, type: '催办提醒', text: reason, at: affair.courtedAt });
```

提交后由 `update()` 写入审计记录、关闭弹窗并刷新列表。

- [x] **Step 4: 显示催办反馈并更新缓存键**

已分办列表“当前状态”单元格追加“已催办 · 时间”，操作按钮变为“再次催办”。`index.html` 的 `app.js` 和 `workflow.js` 缓存键更新为 `20260917-assignment-reminder`。

- [x] **Step 5: 验证**

```bash
node --check 管理端原型设计/app.js
node --check 管理端原型设计/workflow.js
node --check prototype-data.js
git diff --check
```

浏览器验证导航、分办弹窗、催办弹窗、催办后状态/流转记录和答复审核选择控件；确认控制台错误数为 0。
