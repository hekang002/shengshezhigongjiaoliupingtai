(function () {
  const seed = [
    ['cfg-1', '最小密码长度', 'password.min.length', '12', '数字', '密码策略', '单位：位，允许范围 8-64'],
    ['cfg-2', '密码复杂度要求', 'password.complexity.enabled', '是', '布尔', '密码策略', '要求密码包含多类字符'],
    ['cfg-3', '密码有效期', 'password.expiry.days', '90', '数字', '密码策略', '单位：天，0 表示不限制'],
    ['cfg-4', '密码历史记录数', 'password.history.count', '5', '数字', '密码策略', '不可重复使用最近密码'],
    ['cfg-5', '无操作自动退出时长', 'session.idle.minutes', '30', '数字', '会话策略', '单位：分钟'],
    ['cfg-6', '单次会话最长时长', 'session.max.hours', '8', '数字', '会话策略', '单位：小时'],
    ['cfg-7', '单账号会话限制', 'session.single.enabled', '否', '布尔', '会话策略', '仅允许一个活跃会话'],
    ['cfg-8', '连续登录失败次数', 'login.failure.limit', '5', '数字', '登录锁定', '达到次数后锁定账号'],
    ['cfg-9', '失败计数时间窗口', 'login.failure.window.minutes', '15', '数字', '登录锁定', '单位：分钟'],
    ['cfg-10', '自动解锁等待时间', 'login.lock.minutes', '30', '数字', '登录锁定', '单位：分钟'],
    ['cfg-11', '允许管理员提前解锁', 'login.admin.unlock.enabled', '是', '布尔', '登录锁定', '平台管理员可提前解除锁定']
  ].map(([id, name, key, value, type, group, remark], index) => ({ id, name, key, value, type, group, remark, sort: index + 1, enabled: true }));
  const groups = [
    { id: 'password', name: '密码策略', code: 'security.password', summary: '密码长度、复杂度、有效期及历史记录', sort: 1 },
    { id: 'session', name: '会话策略', code: 'security.session', summary: '空闲退出、最长会话及单账号会话限制', sort: 2 },
    { id: 'lock', name: '登录锁定', code: 'security.login.lock', summary: '失败计数、锁定时长及管理员解锁', sort: 3 }
  ];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const btn = (label, action, id = '', kind = '') => `<button type="button" class="btn btn-sm ${kind ? 'btn-' + kind : 'btn-secondary'}" data-base-action="${action}" data-id="${esc(id)}">${label}</button>`;
  const items = (data = PrototypeData.read()) => Array.isArray(data.baseConfigItems) ? data.baseConfigItems : seed;
  let keyword = '', modalGroup = '';
  function saveData(mutator, detail) {
    const data = PrototypeData.read();
    if (!Array.isArray(data.baseConfigItems)) data.baseConfigItems = seed;
    mutator(data.baseConfigItems);
    data.audit.unshift({ action: '基础配置', target: detail, detail, role: roleInfo[state.role].label, at: new Date().toLocaleString('zh-CN', { hour12: false }) });
    PrototypeData.save(data);
  }
  function modal() {
    if (!modalGroup) return '';
    const group = groups.find((entry) => entry.name === modalGroup);
    const rows = items().filter((item) => item.group === modalGroup).sort((a, b) => a.sort - b.sort);
    return `<div class="modal-backdrop base-modal"><section class="modal base-detail-modal" role="dialog" aria-modal="true" aria-label="${esc(modalGroup)}配置详情"><div class="modal-head"><div><h3>${esc(modalGroup)}配置详情</h3><p>${esc(group.summary)} · 共 ${rows.length} 项参数</p></div><button type="button" class="base-modal-close" data-base-action="close" aria-label="关闭">×</button></div><div class="modal-body"><div class="base-detail-head"><span>参数名称</span><span>配置值</span><span>值类型</span><span>状态</span></div><div class="base-detail-rows">${rows.map((item) => `<div class="base-detail-row"><label><strong>${esc(item.name)}</strong><code>${esc(item.key)}</code></label><input class="input" data-base-value="${item.id}" value="${esc(item.value)}"><span>${esc(item.type)}</span><label class="base-detail-switch"><input type="checkbox" data-base-enabled="${item.id}" ${item.enabled ? 'checked' : ''}><span></span><em>${item.enabled ? '启用' : '停用'}</em></label><p>${esc(item.remark)}</p></div>`).join('')}</div></div><div class="modal-foot"><span class="base-detail-tip">保存后记录操作日志</span>${btn('取消', 'close')}${btn('保存配置', 'save-group', modalGroup, 'primary')}</div></section></div>`;
  }
  function page() {
    if (state.role !== 'platform') return pageHead('基础配置', '当前角色无权维护基础配置。');
    const all = items();
    const visible = groups.filter((group) => !keyword || (group.name + group.code + group.summary).includes(keyword));
    return pageHead('基础配置', '一种配置一条记录，具体参数在详情中集中维护。') +
      `<div class="base-group-filter"><label>关键词<input class="input" id="base-group-keyword" value="${esc(keyword)}" placeholder="配置名称或编码"></label><div>${btn('重置', 'reset')}${btn('搜索', 'search', '', 'primary')}</div></div><section class="base-config-table base-group-table"><div class="section-title"><h2>系统配置</h2><span>共 ${visible.length} 条</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>配置名称</th><th>配置编码</th><th>参数数量</th><th>状态</th><th>排序</th><th>说明</th><th>更新时间</th><th>操作</th></tr></thead><tbody>${visible.map((group) => { const children = all.filter((item) => item.group === group.name); const enabled = children.some((item) => item.enabled); return `<tr><td><strong>${group.name}</strong></td><td><code>${group.code}</code></td><td>${children.length} 项</td><td><span class="badge ${enabled ? 'green' : ''}">${enabled ? '已启用' : '已停用'}</span></td><td>${group.sort}</td><td>${group.summary}</td><td>2026-09-14 09:00</td><td>${btn('配置详情', 'detail', group.name, 'primary')}</td></tr>`; }).join('')}</tbody></table></div></section>${modal()}`;
  }
  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-base-action]');
    if (!target) return;
    const action = target.dataset.baseAction, id = target.dataset.id;
    if (action === 'detail') { modalGroup = id; return render(); }
    if (action === 'close') { modalGroup = ''; return render(); }
    if (action === 'reset') { keyword = ''; return render(); }
    if (action === 'search') { keyword = document.getElementById('base-group-keyword').value.trim(); return render(); }
    if (action === 'save-group') {
      const values = [...document.querySelectorAll('[data-base-value]')].map((field) => ({ id: field.dataset.baseValue, value: field.value.trim(), enabled: document.querySelector(`[data-base-enabled="${field.dataset.baseValue}"]`).checked }));
      if (values.some((entry) => !entry.value)) return showToast('配置值不能为空');
      saveData((all) => values.forEach((entry) => { const item = all.find((row) => row.id === entry.id); if (item) Object.assign(item, { value: entry.value, enabled: entry.enabled }); }), '更新' + id);
      modalGroup = ''; render(); showToast(id + '已保存');
    }
  });
  window.ManagementBaseConfig = { page };
})();
