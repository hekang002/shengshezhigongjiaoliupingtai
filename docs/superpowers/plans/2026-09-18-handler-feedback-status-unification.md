# Handler Feedback Status Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“承办管理 > 办理反馈”调整为待处理、办理中、退回修改、已提交四个互斥状态，并把临期和逾期改为时限筛选。

**Architecture:** 继续以 `PrototypeData.affairs` 为唯一数据源，在 `workflow.js` 增加承办端展示状态映射和时限筛选状态。复用现有事项状态“办理中”和“待复核”，不新增业务状态；提交答复后将工作区切换到“已提交”并以只读方式展示同一事项。

**Tech Stack:** 原生 JavaScript、HTML 字符串模板、现有 CSS 设计系统、PrototypeData、Playwright CLI。

## Global Constraints

- 只修改“承办管理 > 办理反馈”，不修改“事项办理 > 事项分办”及其四个页签。
- 办理反馈只显示“待处理、办理中、退回修改、已提交”，不设置“全部”和“已办结”页签。
- 临期和逾期只作为时限筛选，不作为流程状态页签。
- 继续使用 `PrototypeData.affairs`，不新增事项数据副本或业务状态。
- 已提交事项只读；已办结事项继续进入独立的“已办事项”。
- 不覆盖或回退当前工作区中的既有修改，不创建提交。

---

### Task 1: 建立互斥的承办展示状态和时限筛选

**Files:**
- Modify: `管理端原型设计/workflow.js:25-121`

**Interfaces:**
- Consumes: `handlerManagedItems(data)`, `deadlineFlag(affair)`.
- Produces: `handlerWorkspaceDeadline: string`, `handlerWorkspaceStatus(affair): string`, `handlerWorkspaceItems(data): Affair[]`.

- [x] **Step 1: 增加工作区状态**

将初始页签设为空，并在现有工作区状态旁增加时限筛选：

```js
let handlerWorkspaceTab = '';
let handlerWorkspaceDeadline = '';
```

`handlerHandling()` 首次打开时按“待处理、办理中、退回修改、已提交”的顺序选择第一个非空页签；用户主动点击空页签时保留该页签并显示空状态。

- [x] **Step 2: 增加互斥状态映射**

在 `handlerManagedItems` 后增加：

```js
function handlerWorkspaceStatus(affair) {
  if (affair.status === '待复核') return '已提交';
  if (affair.status !== '办理中') return '';
  if (affair.returnReason) return '退回修改';
  if (!affair.progress && !affair.draft) return '待处理';
  return '办理中';
}
```

该函数保证同一事项只属于一个办理反馈页签。

- [x] **Step 3: 重写工作区队列过滤**

将 `handlerWorkspaceItems(data)` 改为：

```js
function handlerWorkspaceItems(data) {
  const query = handlerWorkspaceQuery.trim().toLocaleLowerCase();
  return handlerManagedItems(data).filter((affair) => {
    if (handlerWorkspaceStatus(affair) !== handlerWorkspaceTab) return false;
    if (handlerWorkspaceDeadline && deadlineFlag(affair) !== handlerWorkspaceDeadline) return false;
    return !query || `${affair.id} ${affair.title} ${affair.owner} ${affair.assigneeName || ''}`.toLocaleLowerCase().includes(query);
  });
}
```

- [x] **Step 4: 运行静态检查**

Run:

```bash
node --check 管理端原型设计/workflow.js
```

Expected: 退出码为 0。

### Task 2: 更新办理反馈页签、查询区和提交流转

**Files:**
- Modify: `管理端原型设计/workflow.js:514-575`
- Modify: `管理端原型设计/workflow.js:1018-1021`
- Modify: `管理端原型设计/workflow.js:1316-1351`
- Modify: `管理端原型设计/workflow.js:1478`

**Interfaces:**
- Consumes: `handlerWorkspaceStatus(affair)`, `handlerWorkspaceDeadline`, existing actions `progress-save`, `draft-save`, `draft-submit`, `extension-request`.
- Produces: four status tabs, deadline filter `wf-handler-workspace-deadline`, post-submit read-only selection.

- [x] **Step 1: 让工作台入口打开事项所属承办状态**

将 `handler-workspace-open` 动作改为：

```js
if (action === 'handler-workspace-open') {
  const affair = db().affairs.find((item) => String(item.id) === String(id));
  handlerActiveAffairId = id;
  handlerWorkspaceTab = handlerWorkspaceStatus(affair) || '待处理';
  handlerWorkspaceQuery = '';
  handlerWorkspaceDeadline = '';
  return go('handler-handling');
}
```

