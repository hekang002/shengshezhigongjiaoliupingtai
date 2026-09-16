(function () {
  const flows = [
    { id: 'suggestion', name: '建言献策', code: 'SUGGESTION', steps: ['内容审核', '分办'] },
    { id: 'appeal', name: '心声诉求', code: 'APPEAL', steps: ['内容审核', '分办'] },
    { id: 'exchange', name: '业务交流', code: 'EXCHANGE', steps: ['内容审核'] },
    { id: 'comment', name: '评论提交', code: 'COMMENT', steps: ['评论审核'] },
    { id: 'report', name: '举报提交', code: 'REPORT', steps: ['举报核查'] }
  ];
  const roles = ['内容管理员', '分办管理员', '承办负责人', '平台管理员'];
  const users = { '内容管理员': ['王敏'], '分办管理员': ['王敏'], '承办负责人': ['陈凯', '刘敏', '周磊'], '平台管理员': ['王敏'] };
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const button = (label, action, id, kind) => `<button type="button" class="btn btn-sm ${kind ? 'btn-' + kind : 'btn-secondary'}" data-simple-flow="${action}" data-id="${esc(id || '')}">${label}</button>`;
  let selected = '', editing = false, draft = null;
  const read = () => PrototypeData.read().simpleFlowConfigs || {};
  const defaults = (flow) => flow.steps.map((name, i) => ({ id: `${flow.id}-${i}`, name, role: name === '分办' ? '分办管理员' : name === '事项办理' ? '承办负责人' : '内容管理员', user: '', enabled: true }));
  const steps = (flow) => read()[flow.id]?.steps || defaults(flow);
  function list() {
    const rows = flows.map((flow) => `<tr><td><strong>${flow.name}</strong></td><td><code>${flow.code}</code></td><td>${flow.steps.length} 个固定环节</td><td><span class="flow-status on">已配置</span></td><td>2026-09-15 09:00</td><td>${button('配置详情', 'edit', flow.id, 'primary')}</td></tr>`).join('');
    return pageHead('流程配置', '按业务维护基础审批环节，可在详情弹窗中按需增加节点并指定角色和用户。', '<span class="badge">5 条业务流程</span>') + `<section class="simple-flow-list"><div class="section-title"><h2>业务流程</h2><span>默认环节可按需扩展</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>流程名称</th><th>流程编码</th><th>基础环节</th><th>配置状态</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }
  function detail(flow) {
    if (!draft) draft = steps(flow).map((item) => ({ ...item }));
    const rows = draft.map((step, i) => {
      const userOptions = (users[step.role] || []).map((user) => `<option ${user === step.user ? 'selected' : ''}>${user}</option>`).join('');
      return `<div class="simple-step"><span class="simple-step-index">${String(i + 1).padStart(2, '0')}</span><div class="simple-step-name"><input class="input" data-simple-field="name" data-step-id="${step.id}" value="${esc(step.name)}"><small>审批环节名称</small></div><label>审批角色<select class="select" data-simple-field="role" data-step-id="${step.id}">${roles.map((role) => `<option ${role === step.role ? 'selected' : ''}>${role}</option>`).join('')}</select></label><label>指定用户<select class="select" data-simple-field="user" data-step-id="${step.id}"><option value="">角色下所有人员</option>${userOptions}</select></label><label class="simple-enabled"><input type="checkbox" data-simple-field="enabled" data-step-id="${step.id}" ${step.enabled ? 'checked' : ''}> 启用</label></div>`;
    }).join('');
    return `<div class="modal-backdrop simple-flow-modal"><section class="modal simple-flow-detail" role="dialog" aria-modal="true" aria-label="${flow.name}流程配置"><div class="modal-head"><div><h3>${flow.name}流程配置</h3><p>${flow.code} · 添加和维护审批环节角色及用户</p></div><button type="button" class="simple-modal-close" data-simple-flow="back" aria-label="关闭">×</button></div><div class="modal-body"><div class="notice"><strong>配置说明</strong><p>默认只提供基础审批环节，可按实际业务点击“添加节点”。未指定用户时，由该角色下人员处理。</p></div><div class="simple-step-list">${rows}</div><div class="simple-add-node">${button('+ 添加节点', 'add-node', flow.id, 'secondary')}</div></div><div class="modal-foot"><span class="simple-flow-foot">保存后记录审批人员配置日志。</span>${button('取消', 'back')}${button('保存配置', 'save', flow.id, 'primary')}</div></section></div>`;
  }
  function page() { if (state.role !== 'platform') return pageHead('流程配置', '仅平台管理员可维护流程。'); const flow = flows.find((item) => item.id === selected); return editing && flow ? detail(flow) : list(); }
  document.addEventListener('click', (event) => { const target = event.target.closest('[data-simple-flow]'); if (!target) return; const action = target.dataset.simpleFlow; const id = target.dataset.id; if (action === 'edit') { selected = id; editing = true; draft = null; return render(); } if (action === 'back') { editing = false; draft = null; return render(); } if (action === 'add-node') { draft.push({ id: `${id}-${Date.now()}`, name: '新增审批节点', role: '内容管理员', user: '', enabled: true }); return render(); } if (action === 'save') { const data = PrototypeData.read(); data.simpleFlowConfigs = data.simpleFlowConfigs || {}; data.simpleFlowConfigs[id] = { steps: draft }; data.audit.unshift({ action: '流程配置', target: id, detail: '保存审批角色与用户', role: roleInfo[state.role].label, at: new Date().toLocaleString('zh-CN') }); PrototypeData.save(data); editing = false; draft = null; render(); showToast('审批人员配置已保存'); } });
  document.addEventListener('change', (event) => { const field = event.target.dataset.simpleField; if (!field || !draft) return; const step = draft.find((item) => item.id === event.target.dataset.stepId); if (!step) return; step[field] = field === 'enabled' ? event.target.checked : event.target.value; if (field === 'role') { step.user = ''; render(); } });
  window.ManagementFlowConfig = { page };
})();
