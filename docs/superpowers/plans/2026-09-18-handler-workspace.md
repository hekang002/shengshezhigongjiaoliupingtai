# Handler Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将承办管理中的“办理反馈”改为单事项办理工作区，并让工作台的“办理”动作直接进入对应事项。

**Architecture:** 继续使用 `PrototypeData.affairs` 作为唯一事项数据源，在 `workflow.js` 增加当前办理事项和队列分类的页面状态。复用现有 `progress-save`、`draft-save`、`draft-submit`、`extension-request`、`affair-transfer` 和 `affair-contact` 动作，不复制状态流转逻辑。

**Tech Stack:** 原生 JavaScript、HTML 字符串模板、现有 CSS 设计系统、PrototypeData、Playwright CLI。

## Global Constraints

- 保留“工作台与任务”和“办理反馈”两个菜单。
- 不修改“事项办理 > 事项分办”及其四个页签。
- 不新增事项数据副本或新的业务状态。
- 办理动作必须继续经过现有权限和状态校验。
- 窄屏下不得出现内容遮挡或无法访问的操作按钮。

---

### Task 1: 建立办理反馈工作区状态和渲染结构

**Files:**
- Modify: `管理端原型设计/workflow.js:20-40`
- Modify: `管理端原型设计/workflow.js:499-540`

**Interfaces:**
- Consumes: `handlerManagedItems(data)`, `deadlineFlag(affair)`, `canWorkOn(affair, data)`, `handlerBusinessType(source)`.
- Produces: `handlerWorkspaceTab`, `handlerActiveAffairId`, `handlerWorkspaceItems(data)`, `handlerHandling()`.

- [x] **Step 1: 增加工作区页面状态**

在承办页面状态区增加：

```js
let handlerWorkspaceTab = '办理中';
let handlerActiveAffairId = '';
let handlerWorkspaceQuery = '';
```

- [x] **Step 2: 实现工作区队列过滤**

新增函数：

```js
function handlerWorkspaceItems(data) {
  const query = handlerWorkspaceQuery.trim().toLocaleLowerCase();
  return handlerManagedItems(data).filter((affair) => {
    if (affair.status !== '办理中') return false;
    const tabMatch = handlerWorkspaceTab === '退回'
      ? Boolean(affair.returnReason)
      : handlerWorkspaceTab === '临期'
        ? deadlineFlag(affair) === '临期'
        : true;
    return tabMatch && (!query || `${affair.id} ${affair.title} ${affair.owner} ${affair.assigneeName || ''}`.toLocaleLowerCase().includes(query));
  });
}
```

- [x] **Step 3: 将 `handlerHandling()` 改为三栏工作区**

输出以下稳定结构和类名：

```html
<section class="handler-workspace">
  <aside class="handler-workspace-queue">...</aside>
  <section class="handler-workspace-form">...</section>
  <aside class="handler-workspace-context">...</aside>
</section>
```

中间表单继续使用现有字段 ID：`wf-stage`、`wf-progress`、`wf-draft`、`wf-attachments`、`wf-extension`、`wf-extension-reason`。操作按钮继续使用现有 `data-action` 值。

- [x] **Step 4: 增加空状态和只读状态**

队列为空时显示“当前分类暂无可办理事项”；无办理权限或事项不在办理中时展示事项信息和流转记录，但不渲染编辑字段与提交按钮。

- [x] **Step 5: 运行静态检查**

Run:

```bash
node --check 管理端原型设计/workflow.js
git diff --check
```

Expected: 两条命令均以退出码 0 完成。

### Task 2: 打通工作台到办理反馈的入口

**Files:**
- Modify: `管理端原型设计/workflow.js:499-525`
- Modify: `管理端原型设计/workflow.js:1070-1110`
- Modify: `管理端原型设计/workflow.js:1400-1460`

**Interfaces:**
- Consumes: `handlerActiveAffairId`, `go('handler-handling')`, existing delegated `[data-action]` click handler.
- Produces: action `handler-workspace-open`, actions `handler-workspace-tab`, `handler-workspace-select`, `handler-workspace-search`.

- [x] **Step 1: 区分工作台的查看和办理动作**

将办理中事项的主操作改为：

```js
button('办理', 'handler-workspace-open', affair.id, 'primary')
```

其他状态继续使用：

```js
button('查看', 'affair-detail', affair.id)
```

- [x] **Step 2: 实现页面跳转和当前事项选择**

在动作处理函数中增加：

```js
if (action === 'handler-workspace-open') {
  handlerActiveAffairId = id;
  handlerWorkspaceTab = '办理中';
  go('handler-handling');
  return;
}
```

- [x] **Step 3: 实现队列切换和搜索**

`handler-workspace-tab` 更新分类并清空不在新结果中的当前事项；`handler-workspace-select` 更新 `handlerActiveAffairId`；搜索表单调用 `ManagementWorkflow.handlerWorkspaceSearch()` 读取 `wf-handler-workspace-query` 后重新渲染。

- [x] **Step 4: 保持保存后的当前事项上下文**

现有 `update()` 完成 `progress-save`、`draft-save` 或 `extension-request` 后保留 `handlerActiveAffairId`。`draft-submit` 成功后事项移出办理队列，页面选择过滤结果中的第一条，并显示提交成功提示。

- [x] **Step 5: 运行状态流转检查**

Run:

```bash
node --check 管理端原型设计/workflow.js
```

Expected: 退出码 0，且不新增业务状态字符串。

### Task 3: 完成工作区样式、缓存更新和浏览器验收

**Files:**
- Modify: `管理端原型设计/styles.css`
- Modify: `管理端原型设计/index.html:8-16`

**Interfaces:**
- Consumes: Task 1 的 `handler-workspace*` 类名。
- Produces: 桌面三栏布局、窄屏纵向布局、更新后的静态资源版本号。

- [x] **Step 1: 增加桌面工作区样式**

使用以下网格约束：

```css
.handler-workspace {
  display: grid;
  grid-template-columns: minmax(230px, .72fr) minmax(420px, 1.5fr) minmax(250px, .78fr);
  min-height: 640px;
}
```

队列与上下文使用边框分隔，不新增卡片嵌套；表单底部操作区保持可见并允许换行。

- [x] **Step 2: 增加响应式布局**

在 `max-width: 1100px` 下切换为单列，队列改为横向滚动；在 `max-width: 820px` 下让表单双列字段和上下文区域变为单列，所有按钮文字完整显示。

- [x] **Step 3: 更新资源缓存版本**

将 `styles.css`、`prototype-data.js`、`app.js` 和 `workflow.js` 的查询参数统一更新为：

```text
20260918-handler-workspace-a
```

- [x] **Step 4: 运行静态验证**

Run:

```bash
node --check 管理端原型设计/app.js
node --check 管理端原型设计/workflow.js
node --check prototype-data.js
git diff --check
```

Expected: 所有命令退出码均为 0。

- [x] **Step 5: 运行浏览器验收**

使用 Playwright CLI 验证：

```text
1. 平台端展开“承办管理”，打开“工作台与任务”。
2. 点击任一办理中事项的“办理”。
3. 页面进入“办理反馈”，并自动选中同一事项。
4. 切换办理中、退回、临期队列，确认列表和当前事项同步。
5. 保存阶段进展，确认办理记录和工作台近期动态更新。
6. 打开 1280×800 和 736×929 两个视口，确认无重叠、遮挡或不可达按钮。
7. 检查控制台没有新增 JavaScript 错误。
```
