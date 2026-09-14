(function () {
  const defs = [
    ['suggestion', '建言献策提交', '帖子提交', '建言献策', ['职工提交', '人工审核', '公开与办理决定', '公共待办认领', '部门办理', '答复复核', '办结归档']],
    ['appeal', '心声诉求提交', '帖子提交', '心声诉求', ['职工提交', '人工审核', '公开与办理决定', '公共待办认领', '部门办理', '答复复核', '办结归档']],
    ['exchange', '业务交流提交', '帖子提交', '业务交流', ['职工提交', '敏感规则判断', '命中人工审核', '公开发布']],
    ['comment', '评论提交', '评论提交', '全部栏目', ['提交评论', '敏感规则判断', '命中人工审核', '关联原帖发布']],
    ['report', '举报提交', '举报提交', '全部栏目', ['提交举报', '人工核查', '成立与否判断', '人工选择处置', '结论反馈']]
  ];
  const roles = ['内容管理员', '分办管理员', '平台管理员', '承办负责人'];
  const safeText = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const defaults = () => defs.map(([id, name, event, boards, steps]) => ({
    id, name, event, boards, code: 'FLOW-' + id.toUpperCase(), version: 1, enabled: true, publishedAt: '2026-09-14 09:00',
    receiver: id === 'report' ? '内容管理员' : '分办管理员', reviewer: '内容管理员',
    transfer: '本组织授权角色或人员', timeout: '提醒接收角色并升级至平台管理员',
    nodes: steps.map((label, index) => ({ id: id + '-' + index, name: label, role: index === 0 ? '发起人' : index > 3 ? '承办负责人' : '内容管理员', pass: index === steps.length - 1 ? '结束' : '下一节点', back: index ? '上一节点' : '无', hours: 48,
      branch: label === '公开与办理决定' ? '人工双决定' : label === '敏感规则判断' ? '敏感规则命中' : label === '成立与否判断' ? '举报结论' : '无',
      branchA: label === '公开与办理决定' ? '仅公开 / 不办理 → 结束' : label === '敏感规则判断' ? '未命中 → 直接公开' : label === '成立与否判断' ? '不成立 → 反馈' : '',
      branchB: label === '公开与办理决定' ? '决定办理 → 公共待办' : label === '敏感规则判断' ? '命中 → 人工审核' : label === '成立与否判断' ? '成立 → 人工处置' : '' })), draft: null
  }));
  const items = () => PrototypeData.read().eventFlowTemplates || defaults();
  let selected = 'suggestion', mode = 'list', filter = 'all', search = '', draft = null, focused = '', feedback = '', openMenu = '';
  const current = () => items().find((item) => item.id === selected);
  function commit(action) {
    const data = PrototypeData.read();
    if (!data.eventFlowTemplates) data.eventFlowTemplates = defaults();
    const target = data.eventFlowTemplates.find((item) => item.id === selected);
    if (action === 'save') target.draft = copy(draft);
    if (action === 'publish') Object.assign(target, copy(draft), { draft: null, version: target.version + 1, publishedAt: new Date().toLocaleString('zh-CN', { hour12: false }) });
    if (action === 'toggle') target.enabled = !target.enabled;
    data.audit.unshift({ action: '流程配置', target: target.code, detail: action === 'publish' ? '发布 v' + target.version : action === 'save' ? '保存草稿' : '切换启用状态', role: roleInfo[state.role].label, at: new Date().toLocaleString('zh-CN') });
    PrototypeData.save(data);
  }
  const button = (title, action, id, css = '') => `<button type="button" class="${css}" data-flow-action="${action}" data-id="${safeText(id || '')}">${title}</button>`;
  function listing() {
    const visible = items().filter((item) => (filter === 'all' || (filter === 'draft' ? item.draft : !item.draft)) && (item.name + item.code + item.boards + item.event).includes(search));
    return pageHead('流程配置', '按触发事件管理发布审核与事项办理流程。', '<span class="badge">5 套事件模板</span>') +
      `<section class="flow-list"><div class="flow-filter"><label>流程名称 / 编码<input class="input" id="flow-search" placeholder="搜索流程" value="${safeText(search)}"></label><label>触发事件<select class="select" id="flow-event"><option value="">全部事件</option>${['帖子提交', '评论提交', '举报提交'].map((event) => `<option>${event}</option>`).join('')}</select></label>${button('查询', 'search', '', 'btn btn-primary')}${button('重置', 'reset-search', '', 'btn btn-secondary')}</div><div class="flow-list-toolbar"><div class="flow-segment">${[['all', '全部模板'], ['published', '已发布'], ['draft', '有草稿']].map(([id, label]) => button(label, 'filter', id, filter === id ? 'selected' : '')).join('')}</div><span>${visible.length} 套模板</span></div><div class="table-wrap"><table class="data-table flow-table"><thead><tr><th>流程名称</th><th>流程编码</th><th>适用栏目</th><th>版本</th><th>启用状态</th><th>发布状态</th><th>操作</th></tr></thead><tbody>${visible.map((item) => `<tr><td><strong>${safeText(item.name)}</strong><small>${safeText(item.event)}</small></td><td>${safeText(item.code)}</td><td>${safeText(item.boards)}</td><td>v${item.version}</td><td><span class="flow-status ${item.enabled ? 'on' : ''}">${item.enabled ? '已启用' : '已停用'}</span></td><td><span class="flow-status ${item.draft ? 'draft' : 'on'}">${item.draft ? '有未发布草稿' : '已发布'}</span></td><td class="flow-row-actions">${button('编辑流程', 'edit', item.id, 'flow-text-action')}${button('···', 'menu', item.id, 'flow-more')}${openMenu === item.id ? `<div class="flow-menu">${button(item.enabled ? '停用模板' : '启用模板', 'toggle', item.id)}${button('查看路径', 'edit', item.id)}</div>` : ''}</td></tr>`).join('') || '<tr><td colspan="7">暂无匹配模板</td></tr>'}</tbody></table></div></section>`;
  }
  const choices = (values, currentValue) => values.map((value) => `<option ${value === currentValue ? 'selected' : ''}>${safeText(value)}</option>`).join('');
  function inspector() {
    const node = draft.nodes.find((item) => item.id === focused);
    if (!node) return '<aside class="flow-inspector"><h3>节点设置</h3><p>选择节点查看配置。</p></aside>';
    return `<aside class="flow-inspector"><div class="flow-inspector-head"><h3>节点设置</h3>${button('删除节点', 'remove', node.id, 'flow-delete')}</div><label>节点名称<input class="input" data-node-field="name" value="${safeText(node.name)}"></label><label>处理角色<select class="select" data-node-field="role">${choices(['发起人', ...roles], node.role)}</select></label><label>通过去向<select class="select" data-node-field="pass">${choices(['下一节点', '公开发布', '公共待办认领', '仅公开', '仅内部办理', '公开并办理', '结束'], node.pass)}</select></label><label>退回去向<select class="select" data-node-field="back">${choices(['上一节点', '发起人修改', '原责任人', '结束', '无'], node.back)}</select></label><label>处理时限（小时）<input class="input" type="number" min="1" max="720" data-node-field="hours" value="${safeText(node.hours)}"></label><label>条件分支<select class="select" data-node-field="branch">${choices(['无', '人工双决定', '敏感规则命中', '举报结论'], node.branch || '无')}</select></label>${node.branch && node.branch !== '无' ? `<label>分支 A 去向<input class="input" data-node-field="branchA" value="${safeText(node.branchA)}"></label><label>分支 B 去向<input class="input" data-node-field="branchB" value="${safeText(node.branchB)}"></label>` : ''}<p class="flow-note">转办须经接收方确认，确认前责任不转移。</p></aside>`;
  }
  function editor() {
    const published = current();
    if (!published) return listing();
    if (!draft) draft = copy(published.draft || published);
    if (!draft.nodes.some((node) => node.id === focused)) focused = draft.nodes[1]?.id || draft.nodes[0].id;
    const rule = selected === 'suggestion' || selected === 'appeal' ? '人工分别决定是否公开、是否办理；决定办理后才进入公共待办。' : selected === 'report' ? '人工判断举报成立与否；成立后再选择处置，不自动删除。' : '未命中敏感规则直接发布；命中后提交成功并转人工审核。';
    return `<div class="flow-editor-head">${button('← 返回流程列表', 'back', '', 'flow-back')}<div class="flow-editor-title"><span>${safeText(draft.event)} · ${safeText(draft.boards)}</span><h1>${safeText(draft.name)}</h1><p>已发布 v${published.version} · ${safeText(published.publishedAt)}${published.draft ? ' · 有未发布草稿' : ''}</p></div><div class="flow-editor-actions">${button('路径检查', 'validate', '', 'btn btn-secondary')}${button('模拟运行', 'simulate', '', 'btn btn-secondary')}${button('保存草稿', 'save', '', 'btn btn-secondary')}${button('发布新版本', 'publish', '', 'btn btn-primary')}</div></div>${feedback ? `<div class="flow-feedback" role="status">${safeText(feedback)}</div>` : ''}<div class="flow-meta"><label>接收角色<select class="select" data-template-field="receiver">${choices(roles, draft.receiver)}</select></label><label>复核角色<select class="select" data-template-field="reviewer">${choices(roles, draft.reviewer)}</select></label><label>转办范围<input class="input" data-template-field="transfer" value="${safeText(draft.transfer)}"></label><label>超时兜底<input class="input" data-template-field="timeout" value="${safeText(draft.timeout)}"></label></div><div class="flow-builder"><div class="flow-canvas"><div class="flow-canvas-header"><strong>流转路径</strong><span>点击节点编辑，点击连接点添加节点</span></div><div class="flow-track"><div class="flow-start">触发 · ${safeText(draft.event)}</div>${draft.nodes.map((node, index) => `<div class="flow-line"></div>${button('+', 'add', index ? draft.nodes[index - 1].id : '', 'flow-add')}<button type="button" class="flow-node ${focused === node.id ? 'selected' : ''}" data-flow-action="focus" data-id="${node.id}"><span><b>${String(index + 1).padStart(2, '0')}</b><strong>${safeText(node.name)}</strong>⌁</span><small>${safeText(node.role)} · ${safeText(node.hours)} 小时</small></button>${node.branch && node.branch !== '无' ? `<div class="flow-branches"><span>${safeText(node.branchA || '分支 A 待配置')}</span><span>${safeText(node.branchB || '分支 B 待配置')}</span></div>` : ''}`).join('')}<div class="flow-line"></div>${button('+', 'add', draft.nodes.at(-1).id, 'flow-add')}<div class="flow-end">流程结束</div></div></div>${inspector()}</div><div class="flow-branch"><strong>条件分支</strong><span>${rule}</span></div>`;
  }
  function validate() {
    if (!draft.receiver || !draft.reviewer || !draft.timeout.trim()) return '路径检查未通过：请填写接收角色、复核角色和超时兜底。';
    if (draft.nodes.length < 2 || draft.nodes.some((node) => !node.name.trim() || !node.role || !Number(node.hours))) return '路径检查未通过：至少两个节点，且名称、角色和处理时限不能为空。';
    if (draft.nodes.some((node) => node.branch && node.branch !== '无' && (!node.branchA?.trim() || !node.branchB?.trim()))) return '路径检查未通过：请补齐条件分支的两条去向。';
    if (draft.nodes.at(-1).pass !== '结束') return '路径检查未通过：末节点通过去向必须为结束。';
    return '';
  }
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-flow-action]');
    if (!target) return;
    if (state.role !== 'platform') return showToast('仅平台管理员可维护流程');
    const action = target.dataset.flowAction, id = target.dataset.id;
    if (action === 'back') { mode = 'list'; draft = null; feedback = ''; return render(); }
    if (action === 'edit') { selected = id; mode = 'editor'; draft = null; focused = ''; feedback = ''; return render(); }
    if (action === 'menu') { openMenu = openMenu === id ? '' : id; return render(); }
    if (action === 'filter') { filter = id; return render(); }
    if (action === 'search') { search = document.getElementById('flow-search').value.trim() || document.getElementById('flow-event').value; return render(); }
    if (action === 'reset-search') { search = ''; filter = 'all'; return render(); }
    if (action === 'toggle') { selected = id; commit('toggle'); openMenu = ''; return render(); }
    if (action === 'focus') { focused = id; return render(); }
    if (action === 'add') { const index = draft.nodes.findIndex((node) => node.id === id); const insert = index + 1; const node = { id: 'node-' + Date.now(), name: '新增处理节点', role: '内容管理员', pass: insert === draft.nodes.length ? '结束' : '下一节点', back: '上一节点', hours: 48, branch: '无', branchA: '', branchB: '' }; if (insert === draft.nodes.length) draft.nodes.at(-1).pass = '下一节点'; draft.nodes.splice(insert, 0, node); focused = node.id; return render(); }
    if (action === 'remove') { if (draft.nodes.length <= 2) return showToast('至少保留两个节点'); draft.nodes = draft.nodes.filter((node) => node.id !== id); draft.nodes.at(-1).pass = '结束'; focused = draft.nodes[0].id; return render(); }
    if (action === 'validate') { feedback = validate() || '路径检查通过：节点可达，接收、复核和超时兜底已配置。'; return render(); }
    if (action === 'simulate') { feedback = validate() || (selected === 'suggestion' || selected === 'appeal' ? '模拟通过：提交 → 人工审核 → 公开/办理双决定 → 公共待办认领 → 部门办理。' : selected === 'report' ? '模拟通过：举报 → 人工核查 → 结论 → 人工处置 → 反馈。' : '模拟通过：未命中直接公开；命中后转人工审核。'); return render(); }
    if (action === 'save' || action === 'publish') { if (action === 'publish' && validate()) { feedback = validate(); return render(); } commit(action); feedback = action === 'save' ? '草稿已保存。' : '新版本已发布；已有任务继续沿用原版本。'; return render(); }
  });
  function updateField(event) {
    if (mode !== 'editor' || !draft) return;
    const field = event.target.dataset.templateField, nodeField = event.target.dataset.nodeField;
    if (field) draft[field] = event.target.value;
    if (nodeField) { const node = draft.nodes.find((item) => item.id === focused); if (node) node[nodeField] = event.target.value; }
  }
  document.addEventListener('input', updateField);
  document.addEventListener('change', (event) => { updateField(event); if (event.target.dataset.nodeField === 'branch') render(); });
  window.ManagementFlowConfig = { page: () => state.role === 'platform' ? mode === 'editor' ? editor() : listing() : pageHead('流程配置', '仅平台管理员可维护流程。') };
})();
