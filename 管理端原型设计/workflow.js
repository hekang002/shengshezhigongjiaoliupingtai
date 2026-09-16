(function () {
  const db = () => PrototypeData.read();
  const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isLeaderView = () => state.role === 'leader' || state.page.startsWith('leader-');
  const canEdit = () => !isLeaderView();
  const canReview = () => ['platform', 'content'].includes(state.role);
  const canManageLedger = () => ['platform', 'content'].includes(state.role);
  const canPublish = () => ['platform', 'content'].includes(state.role);
  const canDispatch = () => ['platform', 'dispatch'].includes(state.role);
  const canHandle = () => ['platform', 'handler'].includes(state.role);
  const flowForPost = (post, data) => post?.flowSnapshot || PrototypeData.flowFor(post?.board, data);
  const flowForAffair = (affair, data) => affair?.flowSnapshot || flowForPost(data.posts.find((post) => post.id === affair?.postId), data);
  const canFlowRole = (flow, field, fallback) => state.role === 'platform' || state.role === (flow?.[field] || fallback);
  const badgeFor = (status) => badge(safe(status), /驳回|逾期|隐藏|禁用/.test(status) ? 'red' : /待|临期/.test(status) ? 'gold' : /已发布|已办结|已反馈|已答复|已私密回复/.test(status) ? 'green' : 'blue');
  const button = (label, action, id, kind = 'secondary') => `<button class="btn btn-sm btn-${kind}" data-action="${action}" data-id="${safe(id)}">${label}</button>`;
  const heading = (title, subtitle, actions = '') => pageHead(title, subtitle, actions);
  const list = (columns, rows) => `<div class="table-wrap"><table class="data-table"><thead><tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${columns.length}" class="empty">暂无符合条件的记录</td></tr>`}</tbody></table></div>`;
  const input = (label, id, value = '', type = 'text') => `<label class="field"><span>${label}</span><input class="input" id="wf-${id}" type="${type}" value="${safe(value)}"></label>`;
  const choose = (label, id, options, selected) => `<label class="field"><span>${label}</span><select class="select" id="wf-${id}">${options.map((v) => `<option ${v === selected ? 'selected' : ''}>${safe(v)}</option>`).join('')}</select></label>`;
  const textarea = (label, id, value = '') => `<label class="field"><span>${label}</span><textarea class="textarea" id="wf-${id}">${safe(value)}</textarea></label>`;
  const readField = (name) => document.getElementById(`wf-${name}`)?.value.trim() || '';
  const time = () => new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  const today = () => new Date().toLocaleDateString('sv-SE');
  let handlerFilters = { query: '', status: '', priority: '', deadline: '', type: '', assignedFrom: '', assignedTo: '', deadlineFrom: '', deadlineTo: '' };
  let handlingType = '';
  let handlerMessageType = '';
  let workbenchTab = '待处理';
  let contentReviewType = '全部';
  let assignmentTab = '历史待登记';
  const handlerDepartment = (data) => {
    const accountId = sessionStorage.getItem('prototype-handler-account-id');
    return (accountId ? data.accounts.find((account) => account.id === accountId && account.role === 'handler' && account.status === 'approved') : data.accounts.find((account) => account.role === 'handler' && account.status === 'approved'))?.department || '';
  };
  const handlerAccountId = () => sessionStorage.getItem('prototype-handler-account-id') || '';
  const handlerAccounts = (data) => (data.accounts || []).filter((account) => account.role === 'handler' && account.status === 'approved');
  const accountSelect = (data, id, label, selected = '') => `<label class="field"><span>${label}</span><select class="select" id="wf-${id}"><option value="">请选择承办人</option>${handlerAccounts(data).map((account) => `<option value="${safe(account.id)}" ${account.id === selected ? 'selected' : ''}>${safe(account.name)} · ${safe(account.department)}</option>`).join('')}</select></label>`;
  const processPost = (post) => ['建言献策', '心声诉求'].includes(post?.board);
  const canAuditPost = (post, data) => post?.board === '业务交流' ? canDispatch() : processPost(post) ? canConfirmProcess(post, data) : canFlowRole(flowForPost(post, data), 'contentRole', 'content');
  // 只有完成“信息内容审核”的帖子才允许进入事项分办，避免未审核内容绕过上游流程。
  const processPostStatus = (post) => post?.status === '已发布' && !post.processingAccepted;
  const canConfirmProcess = (post, data) => canFlowRole(flowForPost(post, data), 'assignmentRole', 'dispatch');
  const canWorkOn = (affair, data) => isAssignedHandler(affair, data) || (affair.selfHandled && canDispatch() && affair.dispatcherId === currentAccount().id);
  const transferTarget = (affair) => affair?.transfer?.status === '待接收' ? affair.transfer.toAssigneeId : '';
  const canViewAffair = (affair, data) => {
    if (state.role !== 'handler') return true;
    const id = handlerAccountId();
    return affair.owner === handlerDepartment(data) || transferTarget(affair) === id;
  };
  const isAssignedHandler = (affair, data) => state.role === 'handler' && affair.assigneeId === handlerAccountId() && affair.owner === handlerDepartment(data);
  const isTransferTarget = (affair) => state.role === 'handler' && transferTarget(affair) === handlerAccountId();
  const handlerItems = (data) => state.role === 'handler' ? data.affairs.filter((affair) => canViewAffair(affair, data)) : data.affairs;
  const deadlineFlag = (affair) => {
    if (['已反馈', '已办结'].includes(affair.status)) return '';
    const days = Math.ceil((new Date(`${affair.deadline}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
    return days < 0 ? '逾期' : days <= 3 ? '临期' : '';
  };
  const deadlineText = (affair) => {
    if (['已反馈', '已办结'].includes(affair.status)) return '已完成';
    const days = Math.ceil((new Date(`${affair.deadline}T12:00:00`) - new Date(`${today()}T12:00:00`)) / 86400000);
    return days < 0 ? `逾期 ${Math.abs(days)} 天` : days === 0 ? '今日到期' : `剩余 ${days} 天`;
  };
  const orgUi = { filters: { query: '', visible: '', status: '', parent: '' }, advanced: false, collapsed: new Set(), menuId: null };
  const statusLabel = (a) => a.status === '办理中' && a.extension?.status === '待审批' ? '待延期审批' : a.returnReason && a.status === '办理中' ? '退回修改' : ['待承办确认', '转办待接收'].includes(a.status) ? '办理中' : a.status;
  const handlerStatusLabel = (a) => {
    if (a.returnReason) return '退回';
    if (['待承办确认', '转办待接收'].includes(a.status)) return '待处理';
    if (a.status === '已办结') return '已办结';
    if (deadlineFlag(a) === '临期') return '临期';
    if (a.courted || a.stage === '等待协同反馈') return '已催办';
    return a.status;
  };
  const handlerBusinessType = (source) => source?.board === '心声诉求' ? '心声诉求' : '建言献策';
  function update(action, entity, id, fn, message) {
    const data = db();
    const row = data[entity]?.find((item) => String(item.id) === String(id));
    if (!row) return showToast('记录不存在，请刷新后重试');
    const detail = fn(row, data);
    if (detail === false) return;
    data.audit.unshift({ action, target: id, detail: detail || message, role: roleInfo[state.role].label, at: time() });
    PrototypeData.save(data);
    closeModal();
    showToast(message);
  }
  function board() {
    const data = db();
    const pending = data.posts.filter((p) => ['私密发布', '待审核'].includes(p.status)).length;
    const unassigned = data.posts.filter((p) => processPost(p) && processPostStatus(p) && flowForPost(p, data) && !data.affairs.some((a) => a.postId === p.id)).length;
    const review = data.affairs.filter((a) => a.status === '待复核').length;
    const active = data.affairs.filter((a) => a.status === '办理中').length;
    return heading(state.role === 'leader' ? '领导驾驶舱' : state.role === 'handler' ? '承办工作台' : '运营工作台', '按授权角色查看内容、事项和办理进展。') +
      `<div class="grid grid-4">${[['待确认/审核发言', pending, 'content-review'], ['历史待登记', unassigned, 'handler-dispatch'], ['办理中事项', active, 'handler-handling'], ['待回复审核', review, 'handler-dispatch']].map(([label, value, page]) => `<button class="card stat stat-link" onclick="go('${page}')"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-note">查看明细 →</span></button>`).join('')}</div>` +
      `<div class="split-layout"><section class="card card-pad"><div class="card-title">当前重点事项 ${button('全部事项', 'nav', 'handler-handling')}</div>${data.affairs.map((a) => `<div class="queue-item"><span class="queue-icon">${icon('clipboard-list')}</span><div><strong>${safe(a.title)}</strong><p>${safe(a.id)} · ${safe(a.owner)} · ${safe(a.deadline)}</p></div>${badgeFor(statusLabel(a))}</div>`).join('') || '<div class="empty">暂无办理事项</div>'}</section><aside class="card card-pad"><div class="card-title">最新操作</div><div class="timeline">${data.audit.slice(0, 6).map((e) => `<div class="timeline-item"><span class="timeline-dot">${icon('activity')}</span><div><strong>${safe(e.action)}</strong><p>${safe(e.detail)}</p></div><small>${safe(e.at)}</small></div>`).join('') || '<p class="muted">暂无操作记录</p>'}</div></aside></div>`;
  }
  function contentTabs(items, selected, action, label) { return `<div class="review-status-tabs content-tabs" role="tablist" aria-label="${safe(label)}">${items.map(([value, text, count]) => `<button type="button" role="tab" aria-selected="${selected === value}" class="review-status-tab ${selected === value ? 'active' : ''}" data-action="${action}" data-id="${safe(value)}">${safe(text)}${count === undefined ? '' : `<span>${count}</span>`}</button>`).join('')}</div>`; }
  function sensitiveWordHits(post, data) {
    if (Array.isArray(post.sensitiveHits)) return post.sensitiveHits.filter(Boolean);
    const content = `${post.title || ''}\n${post.body || ''}`.normalize('NFKC').toLocaleLowerCase();
    const hits = (data.sensitiveWords || []).filter((rule) => {
      if (!rule.enabled || (rule.scope !== '全部' && rule.scope !== '发帖')) return false;
      const term = String(rule.term || '').trim().normalize('NFKC').toLocaleLowerCase();
      return term && content.includes(term);
    }).map((rule) => rule.term);
    if (!hits.length && post.risk === '个人信息') hits.push('个人信息');
    return hits;
  }
  function sensitiveWordBadges(post, data) {
    const hits = sensitiveWordHits(post, data);
    return hits.length ? hits.map((term) => badgeFor(term)).join(' ') : '<span class="muted">未命中</span>';
  }
  function postReviewTable(data) {
    const rows = data.posts.filter((post) => post.board !== '业务交流' && (post.status === '私密发布' || sensitiveWordHits(post, data).length || post.protectedListId));
    return list(['帖子 / 来源', '敏感词命中', '状态', '操作'], rows.map((p) => `<tr><td><strong>${safe(p.title)}</strong><div class="td-sub">${safe(p.board)} · ${safe(p.author)} · ${safe(p.time)}</div></td><td>${sensitiveWordBadges(p, data)}</td><td>${badgeFor(p.status)}</td><td><div class="row-actions">${button('详情', 'post-detail', p.id)}${canAuditPost(p, data) && ['私密发布', '待审核'].includes(p.status) ? button(processPost(p) ? '确认办理' : p.status === '私密发布' ? '公开发布' : '审核通过', 'post-decision-approve', p.id, 'primary') + button('退回', 'post-decision-return', p.id) : ''}${canReview() && p.status === '已发布' ? button('隐藏', 'post-hide', p.id) : canReview() && p.status === '已隐藏' ? button('恢复', 'post-restore', p.id) : ''}</div></td></tr>`));
  }
  function commentSensitiveHits(comment) {
    return Array.isArray(comment.sensitiveHits) ? comment.sensitiveHits.filter(Boolean) : [];
  }
  function commentReviewTable(data) {
    const pending = data.comments.filter((comment) => comment.status === '待审核' && (commentSensitiveHits(comment).length || comment.protectedListId));
    const groups = [...new Set(pending.map((comment) => String(comment.postId)))].map((postId) => {
      const comments = pending.filter((comment) => String(comment.postId) === postId);
      const post = data.posts.find((item) => String(item.id) === postId);
      const hits = [...new Set(comments.flatMap(commentSensitiveHits))];
      return { postId, post, comments, hits, latest: comments.map((item) => item.createdAt || '').sort().at(-1) || '未记录' };
    });
    return list(['来源帖子', '待审评论', '敏感词命中', '最近提交', '操作'], groups.map((group) => `<tr><td><strong>${safe(group.post?.title || `帖子 #${group.postId}`)}</strong><div class="td-sub">帖子 #${safe(group.postId)} · ${safe(group.post?.board || '原栏目')}</div></td><td>${badgeFor(`${group.comments.length} 条`)}</td><td>${group.hits.length ? group.hits.map((term) => badgeFor(term)).join(' ') : badgeFor('受保护名单')}</td><td>${safe(group.latest)}</td><td>${button('按帖子审核', 'comment-batch-detail', group.postId, 'primary')}</td></tr>`));
  }
  function posts() {
    const data = db();
    return heading('帖子审核', '审核职工提交的帖子，风险识别结果与处置意见全程留痕。', `<span class="badge red">待审核 ${data.posts.filter((p) => p.status === '待审核').length}</span>`) + postReviewTable(data);
  }
  function comments() {
    const data = db();
    const pending = data.comments.filter((comment) => comment.status === '待审核' && (commentSensitiveHits(comment).length || comment.protectedListId));
    const postCount = new Set(pending.map((comment) => String(comment.postId))).size;
    return heading('评论审核', '按帖子汇总审核命中敏感词的评论；未命中评论直接发布。', `<span class="badge red">待审核 ${postCount} 个帖子 / ${pending.length} 条评论</span>`) + commentReviewTable(data);
  }
  function reportReview() {
    const data = db();
    const rows = (reports) => list(['举报编号 / 来源帖子', '举报原因', '状态', '核查结论', '操作'], reports.map((r) => {
      const source = data.posts.find((p) => p.id === r.postId);
      return `<tr><td><strong>${safe(source?.title || '来源帖子不可用')}</strong><div class="td-sub">${safe(r.id)} · 帖子 #${safe(r.postId)}</div></td><td>${safe(r.reason)}</td><td>${badgeFor(r.status)}</td><td>${safe(r.resolution || '—')}</td><td>${button(r.status === '待核查' ? '核查举报' : '查看结果', 'report-detail', r.id, r.status === '待核查' ? 'primary' : 'secondary')}</td></tr>`;
    }));
    const pending = data.reports.filter((r) => r.status === '待核查');
    return heading('举报核查', '核对来源内容和举报原因，记录核查结论与处置意见。', `<span class="badge red">待核查 ${pending.length}</span>`) + rows(data.reports);
  }
  function postComments(data, postId) {
    return (data.comments || []).filter((comment) => String(comment.postId) === String(postId));
  }
  function interactionSummary(post, comments) {
    const engagement = post.engagement || PrototypeData.emptyEngagement();
    return { views: engagement.views || 0, uniqueViews: engagement.uniqueViews || 0, likes: engagement.likes || 0, comments: (engagement.historicComments || 0) + comments.filter((item) => item.status === '已发布').length, favorites: engagement.favorites || 0, shares: engagement.shares || 0 };
  }
  function interactionCell(metrics) {
    return `<div class="ledger-interactions" aria-label="浏览 ${metrics.views}，点赞 ${metrics.likes}，评论 ${metrics.comments}，收藏 ${metrics.favorites}，分享 ${metrics.shares}">${[['eye', '浏览', metrics.views], ['thumbs-up', '点赞', metrics.likes], ['message-circle', '评论', metrics.comments], ['star', '收藏', metrics.favorites], ['share-2', '分享', metrics.shares]].map(([symbol, label, value]) => `<span title="${label} ${value}">${icon(symbol)}<small>${label}</small><strong>${value}</strong></span>`).join('')}</div>`;
  }
  function contentLedger() {
    const data = db();
    const categories = ['全部', '建言献策', '心声诉求', '业务交流', '回音壁'];
    const selected = categories.includes(state.contentLedgerTab) ? state.contentLedgerTab : '全部';
    const publishedStatuses = new Set(['私密发布', '已发布', '已受理', '已隐藏', '已办结公开']);
    const sourceRows = data.posts.filter((post) => post.deleted !== true && publishedStatuses.has(post.status)).map((post) => ({ id: post.id, title: post.title, category: post.board, author: post.author, time: post.time, status: post.enabled === false ? '已禁用' : post.status, action: 'post-detail', sourcePost: true, enabled: post.enabled !== false, metrics: interactionSummary(post, postComments(data, post.id)) }));
    const echoRows = (data.echoPublications || []).map((item) => ({ id: item.id, title: item.title, category: '回音壁', author: data.affairs.find((affair) => affair.id === item.affairId)?.owner || '平台管理组', time: item.publishedAt || '未发布', status: item.status, action: 'echo-view', metrics: interactionSummary(item, postComments(data, 6000 + Number(item.sourcePostId || 0))) }));
    const rows = [...sourceRows, ...echoRows].filter((item) => selected === '全部' || item.category === selected);
    const tabs = categories.map((category) => [category, category, [...sourceRows, ...echoRows].filter((item) => category === '全部' || item.category === category).length]);
    return heading('信息台账管理', '按内容分类统一查询职工发帖与回音壁公开记录。', `<span class="badge">共 ${sourceRows.length + echoRows.length} 条</span>`) + contentTabs(tabs, selected, 'ledger-tab', '内容分类') +
      list(['内容标题', '内容分类', '作者 / 发布部门', '时间', '互动数据', '状态', '操作'], rows.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${item.category === '回音壁' ? '管理端公开内容' : `帖子 #${safe(item.id)}`}</div></td><td>${badgeFor(item.category)}</td><td>${safe(item.author)}</td><td>${safe(item.time)}</td><td>${interactionCell(item.metrics)}</td><td>${badgeFor(item.status)}</td><td><div class="row-actions">${button('查看', item.action, item.id)}${item.sourcePost && canManageLedger() ? button('编辑', 'ledger-post-edit', item.id) + button(item.enabled ? '禁用' : '启用', 'ledger-post-toggle', item.id) + button('删除', 'ledger-post-delete', item.id) : ''}</div></td></tr>`));
  }
  function postDetail(data, post) {
    const engagement = post.engagement || PrototypeData.emptyEngagement();
    const comments = postComments(data, post.id);
    const metrics = interactionSummary(post, comments);
    const tabs = ['私密发布', '待审核'].includes(post.status)
      ? [['content', '内容信息'], ['history', '操作记录']]
      : [['content', '内容信息'], ['analysis', '互动分析'], ['comments', '评论明细'], ['history', '操作记录']];
    const selected = tabs.some(([key]) => key === state.postDetailTab) ? state.postDetailTab : 'content';
    const content = `<dl class="post-detail-meta"><dt>帖子编号</dt><dd>${safe(post.id)}</dd><dt>发表栏目</dt><dd>${safe(post.board)}</dd><dt>发布作者</dt><dd>${safe(post.author)}</dd><dt>发布方式</dt><dd>${post.author === '匿名用户' ? '匿名发布 · 真实身份受独立溯源权限保护' : '实名发布'}</dd><dt>提交时间</dt><dd>${safe(post.time)}</dd><dt>内容状态</dt><dd>${badgeFor(post.status)}</dd><dt>敏感词命中</dt><dd>${sensitiveWordBadges(post, data)}</dd></dl><div class="post-detail-copy"><h3>${safe(post.title)}</h3><p>${safe(post.body)}</p></div>${post.protectedListId ? `<div class="notice">${icon('shield-alert')}<div><strong>疑似涉及受保护名单</strong><p>关联规则：${safe(data.protectedLists?.find((item) => item.id === post.protectedListId)?.name || '已停用名单')}。仅供人工判断。</p></div></div>` : ''}`;
    const rate = metrics.uniqueViews ? ((metrics.likes + metrics.comments + metrics.favorites + metrics.shares) / metrics.uniqueViews * 100).toFixed(1) : '0.0';
    const metricCards = [['浏览 PV', metrics.views], ['访客 UV', metrics.uniqueViews], ['点赞', metrics.likes], ['评论', metrics.comments], ['收藏', metrics.favorites], ['分享', metrics.shares]];
    const channels = engagement.shareChannels || {};
    const userRecords = (title, users, count) => `<section class="engagement-section"><h4>${title}行为明细 <span>共 ${count} 次 · 以下为可追溯记录 ${users.length} 条</span></h4>${state.role === 'platform' ? (users.length ? `<div class="engagement-users">${users.map((item) => `<div><strong>${safe(item.name)}</strong><span>${safe(item.department)} · ${safe(item.at)}</span></div>`).join('')}</div>` : '<p class="muted">暂无可追溯用户记录；历史汇总不包含逐人身份。</p>') : '<div class="engagement-privacy">当前角色仅可查看互动汇总，用户身份明细需平台管理员权限。</div>'}</section>`;
    const trend = (engagement.daily || []).slice(-7);
    const analysis = `<div class="engagement-metrics">${metricCards.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('')}<div class="featured"><span>互动率</span><strong>${rate}%</strong></div></div><p class="engagement-formula">互动率 =（点赞 + 已发布评论 + 收藏 + 分享）/ UV；历史评论汇总参与计算，待审核评论不计入。</p><div class="engagement-grid"><section class="engagement-section"><h4>近 7 日互动趋势</h4>${trend.length ? `<div class="engagement-trend">${trend.map((item) => `<div><span>${safe(item.date)}</span><div><i style="width:${Math.max(2, Math.min(100, (item.views || 0) / Math.max(1, ...trend.map((entry) => entry.views || 0)) * 100))}%"></i></div><strong>${Number(item.views || 0)} 浏览</strong></div>`).join('')}</div>` : '<p class="muted">暂无趋势记录，互动后开始生成。</p>'}</section><section class="engagement-section"><h4>分享渠道</h4><div class="engagement-channels"><div><span>复制链接</span><strong>${Number(channels.copy || 0)}</strong></div><div><span>站内分享</span><strong>${Number(channels.internal || 0)}</strong></div><div><span>系统分享</span><strong>${Number(channels.system || 0)}</strong></div></div><p class="muted">只记录分享入口和次数，不记录接收人。</p></section></div>${userRecords('点赞', engagement.likeUsers || [], metrics.likes)}${userRecords('收藏', engagement.favoriteUsers || [], metrics.favorites)}`;
    const commentCounts = ['已发布', '待审核', '已驳回', '已隐藏'].map((status) => [status, comments.filter((item) => item.status === status).length]);
    const commentDetails = `<div class="comment-status-summary"><span>历史已发布汇总 <strong>${engagement.historicComments || 0}</strong></span>${commentCounts.map(([status, count]) => `<span>${status} <strong>${count}</strong></span>`).join('')}</div><p class="engagement-formula">历史汇总仅有数量，以下展示本原型中有完整记录的评论。</p>${comments.length ? `<div class="ledger-comment-list">${comments.slice().reverse().map((item) => `<article><div><strong>${safe(item.author)}</strong><span>${safe(item.department || '所属组织未记录')} · ${safe(item.createdAt || '提交时间未记录')}</span>${badgeFor(item.status)}</div><p>${safe(item.text)}</p>${item.reviewReason ? `<small>审核意见：${safe(item.reviewReason)} · ${safe(item.reviewedAt || '时间未记录')}</small>` : ''}</article>`).join('')}</div>` : '<div class="engagement-empty">暂无逐条评论记录</div>'}`;
    const events = (data.audit || []).filter((item) => String(item.target) === String(post.id) || (data.affairs || []).some((affair) => affair.postId === post.id && item.target === affair.id));
    const history = `<div class="ledger-history"><div><span class="timeline-dot">${icon('file-plus-2')}</span><p><strong>提交帖子</strong><small>${safe(post.time)} · ${safe(post.status)}</small></p></div>${events.map((item) => `<div><span class="timeline-dot">${icon('activity')}</span><p><strong>${safe(item.action)}</strong><small>${safe(item.detail)} · ${safe(item.role)} · ${safe(item.at)}</small></p></div>`).join('')}</div>${events.length ? '' : '<p class="engagement-formula">暂无其他审核或流转记录。</p>'}`;
    const body = `<div class="post-detail-tabs" role="tablist" aria-label="帖子详情">${tabs.map(([key, label]) => `<button type="button" role="tab" aria-selected="${selected === key}" class="${selected === key ? 'active' : ''}" data-action="post-detail-tab" data-id="${key}">${label}</button>`).join('')}</div><div class="post-detail-panel" role="tabpanel">${{ content, analysis, comments: commentDetails, history }[selected]}</div>`;
    const actions = selected === 'content' && canAuditPost(post, data) && ['私密发布', '待审核'].includes(post.status) ? button('退回修改', 'post-decision-return', post.id) + button(processPost(post) ? '确认办理' : post.status === '私密发布' ? '公开发布' : '审核通过', 'post-decision-approve', post.id, 'primary') : button('关闭', 'close', '');
    return modal('帖子详情 · ' + post.id, body, actions).replace('<section class="modal"', '<section class="modal post-detail-modal"');
  }
  function contentReviewTable(data, selectedType) {
    const boards = ['建言献策', '心声诉求', '业务交流'];
    const sourceRows = data.posts.filter((post) => post.deleted !== true && boards.includes(post.board) && (state.role !== 'content' || post.board !== '业务交流'));
    const rows = sourceRows.filter((post) => selectedType === '全部' || post.board === selectedType);
    const visibleBoards = state.role === 'content' ? boards.slice(0, 2) : boards;
    const tabs = [['全部', '全部', sourceRows.length], ...visibleBoards.map((board) => [board, board, sourceRows.filter((post) => post.board === board).length])];
    return contentTabs(tabs, selectedType, 'content-review-tab', '信息内容审核') + list(['信息标题 / 编号', '事项类型', '发布人', '提交时间', '内容状态', '审核结果', '操作'], rows.map((post) => {
      const pending = ['私密发布', '待审核'].includes(post.status);
      const contentState = PrototypeData.isPublicPost(post) ? '已发布' : post.status === '私密发布' ? '私密发布' : '未发布';
      const reviewResult = processPost(post) ? ['已办结公开', '已办结私密'].includes(post.status) ? '已办结' : ['退回修改', '已驳回'].includes(post.status) ? '已驳回' : post.processingAccepted ? '办理中' : '待确认' : post.status === '已发布' ? '审核通过' : ['退回修改', '已驳回'].includes(post.status) ? '驳回' : '待审核';
      const actions = [button('详情', 'post-detail', post.id)];
      if (pending && canAuditPost(post, data)) actions.push(button(processPost(post) ? '确认办理' : '审核通过', 'post-decision-approve', post.id, 'primary'), button('退回修改', 'post-decision-return', post.id));
      if (canReview() && post.status === '已发布') actions.push(button('隐藏', 'post-hide', post.id));
      if (canReview() && post.status === '已隐藏') actions.push(button('恢复', 'post-restore', post.id));
      if (canManageLedger()) actions.push(button('删除', 'ledger-post-delete', post.id));
      return `<tr><td><strong>${safe(post.title)}</strong><div class="td-sub">${safe(post.id)}</div></td><td>${badgeFor(post.board)}</td><td>${safe(post.author || '匿名用户')}</td><td>${safe(post.time || '未记录')}</td><td>${badgeFor(contentState)}</td><td>${badgeFor(reviewResult)}</td><td><div class="row-actions">${actions.join('')}</div></td></tr>`;
    }));
  }
  function contentReview() {
    const data = db();
    const visibleBoards = state.role === 'content' ? ['建言献策', '心声诉求'] : ['建言献策', '心声诉求', '业务交流'];
    const pending = data.posts.filter((p) => visibleBoards.includes(p.board) && ['私密发布', '待审核'].includes(p.status)).length;
    const selected = ['全部', ...visibleBoards].includes(contentReviewType) ? contentReviewType : '全部';
    return heading(state.role === 'dispatch' ? '待确认发言' : '信息内容审核', '建言献策和心声诉求由分办人员确认办理或驳回；业务交流由分办人员审核后直接发布，不生成事项。', `<span class="badge red">待处理 ${pending}</span>`) + contentReviewTable(data, selected);
  }
  function assignment() {
    const data = db();
    const candidates = data.posts.filter((p) => processPost(p) && processPostStatus(p) && flowForPost(p, data) && !data.affairs.some((a) => a.postId === p.id));
    const assigned = data.affairs.filter((affair) => affair.status !== '待复核');
    const answerReviews = data.affairs.filter((affair) => affair.status === '待复核');
    const tabs = contentTabs([
      ['历史待登记', '历史待登记', candidates.length],
      ['已分办', '已分办', assigned.length],
      ['答复审核', '答复审核', answerReviews.length]
    ], assignmentTab, 'assignment-tab', '事项分办');
    const pendingTable = `<div class="section-title"><h2>历史待登记事项</h2><span class="badge">${candidates.length} 条</span></div>` + list(['来源帖子', '事项类型', '内容状态', '流程版本', '操作'], candidates.map((p) => `<tr><td><strong>${safe(p.title)}</strong><div class="td-sub">帖子 #${p.id} · ${safe(p.author)}</div></td><td>${badgeFor(p.board)}</td><td>${badgeFor(p.status)}</td><td>v${safe(flowForPost(p, data).version)}</td><td>${canFlowRole(flowForPost(p, data), 'assignmentRole', 'dispatch') ? button('登记并分办', 'assign-form', p.id, 'primary') : '仅可查看'}</td></tr>`));
    const assignedTable = `<div class="section-title"><h2>已分办事项</h2><span class="badge">${assigned.length} 项</span></div>` + affairsTable(assigned);
    const reviewTable = `<div class="section-title"><h2>待答复审核</h2><span class="badge">${answerReviews.length} 项</span></div>` + list(['事项 / 编号', '承办部门', '答复摘要', '当前状态', '操作'], answerReviews.map((affair) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td><td>${safe(affair.owner)}<div class="td-sub">${safe(affair.assigneeName || affair.assigneeId || '未指定')}</div></td><td><div class="td-sub answer-preview">${safe(affair.draft || '承办人已提交答复，待复核')}</div></td><td>${badgeFor('待复核')}</td><td>${button('审核答复', 'affair-detail', affair.id, 'primary')}</td></tr>`));
    const body = assignmentTab === '已分办' ? assignedTable : assignmentTab === '答复审核' ? reviewTable : pendingTable;
    return heading('办理与回复审核', '确认办理时直接自行办理或指定承办人；审核回复时同步办结。') +
      `<div class="notice">${icon('route')}<div><strong>办理规则</strong><p>新发言在“待确认发言”中一次完成确认与承办安排。历史待登记仅供旧数据补录。</p></div></div>` + tabs + body;
  }
  function handlerDispatch() {
    if (!['platform', 'dispatch'].includes(state.role)) return heading('分办管理', '当前角色无权执行事项分办。');
    return assignment();
  }
  function affairsTable(items) { return list(['事项 / 来源', '主办 / 当前承办人', '时限', '状态', '操作'], items.map((a) => `<tr><td><strong>${safe(a.title)}</strong><div class="td-sub">${safe(a.id)} · 来源帖子 #${a.postId}</div></td><td>${safe(a.owner)}<div class="td-sub">${safe(a.assigneeName || a.assigneeId || '待指定承办人')} · 协办 ${safe(a.co || '无')}</div></td><td>${safe(a.deadline)}</td><td>${badgeFor(statusLabel(a))}</td><td>${button('查看办理', 'affair-detail', a.id)}</td></tr>`)); }
  function handling() {
    const data = db();
    const items = handlerItems(data);
    return heading(state.role === 'handler' ? '我的承办事项' : state.role === 'leader' ? '重点事项' : '办理管理', '跟踪进展、延期申请、答复复核及公开反馈。') + affairsTable(items);
  }
  function handlerTable(data, items) {
    return list(['事项名称', '事项类型', '当前状态', '剩余时限', '创建时间', '当前办理人', '操作'], items.map((affair) => {
      const source = data.posts.find((post) => post.id === affair.postId);
      const assignee = affair.transfer?.status === '待接收' ? `待${safe(affair.transfer.toAssigneeName || '目标承办人')}接收` : affair.assigneeName || affair.assigneeId || '待确认';
      const actions = ['待承办确认', '转办待接收', '办理中'].includes(affair.status) ? button('办理', 'affair-detail', affair.id, 'primary') : button('查看', 'affair-detail', affair.id);
      const assignedAt = affair.assignedAt || affair.events?.[0]?.at || '待分办';
      return `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td><td>${badgeFor(handlerBusinessType(source))}</td><td>${badgeFor(handlerStatusLabel(affair))}</td><td><strong>${safe(deadlineText(affair))}</strong><div class="td-sub">截止 ${safe(affair.deadline)}</div></td><td>${safe(assignedAt)}</td><td>${safe(assignee)}</td><td><div class="row-actions">${actions}</div></td></tr>`;
    }));
  }
  function handlerBoard() {
    const data = db(), items = handlerItems(data);
    const open = items.filter((affair) => ['待承办确认', '转办待接收', '办理中'].includes(affair.status));
    const closed = items.filter((affair) => affair.status === '已办结').length;
    const alerts = items.filter((affair) => deadlineFlag(affair) || affair.returnReason);
    const metrics = [['待办事项', items.filter((a) => !['已办结', '已反馈'].includes(a.status)).length], ['临期事项', items.filter((a) => deadlineFlag(a) === '临期').length], ['催办事项', items.filter((a) => a.courted || a.stage === '等待协同反馈').length], ['退回事项', items.filter((a) => a.returnReason).length], ['已办结', closed]];
    const recent = items.flatMap((affair) => (affair.events || []).slice(-2).map((event) => ({ affair, event }))).slice(-6).reverse();
    const boards = ['建言献策', '心声诉求'];
    const quickFilters = `<div class="handler-filters"><label class="handler-filter handler-query"><span>搜索事项</span><input class="input" id="wf-handler-query" placeholder="事项编号或标题" value="${safe(handlerFilters.query)}"></label><label class="handler-filter"><span>业务类型</span><select class="select" id="wf-handler-type"><option value="">全部</option>${boards.map((v) => `<option ${handlerFilters.type === v ? 'selected' : ''}>${safe(v)}</option>`).join('')}</select></label><label class="handler-filter"><span>时限状态</span><select class="select" id="wf-handler-deadline"><option value="">全部</option>${['正常', '临期', '逾期'].map((v) => `<option ${handlerFilters.deadline === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><div class="handler-filter-actions"><button class="btn btn-primary" onclick="ManagementWorkflow.handlerSearch()">筛选</button><button class="btn btn-secondary" data-action="handler-reset">重置</button></div></div>`;
    const tabStatus = { 待处理: ['待承办确认', '转办待接收'], 办理中: ['办理中'], 临期: ['临期'], 已催办: ['已催办'], 退回: ['退回修改'] };
    const tabs = `<div class="tabs" style="margin:16px 0">${Object.keys(tabStatus).map((tab) => `<button class="btn btn-sm ${workbenchTab === tab ? 'btn-primary' : 'btn-ghost'}" data-action="workbench-tab" data-id="${tab}">${tab}</button>`).join('')}</div>`;
    const filtered = items.filter((affair) => { const source = data.posts.find((post) => post.id === affair.postId); const statusMatch = workbenchTab === '临期' ? deadlineFlag(affair) === '临期' : workbenchTab === '已催办' ? affair.courted || affair.stage === '等待协同反馈' : workbenchTab === '退回' ? !!affair.returnReason : tabStatus[workbenchTab]?.includes(affair.status); return statusMatch && (!handlerFilters.query || `${affair.id} ${affair.title}`.toLowerCase().includes(handlerFilters.query.toLowerCase())) && (!handlerFilters.type || handlerBusinessType(source) === handlerFilters.type) && (!handlerFilters.deadline || (handlerFilters.deadline === '正常' ? !deadlineFlag(affair) : deadlineFlag(affair) === handlerFilters.deadline)); });
    return heading('承办工作台', state.role === 'handler' ? `${safe(handlerDepartment(data) || '未配置部门')} · 建言献策与心声诉求办理` : '统一查看承办待办、办理时限与事项详情。') +
      `<div class="grid grid-4">${metrics.map(([label, value]) => `<div class="card stat"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong></div>`).join('')}</div>` +
      `<div class="split-layout handler-workbench-layout" style="grid-template-columns:minmax(0, 4fr) minmax(220px, 1fr);align-items:start;margin-top:16px"><section class="card card-pad"><div class="card-title">待办事项 <span class="badge">${filtered.length} 项</span></div>${tabs}${quickFilters}${handlerTable(data, filtered)}</section><aside class="card card-pad"><div class="card-title">近期动态</div><div class="timeline">${recent.map(({ affair, event }) => `<div class="timeline-item"><span class="timeline-dot">${icon('activity')}</span><div><strong>${safe(event.text)}</strong><p>${safe(affair.id)} · ${safe(affair.owner)}</p></div><small>${safe(event.at)}</small></div>`).join('') || '<p class="muted">暂无办理动态</p>'}</div></aside></div>`;
  }
  function handlerTasks() {
    const data = db(), items = handlerItems(data);
    const boards = ['建言献策', '心声诉求'];
    const filter = (id, label, options) => `<label class="handler-filter"><span>${label}</span><select class="select" id="wf-handler-${id}"><option value="">全部</option>${options.map((value) => `<option value="${safe(value)}" ${handlerFilters[id] === value ? 'selected' : ''}>${safe(value)}</option>`).join('')}</select></label>`;
    const visible = items.filter((affair) => {
      const source = data.posts.find((post) => post.id === affair.postId);
      return (!handlerFilters.query || `${affair.id} ${affair.title} ${affair.owner}`.toLowerCase().includes(handlerFilters.query.toLowerCase())) && (!handlerFilters.status || affair.status === handlerFilters.status) && (!handlerFilters.priority || affair.priority === handlerFilters.priority) && (!handlerFilters.deadline || (handlerFilters.deadline === '正常' ? !deadlineFlag(affair) : deadlineFlag(affair) === handlerFilters.deadline)) && (!handlerFilters.type || handlerBusinessType(source) === handlerFilters.type) && (!handlerFilters.deadlineFrom || affair.deadline >= handlerFilters.deadlineFrom) && (!handlerFilters.deadlineTo || affair.deadline <= handlerFilters.deadlineTo);
    });
    return heading('我的待办', state.role === 'handler' ? '按状态、优先级、时限和业务类型查询本部门承办事项。' : '按部门与事项条件查询承办待办。', `<span class="badge">共 ${visible.length} 项</span>`) +
      `<form class="handler-filters" onsubmit="event.preventDefault();ManagementWorkflow.handlerSearch()"><label class="handler-filter handler-query"><span>事项编号 / 标题</span><input class="input" id="wf-handler-query" placeholder="输入事项编号或关键词" value="${safe(handlerFilters.query)}"></label>${filter('status', '办理状态', ['待承办确认', '转办待接收', '办理中', '待复核', '已反馈', '已办结'])}${filter('priority', '优先级', ['一般', '重点', '紧急'])}${filter('deadline', '办理时限', ['正常', '临期', '逾期'])}${filter('type', '业务类型', boards)}<label class="handler-filter"><span>截止时间起</span><input class="input" id="wf-handler-deadlineFrom" type="date" value="${safe(handlerFilters.deadlineFrom)}"></label><label class="handler-filter"><span>截止时间止</span><input class="input" id="wf-handler-deadlineTo" type="date" value="${safe(handlerFilters.deadlineTo)}"></label><div class="handler-filter-actions"><button type="button" class="btn btn-secondary" data-action="handler-reset">重置</button><button type="submit" class="btn btn-primary">查询</button></div></form>` + handlerTable(data, visible);
  }
  function handlerHandling() { const data = db(); const items = handlerItems(data).filter((affair) => { const source = data.posts.find((post) => post.id === affair.postId); return !handlingType || source?.board === handlingType; }); return heading('事项办理', '按建言献策和心声诉求分类查看办理事项。') + `<div class="tabs" style="margin-bottom:16px"><button class="btn btn-sm ${!handlingType ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="">全部事项</button><button class="btn btn-sm ${handlingType === '建言献策' ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="建言献策">建言献策</button><button class="btn btn-sm ${handlingType === '心声诉求' ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="心声诉求">心声诉求</button></div>` + handlerTable(data, items); }
  function handlerDrafts() {
    const data = db(), items = handlerItems(data).filter((affair) => ['办理中', '待复核'].includes(affair.status));
    return heading('答复草稿', '保存正式答复草稿，退回后修改并重新提交复核。') + list(['事项', '草稿 / 退回意见', '状态', '操作'], items.map((affair) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)} · ${safe(affair.owner)}</div></td><td>${safe(affair.draft || '尚未保存草稿')}${affair.returnReason ? `<div class="td-sub handler-return">退回意见：${safe(affair.returnReason)}</div>` : ''}</td><td>${badgeFor(affair.returnReason ? '退回修改' : affair.status)}</td><td>${button(affair.status === '办理中' ? '编辑答复' : '查看复核', 'affair-detail', affair.id)}</td></tr>`));
  }
  function handlerReminders() {
    const data = db(), rows = [];
    for (const affair of handlerItems(data)) {
      if (affair.status === '待承办确认') rows.push([affair, '待确认办理', `待 ${affair.assigneeName || '承办人'} 确认接收`]);
      if (affair.status === '转办待接收') rows.push([affair, '转办待接收', `待 ${affair.transfer?.toAssigneeName || '目标承办人'} 接收`]);
      if (affair.status === '办理中' && affair.returnReason) rows.push([affair, '退回修改', affair.returnReason]);
      if (affair.extension?.status === '待审批') rows.push([affair, '延期待审批', `拟延期至 ${affair.extension.deadline}`]);
      if (affair.stage === '等待协同反馈' && affair.status === '办理中') rows.push([affair, '协同反馈', affair.co || '协办部门']);
      if (deadlineFlag(affair)) rows.push([affair, deadlineFlag(affair), `办理期限 ${affair.deadline}`]);
    }
    return heading('催办提醒', '汇总待接收、临期、逾期、退回修改及协同反馈事项。', `<span class="badge gold">${rows.length} 条提醒</span>`) + list(['事项', '提醒类型', '提醒内容', '操作'], rows.map(([affair, type, detail]) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)} · ${safe(affair.owner)}</div></td><td>${badgeFor(type)}</td><td>${safe(detail)}</td><td>${button('查看办理', 'affair-detail', affair.id)}</td></tr>`));
  }
  function handlerAnswers() {
    const data = db(), ids = new Set(handlerItems(data).map((affair) => affair.id));
    const published = (data.echoPublications || []).filter((item) => item.status === '已发布' && ids.has(item.affairId));
    const closed = handlerItems(data).filter((affair) => affair.status === '已办结');
    return heading('已公开答复', '仅查看已发布的公开答复及归档办结事项。') + `<div class="section-title"><h2>公开答复</h2><span class="badge">${published.length} 条</span></div>` + list(['答复标题', '来源事项', '发布范围', '发布时间', '操作'], published.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.body)}</div></td><td>${safe(item.affairId)}</td><td>${safe(item.scope)}</td><td>${safe(item.publishedAt || '未记录')}</td><td>${button('查看详情', 'echo-view', item.id)}</td></tr>`)) + `<div class="section-title"><h2>办结事项</h2><span class="badge">${closed.length} 项</span></div>` + handlerTable(data, closed);
  }
  function handlerStatistics() {
    const data = db(), items = handlerItems(data), closed = items.filter((affair) => affair.status === '已办结');
    const elapsed = closed.map((affair) => (new Date(affair.closedAt) - new Date(affair.acceptedAt)) / 86400000).filter((days) => Number.isFinite(days) && days >= 0);
    const metrics = [['接收事项', items.filter((affair) => affair.assignmentState === '已接收').length], ['转办事项', items.filter((affair) => affair.transfer).length], ['办结量', closed.length], ['办结率', items.length ? `${Math.round(closed.length / items.length * 100)}%` : '0%'], ['平均办理时长', elapsed.length ? `${(elapsed.reduce((sum, days) => sum + days, 0) / elapsed.length).toFixed(1)} 天` : '未统计'], ['逾期事项', items.filter((affair) => deadlineFlag(affair) === '逾期').length]];
    return heading('部门统计', state.role === 'handler' ? `${safe(handlerDepartment(data) || '未配置部门')} · 本部门办理情况` : '各部门承办事项汇总；承办角色仅查看所属部门。') + `<div class="grid handler-metrics">${metrics.map(([label, value]) => `<div class="card stat"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong></div>`).join('')}</div><div class="section-title"><h2>办理状态</h2></div>` + list(['状态', '数量', '事项编号'], ['待承办确认', '转办待接收', '办理中', '待复核', '已反馈', '已办结'].map((status) => `<tr><td>${badgeFor(status)}</td><td>${items.filter((affair) => affair.status === status).length}</td><td>${safe(items.filter((affair) => affair.status === status).map((affair) => affair.id).join('、') || '暂无')}</td></tr>`));
  }
  function handlerClosure() {
    if (!['platform', 'dispatch'].includes(state.role)) return heading('公开与归档', '当前角色无权执行公开与归档。');
    const data = db(), items = data.affairs.filter((affair) => ['已反馈', '已办结'].includes(affair.status));
    return heading('公开与归档', '管理已审核答复的公开反馈与事项归档，查看办结结果和完整流转记录。') + handlerTable(data, items);
  }
  function handlerMessages() {
    const data = db(), affairs = handlerItems(data);
    const typeFor = (affair) => affair.returnReason ? '退回通知' : deadlineFlag(affair) === '逾期' ? '逾期提醒' : deadlineFlag(affair) === '临期' ? '催办提醒' : affair.status === '待承办确认' || affair.status === '转办待接收' ? '任务通知' : affair.status === '待复核' ? '审核通知' : ['已反馈', '已办结'].includes(affair.status) ? '公开通知' : '任务通知';
    const messages = affairs.flatMap((affair, index) => {
      const type = typeFor(affair);
      const current = { id: `MSG-${index + 1}`, affair, type, title: `${type} · ${affair.title}`, content: affair.returnReason || (deadlineFlag(affair) ? `${deadlineText(affair)}，办理期限 ${affair.deadline}` : `事项当前状态：${statusLabel(affair)}`), at: affair.events?.at || affair.events?.slice(-1)[0]?.at || '09月14日 09:00' };
      return [current, ...(affair.events || []).slice(-1).map((event, eventIndex) => ({ id: `MSG-${index + 1}-${eventIndex}`, affair, type, title: event.text, content: `${affair.id} · ${affair.owner}`, at: event.at }))];
    }).slice(0, 20);
    const visible = messages.filter((message) => !handlerMessageType || message.type === handlerMessageType);
    const tabs = ['', '任务通知', '催办提醒', '逾期提醒', '退回通知', '审核通知', '公开通知'];
    return heading('消息中心', '集中查看新任务、催办、逾期、退回、审核和公开通知。', `<span class="badge red">${messages.length} 条</span>`) + `<div class="tabs" style="margin-bottom:16px">${tabs.map((type) => `<button class="btn btn-sm ${handlerMessageType === type ? 'btn-primary' : 'btn-ghost'}" data-action="handler-message-tab" data-id="${safe(type)}">${type || '全部消息'}</button>`).join('')}</div>` + list(['消息', '类型', '关联事项', '时间', '操作'], visible.map((message) => `<tr><td><strong>${safe(message.title)}</strong><div class="td-sub">${safe(message.content)}</div></td><td>${badgeFor(message.type)}</td><td>${safe(message.affair.id)}</td><td>${safe(message.at)}</td><td>${button('查看事项', 'affair-detail', message.affair.id)}</td></tr>`));
  }
  function rectifications() {
    const data = db();
    return heading('整改台账', '登记整改措施、责任单位、完成时限和验收结果。', canDispatch() ? button('登记整改', 'rectify-new', '', 'primary') : '') + list(['整改事项', '责任单位', '期限', '状态', '操作'], data.rectifications.map((r) => `<tr><td>${safe(r.title)}<div class="td-sub">关联 ${safe(r.affairId)}</div></td><td>${safe(r.owner)}</td><td>${safe(r.deadline)}</td><td>${badgeFor(r.status)}</td><td>${canDispatch() && r.status !== '已归档' ? button('验收归档', 'rectify-archive', r.id) : '查看'}</td></tr>`));
  }
  function announcements() {
    const data = db();
    return heading('通知公告管理', '发布面向职工的通知公告，并统计目标人数与实际发布结果。', canPublish() ? button('发布通知公告', 'notice-new', '', 'primary') : '') +
      list(['公告标题', '发布范围', '发布时间', '应发布人数', '发布成功数', '操作'], data.notices.map((n) => `<tr><td><strong>${safe(n.title)}</strong><div class="td-sub">${safe(n.body)}</div></td><td>${safe(n.scope)}</td><td>${safe(n.publishedAt || '未发布')}</td><td><strong>${Number(n.targetCount || 0)}</strong> 人</td><td><strong>${Number(n.successCount || 0)}</strong> 人<div class="td-sub">${Number(n.targetCount || 0) ? `${(Number(n.successCount || 0) / Number(n.targetCount) * 100).toFixed(1)}%` : '0.0%'}</div></td><td><div class="row-actions">${canPublish() ? button('编辑', 'notice-edit', n.id) + button('删除', 'notice-delete', n.id) : '只读'}</div></td></tr>`));
  }
  const bannerTypes = { post: '信息台账管理', notice: '通知公告管理', policy: '政策与问答', external: '外部链接' };
  function bannerTargets(data, type) {
    if (type === 'post') return [...data.posts.filter((item) => PrototypeData.isPublicPost(item)).map((item) => ({ id: item.id, title: item.title })), ...(data.echoPublications || []).filter((item) => item.status === '已发布').map((item) => ({ id: item.id, title: `回音壁：${item.title}` }))];
    if (type === 'notice') return data.notices.filter((item) => item.status === '已发布');
    if (type === 'policy') return [...data.policies.filter((item) => item.status === '已发布'), ...data.questions.filter((item) => item.status === '已发布').map((item) => ({ ...item, title: `问答：${item.title}` }))];
    return [];
  }
  function bannerTargetField(data, type, selected = '') {
    if (type === 'external') return input('外链地址（https://）', 'banner-url', selected, 'url');
    const options = bannerTargets(data, type);
    return `<label class="field"><span>关联内容</span><select class="select" id="wf-banner-target"><option value="">请选择已发布内容</option>${options.map((item) => `<option value="${safe(item.id)}" ${String(item.id) === String(selected) ? 'selected' : ''}>${safe(item.title)}</option>`).join('')}</select></label>`;
  }
  function banners() {
    const data = db();
    const rows = (data.banners || []).slice().sort((a, b) => a.sort - b.sort);
    return heading('轮播图管理', '维护职工首页轮播内容及关联跳转。', button('新增轮播图', 'banner-new', '', 'primary')) +
      list(['图片 / 标题', '跳转目标', '排序', '状态', '操作'], rows.map((item) => {
        const target = item.type === 'external' ? item.url : bannerTargets(data, item.type).find((entry) => String(entry.id) === String(item.targetId))?.title;
        return `<tr><td><div class="banner-list-item"><img src="${safe(item.image)}" alt=""><strong>${safe(item.title)}</strong></div></td><td>${safe(bannerTypes[item.type] || '未知类型')}<div class="td-sub">${safe(target || '关联内容已下架')}</div></td><td>${safe(item.sort)}</td><td>${badgeFor(item.enabled ? '已启用' : '已停用')}</td><td><div class="row-actions">${button('预览', 'banner-preview', item.id)}${button('编辑', 'banner-edit', item.id)}${button(item.enabled ? '停用' : '启用', 'banner-toggle', item.id)}${button('删除', 'banner-delete', item.id)}</div></td></tr>`;
      }));
  }
  function policyAndQuestions() {
    const data = db();
    const selected = state.policyAdminTab === 'questions' ? 'questions' : 'policy';
    const tabs = [['policy', '政策发布', data.policies.length], ['questions', '问题答复', data.questions.filter((item) => item.status === '待答复').length]];
    const body = selected === 'policy' ? list(['政策标题', '分类 / 发布部门', '发布时间', '操作'], data.policies.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.summary)}</div></td><td>${safe(item.category)}<div class="td-sub">${safe(item.department)}</div></td><td>${safe(item.publishedAt || '未发布')}</td><td><div class="row-actions">${canPublish() ? button('编辑', 'policy-edit', item.id) + button('删除', 'policy-delete', item.id) : '只读'}</div></td></tr>`)) : list(['职工提问', '分类', '提交时间', '答复状态', '操作'], data.questions.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.answer || '等待管理人员答复')}</div></td><td>${safe(item.category)}</td><td>${safe(item.submittedAt)}</td><td>${badgeFor(item.status)}</td><td>${canPublish() ? button(item.status === '待答复' ? '填写答复' : '修改答复', 'question-answer', item.id, item.status === '待答复' ? 'primary' : 'secondary') : '只读'}</td></tr>`));
    return heading('政策与问答', '发布政策解读，并对职工提问形成统一公开答复。', selected === 'policy' && canPublish() ? button('发布政策', 'policy-new', '', 'primary') : '') + contentTabs(tabs, selected, 'policy-admin-tab', '政策与问答') + body;
  }
  function echo() {
    const data = db();
    const records = data.echoPublications || [];
    if (!canPublish()) return heading(state.role === 'leader' ? '公开成果' : '已公开答复', '查看管理端已公开发布的办理答复。') + list(['公开标题', '来源事项', '发布范围', '状态'], records.filter((item) => item.status === '已发布').map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.body)}</div></td><td>${safe(item.affairId)}</td><td>${safe(item.scope)}</td><td>${badgeFor(item.status)}</td></tr>`));
    return heading('回音壁发布', '从信息台账中选择已公开帖子，编辑公开内容后发布到职工端回音壁。', button('新增发布', 'echo-new', '', 'primary')) +
      `<div class="section-title"><h2>发布记录</h2><span class="badge">${records.length} 条</span></div>` + list(['公开标题', '来源帖子', '原帖子分类', '公开范围', '发布时间', '操作'], records.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.body)}</div></td><td>${safe(item.sourceTitle || item.sourcePostId || item.affairId)}</td><td>${safe(item.sourceCategory || '—')}</td><td>${safe(item.scope)}</td><td>${safe(item.publishedAt || '未发布')}</td><td><div class="row-actions">${button('查看', 'echo-view', item.id)}${button('编辑', 'echo-edit', item.id)}${button('删除', 'echo-delete', item.id)}</div></td></tr>`));
  }
  function categories() {
    const boards = db().boards.slice().sort((a, b) => a.sort - b.sort);
    return heading('栏目管理', '管理职工发帖的分类；停用后不再允许新发帖，历史内容仍可查看。', button('新增栏目', 'board-new', '', 'primary')) +
      list(['顺序', '栏目名称', '排序', '状态', '操作'], boards.map((board, index) => `<tr><td>${index + 1}</td><td><strong>${safe(board.name)}</strong></td><td>${safe(board.sort)}</td><td>${badgeFor(board.enabled ? '已启用' : '已停用')}</td><td><div class="row-actions">${button('编辑', 'board-edit', board.id)}${button(board.enabled ? '停用' : '启用', 'board-toggle', board.id)}${button('删除', 'board-delete', board.id)}</div></td></tr>`));
  }
  function sensitive() {
    const rules = db().sensitiveWords;
    return heading('敏感词库', '配置发帖和评论的关键词拦截规则。', button('新增敏感词', 'word-new', '', 'primary')) +
      `<div class="notice">${icon('shield-alert')}<div><strong>拦截规则</strong><p>包含匹配允许词组出现在句中；完整词匹配要求前后为边界、空白或标点。忽略英文字母大小写。</p></div></div>` +
      list(['敏感词', '命中规则', '适用范围', '命中次数', '状态', '操作'], rules.map((rule) => `<tr><td><strong>${safe(rule.term)}</strong></td><td>${safe(rule.matchRule || '包含匹配')}</td><td>${safe(rule.scope)}</td><td>${Number.isFinite(rule.hitCount) ? rule.hitCount : 0}</td><td>${badgeFor(rule.enabled ? '已启用' : '已停用')}</td><td><div class="row-actions">${button('编辑', 'word-edit', rule.id)}${button(rule.enabled ? '停用' : '启用', 'word-toggle', rule.id)}${button('删除', 'word-delete', rule.id)}</div></td></tr>`));
  }
  function users() {
    const accounts = db().accounts || [];
    return heading('用户管理', '查看用户所属组织和账户状态；新注册申请在“审核管理 → 用户审核”处理。', button('前往用户审核', 'nav', 'user-review')) +
      list(['用户', '所属组织', '账户状态'], accounts.map((a) => `<tr><td><strong>${safe(a.name)}</strong><div class="td-sub">${safe(a.phone.slice(0,3))}****${safe(a.phone.slice(-4))}</div></td><td>${safe(a.department)}</td><td>${badgeFor(a.status === 'pending' ? '待审核' : a.status === 'approved' ? '已通过' : '已驳回')}</td></tr>`));
  }
  function userReviews() {
    if (state.role !== 'platform') return heading('用户审核', '当前角色无权查看注册申请。');
    const accounts = db().accounts || [];
    const statuses = [['pending', '待审核'], ['approved', '已通过'], ['rejected', '已驳回']];
    const selected = statuses.some(([value]) => value === state.userReviewTab) ? state.userReviewTab : 'pending';
    const visible = accounts.filter((a) => a.status === selected);
    return heading('用户审核', '核验职工注册申请；审核结果同步至职工端的申请状态查询。', `<span class="badge red">待审核 ${accounts.filter((a) => a.status === 'pending').length}</span>`) +
      `<div class="review-status-tabs" role="tablist" aria-label="用户审核状态">${statuses.map(([value, label]) => `<button type="button" role="tab" aria-selected="${selected === value}" class="review-status-tab ${selected === value ? 'active' : ''}" data-action="user-review-tab" data-id="${value}">${label}<span>${accounts.filter((a) => a.status === value).length}</span></button>`).join('')}</div>` +
      list(['申请人', '申请部门', '申请时间', '审核状态', '审核意见', '操作'], visible.map((a) => `<tr><td><strong>${safe(a.name)}</strong><div class="td-sub">${safe(a.phone.slice(0, 3))}****${safe(a.phone.slice(-4))}</div></td><td>${safe(a.department || '未填写')}</td><td>${safe(a.submitted || a.createdAt || '未记录')}</td><td>${badgeFor(selected === 'pending' ? '待审核' : selected === 'approved' ? '已通过' : '已驳回')}</td><td>${safe(a.reason || '—')}</td><td>${selected === 'pending' ? button('审核申请', 'account-review', a.id, 'primary') : '已处理'}</td></tr>`));
  }
  function organization() {
    const nodes = db().organizations || [];
    const childrenOf = (parentId) => nodes.filter((node) => node.parentId === parentId).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh-CN'));
    const { query, status, parent } = orgUi.filters;
    const filtered = Boolean(query || status || parent);
    const included = new Set();
    if (filtered) {
      for (const node of nodes) {
        if (query && !node.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue;
        if (status && node.status !== status) continue;
        if (parent && node.parentId !== parent) continue;
        let cursor = node;
        const seen = new Set();
        while (cursor && !seen.has(cursor.id)) { included.add(cursor.id); seen.add(cursor.id); cursor = nodes.find((item) => item.id === cursor.parentId); }
      }
    }
    const rows = [];
    function walk(parentId, depth) {
      for (const node of childrenOf(parentId)) {
        if (filtered && !included.has(node.id)) continue;
        const hasChildren = childrenOf(node.id).some((child) => !filtered || included.has(child.id));
        const expanded = filtered || !orgUi.collapsed.has(node.id);
        rows.push(`<tr><td><div class="org-name" style="--org-depth:${Math.min(depth, 8)}">${hasChildren ? `<button type="button" class="org-tree-toggle" data-action="org-toggle" data-id="${safe(node.id)}" aria-label="${expanded ? '收起' : '展开'}${safe(node.name)}" aria-expanded="${expanded}">${icon(expanded ? 'chevron-down' : 'chevron-right')}</button>` : '<span class="org-tree-spacer"></span>'}<span>${safe(node.name)}</span></div></td><td>${safe(node.sort)}</td><td><span class="org-tag ${node.status === '正常' ? 'is-active' : 'is-inactive'}">${safe(node.status)}</span></td><td class="org-created">${safe(node.createdAt)}</td><td class="org-actions">${button('编辑', 'org-edit', node.id, 'ghost')}<span class="org-more-wrap">${button('更多', 'org-menu', node.id, 'ghost')}${orgUi.menuId === node.id ? `<span class="org-more-menu">${button('新增下级', 'org-child', node.id, 'ghost')}${button('删除', 'org-delete', node.id, 'ghost')}</span>` : ''}</span></td></tr>`);
        if (hasChildren && expanded) walk(node.id, depth + 1);
      }
    }
    walk(null, 0);
    const selectFilter = (label, id, options, value) => `<label class="org-filter-field"><span>${label}</span><select class="select" id="wf-${id}"><option value="">全部</option>${options.map(([optionValue, text]) => `<option value="${safe(optionValue)}" ${optionValue === value ? 'selected' : ''}>${safe(text)}</option>`).join('')}</select></label>`;
    return heading('组织架构', '管理区域与机构层级，组织调整不会覆盖历史事项记录。') +
      `<form class="org-filters" onsubmit="event.preventDefault();ManagementWorkflow.orgSearch()"><label class="org-filter-field"><span>组织机构</span><input class="input" id="wf-org-query" placeholder="输入组织名称" value="${safe(query)}"></label>${selectFilter('状态', 'org-status', [['正常', '正常'], ['停用', '停用']], status)}<div class="org-filter-actions"><button type="button" class="btn btn-secondary" data-action="org-reset">重置</button><button type="submit" class="btn btn-primary">搜索</button><button type="button" class="btn btn-ghost" data-action="org-advanced" aria-expanded="${orgUi.advanced}">更多筛选 ${icon(orgUi.advanced ? 'chevron-up' : 'chevron-down')}</button></div>${orgUi.advanced ? `<div class="org-advanced">${selectFilter('上级组织', 'org-parent-filter', nodes.map((node) => [node.id, node.name]), parent)}</div>` : ''}</form>` +
      `<section class="org-section"><div class="org-section-head"><div class="org-section-title"><h2>组织机构</h2><span>${nodes.length} 个组织</span></div><div class="org-tools">${button('收起', 'org-collapse-all', '')}${button('展开', 'org-expand-all', '')}${button(`${icon('plus')} 新增`, 'org-new', '', 'primary')}<button type="button" class="org-icon-btn" data-action="org-refresh" title="刷新组织列表" aria-label="刷新组织列表">${icon('refresh-cw')}</button></div></div><div class="table-wrap org-table-wrap"><table class="data-table org-table"><thead><tr><th>组织机构</th><th>排序</th><th>状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>${rows.join('') || '<tr><td colspan="5" class="empty">暂无符合条件的组织</td></tr>'}</tbody></table></div></section>`;
  }
  function roles() {
    const descriptions = { platform: '全平台业务与系统治理', content: '审核内容及维护运营栏目', dispatch: '登记分办、复核与整改', handler: '本部门事项承办', leader: '重点事项及指标只读查看' };
    return heading('角色管理', '按职责划分操作权限；原型角色切换不等于真实授权。') +
      list(['角色', '职责边界', '数据范围', '权限属性'], Object.entries(roleInfo).map(([id, role]) => `<tr><td><strong>${safe(role.label)}</strong></td><td>${safe(descriptions[id])}</td><td>${id === 'handler' ? '所属部门' : id === 'leader' ? '授权组织' : '按职责授权'}</td><td>${badgeFor(id === 'leader' ? '只读' : '演示角色')}</td></tr>`));
  }
  function logs() {
    const data = db();
    return heading('系统日志', '记录当前浏览器中的原型业务操作；真实登录与访问日志需由服务端采集。') +
      list(['时间', '角色', '动作', '对象与结果'], data.audit.map((e) => `<tr><td>${safe(e.at)}</td><td>${safe(e.role)}</td><td>${safe(e.action)}</td><td>${safe(e.target)} · ${safe(e.detail)}</td></tr>`));
  }
  function statistics() {
    const data = db();
    const items = state.role === 'handler' ? data.affairs.filter((a) => ['合作指导处', '办公室'].includes(a.owner)) : data.affairs;
    const closed = items.filter((a) => a.status === '已办结').length;
    const overdue = items.filter((a) => !['已办结', '已反馈'].includes(a.status) && a.deadline < new Date().toISOString().slice(0, 10)).length;
    const metrics = [['发帖量', data.posts.length], ['事项受理量', items.length], ['办结率', items.length ? `${Math.round(closed / items.length * 100)}%` : '0%'], ['逾期事项', overdue]];
    return heading(state.role === 'leader' ? '专题统计' : state.role === 'handler' ? '部门办理统计' : '综合统计', '当前演示数据的实时统计；正式系统按授权组织和时间范围汇总。') +
      `<div class="grid grid-4">${metrics.map(([label, value]) => `<div class="card stat"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong></div>`).join('')}</div>` +
      `<div class="section-title"><h2>事项状态分布</h2></div>` + list(['状态', '数量', '事项'], ['办理中', '待复核', '已反馈', '已办结'].map((status) => { const matches = items.filter((a) => a.status === status); return `<tr><td>${badgeFor(status)}</td><td>${matches.length}</td><td>${safe(matches.map((a) => a.id).join('、') || '暂无')}</td></tr>`; }));
  }
  function leaderModel(data) {
    const active = data.affairs.filter((item) => !['已反馈', '已办结'].includes(item.status));
    const closed = data.affairs.filter((item) => item.status === '已办结');
    const overdue = active.filter((item) => deadlineFlag(item) === '逾期');
    const published = (data.echoPublications || []).filter((item) => item.status === '已发布');
    const hotPosts = data.posts.map((post) => {
      const engagement = post.engagement || PrototypeData.emptyEngagement();
      const comments = (engagement.historicComments || 0) + postComments(data, post.id).filter((item) => item.status === '已发布').length;
      return { post, engagement, comments, score: (engagement.views || 0) + (engagement.likes || 0) * 5 + comments * 4 + (engagement.shares || 0) * 6 };
    }).sort((a, b) => b.score - a.score);
    return { active, closed, overdue, published, hotPosts };
  }
  function leaderMetric(label, value, note, tone = '') {
    return `<div class="card stat leader-stat ${tone}"><span class="stat-label">${safe(label)}</span><strong class="stat-value">${safe(value)}</strong><span class="stat-note">${safe(note)}</span></div>`;
  }
  function distributionRows(items, labelFor) {
    const counts = new Map();
    for (const item of items) { const label = labelFor(item) || '其他'; counts.set(label, (counts.get(label) || 0) + 1); }
    const max = Math.max(1, ...counts.values());
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([label, count]) => `<div class="leader-distribution-row"><span>${safe(label)}</span><div class="progress"><i style="width:${Math.max(8, count / max * 100)}%"></i></div><strong>${count}</strong></div>`).join('') || '<p class="muted">暂无可统计数据</p>';
  }
  function leaderDashboard() {
    const data = db(), model = leaderModel(data), total = data.affairs.length;
    const closeRate = total ? `${Math.round(model.closed.length / total * 100)}%` : '0%';
    const focus = model.active.filter((item) => ['重点', '紧急'].includes(item.priority) || deadlineFlag(item)).sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
    return heading('领导驾驶舱', '只读掌握平台运行、问题办理和职工关注热点。', '<span class="badge blue">数据实时汇总</span>') +
      `<div class="grid grid-4">${leaderMetric('发帖量', data.posts.length, `已公开 ${data.posts.filter((item) => !['待审核', '退回修改', '已驳回', '已隐藏'].includes(item.status)).length} 篇`)}${leaderMetric('事项受理量', total, `办理中 ${model.active.length} 项`, 'info')}${leaderMetric('办结率', closeRate, `已办结 ${model.closed.length} 项`, 'good')}${leaderMetric('逾期事项', model.overdue.length, model.overdue.length ? '需重点关注' : '当前无逾期', 'warn')}</div>` +
      `<div class="leader-dashboard-grid"><section class="card card-pad"><div class="card-title">热点问题 <span class="badge">按互动热度</span></div><div class="leader-hot-list">${model.hotPosts.slice(0, 5).map((item, index) => `<div class="leader-hot-item"><span class="leader-rank">${index + 1}</span><div><strong>${safe(item.post.title)}</strong><p>${safe(item.post.board)} · 浏览 ${item.engagement.views || 0} · 点赞 ${item.engagement.likes || 0} · 评论 ${item.comments}</p></div><span class="badge ${index === 0 ? 'red' : ''}">${item.score}</span></div>`).join('') || '<p class="muted">暂无热点数据</p>'}</div></section><aside class="card card-pad"><div class="card-title">办理状态</div>${distributionRows(data.affairs, (item) => statusLabel(item))}</aside></div>` +
      `<div class="section-title"><h2>重点事项</h2><button class="text-link" data-action="nav" data-id="leader-key-affairs">查看全部</button></div>${list(['事项', '责任部门', '期限', '风险', '当前状态'], focus.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.id)}</div></td><td>${safe(item.owner)}</td><td>${safe(item.deadline)}</td><td>${badgeFor(deadlineFlag(item) || item.priority || '一般')}</td><td>${badgeFor(statusLabel(item))}</td></tr>`))}`;
  }
  function leaderStatistics() {
    const data = db(), model = leaderModel(data), daily = new Map();
    for (const item of model.hotPosts) for (const point of item.engagement.daily || []) daily.set(point.date, (daily.get(point.date) || 0) + (point.views || 0) + (point.likes || 0) + (point.comments || 0));
    const trend = [...daily.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-7), maxTrend = Math.max(1, ...trend.map(([, value]) => value));
    return heading('专题统计', '查看板块、组织、问题类型、办理状态和近期趋势。', '<span class="badge blue">授权范围内只读</span>') +
      `<div class="leader-stat-grid"><section class="card card-pad leader-trend-card"><div class="card-title">近期内容热度趋势</div><div class="leader-trend">${trend.map(([date, value]) => `<div class="leader-trend-column"><strong>${value}</strong><i style="height:${Math.max(12, value / maxTrend * 100)}%"></i><span>${safe(date.slice(5))}</span></div>`).join('') || '<p class="muted">暂无趋势数据</p>'}</div></section><section class="card card-pad"><div class="card-title">板块分布</div>${distributionRows(data.posts, (item) => item.board)}</section><section class="card card-pad"><div class="card-title">承办组织分布</div>${distributionRows(data.affairs, (item) => item.owner)}</section><section class="card card-pad"><div class="card-title">办理状态分布</div>${distributionRows(data.affairs, (item) => statusLabel(item))}</section></div>` +
      `<div class="section-title"><h2>问题类型明细</h2></div>${list(['问题类型', '发帖量', '已登记事项', '已公开答复'], [...new Set(data.posts.map((item) => item.board))].map((board) => { const postIds = new Set(data.posts.filter((item) => item.board === board).map((item) => item.id)); const affairIds = new Set(data.affairs.filter((item) => postIds.has(item.postId)).map((item) => item.id)); return `<tr><td><strong>${safe(board)}</strong></td><td>${postIds.size}</td><td>${affairIds.size}</td><td>${model.published.filter((item) => affairIds.has(item.affairId)).length}</td></tr>`; }))}`;
  }
  function leaderKeyAffairs() {
    const data = db();
    const affairs = data.affairs.map((item) => ({ kind: deadlineFlag(item) || (['重点', '紧急'].includes(item.priority) ? item.priority : '持续跟踪'), title: item.title, id: item.id, owner: item.owner, deadline: item.deadline, status: statusLabel(item), progress: item.progress || item.stage || '等待承办进展', action: 'affair-detail' }));
    const rectifications = (data.rectifications || []).map((item) => ({ kind: '整改事项', title: item.title, id: item.id, owner: item.owner, deadline: item.deadline, status: item.status, progress: item.measures || '等待整改进展', action: '' }));
    const rows = [...affairs, ...rectifications].sort((a, b) => a.deadline.localeCompare(b.deadline));
    return heading('重点事项', '只读跟踪重点、临期、逾期及整改事项的责任和进展。', `<span class="badge gold">共 ${rows.length} 项</span>`) + list(['关注类型', '事项', '责任部门', '办理期限', '当前进展', '状态', '操作'], rows.map((item) => `<tr><td>${badgeFor(item.kind)}</td><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.id)}</div></td><td>${safe(item.owner)}</td><td>${safe(item.deadline)}</td><td><div class="leader-progress-text">${safe(item.progress)}</div></td><td>${badgeFor(item.status)}</td><td>${item.action ? button('查看详情', item.action, item.id) : '只读'}</td></tr>`));
  }
  function leaderResults() {
    const data = db(), model = leaderModel(data), archived = (data.rectifications || []).filter((item) => item.status === '已归档');
    return heading('公开成果', '查看已公开答复、典型办理案例和整改成效。', `<span class="badge green">已公开 ${model.published.length} 项</span>`) +
      `<div class="grid grid-3 leader-result-summary">${leaderMetric('公开答复', model.published.length, '已发布至职工端')}${leaderMetric('典型案例', model.published.filter((item) => item.body?.length >= 30).length, '依据完整答复筛选', 'info')}${leaderMetric('整改成效', archived.length, '已验收归档', 'good')}</div>` +
      `<div class="section-title"><h2>回音壁公开答复</h2></div>${list(['公开标题', '来源事项', '发布范围', '发布时间', '操作'], model.published.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.body)}</div></td><td>${safe(item.affairId)}</td><td>${safe(item.scope)}</td><td>${safe(item.publishedAt || '未记录')}</td><td>${button('查看详情', 'echo-view', item.id)}</td></tr>`))}` +
      `<div class="section-title"><h2>整改成效</h2></div>${list(['整改事项', '责任单位', '验收要求', '状态'], archived.map((item) => `<tr><td><strong>${safe(item.title)}</strong><div class="td-sub">${safe(item.id)}</div></td><td>${safe(item.owner)}</td><td>${safe(item.measures || '未记录')}</td><td>${badgeFor(item.status)}</td></tr>`))}`;
  }
  function modal(title, body, actions) { return `<div class="modal-backdrop" data-action="close"><section class="modal" role="dialog" aria-modal="true" aria-label="${safe(title)}"><header class="modal-head"><h3>${safe(title)}</h3>${button('关闭', 'close', '')}</header><div class="modal-body">${body}</div><footer class="modal-foot">${actions}</footer></section></div>`; }
  function form(type, id) {
    const data = db();
    if (type === 'post-decision') {
      const separator = id.indexOf(':');
      const decision = separator > 0 ? id.slice(0, separator) : '';
      const postId = separator > 0 ? id.slice(separator + 1) : '';
      const target = data.posts.find((item) => String(item.id) === postId);
      const config = { approve: ['审核通过', 'post-approve'], return: ['驳回并退回修改', 'post-return'], reject: ['驳回', 'post-reject'] }[decision];
      if (!target || !config || !['私密发布', '待审核', '退回修改'].includes(target.status)) return '';
      const required = decision !== 'approve' || target.protectedListId;
      const prompt = required ? '处置意见（必填）' : '处置意见（选填）';
      const title = processPost(target) && decision === 'approve' ? '确认需要办理' : decision === 'approve' && target.status === '私密发布' ? '公开发布' : config[0];
      const hits = sensitiveWordHits(target, data);
      const reviewContext = target.status === '私密发布'
        ? '当前仅作者和审核人员可见'
        : hits.length
          ? `命中：${safe(hits.join('、'))}`
          : target.protectedListId
            ? '命中：受保护名单'
            : '未命中审核规则，仍须人工审核';
      const processingFields = processPost(target) && decision === 'approve'
        ? choose('办理方式', 'handling-mode', ['自行办理', '指定承办人'], '自行办理') + accountSelect(data, 'assignee', '指定承办人（指定办理时选择）') + input('办理期限', 'deadline', '2026-09-25', 'date') + textarea('办理要求（必填）', 'requirements') + '<p class="muted">确认时直接进入办理中；原帖和答复均在审核回复前不公开。</p>' : '';
      return modal(title, `<div class="notice">${icon('file-search')}<div><strong>${safe(target.title)}</strong><p>${safe(target.board)} · ${safe(target.author)} · ${reviewContext}</p></div></div>${processingFields}${textarea(prompt, 'reason')}`, button('取消', 'post-detail', target.id) + button(processPost(target) && decision === 'approve' ? '确认并进入办理' : `确认${title}`, config[1], target.id, decision === 'approve' ? 'primary' : ''));
    }
    const post = data.posts.find((p) => String(p.id) === id);
    const affair = data.affairs.find((a) => a.id === id);
    if (type === 'post-detail' && post) return postDetail(data, post);
    if (type === 'banner-new' || type === 'banner-edit') {
      if (!canPublish()) return '';
      const item = (data.banners || []).find((entry) => String(entry.id) === id);
      const typeValue = item?.type || 'post';
      return modal(item ? '编辑轮播图' : '新增轮播图', input('轮播标题', 'banner-title', item?.title || '') + input('副标题', 'banner-summary', item?.summary || '') + `<label class="field"><span>轮播图片（JPG、PNG、WebP，最大 1 MB）</span><input class="input" id="wf-banner-image" type="file" accept="image/jpeg,image/png,image/webp"></label><div class="banner-upload-preview">${item ? `<img src="${safe(item.image)}" alt="当前轮播图">` : '选择图片后可在列表中预览'}</div>` + `<label class="field"><span>跳转类型</span><select class="select" id="wf-banner-type" onchange="ManagementWorkflow.bannerTargetOptions(this.value)">${Object.entries(bannerTypes).map(([value, label]) => `<option value="${value}" ${value === typeValue ? 'selected' : ''}>${label}</option>`).join('')}</select></label><div id="wf-banner-target-field">${bannerTargetField(data, typeValue, item?.url || item?.targetId || '')}</div>` + input('显示顺序', 'banner-sort', item?.sort || (data.banners || []).length + 1, 'number'), button('取消', 'close', '') + button('保存轮播图', 'banner-save', id, 'primary'));
    }
    if (type === 'banner-preview' || type === 'banner-delete') {
      const item = (data.banners || []).find((entry) => String(entry.id) === id);
      if (!item) return '';
      return type === 'banner-delete' ? modal('删除轮播图', `<p>确认删除“${safe(item.title)}”？</p>`, button('取消', 'close', '') + button('确认删除', 'banner-remove', id)) : modal('轮播图预览', `<div class="banner-large-preview"><img src="${safe(item.image)}" alt="${safe(item.title)}"><div><strong>${safe(item.title)}</strong><p>${safe(item.summary)}</p></div></div><p>跳转类型：${safe(bannerTypes[item.type])}</p>`, button('关闭', 'close', ''));
    }
    if (type === 'ledger-post-edit' && post && canManageLedger()) {
      const boards = (data.boards || []).filter((board) => board.staffPost).map((board) => board.name);
      return modal('编辑帖子 · ' + post.id, input('帖子标题', 'ledger-title', post.title) + choose('内容分类', 'ledger-board', boards.length ? boards : [post.board], post.board) + textarea('正文内容', 'ledger-body', post.body), button('取消', 'close', '') + button('保存修改', 'ledger-post-save', post.id, 'primary'));
    }
    if (type === 'ledger-post-delete' && post && canManageLedger()) return modal('删除帖子', `<p>确认删除「${safe(post.title)}」？删除后将不再出现在管理台账和职工端，操作记录仍会保留。</p>`, button('取消', 'close', '') + button('确认删除', 'ledger-post-remove', post.id, 'primary'));
    if (type === 'comment-batch-detail') {
      const source = data.posts.find((item) => String(item.id) === id);
      const comments = data.comments.filter((item) => String(item.postId) === id && item.status === '待审核' && (commentSensitiveHits(item).length || item.protectedListId));
      if (!comments.length) return modal('评论审核', '<p>该帖当前没有待审核的敏感评论。</p>', button('关闭', 'close', ''));
      const rows = comments.map((comment) => `<tr><td><input type="checkbox" class="comment-review-check" value="${safe(comment.id)}" aria-label="选择${safe(comment.author)}的评论"></td><td><strong>${safe(comment.text)}</strong><div class="td-sub">${safe(comment.id)}</div></td><td>${safe(comment.author)}<div class="td-sub">${safe(comment.department || '所属部门未记录')} · ${safe(comment.createdAt || '提交时间未记录')}</div></td><td>${commentSensitiveHits(comment).length ? commentSensitiveHits(comment).map((term) => badgeFor(term)).join(' ') : badgeFor('受保护名单')}</td><td><div class="row-actions">${button('通过', 'comment-row-approve', comment.id, 'primary')}${button('驳回', 'comment-row-reject', comment.id)}</div></td></tr>`).join('');
      const table = `<div class="comment-review-table"><table class="data-table"><thead><tr><th><input type="checkbox" aria-label="全选待审评论" onchange="document.querySelectorAll('.comment-review-check').forEach(box => box.checked = this.checked)"></th><th>待审评论</th><th>提交人 / 时间</th><th>敏感词命中</th><th>逐条审核</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      return modal('按帖子审核评论', `<div class="notice">${icon('message-square')}<div><strong>${safe(source?.title || `帖子 #${id}`)}</strong><p>待审核 ${comments.length} 条评论</p></div></div>${table}`, button('批量驳回', 'comment-batch-reject', id) + button('批量通过', 'comment-batch-approve', id, 'primary')).replace('<section class="modal"', '<section class="modal comment-review-modal"');
    }
    if (type === 'comment-review-confirm') {
      const pending = state.commentReviewPending;
      if (!pending) return '';
      const approve = pending.action.endsWith('approve');
      const title = `${pending.single ? '逐条' : '批量'}${approve ? '通过' : '驳回'}评论`;
      const required = !approve || pending.ids.some((commentId) => data.comments.find((item) => String(item.id) === commentId)?.protectedListId);
      return modal(title, `<p>确认${approve ? '通过' : '驳回'}选中的 ${pending.ids.length} 条评论？</p>${textarea(`处置意见（${required ? '必填' : '选填'}）`, 'reason')}`, button('取消', 'comment-review-cancel', '') + button(`确认${approve ? '通过' : '驳回'}`, 'comment-review-submit', '', approve ? 'primary' : 'secondary'));
    }
    if (type === 'comment-detail') { const comment = data.comments.find((item) => item.id === id); if (!comment) return ''; return modal('评论人工复核', `<p>${safe(comment.text)}</p><div class="notice">${icon('shield-alert')}<div><strong>疑似涉及受保护名单</strong><p>${safe(data.protectedLists?.find((item) => item.id === comment.protectedListId)?.name || '已停用名单')}。请结合上下文人工判断。</p></div></div>${textarea('人工复核意见（必填）', 'reason')}`, button('驳回', 'comment-reject', id) + button('审核通过', 'comment-approve', id, 'primary')); }
    if (type === 'report-detail') {
      const report = data.reports.find((item) => String(item.id) === id);
      if (!report || !canReview()) return '';
      const source = data.posts.find((item) => item.id === report.postId);
      const body = `<div class="notice">${icon('file-text')}<div><strong>${safe(source?.title || '来源帖子不可用')}</strong><p>${safe(source?.body || '来源正文不可用')}</p><p>帖子 #${safe(report.postId)} · ${safe(source?.status || '已移除')}</p></div></div><p><strong>举报原因：</strong>${safe(report.reason)}</p>`;
      return modal('举报核查 · ' + report.id, body + (report.status === '待核查' ? '' : `<p><strong>核查结论：</strong>${safe(report.resolution || '历史记录：已处理')}</p><p><strong>核查意见：</strong>${safe(report.reviewReason || '未记录')}</p><p class="muted">${safe(report.reviewedAt || '')}</p>`), report.status === '待核查' ? button('举报不成立', 'report-dismiss', id) + button('举报成立', 'report-confirm', id, 'primary') : button('关闭', 'close', ''));
    }
    if (type === 'report-decision') {
      const report = data.reports.find((item) => String(item.id) === id);
      if (!report || report.status !== '待核查' || !canReview()) return '';
      const confirmed = state.reportDecision === 'report-confirm';
      const conclusion = confirmed ? '举报成立' : '举报不成立';
      return modal(conclusion, `<p>确认将举报 ${safe(report.id)} 判定为“${conclusion}”？</p>${textarea('核查意见（必填）', 'reason')}`, button('取消', 'report-decision-cancel', id) + button('确认处理', 'report-decision-submit', id, 'primary'));
    }
    if (type === 'assign-form' && post) {
      const defaultAccount = handlerAccounts(data).find((account) => account.department === '经济发展处') || handlerAccounts(data)[0];
      return modal('登记并分办', `<div class="notice">${icon('file-text')}<div><strong>${safe(post.title)}</strong><p>来源帖子 #${post.id} · ${safe(post.board)} · 内容状态：${safe(post.status)}</p><p>内容审核通过后进入事项分办，分办完成即进入承办人的办理待办。</p></div></div>${input('主办部门', 'owner', defaultAccount?.department || '')}${accountSelect(data, 'assignee', '初始承办人', defaultAccount?.id || '')}${input('协办部门', 'co', '信息中心')}${input('办理期限', 'deadline', '2026-09-25', 'date')}${choose('优先级', 'priority', ['一般', '重点', '紧急'], '一般')}${choose('反馈方式', 'feedback', ['公开答复', '私密回复'], '公开答复')}${textarea('办理要求', 'requirements')}`, button('生成承办待办', 'assign-save', id, 'primary'));
    }
    if (type === 'affair-transfer' && affair) {
      return modal('转办事项 · ' + affair.id, `<div class="notice">${icon('git-branch')}<div><strong>${safe(affair.title)}</strong><p>当前承办：${safe(affair.assigneeName || affair.assigneeId || '待确认')} · ${safe(affair.owner)}</p><p>转办提交后，目标承办人点击“接收办理”才会正式变更责任。</p></div></div>${accountSelect(data, 'transfer-assignee', '目标承办人', '')}${textarea('转办原因（必填）', 'transfer-reason')}${textarea('补充办理要求', 'transfer-requirements', affair.requirements || '')}`, button('取消', 'close', '') + button('提交转办', 'transfer-save', id, 'primary'));
    }
    if (type === 'affair-contact' && affair) {
      return modal('联系分办人', `<div class="notice">${icon('user-round')}<div><strong>${safe(affair.dispatcherName || '张婧')}</strong><p>分办管理员 · ${safe(affair.dispatcherDepartment || '平台管理组')}<br>事项：${safe(affair.id)} · ${safe(affair.title)}</p></div></div>${choose('联系主题', 'contact-topic', ['分办要求不清', '需要补充材料', '申请转办', '申请延期', '需要协同支持', '其他'], '分办要求不清')}${textarea('联系内容（必填）', 'contact-content')}`, button('取消', 'close', '') + button('发送并记录', 'affair-contact-save', id, 'primary'));
    }
    if (type === 'assignment-skip' && post) return modal('确认无需办理', `<p><strong>${safe(post.title)}</strong></p><p class="muted">此操作仅从待分办队列移除，帖子继续公开展示。</p>${textarea('无需办理理由（必填）', 'routing-reason')}`, button('确认仅发布', 'assignment-skip-save', id, 'primary'));
    if (type === 'affair-detail' && affair) {
      if (state.role === 'handler' && !canViewAffair(affair, data)) return modal('无权查看事项', '<p>该事项不属于当前承办部门或当前账号。</p>', button('关闭', 'close', ''));
      const source = data.posts.find((p) => p.id === affair.postId);
      const events = affair.events || [];
      let actions = button('关闭', 'close', '');
      let fields = '';
      const assigned = canWorkOn(affair, data);
      const target = isTransferTarget(affair);
      if (!isLeaderView() && assigned && ['待承办确认', '转办待接收', '办理中'].includes(affair.status)) { fields = (affair.returnReason ? `<div class="notice handler-return-note">${icon('message-square-warning')}<div><strong>答复退回修改</strong><p>${safe(affair.returnReason)}</p></div></div>` : '') + choose('当前阶段', 'stage', ['调查核实', '制定措施', '等待协同反馈', '形成正式答复'], affair.stage || '调查核实') + textarea('阶段进展', 'progress', affair.progress) + textarea('正式答复草稿', 'draft', affair.draft) + input('补充附件', 'attachments', '', 'file') + input('申请延期至', 'extension', '', 'date') + textarea('延期原因', 'extension-reason'); actions = button('联系分办人', 'affair-contact', id) + button('保存进展', 'progress-save', id) + button('保存草稿', 'draft-save', id) + button('申请延期', 'extension-request', id) + button('提交答复', 'draft-submit', id, 'primary'); }
      if (!isLeaderView() && canFlowRole(flowForAffair(affair, data), 'extensionRole', 'dispatch') && affair.extension?.status === '待审批') actions = button('拒绝延期', 'extension-reject', id) + button('批准延期', 'extension-approve', id, 'primary');
      if (!isLeaderView() && canFlowRole(flowForAffair(affair, data), 'answerRole', 'dispatch') && affair.status === '待复核') { fields = textarea('复核意见（退回时必填）', 'reason') + choose('反馈方式', 'feedback', ['公开答复', '私密回复'], affair.feedback === '私密回复' ? '私密回复' : '公开答复'); actions = button('退回修改', 'answer-return', id) + button(processPost(source) ? '审核并办结' : '通过并反馈', 'answer-approve', id, 'primary'); }
      if (!isLeaderView() && canDispatch() && affair.status === '已反馈' && !processPost(source)) actions = button('登记整改', 'rectify-form', id) + button('办结归档', 'affair-close', id, 'primary');
      return modal('事项办理 · ' + affair.id, `<h3>${safe(affair.title)}</h3><p class="muted">来源帖子 #${affair.postId} · ${safe(source?.author)} · ${safe(source?.board)} · 主办 ${safe(affair.owner)} · 当前承办 ${safe(affair.assigneeName || affair.assigneeId || '待确认')} · 截止 ${safe(affair.deadline)} · <strong>${safe(deadlineText(affair))}</strong></p><div class="notice">${icon('message-square-text')}<div><strong>来源帖子</strong><p>${safe(source?.body || '来源正文暂不可用')}</p></div></div><div class="notice">${icon('clipboard-list')}<div><strong>分办要求</strong><p>${safe(affair.requirements)}</p></div></div><p><strong>当前状态：</strong>${badgeFor(statusLabel(affair))}　<strong>反馈方式：</strong>${safe(affair.feedback)}</p>${affair.draft && !['办理中', '待承办确认', '转办待接收'].includes(affair.status) ? `<div class="notice">${icon('file-check')}<div><strong>正式答复</strong><p>${safe(affair.draft)}</p></div></div>` : ''}${fields}<div class="section-title"><h2>附件</h2></div><p class="muted">${safe(affair.attachments?.join('、') || '暂无附件')}</p><div class="section-title"><h2>流转记录</h2></div><div class="timeline">${events.slice().reverse().map((e) => `<div class="timeline-item"><span class="timeline-dot">${icon('check')}</span><div><strong>${safe(e.text)}</strong><p>${safe(e.at)}</p></div></div>`).join('')}</div>`, actions);
    }
    if (type === 'rectify-new' || type === 'rectify-form') return modal('整改登记', input('整改事项', 'title', affair?.title || '') + input('责任单位', 'owner', affair?.owner || '') + input('完成期限', 'deadline', '2026-09-30', 'date') + textarea('措施与验收要求', 'measures'), button('保存整改', 'rectify-save', id, 'primary'));
    if (type === 'notice-new') return modal('新增公告', input('公告标题', 'title') + choose('发布范围', 'scope', ['全体职工', '省社本级', '直属企业'], '全体职工') + textarea('公告内容', 'body'), button('保存并发布', 'notice-save', '', 'primary'));
    if (type === 'notice-edit') { const notice = data.notices.find((item) => item.id === id); return notice ? modal('编辑通知公告', input('公告标题', 'title', notice.title) + `<div class="notice">${icon('users')}<div><strong>发布范围不可修改</strong><p>${safe(notice.scope)} · 应发布 ${Number(notice.targetCount || 0)} 人 · 成功 ${Number(notice.successCount || 0)} 人</p></div></div>` + textarea('公告内容', 'body', notice.body), button('取消', 'close', '') + button('保存修改', 'notice-update', id, 'primary')) : ''; }
    if (type === 'notice-delete') { const notice = data.notices.find((item) => item.id === id); return notice ? modal('删除通知公告', `<p>确认删除「${safe(notice.title)}」？删除后将从管理端和职工端移除，且不能在原型中恢复。</p>`, button('取消', 'close', '') + button('确认删除', 'notice-remove', id, 'primary')) : ''; }
    if (type === 'policy-new') return modal('发布政策', input('政策标题', 'policy-title') + input('政策分类', 'policy-category', '为农服务') + input('发布部门', 'policy-department', '平台管理组') + textarea('政策摘要', 'policy-summary') + textarea('政策正文', 'policy-body'), button('保存并发布', 'policy-save', '', 'primary'));
    if (type === 'policy-edit') { const policy = data.policies.find((item) => item.id === id); return policy ? modal('编辑政策', input('政策标题', 'policy-title', policy.title) + input('政策分类', 'policy-category', policy.category) + input('发布部门', 'policy-department', policy.department) + textarea('政策摘要', 'policy-summary', policy.summary) + textarea('政策正文', 'policy-body', policy.body), button('取消', 'close', '') + button('保存修改', 'policy-update', id, 'primary')) : ''; }
    if (type === 'policy-delete') { const policy = data.policies.find((item) => item.id === id); return policy ? modal('删除政策', `<p>确认删除「${safe(policy.title)}」？删除后将从管理端和职工端移除，且不能在原型中恢复。</p>`, button('取消', 'close', '') + button('确认删除', 'policy-remove', id, 'primary')) : ''; }
    if (type === 'question-answer') { const question = data.questions.find((item) => item.id === id); return question ? modal('回答提问', `<div class="notice">${icon('circle-help')}<div><strong>${safe(question.title)}</strong><p>${safe(question.category)} · 提交于 ${safe(question.submittedAt)}</p></div></div>${input('答复部门', 'question-department', question.department || '平台管理组')}${textarea('公开答复', 'question-answer', question.answer || '')}`, button('保存并发布', 'question-save', id, 'primary')) : ''; }
    if (type === 'echo-publish' && affair) { const source = data.posts.find((item) => item.id === affair.postId); return modal('选择帖子公开发布', `<div class="notice">${icon('messages-square')}<div><strong>${safe(source?.title || affair.title)}</strong><p>${safe(affair.id)} · ${safe(affair.owner)} · 已完成答复复核</p></div></div>${input('公开标题', 'echo-title', `关于“${affair.title}”的答复`)}${choose('公开范围', 'echo-scope', ['全体职工', '省社本级', '直属企业'], '全体职工')}${textarea('公开内容', 'echo-body', affair.draft)}`, button('确认发布', 'echo-save', id, 'primary')); }
    if (type === 'echo-new') { const used = new Set((data.echoPublications || []).map((item) => String(item.sourcePostId))); const candidates = data.posts.filter((item) => PrototypeData.isPublicPost(item) && !used.has(String(item.id)) && item.board !== '回音壁'); return modal('新增回音壁发布', `<p class="muted">请选择信息台账中已公开的帖子作为来源。</p><label class="field"><span>来源帖子</span><select class="select" id="wf-echo-source"><option value="">请选择帖子</option>${candidates.map((item) => `<option value="${safe(item.id)}">${safe(item.title)} · ${safe(item.board)} · ${safe(item.author)}</option>`).join('')}</select></label>${input('公开标题', 'echo-title')}${choose('公开范围', 'echo-scope', ['全体职工', '省社本级', '直属企业'], '全体职工')}${textarea('公开内容', 'echo-body')}`, button('取消', 'close', '') + button('确认发布', 'echo-new-save', '', 'primary')); }
    if (type === 'echo-edit') { const item = (data.echoPublications || []).find((entry) => entry.id === id); return item ? modal('编辑回音壁发布', input('公开标题', 'echo-title', item.title) + choose('公开范围', 'echo-scope', ['全体职工', '省社本级', '直属企业'], item.scope) + textarea('公开内容', 'echo-body', item.body), button('取消', 'close', '') + button('保存修改', 'echo-update', id, 'primary')) : ''; }
    if (type === 'echo-delete') { const item = (data.echoPublications || []).find((entry) => entry.id === id); return item ? modal('删除回音壁发布', `<p>确认删除「${safe(item.title)}」？删除后将从职工端回音壁移除。</p>`, button('取消', 'close', '') + button('确认删除', 'echo-remove', id, 'primary')) : ''; }
    if (type === 'echo-view') { const item = (data.echoPublications || []).find((entry) => entry.id === id); return item ? modal('回音壁内容', `<h3>${safe(item.title)}</h3><p>${safe(item.body)}</p><p class="muted">来源事项 ${safe(item.affairId)} · ${safe(item.scope)} · ${safe(item.publishedAt || '未发布')} · ${safe(item.status)}</p><div class="engagement-section"><h4>互动数据</h4>${interactionCell(interactionSummary(item, postComments(data, 6000 + Number(item.sourcePostId || 0))))}</div>`, button('关闭', 'close', '')) : ''; }
    if (type === 'board-new' || type === 'board-edit') { const board = data.boards.find((item) => item.id === id); return modal(board ? '编辑栏目' : '新增栏目', input('栏目名称', 'name', board?.name || '') + input('排序', 'board-sort', board?.sort || data.boards.length + 1, 'number'), button('保存栏目', 'board-save', id, 'primary')); }
    if (type === 'board-delete') { const board = data.boards.find((item) => item.id === id); return board ? modal('删除栏目', `<p>确认删除「${safe(board.name)}」？栏目配置删除后不能恢复，历史帖子仍保留原栏目名称。</p>`, button('取消', 'close', '') + button('确认删除', 'board-remove', id, 'primary')) : ''; }
    if (type === 'word-new' || type === 'word-edit') { const rule = data.sensitiveWords.find((item) => item.id === id); return modal(rule ? '编辑敏感词' : '新增敏感词', input('敏感词', 'term', rule?.term || '') + choose('命中规则', 'matchRule', ['包含匹配', '完整词匹配'], rule?.matchRule || '包含匹配') + choose('适用范围', 'scope', ['全部', '发帖', '评论'], rule?.scope || '全部'), button('保存规则', 'word-save', id, 'primary')); }
    if (type === 'word-delete') { const rule = data.sensitiveWords.find((item) => item.id === id); return rule ? modal('删除敏感词', `<p>确认删除「${safe(rule.term)}」？删除后将不再拦截该词，已产生的命中次数为 ${Number.isFinite(rule.hitCount) ? rule.hitCount : 0} 次。</p>`, button('取消', 'close', '') + button('确认删除', 'word-remove', id, 'primary')) : ''; }
    if (['org-new', 'org-child', 'org-edit'].includes(type)) {
      const nodes = data.organizations || [];
      const current = type === 'org-edit' ? nodes.find((node) => node.id === id) : null;
      if (type === 'org-edit' && !current) return '';
      const selectedParent = current?.parentId || (type === 'org-child' ? id : '');
      const descendants = new Set(current ? [current.id] : []);
      for (let i = 0; i < nodes.length; i++) for (const node of nodes) if (descendants.has(node.parentId)) descendants.add(node.id);
      const parentOptions = nodes.filter((node) => !descendants.has(node.id)).map((node) => `<option value="${safe(node.id)}" ${node.id === selectedParent ? 'selected' : ''}>${safe(node.name)}</option>`).join('');
      return modal(current ? '编辑组织' : type === 'org-child' ? '新增下级组织' : '新增组织', input('组织名称', 'org-name', current?.name || '') + `<label class="field"><span>上级组织</span><select class="select" id="wf-org-parent"><option value="">顶级组织</option>${parentOptions}</select></label>` + input('同级排序', 'org-sort', current?.sort ?? 0, 'number') + choose('状态', 'org-state', ['正常', '停用'], current?.status || '正常'), button('保存组织', 'org-save', current?.id || '', 'primary'));
    }
    if (type === 'org-delete') {
      const node = (data.organizations || []).find((item) => item.id === id);
      return node ? modal('删除组织', `<p>确定删除「${safe(node.name)}」？删除后无法在本原型中恢复。</p>`, button('取消', 'close', '') + button('确认删除', 'org-remove', id, 'primary')) : '';
    }
    if (type === 'account-review') { const account = (data.accounts || []).find((a) => a.id === id); return state.role === 'platform' && account?.status === 'pending' ? modal('用户注册审核', `<dl class="post-detail-meta"><dt>申请人</dt><dd>${safe(account.name)}</dd><dt>手机号码</dt><dd>${safe(account.phone.slice(0, 3))}****${safe(account.phone.slice(-4))}</dd><dt>申请部门</dt><dd>${safe(account.department || '未填写')}</dd><dt>申请时间</dt><dd>${safe(account.submitted || account.createdAt || '未记录')}</dd></dl>` + textarea('审核意见（驳回时必填）', 'reason'), button('驳回申请', 'account-reject', id) + button('审核通过', 'account-approve', id, 'primary')) : ''; }
    return '';
  }
  function act(action, id) {
    if (action === 'banner-save') {
      if (!canPublish()) return showToast('当前角色无权管理轮播图');
      const data = db(), existing = (data.banners || []).find((item) => String(item.id) === id);
      const title = readField('banner-title'), summary = readField('banner-summary'), type = readField('banner-type');
      const targetId = readField('banner-target'), url = readField('banner-url'), sort = Number(readField('banner-sort'));
      const file = document.getElementById('wf-banner-image')?.files[0];
      if (!title || !Number.isInteger(sort) || sort < 1) return showToast('请填写标题和有效的显示顺序');
      if (!Object.hasOwn(bannerTypes, type)) return showToast('请选择跳转类型');
      if (type === 'external') {
        try { if (new URL(url).protocol !== 'https:') return showToast('外链须使用 HTTPS 地址'); } catch (_) { return showToast('请输入有效的外链地址'); }
      } else if (!bannerTargets(data, type).some((item) => String(item.id) === targetId)) return showToast('请选择已发布的关联内容');
      if (!file && !existing?.image) return showToast('请上传轮播图片');
      if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 1024 * 1024)) return showToast('仅支持 1 MB 以内的 JPG、PNG 或 WebP 图片');
      const persist = (image) => {
        const current = db(), item = (current.banners || []).find((entry) => String(entry.id) === id);
        const values = { title, summary, image, type, targetId: type === 'external' ? '' : targetId, url: type === 'external' ? url : '', sort };
        if (item) Object.assign(item, values);
        else (current.banners ||= []).push({ id: `banner-${Date.now()}`, ...values, enabled: true });
        current.audit.unshift({ action: '轮播图管理', target: item?.id || '新增轮播图', detail: title, role: roleInfo[state.role].label, at: time() });
        try { PrototypeData.save(current); closeModal(); showToast('轮播图已保存'); } catch (_) { showToast('图片占用空间过大，请换一张较小的图片'); }
      };
      if (file) { const reader = new FileReader(); reader.onload = () => persist(reader.result); reader.onerror = () => showToast('图片读取失败，请重试'); reader.readAsDataURL(file); }
      else persist(existing.image);
      return;
    }
    if (action === 'banner-toggle' || action === 'banner-remove') {
      if (!canPublish()) return showToast('当前角色无权管理轮播图');
      const data = db(), index = (data.banners || []).findIndex((item) => String(item.id) === id);
      if (index < 0) return showToast('轮播图不存在');
      const item = data.banners[index];
      if (action === 'banner-remove') data.banners.splice(index, 1);
      else item.enabled = !item.enabled;
      data.audit.unshift({ action: '轮播图管理', target: id, detail: `${item.title} · ${action === 'banner-remove' ? '删除' : item.enabled ? '启用' : '停用'}`, role: roleInfo[state.role].label, at: time() });
      PrototypeData.save(data); closeModal(); return showToast('轮播图已更新');
    }
    if (action === 'close') return closeModal();
    if (action === 'report-decision-cancel') { state.reportDecision = null; state.modal = { type: 'report-detail', id }; return render(); }
    if (action === 'report-confirm' || action === 'report-dismiss') { if (!canReview()) return showToast('当前角色无权核查举报'); state.reportDecision = action; state.modal = { type: 'report-decision', id }; return render(); }
    if (action === 'comment-review-cancel') { state.modal = { type: 'comment-batch-detail', id: state.commentReviewPending?.postId }; state.commentReviewPending = null; render(); for (const box of document.querySelectorAll('.comment-review-check')) box.checked = state.commentReviewSelection?.includes(box.value) || false; return; }
    if (action === 'nav') return go(id);
    if (action.startsWith('post-decision-')) { state.modal = { type: 'post-decision', id: `${action.slice('post-decision-'.length)}:${id}` }; return render(); }
    if (action === 'handler-reset') { handlerFilters = { query: '', status: '', priority: '', deadline: '', type: '', assignedFrom: '', assignedTo: '', deadlineFrom: '', deadlineTo: '' }; return render(); }
    if (action === 'handler-type-tab') { handlingType = id; return render(); }
    if (action === 'content-review-tab') { contentReviewType = ['全部', '建言献策', '心声诉求', '业务交流'].includes(id) ? id : '全部'; return render(); }
    if (action === 'assignment-tab') { assignmentTab = ['历史待登记', '已分办', '答复审核'].includes(id) ? id : '历史待登记'; return render(); }
    if (action === 'handler-message-tab') { handlerMessageType = id; return render(); }
    if (action === 'workbench-tab') { workbenchTab = id; return render(); }
    if (action === 'user-review-tab') { state.userReviewTab = id; return render(); }
    if (action === 'ledger-tab') { state.contentLedgerTab = id; return render(); }
    if (action === 'post-detail-tab') { state.postDetailTab = id; return render(); }
    if (action === 'policy-admin-tab') { state.policyAdminTab = id === 'questions' ? 'questions' : 'policy'; return render(); }
    if (action === 'staff') return window.location.href = new URL('../', document.baseURI).href;
    if (/^(board|word)-/.test(action) && !['platform', 'content'].includes(state.role)) return showToast('当前角色无权管理内容配置');
    if (action.startsWith('org-')) {
      if (state.role !== 'platform') return showToast('仅平台管理员可维护组织');
      if (action === 'org-toggle') { orgUi.collapsed.has(id) ? orgUi.collapsed.delete(id) : orgUi.collapsed.add(id); return render(); }
      if (action === 'org-expand-all' || action === 'org-collapse-all') { orgUi.collapsed = new Set(action === 'org-collapse-all' ? db().organizations.map((node) => node.id) : []); return render(); }
      if (action === 'org-advanced') { orgUi.advanced = !orgUi.advanced; if (!orgUi.advanced) orgUi.filters.parent = ''; return render(); }
      if (action === 'org-reset') { orgUi.filters = { query: '', visible: '', status: '', parent: '' }; return render(); }
      if (action === 'org-refresh') { orgUi.menuId = null; render(); return showToast('组织列表已刷新'); }
      if (action === 'org-menu') { orgUi.menuId = orgUi.menuId === id ? null : id; return render(); }
      if (['org-new', 'org-child', 'org-edit', 'org-delete'].includes(action)) { orgUi.menuId = null; state.modal = { type: action, id }; return render(); }
      if (action === 'org-save') {
        const data = db(), nodes = data.organizations, name = readField('org-name'), parentId = readField('org-parent') || null, sortValue = readField('org-sort');
        const sort = Number(sortValue);
        if (!name) return showToast('请填写组织名称');
        if (sortValue === '' || !Number.isInteger(sort) || sort < 0) return showToast('排序须为非负整数');
        if (parentId && !nodes.some((node) => node.id === parentId)) return showToast('上级组织不存在');
        if (nodes.some((node) => node.id !== id && node.parentId === parentId && node.name === name)) return showToast('同级组织名称不能重复');
        if (id) {
          const node = nodes.find((item) => item.id === id);
          if (!node) return showToast('组织不存在');
          let cursor = parentId;
          while (cursor) { if (cursor === id) return showToast('不能将组织移到自身或下级'); cursor = nodes.find((item) => item.id === cursor)?.parentId || null; }
          if (node.name !== name) {
            for (const affair of data.affairs) { if (affair.owner === node.name) affair.owner = name; if (affair.co === node.name) affair.co = name; }
            for (const account of data.accounts) if (account.department === node.name) account.department = name;
          }
          Object.assign(node, { name, parentId, sort, status: readField('org-state') });
        } else nodes.push({ id: `org-${Date.now()}`, name, parentId, sort, visible: true, status: readField('org-state'), createdAt: new Date().toLocaleString('zh-CN', { hour12: false }) });
        data.audit.unshift({ action: '组织架构', target: id || name, detail: id ? `编辑组织：${name}` : `新增组织：${name}`, role: roleInfo[state.role].label, at: time() });
        PrototypeData.save(data); closeModal(); return showToast('组织信息已保存');
      }
      if (action === 'org-remove') {
        const data = db(), nodes = data.organizations, node = nodes.find((item) => item.id === id);
        if (!node) return showToast('组织不存在');
        if (nodes.some((item) => item.parentId === id)) return showToast('请先处理下级组织');
        if (data.affairs.some((affair) => affair.owner === node.name || affair.co === node.name) || data.accounts.some((account) => account.department === node.name)) return showToast('该组织已关联事项或用户，不能删除');
        nodes.splice(nodes.indexOf(node), 1);
        data.audit.unshift({ action: '组织架构', target: id, detail: `删除组织：${node.name}`, role: roleInfo[state.role].label, at: time() });
        PrototypeData.save(data); closeModal(); return showToast('组织已删除');
      }
    }
    if (['post-detail', 'ledger-post-edit', 'ledger-post-delete', 'comment-batch-detail', 'comment-detail', 'report-detail', 'assign-form', 'assignment-skip', 'affair-detail', 'affair-transfer', 'affair-contact', 'rectify-new', 'rectify-form', 'notice-new', 'notice-edit', 'notice-delete', 'policy-new', 'policy-edit', 'policy-delete', 'question-answer', 'echo-new', 'echo-publish', 'echo-edit', 'echo-delete', 'echo-view', 'account-review', 'board-new', 'board-edit', 'board-delete', 'word-new', 'word-edit', 'word-delete', 'banner-new', 'banner-edit', 'banner-preview', 'banner-delete'].includes(action)) { if (action === 'post-detail') state.postDetailTab = 'content'; state.modal = { type: action, id }; return render(); }
    if (action.startsWith('ledger-post-')) {
      if (!canManageLedger()) return showToast('当前角色无权管理发帖台账');
      const data = db(), post = data.posts.find((item) => String(item.id) === String(id));
      if (!post || post.deleted === true) return showToast('帖子记录不存在');
      let detail = '';
      if (action === 'ledger-post-save') {
        const title = readField('ledger-title'), board = readField('ledger-board'), body = readField('ledger-body');
        if (!title || !board || !body) return showToast('请填写帖子标题、内容分类和正文');
        Object.assign(post, { title, board, body });
        detail = `编辑帖子：${title}`;
      } else if (action === 'ledger-post-toggle') {
        post.enabled = post.enabled === false;
        detail = `${post.enabled ? '启用' : '禁用'}帖子：${post.title}`;
      } else if (action === 'ledger-post-remove') {
        if (data.affairs.some((affair) => String(affair.postId) === String(post.id))) return showToast('该帖子已关联办理事项，不能删除');
        post.deleted = true;
        detail = `删除帖子：${post.title}`;
      } else return;
      data.audit.unshift({ action: '信息台账管理', target: post.id, detail, role: roleInfo[state.role].label, at: time() });
      PrototypeData.save(data); closeModal();
      return showToast(action === 'ledger-post-save' ? '帖子已更新' : action === 'ledger-post-remove' ? '帖子已删除' : post.enabled ? '帖子已启用' : '帖子已禁用');
    }
    if (action.startsWith('board-') && !['board-new', 'board-edit'].includes(action)) {
      const data = db(); const index = data.boards.findIndex((board) => board.id === id); const board = data.boards[index];
      if (action !== 'board-save' && !board) return showToast('栏目不存在');
      if (action === 'board-save') {
        const name = readField('name'), sort = Number(readField('board-sort'));
        if (!name) return showToast('请填写栏目名称');
        if (data.boards.some((item) => item.name === name && item.id !== id)) return showToast('栏目名称已存在');
        if (!Number.isInteger(sort) || sort < 1 || sort > data.boards.length + (board ? 0 : 1)) return showToast('排序须填写有效的列表位置');
        if (id && !board) return showToast('栏目不存在');
        if (board && board.name !== name && (data.posts.some((post) => post.board === board.name) || data.flowConfigs?.some((flow) => flow.board === board.name))) return showToast('该栏目已关联帖子或流程，不能修改名称');
        data.boards.sort((a, b) => a.sort - b.sort);
        if (board) { board.name = name; data.boards.splice(data.boards.indexOf(board), 1); }
        const saved = board || { id: `board-${Date.now()}`, name, enabled: true, staffPost: true };
        data.boards.splice(sort - 1, 0, saved);
        data.boards.forEach((item, position) => { item.sort = position + 1; });
      } else if (action === 'board-toggle') {
        if (board.enabled && board.staffPost && PrototypeData.postingBoards(data).length <= 1) return showToast('至少保留一个可发帖栏目');
        board.enabled = !board.enabled;
      } else if (action === 'board-remove') {
        if (data.boards.length <= 1) return showToast('至少保留一个栏目');
        if (board.staffPost && PrototypeData.postingBoards(data).length <= 1) return showToast('至少保留一个可发帖栏目');
        if (data.posts.some((post) => post.board === board.name) || data.flowConfigs?.some((flow) => flow.board === board.name)) return showToast('该栏目已关联帖子或流程，请先处理关联数据');
        data.boards.splice(index, 1);
        data.boards.forEach((item, position) => { item.sort = position + 1; });
      }
      else return;
      data.audit.unshift({ action: '栏目管理', target: id || readField('name'), detail: action === 'board-save' ? '保存栏目及排序' : action === 'board-toggle' ? '切换栏目状态' : '删除栏目', role: roleInfo[state.role].label, at: time() });
      PrototypeData.save(data); closeModal(); return showToast(action === 'board-remove' ? '栏目已删除' : '栏目配置已更新');
    }
    if (action.startsWith('word-') && !['word-new', 'word-edit', 'word-delete'].includes(action)) {
      const data = db(); const rule = data.sensitiveWords.find((item) => item.id === id);
      if (action === 'word-save') {
        const term = readField('term'), scope = readField('scope'), matchRule = readField('matchRule');
        if (!term) return showToast('请填写敏感词');
        if (data.sensitiveWords.some((item) => item.term.toLocaleLowerCase() === term.toLocaleLowerCase() && item.id !== id)) return showToast('敏感词已存在');
        if (id) { if (!rule) return showToast('规则不存在'); Object.assign(rule, { term, scope, matchRule }); }
        else data.sensitiveWords.unshift({ id: `word-${Date.now()}`, term, scope, matchRule, enabled: true, hitCount: 0 });
      } else if (action === 'word-toggle' && rule) rule.enabled = !rule.enabled;
      else if (action === 'word-remove' && rule) {
        data.sensitiveWords.splice(data.sensitiveWords.indexOf(rule), 1);
        if (!data.deletedSensitiveWordIds.includes(rule.id)) data.deletedSensitiveWordIds.push(rule.id);
      }
      else return showToast('规则不存在');
      data.audit.unshift({ action: '敏感词库', target: id || '新规则', detail: action === 'word-save' ? '保存拦截规则' : action === 'word-remove' ? `删除规则：${rule.term}，历史命中 ${rule.hitCount || 0} 次` : '切换规则状态', role: roleInfo[state.role].label, at: time() });
      PrototypeData.save(data); closeModal(); return showToast(action === 'word-remove' ? '敏感词已删除' : '敏感词配置已更新');
    }
    if (action.startsWith('post-')) return update(processPost(db().posts.find((item) => String(item.id) === String(id))) ? '分办确认' : '内容审核', 'posts', id, (p, data) => {
      const reason = readField('reason');
      if (['post-approve', 'post-return', 'post-reject'].includes(action) && !canAuditPost(p, data)) { showToast('当前角色无权审核该栏目'); return false; }
      if (['post-approve', 'post-return', 'post-reject'].includes(action) && !['待审核', '私密发布'].includes(p.status)) { showToast('该发言已处理，请刷新'); return false; }
      if (p.protectedListId && !reason && ['post-approve', 'post-return', 'post-reject'].includes(action)) { showToast('请填写人工复核意见'); return false; }
      if (['post-return', 'post-reject'].includes(action) && !reason) { showToast('请填写处置意见'); return false; }
      if (processPost(p) && action === 'post-approve') {
        if (data.affairs.some((affair) => String(affair.postId) === String(p.id))) return showToast('该发言已有办理事项'), false;
        const selfHandled = readField('handling-mode') === '自行办理';
        const account = currentAccount();
        const assignee = selfHandled ? account : handlerAccounts(data).find((item) => item.id === readField('assignee'));
        const deadline = readField('deadline'), requirements = readField('requirements');
        if (!assignee || !deadline || !requirements) return showToast('请选择承办人并填写办理期限和要求'), false;
        const number = `SX-${new Date().getFullYear()}09-${String(Math.max(79, ...data.affairs.map((item) => Number(item.id.split('-').pop()) || 0)) + 1).padStart(3, '0')}`;
        const owner = assignee.department || account.department || '平台管理组';
        data.affairs.unshift({ id: number, postId: p.id, title: p.title, owner, initialOwner: owner, assigneeId: assignee.id, assigneeName: assignee.name, dispatcherId: account.id, selfHandled, deadline, priority: '一般', requirements, feedback: '', status: '办理中', assignmentState: '办理中', stage: '调查核实', progress: '', draft: '', extension: null, transfer: null, flowSnapshot: flowForPost(p, data), acceptedAt: today(), events: [{ text: selfHandled ? `${account.name}确认需要办理并自行办理` : `${account.name}确认需要办理，交由${assignee.name}承办`, at: time() }] });
        p.processingAccepted = true;
      }
      p.status = ({ 'post-approve': processPost(p) ? '办理中' : '已发布', 'post-return': p.board === '业务交流' ? '已驳回' : '退回修改', 'post-reject': '已驳回', 'post-hide': '已隐藏', 'post-restore': '已发布' })[action];
      p.reason = reason;
      p.history = [...(p.history || []), { text: ({ 'post-approve': processPost(p) ? '分办人员确认需要办理' : '人工审核通过', 'post-return': '审核驳回，退回修改', 'post-reject': '审核驳回', 'post-hide': '内容已隐藏', 'post-restore': '内容已恢复' })[action], at: time() }];
      return `${p.title} → ${p.status}${reason ? `：${reason}` : ''}`;
    }, '帖子状态已更新');
    if (action === 'assignment-skip-save') return update('事项分办', 'posts', id, (p, data) => {
      const flow = flowForPost(p, data);
      if (!flow || flow.decision !== '人工判断' || p.status !== '已发布' || data.affairs.some((a) => a.postId === p.id) || !canFlowRole(flow, 'assignmentRole', 'dispatch')) { showToast('该帖子不符合无需办理条件'); return false; }
      if (!readField('routing-reason')) { showToast('请填写无需办理理由'); return false; }
      p.routingDecision = '无需办理'; p.routingReason = readField('routing-reason'); return `${p.title}：无需办理，${p.routingReason}`;
    }, '已标记为无需办理');
    if (action === 'assign-save') {
      const owner = readField('owner'), assigneeId = readField('assignee'), deadline = readField('deadline'), requirements = readField('requirements');
      if (!owner || !assigneeId || !deadline || !requirements) return showToast('请填写主办部门、初始承办人、期限和办理要求');
      const data = db(); const p = data.posts.find((x) => String(x.id) === id);
      const assignee = handlerAccounts(data).find((account) => account.id === assigneeId);
      if (!p || !processPost(p) || !processPostStatus(p) || !flowForPost(p, data) || data.affairs.some((a) => a.postId === p.id)) return showToast('该帖子不符合分办条件');
      if (!assignee || assignee.department !== owner) return showToast('初始承办人必须属于主办部门');
      if (!canFlowRole(flowForPost(p, data), 'assignmentRole', 'dispatch')) return showToast('当前角色无权分办该栏目');
      const number = `SX-${new Date().getFullYear()}09-${String(Math.max(79, ...data.affairs.map((a) => Number(a.id.split('-').pop()) || 0)) + 1).padStart(3, '0')}`;
      data.affairs.unshift({ id: number, postId: p.id, title: p.title, owner, initialOwner: owner, co: readField('co'), assigneeId, assigneeName: assignee.name, deadline, priority: readField('priority'), feedback: readField('feedback'), requirements, status: '办理中', assignmentState: '办理中', stage: '调查核实', progress: '', draft: '', extension: null, transfer: null, flowSnapshot: flowForPost(p, data), acceptedAt: today(), events: [{ text: `已分办至${owner}，进入${assignee.name}办理待办`, at: time() }] });
      p.processingState = '已登记'; p.processingAccepted = true; p.status = '办理中'; data.audit.unshift({ action: '事项分办', target: number, detail: `${p.title}：已分办至${assignee.name}，进入承办待办`, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); showToast(`事项 ${number} 已生成，已进入承办待办`); return;
    }
    if (action === 'affair-accept') return update('事项接收', 'affairs', id, (a, data) => {
      if (state.role !== 'handler' || (!isAssignedHandler(a, data) && !isTransferTarget(a))) { showToast('当前账号不是目标承办人'); return false; }
      if (!['待承办确认', '转办待接收'].includes(a.status)) { showToast('事项当前无需接收'); return false; }
      if (isTransferTarget(a)) {
        a.owner = a.transfer.toDepartment; a.assigneeId = a.transfer.toAssigneeId; a.assigneeName = a.transfer.toAssigneeName; a.transfer.status = '已接收';
      }
      a.status = '办理中'; a.assignmentState = '已接收'; a.acceptedAt = today(); a.returnReason = '';
      a.events.push({ text: `${a.assigneeName || '承办人'}已确认接收办理`, at: time() }); return `${a.title}：${a.assigneeName || '承办人'}确认接收`;
    }, '已接收办理事项');
    if (action === 'transfer-save') return update('事项转办', 'affairs', id, (a, data) => {
      if (state.role !== 'handler' || !isAssignedHandler(a, data)) { showToast('只有当前承办人可以转办'); return false; }
      if (!['待承办确认', '办理中'].includes(a.status)) { showToast('当前状态不可转办'); return false; }
      const targetId = readField('transfer-assignee'), target = handlerAccounts(data).find((account) => account.id === targetId), reason = readField('transfer-reason');
      if (!target || target.id === a.assigneeId) return showToast('请选择不同的目标承办人'), false;
      if (!reason) return showToast('请填写转办原因'), false;
      a.transfer = { status: '待接收', fromDepartment: a.owner, fromAssigneeId: a.assigneeId, fromAssigneeName: a.assigneeName, toDepartment: target.department, toAssigneeId: target.id, toAssigneeName: target.name, reason, at: time() };
      a.status = '转办待接收'; a.assignmentState = '转办待接收'; a.requirements = readField('transfer-requirements') || a.requirements;
      a.events.push({ text: `${a.assigneeName || '当前承办人'}转办至${target.name}，待接收`, at: time() }); return `${a.title}：转办至${target.name}`;
    }, '转办已提交，等待目标承办人接收');
    if (action === 'affair-contact-save') return update('联系分办人', 'affairs', id, (a) => {
      const content = readField('contact-content'), topic = readField('contact-topic');
      if (!content) return showToast('请填写联系内容'), false;
      a.events = a.events || [];
      a.events.push({ text: `联系分办人：${topic} · ${content}`, at: time() });
      return `已记录联系：${topic}`;
    }, '联系记录已保存');
    if (['progress-save', 'draft-save', 'draft-submit', 'extension-request', 'extension-approve', 'extension-reject', 'answer-return', 'answer-approve', 'affair-close'].includes(action)) return update('事项办理', 'affairs', id, (a, data) => {
      if (state.role === 'handler' && !isAssignedHandler(a, data)) { showToast('只有当前承办人可以办理事项'); return false; }
      if (['extension-approve', 'extension-reject'].includes(action) && !canFlowRole(flowForAffair(a, data), 'extensionRole', 'dispatch')) { showToast('当前角色无权审批延期'); return false; }
      if (['answer-return', 'answer-approve'].includes(action) && !canFlowRole(flowForAffair(a, data), 'answerRole', 'dispatch')) { showToast('当前角色无权复核答复'); return false; }
      if (action === 'affair-close' && !canDispatch()) { showToast('当前角色无权办结事项'); return false; }
      if (['progress-save', 'draft-save', 'draft-submit', 'extension-request'].includes(action) && !canWorkOn(a, data)) { showToast('只有当前承办人可以办理事项'); return false; }
      if (['progress-save', 'draft-save', 'draft-submit', 'extension-request'].includes(action) && !['待承办确认', '转办待接收', '办理中'].includes(a.status)) { showToast('事项当前不可提交承办操作'); return false; }
      const p = data.posts.find((x) => x.id === a.postId);
      if (action === 'progress-save') { if (!readField('progress')) return showToast('请填写阶段进展'), false; a.stage = readField('stage'); a.progress = readField('progress'); }
      if (action === 'draft-save') { if (!readField('draft')) return showToast('请填写答复草稿'), false; a.draft = readField('draft'); }
      if (action === 'draft-submit') { if (!readField('draft')) return showToast('请填写正式答复'), false; a.draft = readField('draft'); a.status = '待复核'; a.returnReason = ''; if (p && processPost(p)) p.status = '已处理-分办审核'; }
      if (['progress-save', 'draft-save', 'draft-submit'].includes(action)) { const names = Array.from(document.getElementById('wf-attachments')?.files || [], (file) => file.name); if (names.length) a.attachments = [...new Set([...(a.attachments || []), ...names])]; }
      if (action === 'extension-request') { if (!readField('extension') || !readField('extension-reason')) return showToast('请填写延期日期和原因'), false; if (readField('extension') <= a.deadline || readField('extension') <= today()) return showToast('拟完成时间应晚于原办理期限和当前日期'), false; a.extension = { status: '待审批', deadline: readField('extension'), reason: readField('extension-reason') }; }
      if (action === 'extension-approve' || action === 'extension-reject') { if (!a.extension || a.extension.status !== '待审批') return false; a.extension.status = action === 'extension-approve' ? '已批准' : '已拒绝'; if (action === 'extension-approve') a.deadline = a.extension.deadline; }
      if (action === 'answer-return') { if (!readField('reason')) return showToast('请填写退回意见'), false; a.status = '办理中'; a.returnReason = readField('reason'); if (p && processPost(p)) p.status = '办理中'; }
      if (action === 'answer-approve') {
        if (a.status !== '待复核' || !a.draft) return showToast('请先提交正式答复'), false;
        a.feedback = readField('feedback') === '私密回复' ? '私密回复' : '公开答复';
        if (p && processPost(p)) {
          a.status = '已办结'; a.closedAt = today(); a.repliedAt = time();
          p.status = a.feedback === '公开答复' ? '已办结公开' : '已办结私密';
          p.replyVisibility = a.feedback === '公开答复' ? '公开可见' : '仅个人可见';
          p.reply = a.draft;
          p.history = [...(p.history || []), { text: `办理答复审核通过，已办结 · ${p.replyVisibility}`, at: time() }];
          data.staffNotifications = data.staffNotifications || [];
          data.staffNotifications.unshift({ id: `MSG-${Date.now()}`, postId: p.id, authorId: p.authorId || 'staff', text: `${p.title} 已办结 · ${p.replyVisibility}`, at: time() });
          if (a.feedback === '公开答复' && !(data.echoPublications || []).some((entry) => String(entry.affairId) === String(a.id))) {
            data.echoPublications = data.echoPublications || [];
            data.echoPublications.unshift({ id: `echo-${Date.now()}`, sourcePostId: p.id, affairId: a.id, title: `关于“${p.title}”的答复`, body: a.draft, scope: '全体职工', status: '已发布', publishedAt: time() });
          }
        } else { a.status = '已反馈'; if (p) p.status = a.feedback === '公开答复' ? '已答复' : '已私密回复'; }
      }
      if (action === 'affair-close') { a.status = '已办结'; a.closedAt = today(); }
      const label = ({ 'progress-save': '更新阶段进展', 'draft-save': '保存答复草稿', 'draft-submit': '提交答复待复核', 'extension-request': '申请延期', 'extension-approve': '批准延期', 'extension-reject': '拒绝延期', 'answer-return': `答复退回修改：${a.returnReason}`, 'answer-approve': p && processPost(p) ? `答复审核通过并办结 · ${p.replyVisibility}` : '答复复核通过并反馈', 'affair-close': '事项办结归档' })[action];
      a.events.push({ text: label, at: time() }); return `${a.title}：${label}`;
    }, '事项进展已更新');
    if (['comment-batch-approve', 'comment-batch-reject', 'comment-row-approve', 'comment-row-reject', 'comment-review-submit'].includes(action)) {
      if (!canReview()) return showToast('当前角色无权审核评论');
      const data = db();
      if (action !== 'comment-review-submit') {
        const single = action.startsWith('comment-row-');
        const selected = single ? [id] : [...document.querySelectorAll('.comment-review-check:checked')].map((box) => box.value);
        if (!selected.length) return showToast('请先选择要审核的评论');
        const postId = data.comments.find((item) => String(item.id) === selected[0])?.postId;
        state.commentReviewSelection = [...document.querySelectorAll('.comment-review-check:checked')].map((box) => box.value);
        state.commentReviewPending = { action, ids: selected, single, postId: String(postId) };
        state.modal = { type: 'comment-review-confirm', id: '' };
        return render();
      }
      const pending = state.commentReviewPending;
      if (!pending) return showToast('审核操作已失效，请重新选择');
      const reason = readField('reason');
      const single = pending.single;
      const selected = pending.ids;
      if (!selected.length) return showToast('请先选择要审核的评论');
      const selectedIds = new Set(selected);
      const comments = data.comments.filter((item) => selectedIds.has(String(item.id)) && item.status === '待审核' && (commentSensitiveHits(item).length || item.protectedListId));
      if (comments.length !== selectedIds.size) return showToast('所选评论状态已变化，请刷新后重试');
      const approve = pending.action.endsWith('approve');
      if (!approve && !reason) return showToast('请填写处置意见');
      if (approve && !reason && comments.some((item) => item.protectedListId)) return showToast('受保护名单评论需填写人工复核意见');
      const status = approve ? '已发布' : '已驳回';
      const postId = comments[0].postId;
      if (comments.some((item) => String(item.postId) !== String(postId))) return showToast('只能审核同一帖子的评论');
      const reviewedAt = time();
      for (const comment of comments) { comment.status = status; comment.reviewReason = reason; comment.reviewedAt = reviewedAt; }
      data.audit.unshift({ action: '评论审核', target: postId, detail: `${single ? '逐条' : '批量'}${status} ${comments.length} 条评论${reason ? `：${reason}` : ''}`, role: roleInfo[state.role].label, at: reviewedAt });
      PrototypeData.save(data);
      state.commentReviewPending = null;
      state.commentReviewSelection = null;
      state.modal = { type: 'comment-batch-detail', id: String(postId) };
      render(); return showToast(`已${status} ${comments.length} 条评论`);
    }
    if (action.startsWith('comment-')) return update('评论审核', 'comments', id, (c) => { if (c.protectedListId && !readField('reason')) { showToast('请填写人工复核意见'); return false; } c.status = action === 'comment-approve' ? '已发布' : '已驳回'; c.reviewReason = readField('reason'); c.reviewedAt = time(); return c.protectedListId ? `人工复核：${c.reviewReason}` : c.text; }, '评论状态已更新');
    if (action === 'report-decision-submit') {
      if (!canReview()) return showToast('当前角色无权核查举报');
      if (!['report-confirm', 'report-dismiss'].includes(state.reportDecision)) return showToast('核查操作已失效，请重新选择');
      const conclusion = state.reportDecision;
      return update('举报核查', 'reports', id, (r) => {
        if (r.status !== '待核查') return showToast('该举报已核查'), false;
        const reason = readField('reason');
        if (!reason) return showToast('请填写核查意见'), false;
        r.status = '已处理';
        r.resolution = conclusion === 'report-confirm' ? '举报成立' : '举报不成立';
        r.reviewReason = reason;
        r.reviewedAt = time();
        return `${r.resolution}：${reason}`;
      }, '举报核查结果已保存');
    }
    if (action === 'rectify-save') { if (!readField('title') || !readField('owner') || !readField('deadline') || !readField('measures')) return showToast('请填写完整整改信息'); const data = db(); data.rectifications.unshift({ id: `ZG-${Date.now()}`, affairId: id || '独立整改', title: readField('title'), owner: readField('owner'), deadline: readField('deadline'), measures: readField('measures'), status: '整改中' }); data.audit.unshift({ action: '整改登记', target: id, detail: readField('title'), role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('整改事项已登记'); }
    if (action === 'rectify-archive') return update('整改验收', 'rectifications', id, (r) => { r.status = '已归档'; return r.title; }, '整改已验收归档');
    if (action === 'notice-save') { if (!canPublish()) return showToast('当前角色无权发布公告'); if (!readField('title') || !readField('body')) return showToast('请填写公告标题和内容'); const data = db(); const scope = readField('scope'); const targetCount = ({ '全体职工': 2468, '省社本级': 386, '直属企业': 1280 })[scope] || 0; const item = { id: `GG-${Date.now()}`, title: readField('title'), body: readField('body'), scope, status: '已发布', targetCount, successCount: targetCount, publishedAt: time() }; data.notices.unshift(item); data.audit.unshift({ action: '通知公告发布', target: item.id, detail: `${item.title} · 应发布 ${targetCount} 人，成功 ${targetCount} 人`, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast(`公告发布成功，共 ${targetCount} 人`); }
    if (action === 'notice-update') { if (!canPublish()) return showToast('当前角色无权编辑公告'); const title = readField('title'), body = readField('body'); if (!title || !body) return showToast('请填写公告标题和内容'); return update('通知公告编辑', 'notices', id, (notice) => { notice.title = title; notice.body = body; return `${title} · 发布范围和人数保持不变`; }, '公告已更新'); }
    if (action === 'notice-remove') { if (!canPublish()) return showToast('当前角色无权删除公告'); const data = db(), index = data.notices.findIndex((item) => String(item.id) === String(id)); if (index < 0) return showToast('公告记录不存在'); const [notice] = data.notices.splice(index, 1); data.audit.unshift({ action: '通知公告删除', target: notice.id, detail: `${notice.title} · 应发布 ${Number(notice.targetCount || 0)} 人，成功 ${Number(notice.successCount || 0)} 人`, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('公告已删除'); }
    if (action === 'policy-save') {
      if (!canPublish()) return showToast('当前角色无权发布政策');
      const title = readField('policy-title'), category = readField('policy-category'), department = readField('policy-department'), summary = readField('policy-summary'), body = readField('policy-body');
      if (!title || !category || !department || !summary || !body) return showToast('请填写完整政策信息');
      const data = db(), item = { id: `policy-${Date.now()}`, title, category, department, summary, body, status: '已发布', publishedAt: new Date().toISOString().slice(0, 10) };
      data.policies.unshift(item); data.audit.unshift({ action: '政策发布', target: item.id, detail: title, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('政策已发布');
    }
    if (action === 'policy-update') { if (!canPublish()) return showToast('当前角色无权编辑政策'); const title = readField('policy-title'), category = readField('policy-category'), department = readField('policy-department'), summary = readField('policy-summary'), body = readField('policy-body'); if (!title || !category || !department || !summary || !body) return showToast('请填写完整政策信息'); return update('政策编辑', 'policies', id, (item) => { Object.assign(item, { title, category, department, summary, body }); return title; }, '政策已更新'); }
    if (action === 'policy-remove') { if (!canPublish()) return showToast('当前角色无权删除政策'); const data = db(), index = data.policies.findIndex((item) => String(item.id) === String(id)); if (index < 0) return showToast('政策记录不存在'); const [policy] = data.policies.splice(index, 1); data.audit.unshift({ action: '政策删除', target: policy.id, detail: policy.title, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('政策已删除'); }
    if (action === 'question-save') { if (!canPublish()) return showToast('当前角色无权回答提问'); const answer = readField('question-answer'), department = readField('question-department'); if (!answer || !department) return showToast('请填写答复部门和公开答复'); return update('问题答复', 'questions', id, (item) => { item.answer = answer; item.department = department; item.status = '已发布'; item.answeredAt = new Date().toISOString().slice(0, 10); return item.title; }, '问题答复已发布'); }
    if (action === 'echo-save') {
      if (!canPublish()) return showToast('当前角色无权发布回音壁');
      const title = readField('echo-title'), body = readField('echo-body'), scope = readField('echo-scope');
      const data = db(), affair = data.affairs.find((item) => item.id === id);
      if (!affair || !affair.draft || affair.feedback !== '公开答复' || !['已反馈', '已办结'].includes(affair.status) || (processPost(data.posts.find((post) => String(post.id) === String(affair.postId))) && !PrototypeData.isPublicPost(data.posts.find((post) => String(post.id) === String(affair.postId))))) return showToast('该事项不符合公开条件');
      if (!title || !body) return showToast('请填写公开标题和内容');
      if ((data.echoPublications || []).some((item) => item.affairId === id)) return showToast('该事项已有发布记录');
      const item = { id: `echo-${Date.now()}`, sourcePostId: affair.postId, affairId: affair.id, title, body, scope, status: '已发布', publishedAt: time() };
      data.echoPublications.unshift(item); data.audit.unshift({ action: '回音壁发布', target: item.id, detail: title, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('已发布至回音壁');
    }
    if (action === 'echo-new-save') {
      if (!canPublish()) return showToast('当前角色无权发布回音壁');
      const data = db(), sourceId = readField('echo-source'), source = data.posts.find((item) => String(item.id) === String(sourceId));
      const title = readField('echo-title'), body = readField('echo-body'), scope = readField('echo-scope');
      if (!PrototypeData.isPublicPost(source) || source.board === '回音壁') return showToast('请选择信息台账中符合条件的公开帖子');
      if ((data.echoPublications || []).some((item) => String(item.sourcePostId) === String(source.id))) return showToast('该帖子已有回音壁发布记录');
      if (!title || !body) return showToast('请填写公开标题和内容');
      const item = { id: `echo-${Date.now()}`, sourcePostId: source.id, sourceTitle: source.title, sourceCategory: source.board, title, body, scope, status: '已发布', publishedAt: time() };
      data.echoPublications.unshift(item); data.audit.unshift({ action: '回音壁发布', target: item.id, detail: `${title} · 来源帖子 #${source.id}`, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('已发布至回音壁');
    }
    if (action === 'echo-update') { if (!canPublish()) return showToast('当前角色无权编辑回音壁'); const title = readField('echo-title'), body = readField('echo-body'), scope = readField('echo-scope'); if (!title || !body) return showToast('请填写公开标题和内容'); return update('回音壁编辑', 'echoPublications', id, (item) => { Object.assign(item, { title, body, scope }); return title; }, '回音壁内容已更新'); }
    if (action === 'echo-remove') { if (!canPublish()) return showToast('当前角色无权删除回音壁'); const data = db(), index = data.echoPublications.findIndex((item) => String(item.id) === String(id)); if (index < 0) return showToast('回音壁记录不存在'); const [item] = data.echoPublications.splice(index, 1); data.audit.unshift({ action: '回音壁删除', target: item.id, detail: item.title, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); return showToast('回音壁发布已删除'); }
    if (action.startsWith('account-')) { if (state.role !== 'platform') return showToast('仅平台管理员可审核用户'); return update('注册审核', 'accounts', id, (account) => { if (account.status !== 'pending') return showToast('该申请已处理，请刷新后查看'), false; if (action === 'account-reject' && !readField('reason')) return showToast('请填写驳回意见'), false; account.status = action === 'account-approve' ? 'approved' : 'rejected'; account.reason = readField('reason'); account.reviewedAt = time(); return `${account.name}：${account.status === 'approved' ? '通过' : '驳回'}${account.reason ? `，${account.reason}` : ''}`; }, '注册审核结果已更新'); }
  }
  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    if (trigger.classList.contains('modal-backdrop') && event.target !== trigger) return;
    if (!canEdit() && !['close', 'nav', 'staff', 'post-detail', 'post-detail-tab', 'affair-detail'].includes(trigger.dataset.action)) return showToast('领导视图仅支持查看');
    act(trigger.dataset.action, trigger.dataset.id || '');
  });
  window.ManagementWorkflow = {
    bannerTargetOptions(type) { const container = document.getElementById('wf-banner-target-field'); if (container) container.innerHTML = bannerTargetField(db(), type); },
    orgSearch() { orgUi.filters = { query: readField('org-query'), status: readField('org-status'), parent: orgUi.advanced ? readField('org-parent-filter') : '' }; orgUi.menuId = null; render(); },
    handlerSearch() { handlerFilters = { ...handlerFilters, query: readField('handler-query'), status: readField('handler-status'), priority: readField('handler-priority'), deadline: readField('handler-deadline'), type: readField('handler-type'), deadlineFrom: readField('handler-deadlineFrom'), deadlineTo: readField('handler-deadlineTo') }; render(); },
    page(name) {
      const routes = { dashboard: board, 'flow-config': () => window.ManagementFlowConfig?.page() || '', 'base-config': () => window.ManagementBaseConfig?.page() || '', 'content-ledger': contentLedger, 'content-review': contentReview, review: posts, comments, 'report-review': reportReview, sensitive, assignments: assignment, handling, tasks: handlerTasks, drafts: handlerDrafts, notices: handlerReminders, rectifications, echo: state.role === 'dispatch' ? handling : echo, categories, announcements, banners, policy: policyAndQuestions, 'user-review': userReviews, users, organization, permissions: roles, statistics, logs, audit: logs, 'handler-dashboard': handlerBoard, 'handler-dispatch': handlerDispatch, 'handler-tasks': handlerTasks, 'handler-handling': handlerHandling, 'handler-messages': handlerMessages, 'handler-drafts': handlerDrafts, 'handler-reminders': handlerReminders, 'handler-answers': handlerAnswers, 'handler-closure': handlerClosure, 'handler-statistics': handlerStatistics, 'leader-dashboard': leaderDashboard, 'leader-statistics': leaderStatistics, 'leader-key-affairs': leaderKeyAffairs, 'leader-results': leaderResults };
      return (routes[name] || board)();
    },
    modal: form
  };
  const previousModal = renderModal;
  renderModal = function () { return state.modal?.type && window.ManagementWorkflow.modal(state.modal.type, String(state.modal.id)) || previousModal(); };
  render();
})();
