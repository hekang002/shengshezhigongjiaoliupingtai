# 平台端承办管理实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在平台管理端按权限增加“承办管理”一级模块，并复用现有承办页面，不改分办管理员端。

**Architecture:** 复用现有 `handlerNav` 子菜单和 `handler-*` 路由；扩展 `navByRole.platform` 并在承办页面使用已分办事项过滤，不修改 `navByRole.dispatch` 或分办业务逻辑。

**Tech Stack:** 原生 JavaScript、现有 HTML 模板和本地 PrototypeData 数据层。

## Global Constraints

- “承办管理”和“事项办理”必须是平台侧两个平级一级菜单。
- “承办管理”必须位于“事项办理”之前。
- `dispatch` 角色的导航和分办流程保持不变。
- 不新增第二套事项数据或复制承办页面逻辑。
- 承办页面不展示状态为“待分办”的事项；此状态仅由事项分办处理。

---

### Task 1: 扩展平台角色导航

**Files:**
- Modify: `管理端原型设计/app.js`
- Modify: `管理端原型设计/index.html`

**Interfaces:**
- Consumes: existing `handlerNav` and `navByRole.platform`.
- Produces: platform navigation group `['承办管理', handlerNav]`.
- `index.html` cache keys use `20260918-handler-management-2` so the browser loads the updated navigation and default workbench state.

- [x] **Step 1: 在平台导航中插入承办管理**

在 `navByRole.platform` 中，将：

```js
['内容管理', contentItems],
['事项办理', assignmentItems],
```

调整为：

```js
['内容管理', contentItems],
['承办管理', handlerNav],
['事项办理', assignmentItems],
```

保持 `navByRole.dispatch` 原样，不在分办管理员导航中添加承办管理。

- [x] **Step 2: 运行静态检查**

```bash
node --check 管理端原型设计/app.js
git diff --check
```

- [x] **Step 3: 限定承办范围与默认页签**

承办管理复用事项数据，但过滤“待分办”事项；平台管理员进入“工作台与任务”时默认查看“办理中”，避免将分办队列误当成承办待办。

### Task 2: 浏览器验证角色边界

**Files:**
- No additional files.

- [x] **Step 1: 验证平台角色导航顺序**

打开平台管理页面，确认侧边栏顺序为“承办管理”在“事项办理”之前，并可展开四个承办子页面。

- [x] **Step 2: 验证承办页面可打开**

依次打开“工作台与任务”“办理反馈”“草稿与通知”“已办事项”，确认页面有内容且事项详情入口可用。

- [x] **Step 3: 验证分办端未变化**

切换到 `dispatch` 角色，确认仍保留原有“事项办理 > 事项分办/整改台账”和“分析与协同”，不出现“承办管理”。

- [x] **Step 4: 检查控制台**

确认页面控制台没有新增 JavaScript 错误。