- [x] **Step 2: 渲染四个状态页签和数量**

在 `handlerHandling()` 中使用：

```js
const workspaceTabs = ['待处理', '办理中', '退回修改', '已提交'];
const allWorkspaceItems = handlerManagedItems(data).filter((item) => handlerWorkspaceStatus(item));
const counts = Object.fromEntries(workspaceTabs.map((tab) => [tab, allWorkspaceItems.filter((item) => handlerWorkspaceStatus(item) === tab).length]));
```

页签只渲染 `workspaceTabs`，不增加“全部、临期、逾期、已办结”。

- [x] **Step 3: 在查询区增加时限下拉框**

搜索区增加以下控件，并保留关键词搜索与重置按钮：

```html
<select class="select" id="wf-handler-workspace-deadline" aria-label="时限筛选">
  <option value="">全部时限</option>
  <option value="临期">临期</option>
  <option value="逾期">逾期</option>
</select>
```

`handlerWorkspaceSearch()` 同时读取：

```js
handlerWorkspaceQuery = readField('handler-workspace-query');
handlerWorkspaceDeadline = readField('handler-workspace-deadline');
```

重置动作同时清空 `handlerWorkspaceQuery` 和 `handlerWorkspaceDeadline`。

- [x] **Step 4: 更新页签切换白名单**

`handler-workspace-tab` 只接受：

```js
['待处理', '办理中', '退回修改', '已提交']
```

切换页签后清空当前事项 ID，由渲染逻辑选中该状态的第一项。

- [x] **Step 5: 提交答复后保持同一事项可见**

在 `draft-submit` 成功设置事项状态为“待复核”后同步工作区状态：

```js
handlerWorkspaceTab = '已提交';
handlerActiveAffairId = a.id;
handlerWorkspaceQuery = '';
handlerWorkspaceDeadline = '';
```

渲染后该事项仍被选中，但因为事项状态为“待复核”，只展示答复内容和办理记录，不展示编辑字段与操作按钮。

保存进展或草稿成功后，如果事项从“待处理”变为“办理中”，同步设置：

```js
handlerWorkspaceTab = '办理中';
handlerActiveAffairId = a.id;
```

确保页面继续显示刚处理的同一事项。

- [x] **Step 6: 统一状态文案与空状态**

- 队列事项和详情头部使用 `handlerWorkspaceStatus(affair)`。
- 退回文案统一为“退回修改”。
- 空状态文案使用“当前状态暂无匹配事项”，并提示调整关键词或时限条件。

- [x] **Step 7: 运行静态检查**

Run:

```bash
node --check 管理端原型设计/workflow.js
git diff --check
```

Expected: 两条命令均以退出码 0 完成。

### Task 3: 调整状态控件样式并完成浏览器验收

**Files:**
- Modify: `管理端原型设计/styles.css:553-641`
- Modify: `管理端原型设计/index.html:8-16`

**Interfaces:**
- Consumes: four-tab navigation and `wf-handler-workspace-deadline` from Task 2.
- Produces: stable four-column tabs, responsive query controls, cache version `20260918-handler-feedback-status-a`.

- [x] **Step 1: 将队列状态栏改为四列**

使用：

```css
.handler-workspace-queue > nav {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
```

页签名称允许正常换行，数量保持稳定，不因激活状态改变布局尺寸。

- [x] **Step 2: 调整搜索和时限筛选布局**

查询区使用两行网格：关键词占据可用宽度，时限下拉框与搜索、重置图标按钮保持固定高度。窄屏下允许查询控件换行，但不得出现横向溢出。

- [x] **Step 3: 更新静态资源缓存版本**

将 `styles.css`、`prototype-data.js`、`app.js` 和 `workflow.js` 的查询参数统一更新为：

```text
20260918-handler-feedback-status-a
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
1. 打开“承办管理 > 办理反馈”，确认只有待处理、办理中、退回修改、已提交四个页签。
2. 分别切换四个页签，确认事项互不重复、数量正确。
3. 在当前页签使用关键词以及临期、逾期筛选，确认查询和重置生效。
4. 从“工作台与任务”点击办理，确认进入事项所属的承办状态并选中同一事项。
5. 保存进展后，待处理事项移动到办理中并保持可定位。
6. 提交正式答复后，事项移动到已提交并以只读方式展示。
7. 打开“事项办理 > 事项分办”，确认待分办、已分办、答复审核、已办结及其操作没有变化。
8. 在 1280×800 和 736×929 视口确认无横向溢出、文字遮挡或不可达按钮。
9. 检查浏览器控制台没有新增 JavaScript 错误。
```
