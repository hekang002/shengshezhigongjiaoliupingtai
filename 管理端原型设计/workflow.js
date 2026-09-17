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
  const applicationNo = (account) => account.applicationNo || `SQ-${String(account.submitted || account.createdAt || today()).slice(0, 10).replace(/-/g, '')}-${String(account.phone || '').slice(-4)}`;
  let handlerFilters = { query: '', status: '', priority: '', deadline: '', type: '', assignedFrom: '', assignedTo: '', deadlineFrom: '', deadlineTo: '' };
  let handlingType = '';
  let handlerMessageType = '';
  let workbenchTab = '待处理';
  let contentReviewStatus = '待审核';
  let contentReviewTypes = [];
  let contentReviewFilters = { query: '', risk: '', contentState: '', dateFrom: '', dateTo: '' };
  let contentReviewSelection = new Set();
  let assignmentTab = '待分办';
  let assignmentFilters = { query: '', type: '', priority: '', createdFrom: '', createdTo: '' };
  let assignmentClosedFilters = { query: '', type: '', owner: '', assignee: '', feedback: '', closedFrom: '', closedTo: '' };
  let sensitiveFilters = { query: '', category: '', riskLevel: '', scope: '', status: '' };
  let userReviewFilters = { query: '', department: '', dateFrom: '', dateTo: '' };
  let commentReviewTab = '待审核';
  let commentReviewFilters = { query: '', board: '', risk: '', dateFrom: '', dateTo: '' };
  let reportReviewTab = '待核查';
  let reportReviewFilters = { query: '', category: '', dateFrom: '', dateTo: '' };
  const sensitiveCategories = ['信息安全', '内部信息', '廉洁合规', '不文明用语', '广告引流', '其他'];
  const riskPolicy = (level) => level === '高' ? '禁止提交' : level === '中' ? '优先人工审核' : '普通人工审核';
  const riskBadge = (level) => `<span class="risk-level risk-${level === '高' ? 'high' : level === '中' ? 'medium' : 'low'}">${safe(level)}风险</span>`;
  const parseImportLine = (line, delimiter) => { const cells = []; let value = '', quoted = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"' && line[i + 1] === '"' && quoted) { value += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === delimiter && !quoted) { cells.push(value.trim()); value = ''; } else value += char; } cells.push(value.trim()); return cells; };
  const handlerDepartment = (data) => {
    const accountId = sessionStorage.getItem('prototype-handler-account-id');
    return (accountId ? data.accounts.find((account) => account.id === accountId && account.role === 'handler' && account.status === 'approved') : data.accounts.find((account) => account.role === 'handler' && account.status === 'approved'))?.department || '';
  };
  const handlerAccountId = () => sessionStorage.getItem('prototype-handler-account-id') || '';
  const handlerAccounts = (data) => (data.accounts || []).filter((account) => account.role === 'handler' && account.status === 'approved');
  const accountSelect = (data, id, label, selected = '') => `<label class="field"><span>${label}</span><select class="select" id="wf-${id}"><option value="">请选择承办人</option>${handlerAccounts(data).map((account) => `<option value="${safe(account.id)}" ${account.id === selected ? 'selected' : ''}>${safe(account.name)} · ${safe(account.department)}</option>`).join('')}</select></label>`;
  const processPost = (post) => ['建言献策', '心声诉求'].includes(post?.board);
  const canAuditPost = () => canReview();
  const auditStatus = (post) => post?.contentAuditStatus || (['私密发布', '待审核'].includes(post?.status) ? '待审核' : ['退回修改', '已驳回'].includes(post?.status) ? '已驳回' : '审核通过');
  const publicationStatus = (post) => post?.publishStatus || (post?.status === '私密发布' || post?.status === '已办结私密' ? '私密发布' : PrototypeData.isPublicPost(post) ? '已发布' : '未发布');
  const publicationActions = (post) => {
    if (!canPublish() || auditStatus(post) !== '审核通过') return '';
    if (post.status === '已隐藏') return button('恢复', 'post-restore', post.id);
    if (publicationStatus(post) === '未发布') return button('发布', 'post-publish', post.id, 'primary') + button('私密发布', 'post-private-publish', post.id);
    if (publicationStatus(post) === '私密发布') return button('转为公开', 'post-publish', post.id) + button('取消发布', 'post-hide', post.id);
    return button('隐藏', 'post-hide', post.id);
  };
  const processPostStatus = (post) => auditStatus(post) === '审核通过' && post?.handlingStatus === '待分办';
  const nextAffairNumber = (data) => {
    const stamp = today().slice(0, 7).replace('-', '');
    const max = data.affairs.reduce((value, affair) => {
      const match = String(affair.id || '').match(/-(\d+)$/);
      return Math.max(value, match ? Number(match[1]) : 0);
    }, 79);
    return `SX-${stamp}-${String(max + 1).padStart(3, '0')}`;
  };
  function createPendingAffair(post, data, reviewedAt = time()) {
    const existing = data.affairs.find((affair) => String(affair.postId) === String(post.id));
    if (existing) return existing;
    const number = nextAffairNumber(data);
    const affair = {
      id: number, postId: post.id, title: post.title, sourceType: post.board, publicationMode: publicationStatus(post),
      auditStatus: '审核通过', reviewedAt, createdAt: reviewedAt, owner: '', initialOwner: '', co: '', assigneeId: '', assigneeName: '',
      deadline: '', priority: '一般', feedback: '公开答复', requirements: '', status: '待分办', assignmentState: '待分办',
      stage: '', progress: '', draft: '', extension: null, transfer: null, flowSnapshot: flowForPost(post, data),
      dispatcherId: currentAccount().id, dispatcherName: currentAccount().name || roleInfo[state.role].label,
      dispatcherDepartment: currentAccount().department || '平台管理组',
      events: [{ text: `内容审核通过，自动生成待分办事项 ${number}`, at: reviewedAt }]
    };
    data.affairs.unshift(affair);
    post.processingAccepted = true;
    post.handlingStatus = '待分办';
    return affair;
  }
  function notifyPostAuthor(data, post, text) {
    data.staffNotifications = data.staffNotifications || [];
    data.staffNotifications.unshift({ id: `MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, postId: post.id, authorId: post.authorId || 'staff', text, at: time() });
  }
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
  const statusLabel = (a) => {
    const primary = a.status === '待复核' ? '待答复审核' : ['已反馈', '已办结'].includes(a.status) ? '已办结' : a.status;
    const alert = a.status === '办理中' && a.extension?.status === '待审批' ? '待延期审批' : a.returnReason && a.status === '办理中' ? '退回修改' : deadlineFlag(a) === '逾期' ? '逾期' : '';
    return alert ? `${primary} · ${alert}` : primary;
  };
  const handlerStatusLabel = (a) => {
    if (a.returnReason) return '退回';
    if (a.status === '办理中' && !a.progress && !a.draft) return '待处理';
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
    const pending = data.posts.filter((p) => auditStatus(p) === '待审核').length;
    const unassigned = data.affairs.filter((affair) => affair.status === '待分办').length;
    const review = data.affairs.filter((a) => a.status === '待复核').length;
    const active = data.affairs.filter((a) => a.status === '办理中').length;
    return heading(state.role === 'leader' ? '领导驾驶舱' : state.role === 'handler' ? '承办工作台' : '运营工作台', '按授权角色查看内容、事项和办理进展。') +
      `<div class="grid grid-4">${[['待审核内容', pending, 'content-review'], ['待分办事项', unassigned, 'handler-dispatch'], ['办理中事项', active, 'handler-handling'], ['待答复审核', review, 'handler-dispatch']].map(([label, value, page]) => `<button class="card stat stat-link" onclick="go('${page}')"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong><span class="stat-note">查看明细 →</span></button>`).join('')}</div>` +
      `<div class="split-layout"><section class="card card-pad"><div class="card-title">当前重点事项 ${button('全部事项', 'nav', 'handler-handling')}</div>${data.affairs.map((a) => `<div class="queue-item"><span class="queue-icon">${icon('clipboard-list')}</span><div><strong>${safe(a.title)}</strong><p>${safe(a.id)} · ${safe(a.owner)} · ${safe(a.deadline)}</p></div>${badgeFor(statusLabel(a))}</div>`).join('') || '<div class="empty">暂无办理事项</div>'}</section><aside class="card card-pad"><div class="card-title">最新操作</div><div class="timeline">${data.audit.slice(0, 6).map((e) => `<div class="timeline-item"><span class="timeline-dot">${icon('activity')}</span><div><strong>${safe(e.action)}</strong><p>${safe(e.detail)}</p></div><small>${safe(e.at)}</small></div>`).join('') || '<p class="muted">暂无操作记录</p>'}</div></aside></div>`;
  }
  function contentTabs(items, selected, action, label, variant = '') {
    const variantClass = variant ? ` content-tabs-${safe(variant)}` : '';
    return `<div class="review-status-tabs content-tabs${variantClass}" role="tablist" aria-label="${safe(label)}">${items.map(([value, text, count]) => `<button type="button" role="tab" aria-selected="${selected === value}" class="review-status-tab ${selected === value ? 'active' : ''}" data-action="${action}" data-id="${safe(value)}">${safe(text)}${count === undefined ? '' : `<span>${count}</span>`}</button>`).join('')}</div>`;
  }
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
    return list(['帖子 / 来源', '敏感词命中', '状态', '操作'], rows.map((p) => `<tr><td><strong>${safe(p.title)}</strong><div class="td-sub">${safe(p.board)} · ${safe(p.author)} · ${safe(p.time)}</div></td><td>${sensitiveWordBadges(p, data)}</td><td>${badgeFor(p.status)}</td><td><div class="row-actions">${button('详情', 'post-detail', p.id)}${canAuditPost(p, data) && auditStatus(p) === '待审核' ? button(processPost(p) ? '审核通过并进入分办' : '审核通过', 'post-decision-approve', p.id, 'primary') + button('驳回', 'post-decision-reject', p.id) : publicationActions(p)}</div></td></tr>`));
  }
  function commentSensitiveHits(comment) {
    return Array.isArray(comment.sensitiveHits) ? comment.sensitiveHits.filter(Boolean) : [];
  }
  function commentRisk(comment, data) {
    if (comment.protectedListId) return '高';
    const levels = commentSensitiveHits(comment).map((term) => (data.sensitiveWords || []).find((word) => word.term === term)?.riskLevel || '中');
    return levels.includes('高') ? '高' : levels.includes('中') ? '中' : '低';
  }
  function commentStatusComments(data, status = commentReviewTab) {
    return data.comments.filter((comment) => comment.status === status && (status === '待审核' ? commentSensitiveHits(comment).length || comment.protectedListId : comment.reviewedAt));
  }
  function commentWaitText(value) {
    if (!value) return '时间未记录';
    const days = Math.max(0, Math.floor((new Date(`${today()}T23:59:59`) - new Date(String(value).replace(' ', 'T'))) / 86400000));
    return days ? `已等待 ${days} 天` : '今日提交';
  }
  function highlightComment(text, hits) {
    let output = safe(text);
    hits.filter(Boolean).sort((a, b) => b.length - a.length).forEach((term) => {
      const escaped = safe(term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      output = output.replace(new RegExp(escaped, 'gi'), (match) => `<mark>${match}</mark>`);
    });
    return output;
  }
  function commentReviewTable(data) {
    const source = commentStatusComments(data).filter((comment) => {
      const post = data.posts.find((item) => String(item.id) === String(comment.postId));
      const query = commentReviewFilters.query.toLocaleLowerCase();
      const haystack = `${comment.text || ''} ${comment.author || ''} ${post?.title || ''}`.toLocaleLowerCase();
      const date = String(comment.createdAt || '').slice(0, 10);
      return (!query || haystack.includes(query)) && (!commentReviewFilters.board || post?.board === commentReviewFilters.board) && (!commentReviewFilters.risk || commentRisk(comment, data) === commentReviewFilters.risk) && (!commentReviewFilters.dateFrom || date >= commentReviewFilters.dateFrom) && (!commentReviewFilters.dateTo || date <= commentReviewFilters.dateTo);
    });
    const groups = [...new Set(source.map((comment) => String(comment.postId)))].map((postId) => {
      const comments = source.filter((comment) => String(comment.postId) === postId);
      const post = data.posts.find((item) => String(item.id) === postId);
      const hits = [...new Set(comments.flatMap(commentSensitiveHits))];
      const earliest = comments.map((item) => item.createdAt || '').filter(Boolean).sort()[0] || '';
      const latest = comments.map((item) => item.createdAt || '').filter(Boolean).sort().at(-1) || '未记录';
      const highestRisk = comments.some((item) => commentRisk(item, data) === '高') ? '高' : comments.some((item) => commentRisk(item, data) === '中') ? '中' : '低';
      return { postId, post, comments, hits, earliest, latest, highestRisk };
    });
    const countLabel = commentReviewTab === '待审核' ? '待审评论' : commentReviewTab === '已发布' ? '已发布评论' : '已驳回评论';
    const countSuffix = commentReviewTab === '待审核' ? '条待审' : commentReviewTab === '已发布' ? '条已发布' : '条已驳回';
    return `<div class="comment-review-result"><div class="sensitive-result-head"><strong>${safe(commentReviewTab)}记录</strong><span>共 ${groups.length} 个帖子、${source.length} 条评论</span></div><div class="comment-review-rule-note">${icon('info')}<span>“规则命中”来自敏感词库的风险等级和命中词，仅作人工审核提示，不代表已判定违规。</span></div>${list(['来源帖子', '栏目', countLabel, '规则命中', commentReviewTab === '待审核' ? '等待时间' : '最近提交', '操作'], groups.map((group) => `<tr><td><strong>${safe(group.post?.title || '来源帖子不可用')}</strong><div class="td-sub">发帖人：${safe(group.post?.author || '未记录')}</div></td><td>${badgeFor(group.post?.board || '原栏目')}</td><td><strong>${group.comments.length} ${countSuffix}</strong></td><td><div class="comment-risk-summary">${riskBadge(group.highestRisk)}<span><b>命中词：</b>${group.hits.length ? safe(group.hits.slice(0, 2).join('、')) : '受保护名单'}${group.hits.length > 2 ? ` 等 ${group.hits.length} 项` : ''}</span></div></td><td><strong>${safe(commentReviewTab === '待审核' ? commentWaitText(group.earliest) : group.latest)}</strong><div class="td-sub">${safe(group.latest)}</div></td><td><div class="row-actions">${button('帖子详情', 'post-detail', group.postId)}${button(commentReviewTab === '待审核' ? '审核评论' : '查看记录', 'comment-batch-detail', group.postId, commentReviewTab === '待审核' ? 'primary' : 'secondary')}</div></td></tr>`))}</div>`;
  }
  function posts() {
    const data = db();
    return heading('帖子审核', '审核职工提交的帖子，风险识别结果与处置意见全程留痕。', `<span class="badge red">待审核 ${data.posts.filter((p) => p.status === '待审核').length}</span>`) + postReviewTable(data);
  }
  function comments() {
    const data = db();
    const pending = commentStatusComments(data, '待审核');
    const postCount = new Set(pending.map((comment) => String(comment.postId))).size;
    const highRisk = pending.filter((comment) => commentRisk(comment, data) === '高').length;
    const todayHandled = data.comments.filter((comment) => ['已发布', '已驳回'].includes(comment.status) && String(comment.reviewedAt || '').includes('09-16')).length;
    const counts = ['待审核', '已发布', '已驳回'].map((status) => [status, status, commentStatusComments(data, status).length]);
    const boards = [...new Set(data.posts.map((post) => post.board).filter(Boolean))];
    return heading('评论审核', '结合原帖上下文人工判断敏感规则命中评论，审核结果同步至职工端并留痕。', `<span class="badge red">待审核 ${postCount} 个帖子 / ${pending.length} 条评论</span>`) +
      `<div class="comment-review-summary"><div><span>待审核评论</span><strong>${pending.length}</strong><small>进入人工审核队列</small></div><div><span>涉及帖子</span><strong>${postCount}</strong><small>按来源帖子汇总</small></div><div><span>高风险提示</span><strong>${highRisk}</strong><small>需优先人工判断</small></div><div><span>今日已处理</span><strong>${todayHandled}</strong><small>通过与驳回合计</small></div></div>` +
      contentTabs(counts, commentReviewTab, 'comment-review-tab', '评论审核状态') +
      `<div class="comment-review-filters"><label>关键词<input class="input" id="wf-comment-review-query" value="${safe(commentReviewFilters.query)}" placeholder="评论、作者或帖子标题"></label><label>来源栏目<select class="select" id="wf-comment-review-board"><option value="">全部栏目</option>${boards.map((board) => `<option ${commentReviewFilters.board === board ? 'selected' : ''}>${safe(board)}</option>`).join('')}</select></label><label>风险等级<select class="select" id="wf-comment-review-risk"><option value="">全部风险</option>${['高', '中', '低'].map((level) => `<option ${commentReviewFilters.risk === level ? 'selected' : ''} value="${level}">${level}风险</option>`).join('')}</select></label><label>提交时间<div class="review-date-range"><input class="input" id="wf-comment-review-from" type="date" value="${safe(commentReviewFilters.dateFrom)}"><em>至</em><input class="input" id="wf-comment-review-to" type="date" value="${safe(commentReviewFilters.dateTo)}"></div></label><div class="comment-review-filter-actions">${button('重置', 'comment-review-reset', '')}<button class="btn btn-sm btn-primary" type="button" onclick="ManagementWorkflow.commentReviewSearch()">${icon('search')}查询</button></div></div>` + commentReviewTable(data);
  }
  function reportReview() {
    const data = db();
    const statusMatches = (report) => reportReviewTab === '待核查' ? report.status === '待核查' : report.status === '已处理' && report.resolution === reportReviewTab;
    const sourceReports = data.reports.filter((report) => {
      if (!statusMatches(report)) return false;
      const post = data.posts.find((item) => String(item.id) === String(report.postId));
      const query = reportReviewFilters.query.toLocaleLowerCase();
      const haystack = `${post?.title || ''} ${report.reason || ''} ${report.reporter || ''}`.toLocaleLowerCase();
      const date = String(report.createdAt || '').slice(0, 10);
      return (!query || haystack.includes(query)) && (!reportReviewFilters.category || report.category === reportReviewFilters.category) && (!reportReviewFilters.dateFrom || date >= reportReviewFilters.dateFrom) && (!reportReviewFilters.dateTo || date <= reportReviewFilters.dateTo);
    });
    const groups = [...new Set(sourceReports.map((report) => String(report.postId)))].map((postId) => {
      const reports = sourceReports.filter((report) => String(report.postId) === postId);
      const post = data.posts.find((item) => String(item.id) === postId);
      const categories = [...new Set(reports.map((report) => report.category || '其他'))];
      const reporterCount = new Set(reports.map((report) => report.reporter || report.id)).size;
      const earliest = reports.map((report) => report.createdAt || '').filter(Boolean).sort()[0] || '时间未记录';
      return { postId, post, reports, categories, reporterCount, earliest };
    });
    const pending = data.reports.filter((report) => report.status === '待核查');
    const pendingPosts = new Set(pending.map((report) => String(report.postId))).size;
    const repeated = [...new Set(pending.map((report) => String(report.postId)))].filter((postId) => new Set(pending.filter((report) => String(report.postId) === postId).map((report) => report.reporter || report.id)).size > 1).length;
    const resolved = data.reports.filter((report) => report.status === '已处理');
    const tabs = [['待核查', '待核查', pending.length], ['举报成立', '举报成立', resolved.filter((report) => report.resolution === '举报成立').length], ['举报不成立', '举报不成立', resolved.filter((report) => report.resolution === '举报不成立').length]];
    const categories = [...new Set(data.reports.map((report) => report.category).filter(Boolean))];
    const rows = list(['来源帖子', '举报人数 / 记录', '举报原因类型', reportReviewTab === '待核查' ? '最早举报' : '核查结果', '操作'], groups.map((group) => `<tr><td><strong>${safe(group.post?.title || '来源帖子不可用')}</strong><div class="td-sub">${safe(group.post?.board || '栏目未记录')} · 发帖人：${safe(group.post?.author || '未记录')}</div></td><td><strong>${group.reporterCount} 位用户</strong><div class="td-sub">共 ${group.reports.length} 条举报记录</div></td><td><div class="report-category-list">${group.categories.map((category) => badgeFor(category)).join('')}</div></td><td>${reportReviewTab === '待核查' ? `<strong>${safe(commentWaitText(group.earliest))}</strong><div class="td-sub">${safe(group.earliest)}</div>` : `<strong>${safe(reportReviewTab)}</strong><div class="td-sub">${safe(group.reports[0]?.reviewedAt || '时间未记录')}</div>`}</td><td><div class="row-actions">${button('帖子详情', 'post-detail', group.postId)}${button(reportReviewTab === '待核查' ? '核查举报' : '查看结果', 'report-group-detail', group.postId, reportReviewTab === '待核查' ? 'primary' : 'secondary')}</div></td></tr>`));
    return heading('举报核查', '按被举报内容归并核查举报原因，人工记录结论、处置意见并保留审计记录。', `<span class="badge red">待核查 ${pendingPosts} 个帖子 / ${pending.length} 条举报</span>`) +
      `<div class="report-review-summary"><div><span>待核查举报</span><strong>${pending.length}</strong><small>等待人工核查</small></div><div><span>涉及帖子</span><strong>${pendingPosts}</strong><small>按来源内容归并</small></div><div><span>2人以上举报的帖子</span><strong>${repeated}</strong><small>建议优先处理</small></div><div><span>已处理</span><strong>${resolved.length}</strong><small>成立与不成立合计</small></div></div>` + contentTabs(tabs, reportReviewTab, 'report-review-tab', '举报核查状态') +
      `<div class="report-review-filters"><label>关键词<input class="input" id="wf-report-review-query" value="${safe(reportReviewFilters.query)}" placeholder="帖子标题、举报原因或举报人"></label><label>举报原因类型<select class="select" id="wf-report-review-category"><option value="">全部类型</option>${categories.map((category) => `<option ${reportReviewFilters.category === category ? 'selected' : ''}>${safe(category)}</option>`).join('')}</select></label><label>举报时间<div class="review-date-range"><input class="input" id="wf-report-review-from" type="date" value="${safe(reportReviewFilters.dateFrom)}"><em>至</em><input class="input" id="wf-report-review-to" type="date" value="${safe(reportReviewFilters.dateTo)}"></div></label><div class="report-review-filter-actions">${button('重置', 'report-review-reset', '')}<button class="btn btn-sm btn-primary" type="button" onclick="ManagementWorkflow.reportReviewSearch()">${icon('search')}查询</button></div></div><div class="report-review-result"><div class="sensitive-result-head"><strong>${safe(reportReviewTab)}记录</strong><span>共 ${groups.length} 个帖子、${sourceReports.length} 条举报</span></div><div class="report-review-rule-note">${icon('info')}<span>举报原因类型由职工提交举报时选择，仅作为核查线索，最终结论由审核人员判断。</span></div>${rows}</div>`;
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
    const content = `<dl class="post-detail-meta"><dt>帖子编号</dt><dd>${safe(post.id)}</dd><dt>发表栏目</dt><dd>${safe(post.board)}</dd><dt>发布作者</dt><dd>${safe(post.author)}</dd><dt>发布方式</dt><dd>${post.author === '匿名用户' ? '匿名发布 · 真实身份受独立溯源权限保护' : '实名发布'}</dd><dt>提交时间</dt><dd>${safe(post.time)}</dd><dt>审核状态</dt><dd>${badgeFor(contentReviewResult(post))}</dd><dt>发布状态</dt><dd>${badgeFor(publicationStatus(post))}</dd><dt>敏感词命中</dt><dd>${sensitiveWordBadges(post, data)}</dd></dl><div class="post-detail-copy"><h3>${safe(post.title)}</h3><p>${safe(post.body)}</p></div>${post.protectedListId ? `<div class="notice">${icon('shield-alert')}<div><strong>疑似涉及受保护名单</strong><p>关联规则：${safe(data.protectedLists?.find((item) => item.id === post.protectedListId)?.name || '已停用名单')}。仅供人工判断。</p></div></div>` : ''}`;
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
    const actions = selected === 'content' && canAuditPost(post, data) && auditStatus(post) === '待审核'
      ? button('驳回', 'post-decision-reject', post.id) + button(processPost(post) ? '审核通过并进入分办' : '审核通过', 'post-decision-approve', post.id, 'primary')
      : publicationActions(post) + button('关闭', 'close', '');
    return modal('帖子详情 · ' + post.id, body, actions).replace('<section class="modal"', '<section class="modal post-detail-modal"');
  }
  function contentReviewDetail(data, post) {
    const risk = contentRisk(post, data);
    const pending = auditStatus(post) === '待审核';
    const route = processPost(post) ? '审核通过后立即生成带编号的待分办事项，由分办人员设置承办部门、办理人和办理时限；发布状态独立管理。' : '审核通过后进入待发布状态，不生成办理事项。';
    const events = (data.audit || []).filter((item) => String(item.target) === String(post.id));
    const hitLabels = risk.labels.length ? risk.labels.map((label) => `<span class="content-evidence-tag">${safe(label)}</span>`).join('') : '<span class="content-evidence-empty">未命中敏感词、个人信息或受保护名单规则</span>';
    const body = `<div class="content-review-detail-grid"><article class="content-review-document"><header><div><span>${badgeFor(post.board)} ${badgeFor(contentState(post))}</span><h2>${safe(post.title)}</h2><p>${safe(post.id)} · ${safe(post.author || '匿名用户')} · ${safe(post.time || '提交时间未记录')}</p></div></header><div class="content-review-copy">${safe(post.body || '暂无正文内容')}</div><section><h3>附件材料</h3><div class="content-evidence-empty">该内容未上传附件</div></section><section><h3>审核记录</h3>${events.length ? `<div class="ledger-history">${events.slice(0, 6).map((item) => `<div><span class="timeline-dot">${icon('activity')}</span><p><strong>${safe(item.action)}</strong><small>${safe(item.detail)} · ${safe(item.role)} · ${safe(item.at)}</small></p></div>`).join('')}</div>` : '<div class="content-evidence-empty">暂无历史审核记录</div>'}</section></article><aside class="content-review-inspector"><section class="content-review-risk-head ${risk.level === '高' ? 'high' : risk.level === '中' ? 'medium' : 'low'}"><div>${icon(risk.level === '高' ? 'shield-alert' : risk.level === '中' ? 'scan-search' : 'shield-check')}<span>机器审核建议</span></div><strong>${safe(risk.suggestion)}</strong><small>${safe(risk.level)}风险 · 仅供人工判断</small></section><section><h3>风险证据</h3><div class="content-evidence-tags">${hitLabels}</div>${post.protectedListId ? `<p>受保护名单：${safe(data.protectedLists?.find((item) => item.id === post.protectedListId)?.name || '已停用名单')}</p>` : ''}</section><section><h3>发布与办理信息</h3><dl><dt>发布方式</dt><dd>${post.author === '匿名用户' ? '匿名发布' : '实名发布'}</dd><dt>审核状态</dt><dd>${safe(contentReviewResult(post))}</dd><dt>发布状态</dt><dd>${safe(contentState(post))}</dd><dt>办理状态</dt><dd>${safe(post.handlingStatus || '不适用')}</dd><dt>审核队列</dt><dd>${safe(contentReviewQueue(post, data))}</dd></dl></section><section class="content-review-route"><h3>审核通过后的流向</h3><p>${safe(route)}</p></section></aside></div>`;
    const actions = pending && canAuditPost(post, data)
      ? button('驳回', 'post-decision-reject', post.id) + button(processPost(post) ? '审核通过，进入分办' : '审核通过', 'post-decision-approve', post.id, 'primary')
      : publicationActions(post) + button('关闭', 'close', '');
    return modal('信息内容审核 · ' + post.id, body, actions).replace('<section class="modal"', '<section class="modal content-review-detail-modal"');
  }
  function contentState(post) {
    return publicationStatus(post);
  }
  function contentRisk(post, data) {
    const hits = sensitiveWordHits(post, data);
    const levels = hits.map((term) => (data.sensitiveWords || []).find((word) => word.term === term)?.riskLevel || '中');
    const personal = post.risk === '个人信息' || hits.some((term) => /身份证|银行卡|密码|验证码|住址|通讯录|人事档案/.test(term));
    const protectedHit = Boolean(post.protectedListId);
    const level = protectedHit || personal || levels.includes('高') ? '高' : hits.length || post.risk === '需核验' || levels.includes('中') ? '中' : '低';
    const labels = [...new Set([protectedHit ? '受保护名单' : '', personal ? '疑似个人信息' : '', ...hits])].filter(Boolean);
    const suggestion = level === '高' ? '建议阻断' : level === '中' ? '建议人工核验' : '建议通过';
    return { hits, labels, level, suggestion };
  }
  function contentReviewQueue(post, data) {
    if (auditStatus(post) !== '待审核') return '已处理';
    return contentRisk(post, data).level === '高' ? '风险待审' : '待审核';
  }
  function contentReviewResult(post) {
    return auditStatus(post) === '已驳回' ? '驳回' : auditStatus(post);
  }
  function contentReviewDate(post) {
    const raw = String(post.time || '');
    const iso = raw.match(/(20\d{2})[-/]([01]?\d)[-/]([0-3]?\d)/);
    if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;
    const short = raw.match(/([01]?\d)月([0-3]?\d)日/);
    if (short) return `2026-${short[1].padStart(2, '0')}-${short[2].padStart(2, '0')}`;
    const slash = raw.match(/(?:^|\D)([01]?\d)\/([0-3]?\d)(?:\D|$)/);
    return slash ? `2026-${slash[1].padStart(2, '0')}-${slash[2].padStart(2, '0')}` : '';
  }
  function contentReviewSource(data) {
    const boards = ['建言献策', '心声诉求', '业务交流'];
    return data.posts.filter((post) => post.deleted !== true && boards.includes(post.board) && (state.role !== 'content' || post.board !== '业务交流'));
  }
  function contentReviewRows(data) {
    const query = contentReviewFilters.query.toLocaleLowerCase();
    return contentReviewSource(data).filter((post) => {
      const risk = contentRisk(post, data);
      const date = contentReviewDate(post);
      const haystack = `${post.id || ''} ${post.title || ''} ${post.author || ''} ${post.body || ''}`.toLocaleLowerCase();
      return contentReviewQueue(post, data) === contentReviewStatus
        && (!contentReviewTypes.length || contentReviewTypes.includes(post.board))
        && (!query || haystack.includes(query))
        && (!contentReviewFilters.risk || risk.level === contentReviewFilters.risk)
        && (!contentReviewFilters.contentState || contentState(post) === contentReviewFilters.contentState)
        && (!contentReviewFilters.dateFrom || date >= contentReviewFilters.dateFrom)
        && (!contentReviewFilters.dateTo || date <= contentReviewFilters.dateTo);
    });
  }
  function contentRiskCell(post, data) {
    const risk = contentRisk(post, data);
    const labels = risk.labels.length ? risk.labels.slice(0, 2).map((label) => `<span>${safe(label)}</span>`).join('') : '<span>未命中规则</span>';
    return `<div class="content-risk-cell">${riskBadge(risk.level)}<div>${labels}<small>${safe(risk.suggestion)}</small></div></div>`;
  }
  function contentReviewTable(data) {
    const rows = contentReviewRows(data);
    const pendingView = contentReviewStatus !== '已处理';
    const selectedCount = rows.filter((post) => contentReviewSelection.has(String(post.id))).length;
    const batch = pendingView ? `<div class="content-review-batch"><div><button class="btn btn-sm btn-secondary" data-action="content-review-select-all">${selectedCount === rows.length && rows.length ? '取消全选' : '全选当前结果'}</button><span>已选择 <strong>${selectedCount}</strong> 条</span></div><div>${button('批量驳回', 'content-review-batch-return', '')}${button('批量通过', 'content-review-batch-approve', '', 'primary')}</div></div>` : '';
    const tableRows = rows.map((post) => {
      const pending = auditStatus(post) === '待审核';
      const route = processPost(post) ? '通过后进入事项分办' : '通过后进入待发布';
      const actions = [button(pending ? '审核' : '详情', 'content-review-detail', post.id, pending ? 'primary' : 'secondary')];
      if (!pending) actions.push(publicationActions(post));
      if (!pending && canManageLedger()) actions.push(button('删除', 'ledger-post-delete', post.id));
      return `<tr class="${contentReviewSelection.has(String(post.id)) ? 'is-selected' : ''}">${pendingView ? `<td class="content-review-select"><input type="checkbox" aria-label="选择 ${safe(post.title)}" data-action="content-review-check" data-id="${safe(post.id)}" ${contentReviewSelection.has(String(post.id)) ? 'checked' : ''}></td>` : ''}<td><strong>${safe(post.title)}</strong><div class="td-sub">${safe(post.id)} · ${safe(post.body || '').slice(0, 42)}${String(post.body || '').length > 42 ? '…' : ''}</div></td><td>${badgeFor(post.board)}</td><td><strong>${safe(post.author || '匿名用户')}</strong></td><td>${contentRiskCell(post, data)}</td><td>${badgeFor(contentReviewResult(post))}</td><td>${badgeFor(contentState(post))}</td><td>${badgeFor(post.handlingStatus || '不适用')}</td><td>${safe(post.time || '未记录')}</td><td><strong class="content-route">${safe(route)}</strong></td><td><div class="row-actions">${actions.join('')}</div></td></tr>`;
    });
    const columns = [...(pendingView ? [''] : []), '信息内容', '内容分类', '发布人', '风险提示', '审核状态', '发布状态', '办理状态', '提交时间', '后续流向', '操作'];
    return batch + `<div class="table-wrap content-review-table"><table class="data-table"><thead><tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr></thead><tbody>${tableRows.join('') || `<tr><td colspan="${columns.length}" class="empty">暂无符合条件的审核记录</td></tr>`}</tbody></table></div>`;
  }
  function contentReview() {
    const data = db();
    const source = contentReviewSource(data);
    const visibleBoards = state.role === 'content' ? ['建言献策', '心声诉求'] : ['建言献策', '心声诉求', '业务交流'];
    contentReviewTypes = contentReviewTypes.filter((board) => visibleBoards.includes(board));
    const counts = (status) => source.filter((post) => contentReviewQueue(post, data) === status).length;
    const highRisk = source.filter((post) => ['待审核', '风险待审'].includes(contentReviewQueue(post, data)) && contentRisk(post, data).level === '高').length;
    const statusTabs = [['待审核', '待审核', counts('待审核')], ['风险待审', '风险待审', counts('风险待审')], ['已处理', '已处理', counts('已处理')]];
    const typeSummary = !contentReviewTypes.length ? '全部类型' : contentReviewTypes.length === 1 ? contentReviewTypes[0] : `已选 ${contentReviewTypes.length} 项`;
    const typeOptions = visibleBoards.map((board) => `<label><input type="checkbox" value="${safe(board)}" aria-label="${safe(board)}" data-content-review-type ${contentReviewTypes.includes(board) ? 'checked' : ''} onchange="ManagementWorkflow.updateContentReviewTypeSummary()"><span>${safe(board)}</span><small>${source.filter((post) => post.board === board && contentReviewQueue(post, data) === contentReviewStatus).length}</small></label>`).join('');
    const typeSelect = `<div class="content-review-filter-field"><span>内容分类</span><div class="content-review-type-select"><details><summary><span id="wf-content-review-type-summary">${safe(typeSummary)}</span>${icon('chevron-down')}</summary><div class="content-review-type-menu" id="wf-content-review-types">${typeOptions}<div class="content-review-type-menu-foot"><span>支持多选</span><button type="button" onclick="ManagementWorkflow.clearContentReviewTypes()">重置</button></div></div></details></div></div>`;
    const summary = `<div class="content-review-summary"><button data-action="content-review-status-tab" data-id="待审核"><span>待审核</span><strong>${counts('待审核')}</strong><small>普通人工审核队列</small></button><button data-action="content-review-status-tab" data-id="风险待审"><span>风险待审</span><strong>${counts('风险待审')}</strong><small>系统预警，需人工逐条审核</small></button><button data-action="content-review-status-tab" data-id="已处理"><span>已处理</span><strong>${counts('已处理')}</strong><small>可追溯审核记录</small></button><div class="risk"><span>系统风险预警</span><strong>${highRisk}</strong><small>敏感词、疑似个人信息及保护名单规则</small></div></div>`;
    const filters = `<div class="content-review-filters"><label>关键词<input class="input" id="wf-content-review-query" value="${safe(contentReviewFilters.query)}" placeholder="标题、编号、发布人或正文"></label>${typeSelect}<label>风险等级<select class="select" id="wf-content-review-risk"><option value="">全部风险</option>${['高', '中', '低'].map((level) => `<option value="${level}" ${contentReviewFilters.risk === level ? 'selected' : ''}>${level}风险</option>`).join('')}</select></label><label>发布状态<select class="select" id="wf-content-review-state"><option value="">全部状态</option>${['已发布', '未发布', '私密发布'].map((value) => `<option ${contentReviewFilters.contentState === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label>提交时间<div class="review-date-range"><input class="input" id="wf-content-review-from" type="date" value="${safe(contentReviewFilters.dateFrom)}"><em>至</em><input class="input" id="wf-content-review-to" type="date" value="${safe(contentReviewFilters.dateTo)}"></div></label><div class="content-review-filter-actions">${button('重置', 'content-review-reset', '')}<button class="btn btn-sm btn-primary" type="button" onclick="ManagementWorkflow.contentReviewSearch()">${icon('search')}查询</button></div></div>`;
    return heading('信息内容审核', '先判断内容是否符合发布规范，审核通过后再独立决定公开、私密发布或暂不发布。系统规则只提供风险预警，最终结果由审核人员判断。', `<span class="badge red">待处理 ${counts('待审核') + counts('风险待审')}</span>`) + summary + `<section class="content-review-workspace"><div class="content-review-level queue"><span>审核队列</span>${contentTabs(statusTabs, contentReviewStatus, 'content-review-status-tab', '审核状态', 'queue')}</div>${filters}<div class="content-review-rule-note">${icon('shield-check')}<span>系统根据敏感词、疑似个人信息和受保护名单等规则生成预警；预警不是审核结论，由审核人员逐条核验并做最终决定。</span></div>${contentReviewTable(data)}</section>`;
  }
  function assignment() {
    const data = db();
    const pendingSource = data.affairs.filter((affair) => affair.status === '待分办');
    const query = assignmentFilters.query.toLocaleLowerCase();
    const candidates = pendingSource.filter((affair) => {
      const post = data.posts.find((item) => String(item.id) === String(affair.postId));
      const created = contentReviewDate({ time: affair.createdAt || affair.reviewedAt || '' });
      return (!query || `${affair.id} ${affair.title} ${post?.author || ''}`.toLocaleLowerCase().includes(query))
        && (!assignmentFilters.type || post?.board === assignmentFilters.type)
        && (!assignmentFilters.priority || affair.priority === assignmentFilters.priority)
        && (!assignmentFilters.createdFrom || created >= assignmentFilters.createdFrom)
        && (!assignmentFilters.createdTo || created <= assignmentFilters.createdTo);
    });
    const assigned = data.affairs.filter((affair) => !['待分办', '待复核', '已反馈', '已办结'].includes(affair.status));
    const answerReviews = data.affairs.filter((affair) => affair.status === '待复核');
    const affairType = (affair, post) => post?.board || affair.sourceType || (/^SX-MOCK-(\d+)$/.test(affair.id) ? (Number(affair.id.match(/(\d+)$/)?.[1]) % 2 ? '建言献策' : '心声诉求') : '未记录');
    const closedSource = data.affairs.filter((affair) => {
      const post = data.posts.find((item) => String(item.id) === String(affair.postId));
      return ['已反馈', '已办结'].includes(affair.status) && ['建言献策', '心声诉求'].includes(affairType(affair, post));
    });
    const closedTime = (affair) => affair.closedAt || affair.repliedAt || [...(affair.events || [])].reverse().find((event) => /办结|审核通过|已反馈/.test(event.text || ''))?.at || affair.deadline || '';
    const closedItems = closedSource.filter((affair) => {
      const post = data.posts.find((item) => String(item.id) === String(affair.postId));
      const closedDate = contentReviewDate({ time: closedTime(affair) });
      const keyword = `${affair.id} ${affair.title} ${affair.owner || ''} ${affair.assigneeName || affair.assigneeId || ''}`.toLocaleLowerCase();
      return (!assignmentClosedFilters.query || keyword.includes(assignmentClosedFilters.query.toLocaleLowerCase()))
        && (!assignmentClosedFilters.type || affairType(affair, post) === assignmentClosedFilters.type)
        && (!assignmentClosedFilters.owner || affair.owner === assignmentClosedFilters.owner)
        && (!assignmentClosedFilters.assignee || (affair.assigneeName || affair.assigneeId) === assignmentClosedFilters.assignee)
        && (!assignmentClosedFilters.feedback || affair.feedback === assignmentClosedFilters.feedback)
        && (!assignmentClosedFilters.closedFrom || closedDate >= assignmentClosedFilters.closedFrom)
        && (!assignmentClosedFilters.closedTo || closedDate <= assignmentClosedFilters.closedTo);
    });
    const overdue = data.affairs.filter((affair) => deadlineFlag(affair) === '逾期').length;
    const returned = data.affairs.filter((affair) => affair.returnReason && affair.status === '办理中').length;
    const tabs = contentTabs([
      ['待分办', '待分办', pendingSource.length],
      ['已分办', '已分办', assigned.length],
      ['答复审核', '答复审核', answerReviews.length],
      ['已办结', '已办结', closedSource.length]
    ], assignmentTab, 'assignment-tab', '事项分办');
    const summary = `<div class="assignment-summary">${[
      ['待分办', pendingSource.length, 'inbox'], ['办理中', data.affairs.filter((item) => item.status === '办理中').length, 'briefcase-business'], ['待答复审核', answerReviews.length, 'file-check-2'], ['逾期', overdue, 'circle-alert'], ['退回修改', returned, 'undo-2']
    ].map(([label, value, name]) => `<div><span>${icon(name)}${label}</span><strong>${value}</strong></div>`).join('')}</div>`;
    const filters = `<form class="assignment-filters" onsubmit="event.preventDefault();ManagementWorkflow.assignmentSearch()"><label><span>关键词</span><input class="input" id="wf-assignment-query" value="${safe(assignmentFilters.query)}" placeholder="事项编号、名称或发布人"></label><label><span>事项类型</span><select class="select" id="wf-assignment-type"><option value="">全部类型</option>${['建言献策', '心声诉求'].map((value) => `<option ${assignmentFilters.type === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>优先级</span><select class="select" id="wf-assignment-priority"><option value="">全部优先级</option>${['一般', '重点', '紧急'].map((value) => `<option ${assignmentFilters.priority === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>生成时间</span><div class="review-date-range"><input class="input" id="wf-assignment-from" type="date" value="${safe(assignmentFilters.createdFrom)}"><em>至</em><input class="input" id="wf-assignment-to" type="date" value="${safe(assignmentFilters.createdTo)}"></div></label><div class="assignment-filter-actions">${button('重置', 'assignment-reset', '')}<button class="btn btn-sm btn-primary" type="submit">${icon('search')}查询</button></div></form>`;
    const owners = [...new Set(closedSource.map((affair) => affair.owner).filter(Boolean))];
    const assignees = [...new Set(closedSource.map((affair) => affair.assigneeName || affair.assigneeId).filter(Boolean))];
    const closedFilters = `<form class="assignment-filters assignment-closed-filters" onsubmit="event.preventDefault();ManagementWorkflow.assignmentClosedSearch()"><label><span>关键词</span><input class="input" id="wf-assignment-closed-query" value="${safe(assignmentClosedFilters.query)}" placeholder="事项编号或名称"></label><label><span>事项类型</span><select class="select" id="wf-assignment-closed-type"><option value="">全部类型</option>${['建言献策', '心声诉求'].map((value) => `<option ${assignmentClosedFilters.type === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>承办部门</span><select class="select" id="wf-assignment-closed-owner"><option value="">全部部门</option>${owners.map((value) => `<option ${assignmentClosedFilters.owner === value ? 'selected' : ''}>${safe(value)}</option>`).join('')}</select></label><label><span>办理人</span><select class="select" id="wf-assignment-closed-assignee"><option value="">全部人员</option>${assignees.map((value) => `<option ${assignmentClosedFilters.assignee === value ? 'selected' : ''}>${safe(value)}</option>`).join('')}</select></label><label><span>答复方式</span><select class="select" id="wf-assignment-closed-feedback"><option value="">全部方式</option>${['公开答复', '私密回复'].map((value) => `<option ${assignmentClosedFilters.feedback === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label><span>办结时间</span><div class="review-date-range"><input class="input" id="wf-assignment-closed-from" type="date" value="${safe(assignmentClosedFilters.closedFrom)}"><em>至</em><input class="input" id="wf-assignment-closed-to" type="date" value="${safe(assignmentClosedFilters.closedTo)}"></div></label><div class="assignment-filter-actions">${button('重置', 'assignment-closed-reset', '')}<button class="btn btn-sm btn-primary" type="submit">${icon('search')}查询</button></div></form>`;
    const pendingTable = `<div class="section-title"><h2>待分办事项</h2><span class="badge">${candidates.length} 项</span></div>` + list(['事项编号 / 名称', '事项类型', '发布方式', '审核通过时间', '优先级', '待分办时长', '操作'], candidates.map((affair) => { const post = data.posts.find((item) => String(item.id) === String(affair.postId)); const created = contentReviewDate({ time: affair.createdAt || affair.reviewedAt || '' }); const days = created ? Math.max(0, Math.floor((new Date(`${today()}T12:00:00`) - new Date(`${created}T12:00:00`)) / 86400000)) : 0; return `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)} · 来源内容 ${safe(post?.id)}</div></td><td>${badgeFor(post?.board || affair.sourceType || '未记录')}</td><td>${badgeFor(affair.publicationMode || publicationStatus(post))}</td><td>${safe(affair.reviewedAt || affair.createdAt || '未记录')}</td><td>${badgeFor(affair.priority || '一般')}</td><td><strong class="assignment-wait ${days >= 2 ? 'is-urgent' : ''}">${days ? `${days} 天` : '当天'}</strong></td><td>${canFlowRole(flowForAffair(affair, data), 'assignmentRole', 'dispatch') ? button('查看并分办', 'assign-form', affair.id, 'primary') : '仅可查看'}</td></tr>`; }));
    const assignedTable = `<div class="section-title"><h2>已分办事项</h2><span class="badge">${assigned.length} 项</span></div>` + affairsTable(assigned);
    const reviewTable = `<div class="section-title"><h2>待答复审核</h2><span class="badge">${answerReviews.length} 项</span></div>` + list(['事项 / 编号', '承办部门', '答复摘要', '当前状态', '操作'], answerReviews.map((affair) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td><td>${safe(affair.owner)}<div class="td-sub">${safe(affair.assigneeName || affair.assigneeId || '未指定')}</div></td><td><div class="td-sub answer-preview">${safe(affair.draft || '承办人已提交答复，等待审核')}</div></td><td>${badgeFor('待答复审核')}</td><td>${button('审核答复', 'affair-detail', affair.id, 'primary')}</td></tr>`));
    const closedTable = `<div class="section-title"><h2>已办结事项</h2><span class="badge">${closedItems.length} 项</span></div>` + list(['事项 / 编号', '事项类型', '承办部门 / 办理人', '答复方式', '办结时间', '操作'], closedItems.map((affair) => { const post = data.posts.find((item) => String(item.id) === String(affair.postId)); return `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td><td>${badgeFor(affairType(affair, post))}</td><td>${safe(affair.owner || '未记录')}<div class="td-sub">${safe(affair.assigneeName || affair.assigneeId || '未记录')}</div></td><td>${badgeFor(affair.feedback || '未记录')}</td><td>${safe(closedTime(affair) || '未记录')}</td><td>${button('查看详情', 'affair-detail', affair.id)}</td></tr>`; }));
    const body = assignmentTab === '已分办' ? assignedTable : assignmentTab === '答复审核' ? reviewTable : assignmentTab === '已办结' ? closedTable : pendingTable;
    const activeFilters = assignmentTab === '待分办' ? filters : assignmentTab === '已办结' ? closedFilters : '';
    return heading('事项分办', '内容审核通过后自动成单；分办人只负责明确责任、时限和办理要求。') + summary + tabs + activeFilters + body;
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
      const assignee = affair.assigneeName || affair.assigneeId || '待分办';
      const actions = affair.status === '办理中' ? button('办理', 'affair-detail', affair.id, 'primary') : button('查看', 'affair-detail', affair.id);
      const assignedAt = affair.assignedAt || affair.events?.[0]?.at || '待分办';
      return `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)}</div></td><td>${badgeFor(handlerBusinessType(source))}</td><td>${badgeFor(handlerStatusLabel(affair))}</td><td><strong>${safe(deadlineText(affair))}</strong><div class="td-sub">截止 ${safe(affair.deadline)}</div></td><td>${safe(assignedAt)}</td><td>${safe(assignee)}</td><td><div class="row-actions">${actions}</div></td></tr>`;
    }));
  }
  function handlerBoard() {
    const data = db(), items = handlerItems(data);
    const open = items.filter((affair) => affair.status === '办理中');
    const closed = items.filter((affair) => affair.status === '已办结').length;
    const alerts = items.filter((affair) => deadlineFlag(affair) || affair.returnReason);
    const metrics = [['待办事项', items.filter((a) => !['已办结', '已反馈'].includes(a.status)).length], ['临期事项', items.filter((a) => deadlineFlag(a) === '临期').length], ['催办事项', items.filter((a) => a.courted || a.stage === '等待协同反馈').length], ['退回事项', items.filter((a) => a.returnReason).length], ['已办结', closed]];
    const recent = items.flatMap((affair) => (affair.events || []).slice(-2).map((event) => ({ affair, event }))).slice(-6).reverse();
    const boards = ['建言献策', '心声诉求'];
    const quickFilters = `<div class="handler-filters"><label class="handler-filter handler-query"><span>搜索事项</span><input class="input" id="wf-handler-query" placeholder="事项编号或标题" value="${safe(handlerFilters.query)}"></label><label class="handler-filter"><span>业务类型</span><select class="select" id="wf-handler-type"><option value="">全部</option>${boards.map((v) => `<option ${handlerFilters.type === v ? 'selected' : ''}>${safe(v)}</option>`).join('')}</select></label><label class="handler-filter"><span>时限状态</span><select class="select" id="wf-handler-deadline"><option value="">全部</option>${['正常', '临期', '逾期'].map((v) => `<option ${handlerFilters.deadline === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><div class="handler-filter-actions"><button class="btn btn-primary" onclick="ManagementWorkflow.handlerSearch()">筛选</button><button class="btn btn-secondary" data-action="handler-reset">重置</button></div></div>`;
    const tabStatus = { 待处理: ['待处理'], 办理中: ['办理中'], 临期: ['临期'], 已催办: ['已催办'], 退回: ['退回修改'] };
    const tabs = `<div class="tabs" style="margin:16px 0">${Object.keys(tabStatus).map((tab) => `<button class="btn btn-sm ${workbenchTab === tab ? 'btn-primary' : 'btn-ghost'}" data-action="workbench-tab" data-id="${tab}">${tab}</button>`).join('')}</div>`;
    const filtered = items.filter((affair) => { const source = data.posts.find((post) => post.id === affair.postId); const statusMatch = workbenchTab === '待处理' ? handlerStatusLabel(affair) === '待处理' : workbenchTab === '临期' ? deadlineFlag(affair) === '临期' : workbenchTab === '已催办' ? affair.courted || affair.stage === '等待协同反馈' : workbenchTab === '退回' ? !!affair.returnReason : tabStatus[workbenchTab]?.includes(affair.status) && handlerStatusLabel(affair) !== '待处理'; return statusMatch && (!handlerFilters.query || `${affair.id} ${affair.title}`.toLowerCase().includes(handlerFilters.query.toLowerCase())) && (!handlerFilters.type || handlerBusinessType(source) === handlerFilters.type) && (!handlerFilters.deadline || (handlerFilters.deadline === '正常' ? !deadlineFlag(affair) : deadlineFlag(affair) === handlerFilters.deadline)); });
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
      return (!handlerFilters.query || `${affair.id} ${affair.title} ${affair.owner}`.toLowerCase().includes(handlerFilters.query.toLowerCase())) && (!handlerFilters.status || statusLabel(affair).startsWith(handlerFilters.status)) && (!handlerFilters.priority || affair.priority === handlerFilters.priority) && (!handlerFilters.deadline || (handlerFilters.deadline === '正常' ? !deadlineFlag(affair) : deadlineFlag(affair) === handlerFilters.deadline)) && (!handlerFilters.type || handlerBusinessType(source) === handlerFilters.type) && (!handlerFilters.deadlineFrom || affair.deadline >= handlerFilters.deadlineFrom) && (!handlerFilters.deadlineTo || affair.deadline <= handlerFilters.deadlineTo);
    });
    return heading('我的待办', state.role === 'handler' ? '按状态、优先级、时限和业务类型查询本部门承办事项。' : '按部门与事项条件查询承办待办。', `<span class="badge">共 ${visible.length} 项</span>`) +
      `<form class="handler-filters" onsubmit="event.preventDefault();ManagementWorkflow.handlerSearch()"><label class="handler-filter handler-query"><span>事项编号 / 标题</span><input class="input" id="wf-handler-query" placeholder="输入事项编号或关键词" value="${safe(handlerFilters.query)}"></label>${filter('status', '办理状态', ['待分办', '办理中', '待答复审核', '已办结'])}${filter('priority', '优先级', ['一般', '重点', '紧急'])}${filter('deadline', '办理时限', ['正常', '临期', '逾期'])}${filter('type', '业务类型', boards)}<label class="handler-filter"><span>截止时间起</span><input class="input" id="wf-handler-deadlineFrom" type="date" value="${safe(handlerFilters.deadlineFrom)}"></label><label class="handler-filter"><span>截止时间止</span><input class="input" id="wf-handler-deadlineTo" type="date" value="${safe(handlerFilters.deadlineTo)}"></label><div class="handler-filter-actions"><button type="button" class="btn btn-secondary" data-action="handler-reset">重置</button><button type="submit" class="btn btn-primary">查询</button></div></form>` + handlerTable(data, visible);
  }
  function handlerHandling() { const data = db(); const items = handlerItems(data).filter((affair) => { const source = data.posts.find((post) => post.id === affair.postId); return !handlingType || source?.board === handlingType; }); return heading('事项办理', '按建言献策和心声诉求分类查看办理事项。') + `<div class="tabs" style="margin-bottom:16px"><button class="btn btn-sm ${!handlingType ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="">全部事项</button><button class="btn btn-sm ${handlingType === '建言献策' ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="建言献策">建言献策</button><button class="btn btn-sm ${handlingType === '心声诉求' ? 'btn-primary' : 'btn-ghost'}" data-action="handler-type-tab" data-id="心声诉求">心声诉求</button></div>` + handlerTable(data, items); }
  function handlerDrafts() {
    const data = db(), items = handlerItems(data).filter((affair) => ['办理中', '待复核'].includes(affair.status));
    return heading('答复草稿', '保存正式答复草稿，退回后修改并重新提交审核。') + list(['事项', '草稿 / 退回意见', '状态', '操作'], items.map((affair) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)} · ${safe(affair.owner)}</div></td><td>${safe(affair.draft || '尚未保存草稿')}${affair.returnReason ? `<div class="td-sub handler-return">退回意见：${safe(affair.returnReason)}</div>` : ''}</td><td>${badgeFor(statusLabel(affair))}</td><td>${button(affair.status === '办理中' ? '编辑答复' : '查看审核', 'affair-detail', affair.id)}</td></tr>`));
  }
  function handlerReminders() {
    const data = db(), rows = [];
    for (const affair of handlerItems(data)) {
      if (affair.status === '办理中' && affair.returnReason) rows.push([affair, '退回修改', affair.returnReason]);
      if (affair.extension?.status === '待审批') rows.push([affair, '延期待审批', `拟延期至 ${affair.extension.deadline}`]);
      if (affair.stage === '等待协同反馈' && affair.status === '办理中') rows.push([affair, '协同反馈', affair.co || '协办部门']);
      if (deadlineFlag(affair)) rows.push([affair, deadlineFlag(affair), `办理期限 ${affair.deadline}`]);
    }
    return heading('催办提醒', '汇总临期、逾期、退回修改及协同反馈事项。', `<span class="badge gold">${rows.length} 条提醒</span>`) + list(['事项', '提醒类型', '提醒内容', '操作'], rows.map(([affair, type, detail]) => `<tr><td><strong>${safe(affair.title)}</strong><div class="td-sub">${safe(affair.id)} · ${safe(affair.owner)}</div></td><td>${badgeFor(type)}</td><td>${safe(detail)}</td><td>${button('查看办理', 'affair-detail', affair.id)}</td></tr>`));
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
    const metrics = [['承办事项', items.length], ['转办事项', items.filter((affair) => affair.transfer).length], ['办结量', closed.length], ['办结率', items.length ? `${Math.round(closed.length / items.length * 100)}%` : '0%'], ['平均办理时长', elapsed.length ? `${(elapsed.reduce((sum, days) => sum + days, 0) / elapsed.length).toFixed(1)} 天` : '未统计'], ['逾期事项', items.filter((affair) => deadlineFlag(affair) === '逾期').length]];
    return heading('部门统计', state.role === 'handler' ? `${safe(handlerDepartment(data) || '未配置部门')} · 本部门办理情况` : '各部门承办事项汇总；承办角色仅查看所属部门。') + `<div class="grid handler-metrics">${metrics.map(([label, value]) => `<div class="card stat"><span class="stat-label">${label}</span><strong class="stat-value">${value}</strong></div>`).join('')}</div><div class="section-title"><h2>办理状态</h2></div>` + list(['状态', '数量', '事项编号'], ['待分办', '办理中', '待答复审核', '已办结'].map((status) => { const matches = items.filter((affair) => statusLabel(affair).startsWith(status)); return `<tr><td>${badgeFor(status)}</td><td>${matches.length}</td><td>${safe(matches.map((affair) => affair.id).join('、') || '暂无')}</td></tr>`; }));
  }
  function handlerClosure() {
    if (!['platform', 'dispatch'].includes(state.role)) return heading('公开与归档', '当前角色无权执行公开与归档。');
    const data = db(), items = data.affairs.filter((affair) => ['已反馈', '已办结'].includes(affair.status));
    return heading('公开与归档', '管理已审核答复的公开反馈与事项归档，查看办结结果和完整流转记录。') + handlerTable(data, items);
  }
  function handlerMessages() {
    const data = db(), affairs = handlerItems(data);
    const typeFor = (affair) => affair.returnReason ? '退回通知' : deadlineFlag(affair) === '逾期' ? '逾期提醒' : deadlineFlag(affair) === '临期' ? '催办提醒' : affair.status === '待复核' ? '审核通知' : ['已反馈', '已办结'].includes(affair.status) ? '公开通知' : '任务通知';
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
    const data = db();
    const boards = data.boards.slice().sort((a, b) => a.sort - b.sort);
    return heading('栏目管理', '管理职工发帖的分类；停用后不再允许新发帖，历史内容仍可查看。', button('新增栏目', 'board-new', '', 'primary')) +
      `<div class="board-rule-note">${icon('info')}<span>栏目规则同步影响职工端发帖、内容审核和事项分办；系统栏目不允许删除。</span></div><div class="board-management-table">${list(['栏目信息', '栏目类型', '发布主体', '内容规则', '关联内容', '排序', '状态', '操作'], boards.map((board) => { const postCount = data.posts.filter((post) => post.board === board.name && !post.deleted).length; const contentCount = board.type === '成果发布类' ? (data.echoPublications || []).filter((item) => item.status === '已发布').length : postCount; const flowCount = (data.flowConfigs || []).filter((flow) => flow.board === board.name).length; return `<tr><td><div class="board-name-cell"><strong>${safe(board.name)}${board.system ? '<span>系统</span>' : ''}</strong><small>${safe(board.description || '暂无栏目说明')}</small></div></td><td>${badgeFor(board.type || '内容交流类')}</td><td><strong>${safe(board.publisher || (board.staffPost ? '职工' : '管理员'))}</strong><div class="td-sub">${board.allowComments ? '允许评论' : '关闭评论'}</div></td><td><span class="board-rule-text">${safe(board.reviewRule || '人工审核')}</span><div class="td-sub">${board.generatesAffair ? '审核后生成办理事项' : '不生成办理事项'}</div></td><td><strong>${contentCount} 条内容</strong><div class="td-sub">${flowCount ? `关联 ${flowCount} 套流程` : '未关联流程'}</div></td><td>${safe(board.sort)}</td><td>${badgeFor(board.enabled ? '已启用' : '已停用')}</td><td><div class="row-actions">${button('编辑', 'board-edit', board.id)}${button(board.enabled ? '停用' : '启用', 'board-toggle', board.id)}${button('删除', 'board-delete', board.id)}</div></td></tr>`; }))}</div>`;
  }
  function sensitive() {
    const rules = db().sensitiveWords;
    const visible = rules.filter((rule) => {
      const status = rule.enabled ? '已启用' : '已停用';
      return (!sensitiveFilters.query || rule.term.toLocaleLowerCase().includes(sensitiveFilters.query.toLocaleLowerCase()))
        && (!sensitiveFilters.category || rule.category === sensitiveFilters.category)
        && (!sensitiveFilters.riskLevel || rule.riskLevel === sensitiveFilters.riskLevel)
        && (!sensitiveFilters.scope || rule.scope === sensitiveFilters.scope)
        && (!sensitiveFilters.status || status === sensitiveFilters.status);
    });
    const filters = `<form class="sensitive-filters" onsubmit="event.preventDefault();ManagementWorkflow.sensitiveSearch()"><label><span>关键词</span><input class="input" id="wf-word-query" placeholder="输入敏感词" value="${safe(sensitiveFilters.query)}"></label><label><span>词语分类</span><select class="select" id="wf-word-category"><option value="">全部分类</option>${sensitiveCategories.map((item) => `<option ${sensitiveFilters.category === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label><span>风险等级</span><select class="select" id="wf-word-risk"><option value="">全部等级</option>${['高', '中', '低'].map((item) => `<option ${sensitiveFilters.riskLevel === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label><span>适用范围</span><select class="select" id="wf-word-scope"><option value="">全部范围</option>${['全部', '发帖', '评论'].map((item) => `<option ${sensitiveFilters.scope === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><label><span>状态</span><select class="select" id="wf-word-status"><option value="">全部状态</option>${['已启用', '已停用'].map((item) => `<option ${sensitiveFilters.status === item ? 'selected' : ''}>${item}</option>`).join('')}</select></label><div class="sensitive-filter-actions"><button type="button" class="btn btn-secondary" data-action="word-reset">重置</button><button class="btn btn-primary" type="submit">查询</button></div></form>`;
    return heading('敏感词库', '按风险等级管理发帖和评论规则，高风险禁止提交，中低风险进入人工审核。', button('批量导入', 'word-import', '') + button('新增敏感词', 'word-new', '', 'primary')) +
      `<div class="notice">${icon('shield-alert')}<div><strong>分级处置规则</strong><p>高风险：禁止提交；中风险：进入优先审核；低风险：进入普通审核。包含匹配允许词组出现在句中，完整词匹配要求前后为边界、空白或标点。</p></div></div>${filters}` +
      `<div class="sensitive-result-head"><strong>敏感词规则</strong><span>共 ${visible.length} 条</span></div><div class="sensitive-table">${list(['敏感词', '分类', '风险等级', '处置方式', '命中规则', '适用范围', '命中次数', '状态', '操作'], visible.map((rule) => `<tr><td><strong>${safe(rule.term)}</strong></td><td>${safe(rule.category || '其他')}</td><td>${riskBadge(rule.riskLevel || '中')}</td><td><span class="policy-text">${riskPolicy(rule.riskLevel || '中')}</span></td><td>${safe(rule.matchRule || '包含匹配')}</td><td>${safe(rule.scope)}</td><td>${Number.isFinite(rule.hitCount) ? rule.hitCount : 0}</td><td>${badgeFor(rule.enabled ? '已启用' : '已停用')}</td><td><div class="row-actions">${button('编辑', 'word-edit', rule.id)}${button(rule.enabled ? '停用' : '启用', 'word-toggle', rule.id)}${button('删除', 'word-delete', rule.id)}</div></td></tr>`))}</div>`;
  }
  function users() {
    const accounts = db().accounts || [];
    return heading('用户管理', '查看用户所属组织和账户状态；新注册申请在“审核管理 → 用户审核”处理。', button('前往用户审核', 'nav', 'user-review')) +
      list(['用户', '所属组织', '账户状态'], accounts.map((a) => `<tr><td><strong>${safe(a.name)}</strong><div class="td-sub">${safe(a.phone.slice(0,3))}****${safe(a.phone.slice(-4))}</div></td><td>${safe(a.department)}</td><td>${badgeFor(a.status === 'pending' ? '待审核' : a.status === 'approved' ? '已通过' : '已驳回')}</td></tr>`));
  }
  function userReviews() {
    if (state.role !== 'platform') return heading('用户审核', '当前角色无权查看注册申请。');
    const data = db(), accounts = data.accounts || [];
    const statuses = [['pending', '待审核'], ['approved', '已通过'], ['rejected', '已驳回']];
    const selected = statuses.some(([value]) => value === state.userReviewTab) ? state.userReviewTab : 'pending';
    const departments = [...new Set(accounts.map((item) => item.department).filter(Boolean))];
    const visible = accounts.filter((a) => { const submitted = a.submitted || a.createdAt || ''; const queryText = `${a.id} ${a.name} ${a.phone} ${a.department}`.toLocaleLowerCase(); return a.status === selected && (!userReviewFilters.query || queryText.includes(userReviewFilters.query.toLocaleLowerCase())) && (!userReviewFilters.department || a.department === userReviewFilters.department) && (!userReviewFilters.dateFrom || submitted >= userReviewFilters.dateFrom) && (!userReviewFilters.dateTo || submitted <= userReviewFilters.dateTo + ' 23:59'); });
    const summary = `<div class="user-review-summary"><div><span>待审核</span><strong>${accounts.filter((a) => a.status === 'pending').length}</strong><small>需及时处理</small></div><div><span>今日申请</span><strong>${accounts.filter((a) => (a.submitted || a.createdAt || '').startsWith(today())).length}</strong><small>新增注册申请</small></div><div><span>已通过</span><strong>${accounts.filter((a) => a.status === 'approved').length}</strong><small>已开通账号</small></div><div><span>已驳回</span><strong>${accounts.filter((a) => a.status === 'rejected').length}</strong><small>可查看驳回原因</small></div></div>`;
    const filters = `<form class="user-review-filters" onsubmit="event.preventDefault();ManagementWorkflow.userReviewSearch()"><label><span>关键词</span><input class="input" id="wf-user-review-query" value="${safe(userReviewFilters.query)}" placeholder="姓名、手机号或申请编号"></label><label><span>申请部门</span><select class="select" id="wf-user-review-department"><option value="">全部部门</option>${departments.map((item) => `<option ${userReviewFilters.department === item ? 'selected' : ''}>${safe(item)}</option>`).join('')}</select></label><label><span>申请时间</span><div class="review-date-range"><input class="input" id="wf-user-review-from" type="date" value="${safe(userReviewFilters.dateFrom)}"><em>至</em><input class="input" id="wf-user-review-to" type="date" value="${safe(userReviewFilters.dateTo)}"></div></label><div class="user-review-filter-actions">${button('重置', 'user-review-reset', '')}<button class="btn btn-sm btn-primary" type="submit">查询</button></div></form>`;
    return heading('用户审核', '核验职工注册申请；审核结果同步至职工端的申请状态查询。', `<span class="badge red">待审核 ${accounts.filter((a) => a.status === 'pending').length}</span>`) +
      summary + filters +
      `<div class="review-status-tabs" role="tablist" aria-label="用户审核状态">${statuses.map(([value, label]) => `<button type="button" role="tab" aria-selected="${selected === value}" class="review-status-tab ${selected === value ? 'active' : ''}" data-action="user-review-tab" data-id="${value}">${label}<span>${accounts.filter((a) => a.status === value).length}</span></button>`).join('')}</div>` +
      `<div class="user-review-result"><div class="sensitive-result-head"><strong>申请记录</strong><span>当前条件共 ${visible.length} 条</span></div>${list(['申请编号', '申请人', '联系方式', '申请部门', '申请时间', '审核状态', '操作'], visible.map((a) => `<tr><td><strong>${safe(applicationNo(a))}</strong></td><td><strong>${safe(a.name)}</strong></td><td>${safe(a.phone.slice(0, 3))}****${safe(a.phone.slice(-4))}</td><td>${safe(a.department || '未填写')}</td><td>${safe(a.submitted || a.createdAt || '未记录')}<div class="td-sub">${a.status === 'pending' ? '等待审核' : `处理于 ${safe(a.reviewedAt || '未记录')}`}</div></td><td>${badgeFor(selected === 'pending' ? '待审核' : selected === 'approved' ? '已通过' : '已驳回')}</td><td>${button(selected === 'pending' ? '审核申请' : '查看详情', 'account-review', a.id, selected === 'pending' ? 'primary' : 'secondary')}</td></tr>`))}</div>`;
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
      `<div class="section-title"><h2>事项状态分布</h2></div>` + list(['状态', '数量', '事项'], ['待分办', '办理中', '待答复审核', '已办结'].map((status) => { const matches = items.filter((item) => statusLabel(item).startsWith(status)); return `<tr><td>${badgeFor(status)}</td><td>${matches.length}</td><td>${safe(matches.map((item) => item.id).join('、') || '暂无')}</td></tr>`; }));
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
      if (!target || !config || auditStatus(target) !== '待审核') return '';
      const required = decision !== 'approve' || contentRisk(target, data).level === '高';
      const prompt = required ? '处置意见（必填）' : '处置意见（选填）';
      const title = processPost(target) && decision === 'approve' ? '审核通过并进入事项分办' : decision === 'approve' ? '审核通过' : config[0];
      const hits = sensitiveWordHits(target, data);
      const reviewContext = publicationStatus(target) === '私密发布'
        ? '当前仅作者和审核人员可见'
        : hits.length
          ? `命中：${safe(hits.join('、'))}`
          : target.protectedListId
            ? '命中：受保护名单'
            : '未命中审核规则，仍须人工审核';
      const routeNote = decision === 'approve' ? `<div class="content-review-decision-route">${icon('route')}<div><strong>通过后的业务流向</strong><p>${processPost(target) ? '进入事项分办，由分办人员确定承办部门、承办人、办理要求和时限；发布状态独立管理。' : '审核结果改为“审核通过”，发布状态保持“未发布”，待后续显式发布。'}</p></div></div>` : '';
      return modal(title, `<div class="notice">${icon('file-search')}<div><strong>${safe(target.title)}</strong><p>${safe(target.board)} · ${safe(target.author)} · ${reviewContext}</p></div></div>${routeNote}${textarea(prompt, 'reason')}`, button('取消', 'content-review-detail', target.id) + button(`确认${title}`, config[1], target.id, decision === 'approve' ? 'primary' : ''));
    }
    const post = data.posts.find((p) => String(p.id) === id);
    const affair = data.affairs.find((a) => a.id === id);
    if (type === 'post-detail' && post) return postDetail(data, post);
    if (type === 'content-review-detail' && post) return contentReviewDetail(data, post);
    if (type === 'content-review-batch-return') {
      const selected = data.posts.filter((item) => contentReviewSelection.has(String(item.id)) && auditStatus(item) === '待审核');
      if (!selected.length) return modal('批量驳回', '<p>当前没有可批量处理的内容，请重新选择。</p>', button('关闭', 'close', ''));
      return modal('批量驳回', `<div class="notice">${icon('x-circle')}<div><strong>将驳回 ${selected.length} 条内容</strong><p>驳回原因会同步给发布人，并写入每条内容的审核记录。</p></div></div>${textarea('驳回原因（必填）', 'content-batch-reason')}`, button('取消', 'close', '') + button('确认驳回', 'content-review-batch-return-submit', '', 'primary'));
    }
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
      const comments = data.comments.filter((item) => String(item.postId) === id && item.status === commentReviewTab && (commentReviewTab === '待审核' ? commentSensitiveHits(item).length || item.protectedListId : item.reviewedAt));
      if (!comments.length) return modal('评论审核', `<p>该帖当前没有${safe(commentReviewTab)}的风险评论。</p>`, button('关闭', 'close', ''));
      const pending = commentReviewTab === '待审核';
      const rows = comments.map((comment) => {
        const hits = commentSensitiveHits(comment);
        const ruleDetails = hits.map((term) => { const rule = (data.sensitiveWords || []).find((word) => word.term === term); return `${term}（${rule?.riskLevel || '中'}风险 · ${rule?.matchRule || '包含匹配'}）`; });
        return `<tr>${pending ? `<td><input type="checkbox" class="comment-review-check" value="${safe(comment.id)}" aria-label="选择${safe(comment.author)}的评论"></td>` : ''}<td><div class="comment-review-text">${highlightComment(comment.text, hits)}</div><div class="td-sub">${safe(comment.id)}</div></td><td>${safe(comment.author)}<div class="td-sub">${safe(comment.department || '所属部门未记录')} · ${safe(comment.createdAt || '提交时间未记录')}</div></td><td>${riskBadge(commentRisk(comment, data))}<div class="td-sub comment-rule-detail">${safe(ruleDetails.join('；') || '受保护名单提示')}</div></td>${pending ? `<td><div class="row-actions">${button('通过', 'comment-row-approve', comment.id, 'primary')}${button('驳回', 'comment-row-reject', comment.id)}</div></td>` : `<td>${badgeFor(comment.status)}<div class="td-sub">${safe(comment.reviewReason || '未填写处置意见')} · ${safe(comment.reviewedAt || '时间未记录')}</div></td>`}</tr>`;
      }).join('');
      const table = `<div class="comment-review-table"><table class="data-table"><thead><tr>${pending ? '<th><input type="checkbox" aria-label="全选待审评论" onchange="document.querySelectorAll(\'.comment-review-check\').forEach(box => box.checked = this.checked)"></th>' : ''}<th>评论内容</th><th>提交人 / 时间</th><th>规则命中与风险</th><th>${pending ? '逐条审核' : '审核结果'}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
      const sourceContext = `<div class="comment-source-context"><div><span>来源帖子</span><strong>${safe(source?.title || '来源帖子不可用')}</strong><p>${safe(source?.body || '原帖正文未记录')}</p></div><dl><div><dt>栏目</dt><dd>${safe(source?.board || '未记录')}</dd></div><div><dt>作者</dt><dd>${safe(source?.author || '未记录')}</dd></div><div><dt>发布时间</dt><dd>${safe(source?.time || source?.createdAt || '未记录')}</dd></div></dl></div>`;
      return modal(`${pending ? '按帖子审核' : '查看'}评论`, `${sourceContext}<div class="comment-review-guidance">${icon('shield-alert')}<span>规则命中仅作风险提示，请结合原帖语境人工判断。</span><strong>${comments.length} 条${safe(commentReviewTab)}评论</strong></div>${table}`, pending ? button('批量驳回', 'comment-batch-reject', id) + button('批量通过', 'comment-batch-approve', id, 'primary') : button('关闭', 'close', '')).replace('<section class="modal"', '<section class="modal comment-review-modal"');
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
    if (type === 'report-group-detail') {
      const source = data.posts.find((item) => String(item.id) === id);
      const reports = data.reports.filter((item) => String(item.postId) === id && (reportReviewTab === '待核查' ? item.status === '待核查' : item.status === '已处理' && item.resolution === reportReviewTab));
      if (!reports.length) return modal('举报核查', '<p>该帖子当前没有符合条件的举报记录。</p>', button('关闭', 'close', ''));
      const records = reports.map((report) => `<article class="report-record"><div><strong>举报原因类型：${safe(report.category || '其他')}</strong>${badgeFor(report.status === '待核查' ? '待核查' : report.resolution)}</div><p><b>举报说明：</b>${safe(report.reason)}</p><small>${safe(report.reporter || '匿名举报')} · ${safe(report.createdAt || '时间未记录')}${report.reviewReason ? ` · 核查意见：${safe(report.reviewReason)}` : ''}</small></article>`).join('');
      const sourceContext = `<div class="report-source-context"><div><span>被举报帖子</span><strong>${safe(source?.title || '来源帖子不可用')}</strong><p>${safe(source?.body || '原帖正文未记录')}</p></div><dl><div><dt>栏目</dt><dd>${safe(source?.board || '未记录')}</dd></div><div><dt>作者</dt><dd>${safe(source?.author || '未记录')}</dd></div><div><dt>发布时间</dt><dd>${safe(source?.time || source?.createdAt || '未记录')}</dd></div></dl></div>`;
      return modal('举报核查详情', `${sourceContext}<div class="section-title"><h2>举报记录</h2><span class="badge">${reports.length} 条</span></div><div class="report-record-list">${records}</div>`, reportReviewTab === '待核查' ? button('举报不成立', 'report-group-dismiss', id) + button('举报成立', 'report-group-confirm', id, 'primary') : button('关闭', 'close', '')).replace('<section class="modal"', '<section class="modal report-review-modal"');
    }
    if (type === 'report-group-decision') {
      const reports = data.reports.filter((item) => String(item.postId) === id && item.status === '待核查');
      if (!reports.length || !state.reportDecision) return '';
      const confirmed = state.reportDecision === 'report-group-confirm';
      const conclusion = confirmed ? '举报成立' : '举报不成立';
      const actionField = confirmed ? choose('内容处置', 'report-disposal', ['隐藏原帖'], '隐藏原帖') : '';
      return modal(conclusion, `<p>将对该帖的 ${reports.length} 条待核查举报统一记录为“${conclusion}”。</p>${actionField}${textarea('核查意见（必填）', 'reason')}`, button('取消', 'report-group-decision-cancel', id) + button('确认处理', 'report-group-decision-submit', id, 'primary'));
    }
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
    if (type === 'assign-form' && affair) {
      const source = data.posts.find((item) => String(item.id) === String(affair.postId));
      const defaultAccount = handlerAccounts(data).find((account) => account.department === '经济发展处') || handlerAccounts(data)[0];
      const departments = [...new Set(handlerAccounts(data).map((account) => account.department).filter(Boolean))];
      const sourcePanel = `<article class="assignment-source"><div class="assignment-source-head"><div><span>${badgeFor(source?.board || affair.sourceType || '未记录')} ${badgeFor(affair.publicationMode || publicationStatus(source))}</span><h3>${safe(affair.title)}</h3><p>${safe(affair.id)} · 来源内容 ${safe(source?.id || affair.postId)}</p></div></div><dl><dt>发布人</dt><dd>${safe(source?.author || '匿名用户')}</dd><dt>发布方式</dt><dd>${source?.author === '匿名用户' ? '匿名发布' : '实名发布'}</dd><dt>审核结果</dt><dd>审核通过</dd><dt>通过时间</dt><dd>${safe(affair.reviewedAt || affair.createdAt || '未记录')}</dd></dl><section><h4>来源内容</h4><p>${safe(source?.body || '暂无来源正文')}</p></section><div class="assignment-route-note">${icon('route')}<span>确认分办后直接进入承办人的“办理中”任务，不再设确认或接收环节。</span></div></article>`;
      const formPanel = `<div class="assignment-fields"><h3>责任与时限</h3>${choose('主办部门', 'owner', departments, defaultAccount?.department || '')}${accountSelect(data, 'assignee', '当前办理人', defaultAccount?.id || '')}${input('协同部门', 'co', '信息中心')}${choose('优先级', 'priority', ['一般', '重点', '紧急'], affair.priority || '一般')}${input('办理截止时间', 'deadline', affair.deadline || '2026-09-25', 'date')}${choose('答复方式', 'feedback', ['公开答复', '私密回复'], affair.feedback || '公开答复')}${textarea('办理要求', 'requirements', affair.requirements || '')}</div>`;
      return modal('查看并分办 · ' + affair.id, `<div class="assignment-form-grid">${sourcePanel}${formPanel}</div>`, button('取消', 'close', '') + button('确认分办', 'assign-save', id, 'primary')).replace('<section class="modal"', '<section class="modal assignment-modal"');
    }
    if (type === 'affair-transfer' && affair) {
      return modal('转办事项 · ' + affair.id, `<div class="notice">${icon('git-branch')}<div><strong>${safe(affair.title)}</strong><p>当前办理：${safe(affair.assigneeName || affair.assigneeId || '未指定')} · ${safe(affair.owner)}</p><p>确认后直接变更责任部门和办理人，新办理人无需再次接收。</p></div></div>${accountSelect(data, 'transfer-assignee', '目标办理人', '')}${textarea('转办原因（必填）', 'transfer-reason')}${textarea('补充办理要求', 'transfer-requirements', affair.requirements || '')}`, button('取消', 'close', '') + button('确认改派', 'transfer-save', id, 'primary'));
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
      if (!isLeaderView() && assigned && affair.status === '办理中') { fields = (affair.returnReason ? `<div class="notice handler-return-note">${icon('message-square-warning')}<div><strong>答复退回修改</strong><p>${safe(affair.returnReason)}</p></div></div>` : '') + choose('当前阶段', 'stage', ['调查核实', '制定措施', '等待协同反馈', '形成正式答复'], affair.stage || '调查核实') + textarea('阶段进展', 'progress', affair.progress) + textarea('正式答复草稿', 'draft', affair.draft) + input('补充附件', 'attachments', '', 'file') + input('申请延期至', 'extension', '', 'date') + textarea('延期原因', 'extension-reason'); actions = button('联系分办人', 'affair-contact', id) + button('转办', 'affair-transfer', id) + button('保存进展', 'progress-save', id) + button('保存草稿', 'draft-save', id) + button('申请延期', 'extension-request', id) + button('提交答复', 'draft-submit', id, 'primary'); }
      if (!isLeaderView() && canFlowRole(flowForAffair(affair, data), 'extensionRole', 'dispatch') && affair.extension?.status === '待审批') actions = button('拒绝延期', 'extension-reject', id) + button('批准延期', 'extension-approve', id, 'primary');
      if (!isLeaderView() && canFlowRole(flowForAffair(affair, data), 'answerRole', 'dispatch') && affair.status === '待复核') { fields = textarea('复核意见（退回时必填）', 'reason') + choose('反馈方式', 'feedback', ['公开答复', '私密回复'], affair.feedback === '私密回复' ? '私密回复' : '公开答复'); actions = button('退回修改', 'answer-return', id) + button(processPost(source) ? '审核并办结' : '通过并反馈', 'answer-approve', id, 'primary'); }
      if (!isLeaderView() && canDispatch() && affair.status === '已反馈' && !processPost(source)) actions = button('登记整改', 'rectify-form', id) + button('办结归档', 'affair-close', id, 'primary');
      return modal('事项办理 · ' + affair.id, `<h3>${safe(affair.title)}</h3><p class="muted">来源帖子 #${affair.postId} · ${safe(source?.author)} · ${safe(source?.board)} · 主办 ${safe(affair.owner)} · 当前办理人 ${safe(affair.assigneeName || affair.assigneeId || '待分办')} · 截止 ${safe(affair.deadline || '待设置')} · <strong>${safe(affair.deadline ? deadlineText(affair) : '待分办')}</strong></p><div class="notice">${icon('message-square-text')}<div><strong>来源帖子</strong><p>${safe(source?.body || '来源正文暂不可用')}</p></div></div><div class="notice">${icon('clipboard-list')}<div><strong>分办要求</strong><p>${safe(affair.requirements || '待分办时填写')}</p></div></div><p><strong>当前状态：</strong>${badgeFor(statusLabel(affair))}　<strong>反馈方式：</strong>${safe(affair.feedback)}</p>${affair.draft && affair.status !== '办理中' ? `<div class="notice">${icon('file-check')}<div><strong>正式答复</strong><p>${safe(affair.draft)}</p></div></div>` : ''}${fields}<div class="section-title"><h2>附件</h2></div><p class="muted">${safe(affair.attachments?.join('、') || '暂无附件')}</p><div class="section-title"><h2>流转记录</h2></div><div class="timeline">${events.slice().reverse().map((e) => `<div class="timeline-item"><span class="timeline-dot">${icon('check')}</span><div><strong>${safe(e.text)}</strong><p>${safe(e.at)}</p></div></div>`).join('')}</div>`, actions);
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
    if (type === 'board-new' || type === 'board-edit') { const board = data.boards.find((item) => item.id === id); const body = `<div class="board-editor-grid">${input('栏目名称', 'name', board?.name || '')}${choose('栏目类型', 'board-type', ['诉求办理类', '内容交流类', '成果发布类'], board?.type || '内容交流类')}${textarea('栏目说明', 'board-description', board?.description || '')}${choose('发布主体', 'board-publisher', ['职工', '管理员'], board?.publisher || '职工')}${choose('内容规则', 'board-review-rule', ['人工审核', '按敏感规则处理', '仅管理员发布'], board?.reviewRule || '按敏感规则处理')}${choose('允许评论', 'board-comments', ['是', '否'], board?.allowComments === false ? '否' : '是')}${choose('生成办理事项', 'board-affair', ['是', '否'], board?.generatesAffair ? '是' : '否')}${input('排序', 'board-sort', board?.sort || data.boards.length + 1, 'number')}</div><div class="board-editor-hint">${icon('workflow')}<span>诉求办理类必须人工审核并生成事项；成果发布类仅允许管理员发布。</span></div>`; return modal(board ? '编辑栏目' : '新增栏目', body, button('取消', 'close', '') + button('保存栏目', 'board-save', id, 'primary')).replace('<section class="modal"', '<section class="modal board-editor-modal"'); }
    if (type === 'board-delete') { const board = data.boards.find((item) => item.id === id); if (!board) return ''; const postCount = data.posts.filter((post) => post.board === board.name && !post.deleted).length; const flowCount = (data.flowConfigs || []).filter((flow) => flow.board === board.name).length; const blocked = board.system || postCount || flowCount; return modal('删除栏目', blocked ? `<div class="notice">${icon('shield-alert')}<div><strong>当前栏目不能删除</strong><p>${board.system ? '该栏目为系统栏目。' : `已关联 ${postCount} 条帖子和 ${flowCount} 套流程。`}如需停止使用，请返回列表停用栏目。</p></div></div>` : `<p>确认删除「${safe(board.name)}」？栏目配置删除后不能恢复。</p>`, blocked ? button('知道了', 'close', '') : button('取消', 'close', '') + button('确认删除', 'board-remove', id, 'primary')); }
    if (type === 'word-new' || type === 'word-edit') { const rule = data.sensitiveWords.find((item) => item.id === id); const level = rule?.riskLevel || '中'; return modal(rule ? '编辑敏感词' : '新增敏感词', input('敏感词', 'term', rule?.term || '') + choose('词语分类', 'category', sensitiveCategories, rule?.category || '其他') + choose('风险等级', 'riskLevel', ['高', '中', '低'], level) + `<div class="risk-policy-preview"><strong>处置方式随风险等级自动确定</strong><p>高风险禁止提交；中风险进入优先审核；低风险进入普通审核。</p></div>` + choose('命中规则', 'matchRule', ['包含匹配', '完整词匹配'], rule?.matchRule || '包含匹配') + choose('适用范围', 'scope', ['全部', '发帖', '评论'], rule?.scope || '全部'), button('保存规则', 'word-save', id, 'primary')); }
    if (type === 'word-import') return modal('批量导入敏感词', `<div class="word-import-guide"><div class="word-import-guide-head"><div><strong>文件格式</strong><p>支持 CSV、TXT 文件。首行字段必须依次为：敏感词、分类、风险等级、命中规则、适用范围。</p></div>${button(`${icon('download')} 下载导入模板`, 'word-template-download', '')}</div><code>财政专户密码,信息安全,高,包含匹配,全部</code></div><label class="field"><span>选择导入文件</span><input class="input" id="wf-word-import-file" type="file" accept=".csv,.txt,text/csv,text/plain"></label><p class="muted">有效值：风险等级为高/中/低；命中规则为包含匹配/完整词匹配；适用范围为全部/发帖/评论。重复敏感词将自动跳过。</p>`, button('取消', 'close', '') + button('开始导入', 'word-import-save', '', 'primary'));
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
    if (type === 'account-review') { const account = (data.accounts || []).find((a) => a.id === id); if (state.role !== 'platform' || !account) return ''; const pending = account.status === 'pending'; const history = pending ? '' : `<div class="review-history"><strong>审核记录</strong><p>${badgeFor(account.status === 'approved' ? '已通过' : '已驳回')} · ${safe(account.reviewedAt || '处理时间未记录')}</p><p>${safe(account.reason || '无补充审核意见')}</p></div>`; return modal(pending ? '用户注册审核' : '注册申请详情', `<div class="review-applicant-head"><span>${safe(account.name.slice(0, 1))}</span><div><strong>${safe(account.name)}</strong><p>申请编号 ${safe(applicationNo(account))} · ${safe(account.department || '未填写')}</p></div>${badgeFor(pending ? '待审核' : account.status === 'approved' ? '已通过' : '已驳回')}</div><dl class="post-detail-meta"><dt>手机号码</dt><dd>${safe(account.phone.slice(0, 3))}****${safe(account.phone.slice(-4))}</dd><dt>申请部门</dt><dd>${safe(account.department || '未填写')}</dd><dt>申请时间</dt><dd>${safe(account.submitted || account.createdAt || '未记录')}</dd><dt>审核责任人</dt><dd>平台管理员</dd></dl>${history}`, pending ? button('驳回申请', 'account-decision-reject', id) + button('审核通过', 'account-decision-approve', id, 'primary') : button('关闭', 'close', '')); }
    if (type === 'account-decision-reject' || type === 'account-decision-approve') { const account = (data.accounts || []).find((a) => a.id === id); if (state.role !== 'platform' || account?.status !== 'pending') return ''; const approve = type === 'account-decision-approve'; return modal(approve ? '确认审核通过' : '确认驳回申请', `<div class="notice">${icon(approve ? 'circle-check' : 'circle-x')}<div><strong>${safe(account.name)} · ${safe(applicationNo(account))}</strong><p>${approve ? '通过后将开通职工端账号，并同步申请状态。' : '驳回后申请人可在职工端查看驳回原因。'}</p></div></div>${textarea(approve ? '审核意见（选填）' : '驳回原因（必填）', 'reason')}`, button('取消', 'close', '') + button(approve ? '确认通过' : '确认驳回', approve ? 'account-approve' : 'account-reject', id, approve ? 'primary' : 'secondary')); }
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
    if (action === 'word-reset') { sensitiveFilters = { query: '', category: '', riskLevel: '', scope: '', status: '' }; return render(); }
    if (action === 'word-template-download') {
      const content = '\uFEFF敏感词,分类,风险等级,命中规则,适用范围\r\n示例敏感词,其他,中,包含匹配,全部\r\n';
      const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a'); link.href = url; link.download = '敏感词导入模板.csv'; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      return showToast('敏感词导入模板已下载');
    }
    if (action === 'handler-type-tab') { handlingType = id; return render(); }
    if (action === 'content-review-status-tab') { contentReviewStatus = ['待审核', '风险待审', '已处理'].includes(id) ? id : '待审核'; contentReviewSelection.clear(); return render(); }
    if (action === 'content-review-reset') { contentReviewTypes = []; contentReviewFilters = { query: '', risk: '', contentState: '', dateFrom: '', dateTo: '' }; contentReviewSelection.clear(); return render(); }
    if (action === 'content-review-check') { contentReviewSelection.has(id) ? contentReviewSelection.delete(id) : contentReviewSelection.add(id); return render(); }
    if (action === 'content-review-select-all') {
      const rows = contentReviewRows(db());
      const allSelected = rows.length && rows.every((post) => contentReviewSelection.has(String(post.id)));
      rows.forEach((post) => allSelected ? contentReviewSelection.delete(String(post.id)) : contentReviewSelection.add(String(post.id)));
      return render();
    }
    if (action === 'content-review-batch-approve') {
      const data = db();
      const selected = data.posts.filter((post) => contentReviewSelection.has(String(post.id)) && auditStatus(post) === '待审核');
      if (!selected.length) return showToast('请先选择要审核的内容');
      if (selected.some((post) => contentRisk(post, data).level === '高')) return showToast('风险待审内容必须逐条审核并填写处置意见');
      const reviewedAt = time();
      let created = 0;
      selected.forEach((post) => {
        post.contentAuditStatus = '审核通过';
        post.publishStatus = '未发布';
        post.status = '未发布';
        post.reason = '批量审核通过'; post.reviewedAt = reviewedAt;
        let affair = null;
        if (processPost(post)) { affair = createPendingAffair(post, data, reviewedAt); created += 1; }
        else post.handlingStatus = '不适用';
        post.history = [...(post.history || []), { text: affair ? `内容审核通过，自动生成事项 ${affair.id}；内容待发布` : '内容审核通过，等待发布', at: reviewedAt }];
        data.audit.unshift({ action: '内容审核', target: post.id, detail: affair ? `${post.title} → 待分办 ${affair.id} · 未发布` : `${post.title} → 审核通过 · 未发布`, role: roleInfo[state.role].label, at: reviewedAt });
        notifyPostAuthor(data, post, `${post.title} 内容审核已通过，等待发布`);
      });
      PrototypeData.save(data); contentReviewSelection.clear(); render(); return showToast(`已通过 ${selected.length} 条内容${created ? `，生成 ${created} 个待分办事项` : ''}`);
    }
    if (action === 'content-review-batch-return-submit') {
      const reason = readField('content-batch-reason');
      if (!reason) return showToast('请填写驳回原因');
      const data = db();
      const selected = data.posts.filter((post) => contentReviewSelection.has(String(post.id)) && auditStatus(post) === '待审核');
      if (!selected.length) return showToast('所选内容状态已变化，请刷新后重试');
      const reviewedAt = time();
      selected.forEach((post) => { post.status = '已驳回'; post.contentAuditStatus = '已驳回'; post.publishStatus = '未发布'; post.handlingStatus = '不适用'; post.reason = reason; post.history = [...(post.history || []), { text: `内容审核驳回：${reason}`, at: reviewedAt }]; data.audit.unshift({ action: '内容审核', target: post.id, detail: `${post.title} → 驳回：${reason}`, role: roleInfo[state.role].label, at: reviewedAt }); });
      PrototypeData.save(data); contentReviewSelection.clear(); closeModal(); render(); return showToast(`已驳回 ${selected.length} 条内容`);
    }
    if (action === 'comment-review-tab') { commentReviewTab = ['待审核', '已发布', '已驳回'].includes(id) ? id : '待审核'; return render(); }
    if (action === 'comment-review-reset') { commentReviewFilters = { query: '', board: '', risk: '', dateFrom: '', dateTo: '' }; return render(); }
    if (action === 'report-review-tab') { reportReviewTab = ['待核查', '举报成立', '举报不成立'].includes(id) ? id : '待核查'; return render(); }
    if (action === 'report-review-reset') { reportReviewFilters = { query: '', category: '', dateFrom: '', dateTo: '' }; return render(); }
    if (action === 'report-group-decision-cancel') { state.reportDecision = null; state.modal = { type: 'report-group-detail', id }; return render(); }
    if (action === 'report-group-confirm' || action === 'report-group-dismiss') { state.reportDecision = action; state.modal = { type: 'report-group-decision', id }; return render(); }
    if (action === 'assignment-tab') { assignmentTab = ['待分办', '已分办', '答复审核', '已办结'].includes(id) ? id : '待分办'; return render(); }
    if (action === 'assignment-reset') { assignmentFilters = { query: '', type: '', priority: '', createdFrom: '', createdTo: '' }; return render(); }
    if (action === 'assignment-closed-reset') { assignmentClosedFilters = { query: '', type: '', owner: '', assignee: '', feedback: '', closedFrom: '', closedTo: '' }; return render(); }
    if (action === 'handler-message-tab') { handlerMessageType = id; return render(); }
    if (action === 'workbench-tab') { workbenchTab = id; return render(); }
    if (action === 'user-review-tab') { state.userReviewTab = id; return render(); }
    if (action === 'user-review-reset') { userReviewFilters = { query: '', department: '', dateFrom: '', dateTo: '' }; return render(); }
    if (action === 'ledger-tab') { state.contentLedgerTab = id; return render(); }
    if (action === 'post-detail-tab') { state.postDetailTab = id; return render(); }
    if (action === 'policy-admin-tab') { state.policyAdminTab = id === 'questions' ? 'questions' : 'policy'; return render(); }
    if (action === 'staff') return window.location.href = new URL('../index.html', document.baseURI).href;
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
    if (['post-detail', 'content-review-detail', 'content-review-batch-return', 'ledger-post-edit', 'ledger-post-delete', 'comment-batch-detail', 'comment-detail', 'report-detail', 'report-group-detail', 'assign-form', 'assignment-skip', 'affair-detail', 'affair-transfer', 'affair-contact', 'rectify-new', 'rectify-form', 'notice-new', 'notice-edit', 'notice-delete', 'policy-new', 'policy-edit', 'policy-delete', 'question-answer', 'echo-new', 'echo-publish', 'echo-edit', 'echo-delete', 'echo-view', 'account-review', 'account-decision-reject', 'account-decision-approve', 'board-new', 'board-edit', 'board-delete', 'word-new', 'word-edit', 'word-import', 'word-delete', 'banner-new', 'banner-edit', 'banner-preview', 'banner-delete'].includes(action)) { if (action === 'post-detail') state.postDetailTab = 'content'; state.modal = { type: action, id }; return render(); }
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
        const name = readField('name'), sort = Number(readField('board-sort')), type = readField('board-type'), description = readField('board-description'), publisher = readField('board-publisher'), reviewRule = readField('board-review-rule'), allowComments = readField('board-comments') === '是', generatesAffair = readField('board-affair') === '是';
        if (!name) return showToast('请填写栏目名称');
        if (type === '诉求办理类' && (publisher !== '职工' || reviewRule !== '人工审核' || !generatesAffair)) return showToast('诉求办理类须由职工发布、人工审核并生成办理事项');
        if (type === '内容交流类' && (publisher !== '职工' || reviewRule !== '按敏感规则处理' || generatesAffair)) return showToast('内容交流类须由职工发布、按敏感规则处理且不生成事项');
        if (type === '成果发布类' && (publisher !== '管理员' || reviewRule !== '仅管理员发布' || generatesAffair)) return showToast('成果发布类仅允许管理员发布且不生成事项');
        if (data.boards.some((item) => item.name === name && item.id !== id)) return showToast('栏目名称已存在');
        if (!Number.isInteger(sort) || sort < 1 || sort > data.boards.length + (board ? 0 : 1)) return showToast('排序须填写有效的列表位置');
        if (id && !board) return showToast('栏目不存在');
        if (board && board.name !== name && (data.posts.some((post) => post.board === board.name) || data.flowConfigs?.some((flow) => flow.board === board.name))) return showToast('该栏目已关联帖子或流程，不能修改名称');
        data.boards.sort((a, b) => a.sort - b.sort);
        if (board) { board.name = name; data.boards.splice(data.boards.indexOf(board), 1); }
        const saved = board || { id: `board-${Date.now()}`, name, enabled: true, system: false };
        Object.assign(saved, { name, description, type, publisher, reviewRule, allowComments, generatesAffair, staffPost: publisher === '职工' });
        data.boards.splice(sort - 1, 0, saved);
        data.boards.forEach((item, position) => { item.sort = position + 1; });
      } else if (action === 'board-toggle') {
        if (board.enabled && board.staffPost && PrototypeData.postingBoards(data).length <= 1) return showToast('至少保留一个可发帖栏目');
        board.enabled = !board.enabled;
      } else if (action === 'board-remove') {
        if (board.system) return showToast('系统栏目不能删除');
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
      if (action === 'word-import-save') {
        const file = document.getElementById('wf-word-import-file')?.files?.[0];
        if (!file) return showToast('请选择需要导入的 CSV 或 TXT 文件');
        return file.text().then((text) => {
          const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
          if (lines.length < 2) return showToast('文件中没有可导入的数据');
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          const headers = parseImportLine(lines[0], delimiter);
          const expected = ['敏感词', '分类', '风险等级', '命中规则', '适用范围'];
          if (expected.some((name, index) => headers[index] !== name)) return showToast('文件表头不正确，请按模板字段顺序整理');
          const data = db(), existing = new Set(data.sensitiveWords.map((item) => item.term.toLocaleLowerCase()));
          let added = 0, skipped = 0, invalid = 0;
          lines.slice(1).forEach((line, index) => {
            const [term, category, riskLevel, matchRule, scope] = parseImportLine(line, delimiter);
            if (!term || !sensitiveCategories.includes(category) || !['高', '中', '低'].includes(riskLevel) || !['包含匹配', '完整词匹配'].includes(matchRule) || !['全部', '发帖', '评论'].includes(scope)) { invalid += 1; return; }
            const key = term.toLocaleLowerCase();
            if (existing.has(key)) { skipped += 1; return; }
            existing.add(key); data.sensitiveWords.push({ id: `word-import-${Date.now()}-${index}`, term, category, riskLevel, matchRule, scope, enabled: true, hitCount: 0 }); added += 1;
          });
          if (!added) return showToast(`没有新增数据：重复 ${skipped} 条，格式错误 ${invalid} 条`);
          data.audit.unshift({ action: '敏感词库', target: file.name, detail: `批量导入 ${added} 条，跳过 ${skipped} 条，错误 ${invalid} 条`, role: roleInfo[state.role].label, at: time() });
          PrototypeData.save(data); closeModal(); showToast(`导入完成：新增 ${added} 条，跳过 ${skipped} 条，错误 ${invalid} 条`);
        }).catch(() => showToast('文件读取失败，请检查文件后重试'));
      }
      const data = db(); const rule = data.sensitiveWords.find((item) => item.id === id);
      if (action === 'word-save') {
        const term = readField('term'), category = readField('category'), riskLevel = readField('riskLevel'), scope = readField('scope'), matchRule = readField('matchRule');
        if (!term) return showToast('请填写敏感词');
        if (data.sensitiveWords.some((item) => item.term.toLocaleLowerCase() === term.toLocaleLowerCase() && item.id !== id)) return showToast('敏感词已存在');
        if (id) { if (!rule) return showToast('规则不存在'); Object.assign(rule, { term, category, riskLevel, scope, matchRule }); }
        else data.sensitiveWords.unshift({ id: `word-${Date.now()}`, term, category, riskLevel, scope, matchRule, enabled: true, hitCount: 0 });
      } else if (action === 'word-toggle' && rule) rule.enabled = !rule.enabled;
      else if (action === 'word-remove' && rule) {
        data.sensitiveWords.splice(data.sensitiveWords.indexOf(rule), 1);
        if (!data.deletedSensitiveWordIds.includes(rule.id)) data.deletedSensitiveWordIds.push(rule.id);
      }
      else return showToast('规则不存在');
      data.audit.unshift({ action: '敏感词库', target: id || '新规则', detail: action === 'word-save' ? `保存${readField('riskLevel')}风险规则` : action === 'word-remove' ? `删除规则：${rule.term}，历史命中 ${rule.hitCount || 0} 次` : '切换规则状态', role: roleInfo[state.role].label, at: time() });
      PrototypeData.save(data); closeModal(); return showToast(action === 'word-remove' ? '敏感词已删除' : '敏感词配置已更新');
    }
    if (action === 'post-approve') {
      const data = db(), p = data.posts.find((item) => String(item.id) === String(id)), reason = readField('reason');
      if (!p || !canAuditPost(p, data)) return showToast('当前角色无权审核该栏目');
      if (auditStatus(p) !== '待审核') return showToast('该内容已处理，请刷新');
      if (contentRisk(p, data).level === '高' && !reason) return showToast('风险待审内容请填写人工审核意见');
      const reviewedAt = time();
      p.contentAuditStatus = '审核通过';
      p.publishStatus = '未发布';
      p.status = '未发布';
      p.reason = reason; p.reviewedAt = reviewedAt;
      const affair = processPost(p) ? createPendingAffair(p, data, reviewedAt) : null;
      if (!affair) p.handlingStatus = '不适用';
      const detail = affair ? `${p.title} → 待分办 ${affair.id} · 未发布` : `${p.title} → 审核通过 · 未发布`;
      p.history = [...(p.history || []), { text: affair ? `内容审核通过，自动生成事项 ${affair.id}；内容待发布` : '内容审核通过，等待发布', at: reviewedAt }];
      data.audit.unshift({ action: '内容审核', target: p.id, detail, role: roleInfo[state.role].label, at: reviewedAt });
      notifyPostAuthor(data, p, `${p.title} 内容审核已通过，等待发布`);
      PrototypeData.save(data); closeModal(); render();
      return showToast(affair ? `审核通过，已生成待分办事项 ${affair.id}，内容待发布` : '审核通过，内容已进入待发布状态');
    }
    if (action.startsWith('post-')) return update(['post-publish', 'post-private-publish', 'post-hide', 'post-restore'].includes(action) ? '内容发布' : '内容审核', 'posts', id, (p, data) => {
      const reason = readField('reason');
      if (['post-return', 'post-reject'].includes(action) && (!canAuditPost(p, data) || auditStatus(p) !== '待审核')) { showToast('该内容无法审核或已处理'); return false; }
      if (['post-return', 'post-reject'].includes(action) && !reason) { showToast('请填写处置意见'); return false; }
      if (['post-publish', 'post-private-publish'].includes(action) && auditStatus(p) !== '审核通过') { showToast('只有审核通过的内容才能发布'); return false; }
      p.status = ({ 'post-approve': '已发布', 'post-return': '退回修改', 'post-reject': '已驳回', 'post-publish': '已发布', 'post-private-publish': '私密发布', 'post-hide': '已隐藏', 'post-restore': '已发布' })[action];
      if (['post-return', 'post-reject'].includes(action)) { p.contentAuditStatus = '已驳回'; p.publishStatus = '未发布'; p.handlingStatus = '不适用'; }
      if (action === 'post-publish') p.publishStatus = '已发布';
      if (action === 'post-private-publish') p.publishStatus = '私密发布';
      if (action === 'post-hide') p.publishStatus = '未发布';
      if (action === 'post-restore') p.publishStatus = '已发布';
      const relatedAffair = data.affairs.find((affair) => String(affair.postId) === String(p.id));
      if (relatedAffair && ['post-publish', 'post-private-publish', 'post-hide', 'post-restore'].includes(action)) relatedAffair.publicationMode = p.publishStatus;
      p.reason = reason;
      const operationText = ({ 'post-approve': processPost(p) ? '内容审核通过，进入事项分办' : '内容审核通过', 'post-return': '审核退回修改', 'post-reject': '审核驳回', 'post-publish': '内容已发布', 'post-private-publish': '内容已私密发布', 'post-hide': '内容已隐藏', 'post-restore': '内容已恢复发布' })[action];
      p.history = [...(p.history || []), { text: operationText, at: time() }];
      if (action === 'post-publish') notifyPostAuthor(data, p, `${p.title} 内容已发布`);
      if (action === 'post-private-publish') notifyPostAuthor(data, p, `${p.title} 内容已私密发布`);
      return `${p.title} → ${p.status}${reason ? `：${reason}` : ''}`;
    }, ['post-publish', 'post-private-publish', 'post-hide', 'post-restore'].includes(action) ? '发布状态已更新' : '审核状态已更新');
    if (action === 'assignment-skip-save') return update('事项分办', 'posts', id, (p, data) => {
      const flow = flowForPost(p, data);
      if (!flow || flow.decision !== '人工判断' || p.status !== '已发布' || data.affairs.some((a) => a.postId === p.id) || !canFlowRole(flow, 'assignmentRole', 'dispatch')) { showToast('该帖子不符合无需办理条件'); return false; }
      if (!readField('routing-reason')) { showToast('请填写无需办理理由'); return false; }
      p.routingDecision = '无需办理'; p.routingReason = readField('routing-reason'); return `${p.title}：无需办理，${p.routingReason}`;
    }, '已标记为无需办理');
    if (action === 'assign-save') {
      const owner = readField('owner'), assigneeId = readField('assignee'), deadline = readField('deadline'), requirements = readField('requirements');
      if (!owner || !assigneeId || !deadline || !requirements) return showToast('请填写主办部门、当前办理人、截止时间和办理要求');
      const data = db(); const affair = data.affairs.find((item) => String(item.id) === String(id));
      const p = data.posts.find((x) => String(x.id) === String(affair?.postId));
      const assignee = handlerAccounts(data).find((account) => account.id === assigneeId);
      if (!affair || affair.status !== '待分办' || !p || !processPost(p)) return showToast('该事项不符合分办条件');
      if (!assignee || assignee.department !== owner) return showToast('当前办理人必须属于主办部门');
      if (!canFlowRole(flowForAffair(affair, data), 'assignmentRole', 'dispatch')) return showToast('当前角色无权分办该事项');
      Object.assign(affair, { owner, initialOwner: owner, co: readField('co'), assigneeId, assigneeName: assignee.name, deadline, priority: readField('priority'), feedback: readField('feedback'), requirements, status: '办理中', assignmentState: '办理中', stage: '调查核实', assignedAt: time(), dispatcherId: currentAccount().id, dispatcherName: currentAccount().name || roleInfo[state.role].label, dispatcherDepartment: currentAccount().department || '平台管理组' });
      affair.events = [...(affair.events || []), { text: `已分办至${owner} · ${assignee.name}，直接进入办理中`, at: time() }];
      p.processingState = '已分办'; p.processingAccepted = true; p.handlingStatus = '办理中'; p.status = '办理中';
      data.handlerNotifications = data.handlerNotifications || [];
      data.handlerNotifications.unshift({ id: `HMSG-${Date.now()}`, affairId: affair.id, assigneeId, text: `新事项 ${affair.id} 已分办，请办理`, at: time() });
      data.audit.unshift({ action: '事项分办', target: affair.id, detail: `${p.title}：已分办至${assignee.name}，直接进入办理中`, role: roleInfo[state.role].label, at: time() }); PrototypeData.save(data); closeModal(); showToast(`事项 ${affair.id} 已分办至 ${assignee.name}`); return;
    }
    if (action === 'transfer-save') return update('事项转办', 'affairs', id, (a, data) => {
      if (state.role !== 'handler' || !isAssignedHandler(a, data)) { showToast('只有当前承办人可以转办'); return false; }
      if (a.status !== '办理中') { showToast('当前状态不可转办'); return false; }
      const targetId = readField('transfer-assignee'), target = handlerAccounts(data).find((account) => account.id === targetId), reason = readField('transfer-reason');
      if (!target || target.id === a.assigneeId) return showToast('请选择不同的目标承办人'), false;
      if (!reason) return showToast('请填写转办原因'), false;
      const fromDepartment = a.owner, fromAssigneeId = a.assigneeId, fromAssigneeName = a.assigneeName;
      a.transfer = { status: '已改派', fromDepartment, fromAssigneeId, fromAssigneeName, toDepartment: target.department, toAssigneeId: target.id, toAssigneeName: target.name, reason, at: time() };
      a.owner = target.department; a.assigneeId = target.id; a.assigneeName = target.name; a.assignmentState = '办理中'; a.requirements = readField('transfer-requirements') || a.requirements;
      a.events.push({ text: `${fromAssigneeName || '原办理人'}转办至${target.name}，已直接改派`, at: time() }); return `${a.title}：已改派至${target.name}`;
    }, '事项已直接改派');
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
      if (['progress-save', 'draft-save', 'draft-submit', 'extension-request'].includes(action) && a.status !== '办理中') { showToast('事项当前不可提交承办操作'); return false; }
      const p = data.posts.find((x) => x.id === a.postId);
      if (action === 'progress-save') { if (!readField('progress')) return showToast('请填写阶段进展'), false; a.stage = readField('stage'); a.progress = readField('progress'); }
      if (action === 'draft-save') { if (!readField('draft')) return showToast('请填写答复草稿'), false; a.draft = readField('draft'); }
      if (action === 'draft-submit') { if (!readField('draft')) return showToast('请填写正式答复'), false; a.draft = readField('draft'); a.status = '待复核'; a.returnReason = ''; if (p && processPost(p)) { p.status = '已处理-分办审核'; p.handlingStatus = '待答复审核'; } }
      if (['progress-save', 'draft-save', 'draft-submit'].includes(action)) { const names = Array.from(document.getElementById('wf-attachments')?.files || [], (file) => file.name); if (names.length) a.attachments = [...new Set([...(a.attachments || []), ...names])]; }
      if (action === 'extension-request') { if (!readField('extension') || !readField('extension-reason')) return showToast('请填写延期日期和原因'), false; if (readField('extension') <= a.deadline || readField('extension') <= today()) return showToast('拟完成时间应晚于原办理期限和当前日期'), false; a.extension = { status: '待审批', deadline: readField('extension'), reason: readField('extension-reason') }; }
      if (action === 'extension-approve' || action === 'extension-reject') { if (!a.extension || a.extension.status !== '待审批') return false; a.extension.status = action === 'extension-approve' ? '已批准' : '已拒绝'; if (action === 'extension-approve') a.deadline = a.extension.deadline; }
      if (action === 'answer-return') { if (!readField('reason')) return showToast('请填写退回意见'), false; a.status = '办理中'; a.returnReason = readField('reason'); if (p && processPost(p)) { p.status = '办理中'; p.handlingStatus = '退回修改'; } }
      if (action === 'answer-approve') {
        if (a.status !== '待复核' || !a.draft) return showToast('请先提交正式答复'), false;
        a.feedback = readField('feedback') === '私密回复' ? '私密回复' : '公开答复';
        if (p && processPost(p)) {
          a.status = '已办结'; a.closedAt = today(); a.repliedAt = time();
          p.status = a.feedback === '公开答复' ? '已办结公开' : '已办结私密';
          p.handlingStatus = '已办结';
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
      if (action === 'affair-close') { a.status = '已办结'; a.closedAt = today(); if (p && processPost(p)) p.handlingStatus = '已办结'; }
      const label = ({ 'progress-save': '更新阶段进展', 'draft-save': '保存答复草稿', 'draft-submit': '提交答复待审核', 'extension-request': '申请延期', 'extension-approve': '批准延期', 'extension-reject': '拒绝延期', 'answer-return': `答复退回修改：${a.returnReason}`, 'answer-approve': p && processPost(p) ? `答复审核通过并办结 · ${p.replyVisibility}` : '答复审核通过并反馈', 'affair-close': '事项办结归档' })[action];
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
    if (action === 'report-group-decision-submit') {
      if (!canReview()) return showToast('当前角色无权核查举报');
      const reason = readField('reason');
      if (!reason) return showToast('请填写核查意见');
      const data = db();
      const reports = data.reports.filter((item) => String(item.postId) === id && item.status === '待核查');
      if (!reports.length) return showToast('该帖举报状态已变化，请刷新后重试');
      const confirmed = state.reportDecision === 'report-group-confirm';
      const resolution = confirmed ? '举报成立' : '举报不成立';
      const disposal = confirmed ? readField('report-disposal') : '保留原帖';
      const reviewedAt = time();
      reports.forEach((report) => { report.status = '已处理'; report.resolution = resolution; report.reviewReason = reason; report.reviewedAt = reviewedAt; report.disposal = disposal; });
      const post = data.posts.find((item) => String(item.id) === id);
      if (confirmed && disposal === '隐藏原帖' && post) post.status = '已隐藏';
      data.audit.unshift({ action: '举报核查', target: id, detail: `${resolution} ${reports.length} 条举报 · ${disposal}：${reason}`, role: roleInfo[state.role].label, at: reviewedAt });
      PrototypeData.save(data);
      state.reportDecision = null;
      state.modal = null;
      render();
      return showToast(`已完成 ${reports.length} 条举报核查`);
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
    assignmentSearch() { assignmentFilters = { query: readField('assignment-query'), type: readField('assignment-type'), priority: readField('assignment-priority'), createdFrom: readField('assignment-from'), createdTo: readField('assignment-to') }; render(); },
    assignmentClosedSearch() { assignmentClosedFilters = { query: readField('assignment-closed-query'), type: readField('assignment-closed-type'), owner: readField('assignment-closed-owner'), assignee: readField('assignment-closed-assignee'), feedback: readField('assignment-closed-feedback'), closedFrom: readField('assignment-closed-from'), closedTo: readField('assignment-closed-to') }; render(); },
    handlerSearch() { handlerFilters = { ...handlerFilters, query: readField('handler-query'), status: readField('handler-status'), priority: readField('handler-priority'), deadline: readField('handler-deadline'), type: readField('handler-type'), deadlineFrom: readField('handler-deadlineFrom'), deadlineTo: readField('handler-deadlineTo') }; render(); },
    updateContentReviewTypeSummary() { const selected = [...document.querySelectorAll('[data-content-review-type]:checked')].map((input) => input.value); const summary = document.getElementById('wf-content-review-type-summary'); if (summary) summary.textContent = !selected.length ? '全部类型' : selected.length === 1 ? selected[0] : `已选 ${selected.length} 项`; },
    clearContentReviewTypes() { document.querySelectorAll('[data-content-review-type]').forEach((input) => { input.checked = false; }); this.updateContentReviewTypeSummary(); },
    contentReviewSearch() { contentReviewTypes = [...document.querySelectorAll('[data-content-review-type]:checked')].map((input) => input.value).filter((value) => ['建言献策', '心声诉求', '业务交流'].includes(value)); contentReviewFilters = { query: readField('content-review-query'), risk: readField('content-review-risk'), contentState: readField('content-review-state'), dateFrom: readField('content-review-from'), dateTo: readField('content-review-to') }; contentReviewSelection.clear(); render(); },
    sensitiveSearch() { sensitiveFilters = { query: readField('word-query'), category: readField('word-category'), riskLevel: readField('word-risk'), scope: readField('word-scope'), status: readField('word-status') }; render(); },
    userReviewSearch() { userReviewFilters = { query: readField('user-review-query'), department: readField('user-review-department'), dateFrom: readField('user-review-from'), dateTo: readField('user-review-to') }; render(); },
    commentReviewSearch() { commentReviewFilters = { query: readField('comment-review-query'), board: readField('comment-review-board'), risk: readField('comment-review-risk'), dateFrom: readField('comment-review-from'), dateTo: readField('comment-review-to') }; render(); },
    reportReviewSearch() { reportReviewFilters = { query: readField('report-review-query'), category: readField('report-review-category'), dateFrom: readField('report-review-from'), dateTo: readField('report-review-to') }; render(); },
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
