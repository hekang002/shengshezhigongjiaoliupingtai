# 事项分办四页签字段统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“待分办、已分办、答复审核、已办结”四个页签统一为同一套查询项、列结构和互斥数据分类。

**Architecture:** 在现有 `assignment()` 页面内建立页签配置、统一筛选状态和通用行渲染函数。每个页签只提供自己的源数据、节点时间标签和操作按钮，查询区与表格结构共用，避免复制逻辑和切页跳动。

**Tech Stack:** 原生 JavaScript、HTML 模板字符串、CSS Grid、现有 `PrototypeData` 本地数据层。

## Global Constraints

- 仅修改管理端“事项办理 > 事项分办”。
- 事项类型只允许“建言献策”和“心声诉求”，排除“业务交流”。
- 四个页签分类互斥，同一事项只能出现一次。
- 不改变事项状态流转、权限模型和现有详情弹窗操作。
- 缺少节点时间时从流转记录回退，仍无记录显示“未记录”。

---

### Task 1: 统一页签数据、查询与表格渲染

**Files:**
- Modify: `管理端原型设计/workflow.js:33-35`
- Modify: `管理端原型设计/workflow.js:410-464`
- Modify: `管理端原型设计/workflow.js:1008-1010`
- Modify: `管理端原型设计/workflow.js:1397-1398`

**Interfaces:**
- Consumes: `db()`、`contentReviewDate()`、`deadlineFlag()`、`statusLabel()`、`flowForAffair()`、`canFlowRole()`、`list()`、`button()`。
- Produces: `assignmentFilterStates` 页签独立筛选状态；`assignmentStageTime(affair, tab)` 节点时间回退；`assignment()` 的统一查询区和八列表格。

- [x] **Step 1: 将筛选状态改为按页签保存**

```js
const emptyAssignmentFilter = () => ({ query: '', type: '', owner: '', assignee: '', priority: '', dateFrom: '', dateTo: '' });
let assignmentFilterStates = Object.fromEntries(['待分办', '已分办', '答复审核', '已办结'].map((tab) => [tab, emptyAssignmentFilter()]));
```

- [x] **Step 2: 建立互斥分类和节点时间回退**

```js
const tabForAffair = (affair) => ['已反馈', '已办结'].includes(affair.status)
  ? '已办结'
  : affair.status === '待复核'
    ? '答复审核'
    : affair.status === '待分办'
      ? '待分办'
      : '已分办';
const assignmentStageTime = (affair, tab) => {
  const direct = { 待分办: affair.createdAt || affair.reviewedAt, 已分办: affair.assignedAt, 答复审核: affair.submittedAt, 已办结: affair.closedAt || affair.repliedAt }[tab];
  const pattern = { 待分办: /审核通过|生成待分办/, 已分办: /已分办|重新分办|转办完成/, 答复审核: /提交.*审核|待答复审核/, 已办结: /办结|审核通过|已反馈/ }[tab];
  return direct || [...(affair.events || [])].reverse().find((event) => pattern.test(event.text || ''))?.at || '';
};
```

- [x] **Step 3: 用当前页签筛选状态生成统一查询区**

查询区固定包含关键词、事项类型、承办部门、办理人、优先级、节点时间范围、重置和查询。待分办页签的承办部门和办理人保留但禁用，并显示“分办后可查询”。

- [x] **Step 4: 用统一列渲染四个页签**

```js
const columns = ['事项名称 / 编号', '事项类型', '承办部门 / 办理人', '优先级', '办理期限', '当前状态', '节点时间', '操作'];
const row = (affair) => `<tr>
  <td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td>
  <td>${badgeFor(affairType(affair, postForAffair(affair)))}</td>
  <td>${safe(affair.owner || '待分办')}<div class="td-sub">${safe(affair.assigneeName || affair.assigneeId || '待指定')}</div></td>
  <td>${badgeFor(affair.priority || '一般')}</td>
  <td><strong>${safe(affair.deadline || '待设置')}</strong><div class="td-sub">${safe(affair.deadline ? deadlineText(affair) : '分办时设置')}</div></td>
  <td>${badgeFor(assignmentDisplayStatus(affair, assignmentTab))}</td>
  <td><strong>${safe(assignmentStageTime(affair, assignmentTab) || '未记录')}</strong><div class="td-sub">${safe(stageLabel)}</div></td>
  <td><div class="row-actions">${assignmentAction(affair, assignmentTab)}</div></td>
</tr>`;
const table = list(columns, filteredItems.map(row));
```

每个页签只改变节点时间名称和操作：待分办为“查看并分办”，答复审核为“审核答复”，其余为“查看详情”。

- [x] **Step 5: 统一查询与重置事件**

```js
assignmentSearch() {
  assignmentFilterStates[assignmentTab] = {
    query: readField('assignment-query'),
    type: readField('assignment-type'),
    owner: readField('assignment-owner'),
    assignee: readField('assignment-assignee'),
    priority: readField('assignment-priority'),
    dateFrom: readField('assignment-from'),
    dateTo: readField('assignment-to')
  };
  render();
}
```

`assignment-reset` 只清空当前页签状态，切换页签时保留其他页签已输入的查询条件。

- [x] **Step 6: 运行语法和静态检查**

```bash
node --check 管理端原型设计/workflow.js
node --check 管理端原型设计/app.js
git diff --check
```

Expected: 三条命令均退出码 0。

### Task 2: 统一查询布局并完成浏览器验收

**Files:**
- Modify: `管理端原型设计/styles.css:1079-1107`
- Modify: `管理端原型设计/index.html:8-16`

**Interfaces:**
- Consumes: `assignment-filters`、`assignment-filter-actions`、现有 `review-date-range`。
- Produces: 宽屏四列、1180px 以下两列、680px 以下单列的稳定查询布局。

- [x] **Step 1: 调整查询区网格**

```css
.assignment-filters { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.assignment-filter-actions { grid-column: 1 / -1; justify-content: flex-end; }
@media (max-width: 1180px) { .assignment-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 680px) { .assignment-filters { grid-template-columns: 1fr; } }
```

- [x] **Step 2: 更新样式和脚本缓存键**

```html
<link rel="stylesheet" href="styles.css?v=20260917-assignment-tabs-unified">
<script src="workflow.js?v=20260917-assignment-tabs-unified"></script>
```

- [x] **Step 3: 在浏览器验证四个页签**

在 736px 和 1200px 视口逐一检查：四页签查询区均显示、八列顺序一致、查询和重置生效、操作按钮可打开原有弹窗、无“业务交流”、无文字重叠和不可读压缩。

- [x] **Step 4: 检查控制台和最终差异**

```bash
node --check 管理端原型设计/workflow.js
node --check 管理端原型设计/app.js
git diff --check
git diff -- 管理端原型设计/workflow.js 管理端原型设计/styles.css 管理端原型设计/index.html
```

Expected: 无语法错误、无空白错误；差异仅包含本功能相关修改。
