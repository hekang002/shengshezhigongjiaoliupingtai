# 已办结事项统一台账实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将承办管理的“已办结事项”改为与“事项办理 > 已办结”同源、同字段口径的统一台账页面。

**Architecture:** 复用现有事项分办中的办结归类、筛选字段和阶段时间计算，承办页面只读展示。页面保留统一查询栏和单张办结台账，答复方式与答复摘要作为事项字段，详情继续使用现有事项详情弹窗。

**Tech Stack:** 原生 JavaScript、现有 HTML 字符串模板、现有 CSS、PrototypeData、Playwright CLI。

## Global Constraints

- 不修改“事项办理 > 事项分办”及其四个页签的业务逻辑。
- “已办结事项”只读，不提供编辑、再次办理或发布动作。
- 统一台账数据只取事项分办中的 `已反馈` / `已办结` 集合，并保持建言献策、心声诉求范围。
- 保留当前工作区已有修改，不提交 git。

### Task 1: 统一办结台账页面

**Files:**
- Modify: `原型优化设计/管理端原型设计/workflow.js`
- Modify: `原型优化设计/管理端原型设计/styles.css`
- Modify: `原型优化设计/管理端原型设计/index.html`

- [ ] 将 `handlerAnswers()` 改为单张“办结台账”，字段统一为事项名称/编号、事项类型、承办部门/办理人、优先级、办理期限、答复方式、办结时间、操作。
- [ ] 复用办结事项筛选项：关键词、事项类型、承办部门、答复方式、办结时间范围；重置和查询只作用于该页面。
- [ ] 将公开答复/私密回复作为行内字段，不再单独渲染“公开答复”表。
- [ ] 保留 `affair-detail` 详情入口，确保只读查看完整事项、答复和流程记录。
- [ ] 为统一台账增加紧凑表格和移动端横向滚动样式。

### Task 2: Verification

- [ ] 运行 `node --check` 检查 JavaScript 文件。
- [ ] 运行 `git diff --check`。
- [ ] 用 Playwright 验证页面数量与事项办理 > 已办结一致、筛选可用、详情可打开、事项分办未变化。
- [ ] 用 1280x800 与 736x929 检查无页面级横向溢出，控制台无新增错误。
