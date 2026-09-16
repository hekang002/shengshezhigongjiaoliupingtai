# 承办端三页信息架构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将承办端重构为“工作台、事项办理、消息中心”三个一级页面，覆盖全部业主需求并形成完整事项闭环。

**Architecture:** 继续以 `affair` 为统一事项对象，工作台只负责发现和判断任务，事项办理负责执行，消息中心负责提醒。建言献策和心声诉求共用状态机、列表和详情组件，通过业务类型及详情字段区分。

**Tech Stack:** 原生 HTML/CSS/JavaScript、浏览器 LocalStorage、Lucide 图标、Playwright CLI。

## Global Constraints

- 复用职工端公共登录页，不新增管理端登录页。
- 仅设计桌面端，保持职工端红色视觉风格。
- 一级导航只保留“工作台、事项办理、消息中心”。
- 工作台不执行保存进度、提交答复等正式办理操作。
- 转办须由目标承办人确认接收后生效。
- 只有当前最终承办人可以更新进度和提交答复。
- 敏感词只影响内容公开，不阻断建言献策和心声诉求办理。

---

### Task 1: 收敛承办端一级导航

**Files:**
- Modify: `管理端原型设计/app.js`
- Modify: `管理端原型设计/workflow.js`

**Interfaces:**
- Consumes: `handlerNav`、`ManagementWorkflow.page(name)`
- Produces: `handler-dashboard`、`handler-handling`、`handler-messages` 三个稳定路由

- [ ] 将 `handlerNav` 调整为“工作台、事项办理、消息中心”。
- [ ] 删除“答复草稿、催办提醒、已公开答复、部门统计”的一级菜单入口。
- [ ] 保留旧路由作为内部视图兼容入口，避免已有按钮失效。
- [ ] 在 `ManagementWorkflow.page` 中注册 `handler-messages`。
- [ ] 运行 `node --check 管理端原型设计/app.js && node --check 管理端原型设计/workflow.js`。

### Task 2: 重构工作台为任务发现页面

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`

**Interfaces:**
- Consumes: `handlerItems(data)`、`deadlineFlag(affair)`、`deadlineText(affair)`
- Produces: `handlerBoard()` 工作台页面

- [ ] 顶部展示待办、临期、催办、退回、已办结五项数据概览。
- [ ] 概览卡片点击后进入事项办理，并带入对应状态或时限筛选。
- [ ] 中部展示重点待办，覆盖待处理、办理中、临期、已催办和退回。
- [ ] 每条待办只提供“查看事项”入口，不在工作台直接保存进度或提交答复。
- [ ] 右侧或底部展示新增事项、审核结果、退回记录和答复公开动态。
- [ ] 调整卡片密度、栅格和表格间距，确保 1366px 及以上桌面视口无重叠。

### Task 3: 建立事项办理列表

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`

**Interfaces:**
- Consumes: `handlerTable(data, items)`、`handlerFilters`
- Produces: 可筛选的 `handlerHandling()`

- [ ] 增加“全部事项、待办理、办理中、待审核、已答复、已公开”状态 Tab。
- [ ] 增加“全部、建言献策、心声诉求”业务类型 Tab。
- [ ] 支持编号/标题、优先级、时限状态、分办时间和截止时间筛选。
- [ ] 列表展示编号、类型、标题、状态、优先级、分办人、剩余时限和操作。
- [ ] 行操作统一进入事项详情，真正的办理动作全部放在详情中。
- [ ] 增加无结果状态和一键重置筛选。

### Task 4: 重构事项详情为六区块办理页

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`

**Interfaces:**
- Consumes: `affair`、来源 `post`、`affair.events`
- Produces: `affair-detail` 详情视图

- [ ] 事项信息区展示基本信息、来源、办理要求、办理时限和剩余时限。
- [ ] 办理进度区展示受理、承办、办理、答复、公开五个节点。
- [ ] 办理反馈区支持阶段进度、附件和办理结果。
- [ ] 答复内容区支持草稿编辑、保存草稿和提交正式答复。
- [ ] 协同与记录区分类展示协同意见、办理记录、退回记录和审核记录。
- [ ] 操作区根据状态展示确认接收、转办、保存、提交审核、修改和联系分办人。
- [ ] 建言献策显示可行性、采纳情况和改进措施；心声诉求显示核实情况、处理措施和答复内容。

### Task 5: 新增消息中心

**Files:**
- Modify: `管理端原型设计/workflow.js`
- Modify: `管理端原型设计/styles.css`
- Modify: `prototype-data.js`

**Interfaces:**
- Consumes: 事项状态、时限、退回原因和 `events`
- Produces: `handlerMessages()` 与标准消息对象 `{ id, affairId, type, title, content, at, read }`

- [ ] 创建全部消息、任务通知、催办提醒、逾期提醒、退回通知、审核通知、公开通知 Tab。
- [ ] 从现有事项和事件生成不少于 20 条演示消息。
- [ ] 消息列表展示类型、标题、关联事项、时间和已读状态。
- [ ] 点击消息进入对应事项详情并将消息标记为已读。
- [ ] 工作台消息角标只统计未读消息。

### Task 6: 需求映射与业务闭环验证

**Files:**
- Modify: `管理端原型设计/README.md`
- Test: Playwright CLI 浏览器会话

**Interfaces:**
- Consumes: 三个页面和事项状态机
- Produces: 可验收的需求映射说明及截图

- [ ] 在 README 中记录“业主需求 → 工作台/事项办理/消息中心”的映射。
- [ ] 验证工作台只能发现任务，不能直接提交正式答复。
- [ ] 验证建言献策和心声诉求可分别筛选并进入详情。
- [ ] 验证办理中事项可保存进度、上传附件、保存草稿和提交审核。
- [ ] 验证退回后可修改答复，审核通过后进入已答复/已公开状态。
- [ ] 验证催办、逾期、退回、审核和公开消息可进入关联事项。
- [ ] 验证转办目标确认前后责任人和操作权限正确变化。
- [ ] 在 1440×900 和 1920×1080 视口检查页面无文字溢出和控件重叠。
- [ ] 运行 `node --check app.js && node --check prototype-data.js && node --check 管理端原型设计/app.js && node --check 管理端原型设计/workflow.js`。

## 需求覆盖检查

| 业主需求 | 产品落点 |
|---|---|
| 待办统计、重点待办、剩余时限 | 工作台 |
| 任务列表、条件筛选 | 工作台简版 + 事项办理完整版 |
| 事项详情、办理反馈、附件、答复草稿 | 事项办理详情 |
| 协同意见、退回记录、审核记录 | 事项办理详情的协同与记录区 |
| 新任务、催办、逾期、退回、审核、公开通知 | 消息中心 |
| 已公开答复 | 事项办理最终状态与公开通知 |

