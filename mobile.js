function getMobileHomePosts() {
  if (state.homeContentTab === '精华贴') return getRankingItems('discussion').slice(0, 20).map((item, index) => rankingItemToPost(item, 'discussion', index));
  if (state.homeContentTab === '本周热议') return getRankingItems('progress').slice(0, 20).map((item, index) => rankingItemToPost(item, 'progress', index));
  return portalPosts.filter((post) => !post.managedUnavailable && PrototypeData.isPublicPost(post));
}

function renderMobileFeed(posts, title, numbered = false) {
  return `<section class="mobile-feed"><header class="mobile-section-head"><div><span>内容动态</span><h2>${title}</h2></div><small>${posts.length} 条</small></header>${posts.map((post, index) => renderPortalPost(post, numbered ? index + 1 : null)).join('')}<footer class="feed-end"><span>没有更多了</span></footer></section>`;
}

function renderMobileHeader() {
  const titles = { dashboard: '职工首页', voices: '供销心声', policy: '政策服务', notices: '通知公告', profile: '个人中心' };
  if (state.workspaceView === 'policy' && state.policyQuestionOpen) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回常见问答" onclick="AppPrototype.closePolicyQuestion()">${icon('arrow-left')}<span>返回</span></button><strong>我要提问</strong><span></span></header>`;
  if (state.workspaceView === 'policy' && state.myPolicyQuestionsOpen) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回常见问答" onclick="AppPrototype.closeMyPolicyQuestions()">${icon('arrow-left')}<span>返回</span></button><strong>我的提问</strong><span></span></header>`;
  if (state.workspaceView === 'policy' && state.hotPolicyOpen) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回政策服务" onclick="AppPrototype.closeHotPolicies()">${icon('arrow-left')}<span>返回</span></button><strong>热门政策</strong><span></span></header>`;
  if (state.workspaceView === 'policy' && state.policyDetailId) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回政策列表" onclick="AppPrototype.closePolicyDetail()">${icon('arrow-left')}<span>返回</span></button><strong>政策详情</strong><span></span></header>`;
  if (state.workspaceView === 'notices' && state.noticeDetailId) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回通知列表" onclick="AppPrototype.closeNoticeDetail()">${icon('arrow-left')}<span>返回</span></button><strong>通知详情</strong><span></span></header>`;
  if (state.workspaceView === 'profile' && state.personalProgressId !== null) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回办理进度" onclick="AppPrototype.closeAffairProgress()">${icon('arrow-left')}<span>返回</span></button><strong>进度详情</strong><span></span></header>`;
  if (state.workspaceView === 'profile' && state.mobilePersonalSection) {
    const labels = { edit: '编辑资料', progress: '办理进度', posts: '我的发言', favorites: '我的收藏', interactions: '我的互动' };
    return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回个人中心" onclick="AppPrototype.closeMobilePersonalSection()">${icon('arrow-left')}<span>返回</span></button><strong>${labels[state.mobilePersonalSection] || '个人中心'}</strong><span></span></header>`;
  }
  return `<header class="mobile-app-header"><div class="mobile-brand"><span class="mobile-seal">湖北<br>供销</span><div><strong>湖北供销·心声</strong><small>${titles[state.workspaceView] || '职工服务'}</small></div></div></header>`;
}

function renderMobileHome() {
  const banner = policyBanners[state.bannerIndex];
  const posts = getMobileHomePosts();
  return `<div class="mobile-page mobile-home"><section class="mobile-welcome"><span>${state.session.department}</span><h1>${state.session.name}，你好</h1><p>今天也来看看大家的新声音。</p></section><section class="mobile-policy-banner" style="background-image:linear-gradient(180deg, rgba(19,25,24,.08), rgba(19,25,24,.86)),url('${banner.image}')"><div><span>${banner.tag}</span><h2>${banner.title}</h2><button type="button" onclick="AppPrototype.setWorkspaceView('policy')">查看详情 ${icon('arrow-right')}</button></div><nav>${policyBanners.map((_, index) => `<button type="button" class="${index === state.bannerIndex ? 'active' : ''}" aria-label="第 ${index + 1} 条" onclick="AppPrototype.setBanner(${index})"></button>`).join('')}</nav></section><nav class="mobile-segments mobile-sticky-tabs" aria-label="首页内容分类">${['全部', '精华贴', '本周热议'].map((tab) => `<button type="button" class="${state.homeContentTab === tab ? 'active' : ''}" onclick="AppPrototype.setHomeContentTab('${tab}')">${tab}</button>`).join('')}</nav>${renderMobileFeed(posts, state.homeContentTab === '全部' ? '全部内容' : state.homeContentTab, true)}</div>`;
}

function renderMobileVoices() {
  const tabs = ['全部', ...new Set([...PrototypeData.read().boards.map((board) => board.name), ...portalPosts.map((post) => post.board)])];
  return `<div class="mobile-page mobile-voices"><section class="mobile-page-intro"><span>职工交流</span><h1>供销心声</h1><p>说建议、讲诉求、交流经验，也查看每一次办理回应。</p></section><nav class="mobile-segments mobile-sticky-tabs mobile-board-tabs">${tabs.map((tab, index) => `<button type="button" class="${state.portalTab === tab ? 'active' : ''}" onclick="AppPrototype.setPortalTabByIndex(${index})">${escapeHtml(tab)}</button>`).join('')}</nav>${renderMobileFeed(getPortalPosts(), state.portalTab === '全部' ? '最新声音' : state.portalTab)}</div>`;
}

function renderMobilePolicy() {
  if (state.policyQuestionOpen) return renderMobilePolicyQuestionPage();
  if (state.myPolicyQuestionsOpen) return renderMobileMyPolicyQuestionsPage();
  if (state.hotPolicyOpen) return renderMobileHotPoliciesPage();
  if (state.policyDetailId) return renderMobilePolicyDetail();
  const active = policyTabs.find(([id]) => id === state.policyTab) || policyTabs[0];
  const items = policyContent[active[0]];
  const hotItems = getHotPolicyItems().slice(0, 5);
  return `<div class="mobile-page mobile-knowledge ${active[0] === 'faq' ? 'has-question-actions' : ''}"><section class="mobile-search-panel"><div><span>湖北供销职工服务</span><h1>政策答疑与公开</h1><p>政策文件、办事口径和公开进展统一查询</p></div><form onsubmit="AppPrototype.searchPolicy(event)">${icon('search')}<input id="policy-search" type="search" placeholder="搜索政策、问题或关键词"><button type="submit">搜索</button></form></section><section class="mobile-policy-hot"><header><h2>热门政策</h2><button type="button" onclick="AppPrototype.openHotPolicies()">查看更多 ${icon('chevron-right')}</button></header>${hotItems.map((item) => `<button type="button" onclick="AppPrototype.openPolicyDetail('${item.id}')"><span>${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.date.slice(5).replace('-', '.'))}</small></button>`).join('')}</section><nav class="mobile-policy-tabs" aria-label="政策服务分类">${policyTabs.map(([id, label]) => `<button type="button" class="${state.policyTab === id ? 'active' : ''}" onclick="AppPrototype.setPolicyTab('${id}')">${label}</button>`).join('')}</nav><section class="mobile-catalog"><header class="mobile-section-head"><div><span>${active[2]}</span><h2>${active[1]}</h2></div><small>${items.length} 条</small></header>${items.map((item) => `<button type="button" class="mobile-policy-row" onclick="AppPrototype.openPolicyDetail('${item.id}')"><span>${item.type}</span><div><strong>${item.title}</strong><small>${item.category} · ${item.department} · ${item.date}</small><p>${item.summary}</p></div>${icon('chevron-right')}</button>`).join('')}</section>${active[0] === 'faq' ? `<div class="mobile-policy-question-tools">${renderPolicyQuestionTools()}</div>` : ''}</div>`;
}

function renderMobileHotPoliciesPage() {
  const items = getHotPolicyItems();
  return `<div class="mobile-page mobile-hot-policy-page"><section class="mobile-question-intro"><span>后台人工置顶与排序</span><h1>热门政策</h1><p>查看全部推荐内容，排序结果与后台配置保持一致。</p></section><section class="mobile-hot-policy-list">${items.map((item, index) => `<button type="button" onclick="AppPrototype.openHotPolicyDetail('${item.id}')"><b>${String(index + 1).padStart(2, '0')}</b><span><em>${escapeHtml(item.type)}</em><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.category)} · ${escapeHtml(item.department)} · ${escapeHtml(item.date)}</small></span>${icon('chevron-right')}</button>`).join('')}</section><footer class="feed-end"><span>共 ${items.length} 条</span></footer></div>`;
}

function renderMobilePolicyQuestionPage() {
  return `<div class="mobile-page mobile-question-page"><section class="mobile-question-intro"><span>政策答疑与公开</span><h1>提交问题</h1><p>请描述实际工作中遇到的政策、办事或制度问题，我们会转交相关部门答复。</p></section><form class="knowledge-question-form mobile-question-form" onsubmit="event.preventDefault();AppPrototype.submitPolicyQuestion()"><label><span>问题标题 <i>必填</i></span><small>用一句话概括你想了解的事项</small><input id="policy-question-title-input" maxlength="80" placeholder="例如：基层社项目申报需要准备哪些材料？" required></label><label><span>问题分类 <i>必填</i></span><select id="policy-question-category"><option>项目申报</option><option>财务管理</option><option>教育培训</option><option>数据管理</option><option>其他</option></select></label><label><span>问题描述 <i>必填</i></span><small>可补充背景、当前困难和希望得到的具体答复，500 字以内</small><textarea id="policy-question-body" maxlength="500" rows="7" placeholder="请填写问题的具体情况"></textarea></label><label class="knowledge-question-check"><input id="policy-question-anonymous" type="checkbox"><span>匿名提交</span><small>匿名后，公开答复不会显示你的姓名</small></label><footer class="mobile-question-actions"><button type="button" onclick="AppPrototype.closePolicyQuestion()">取消</button><button type="submit" class="primary">提交问题</button></footer></form></div>`;
}

function renderMobileMyPolicyQuestionsPage() {
  const questions = getMyPolicyQuestions();
  return `<div class="mobile-page mobile-question-page"><section class="mobile-question-intro"><span>政策答疑与公开</span><h1>我的提问</h1><p>查看问题提交记录和答复状态。</p></section><section class="mobile-question-list">${questions.length ? questions.map((item) => { const answered = Boolean(item.answer); return `<article><div><span>${escapeHtml(item.category || '其他')}</span><small>${escapeHtml(item.submittedAt || '')}</small></div><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.body || '')}</p><strong class="knowledge-question-status ${answered ? 'published' : 'pending'}">${answered ? '已答复' : '待答复'}</strong>${answered ? `<div class="knowledge-question-answer"><b>答复</b><p>${escapeHtml(item.answer)}</p></div>` : ''}</article>`; }).join('') : '<p class="knowledge-question-empty">还没有提交过问题。</p>'}</section></div>`;
}

function renderMobilePolicyDetail() {
  const item = getPolicyDetail(state.policyDetailId);
  if (!item) return `<section class="mobile-policy-detail mobile-detail-empty"><h1>该内容暂不可查看</h1><p>政策内容可能已更新或撤回。</p><button type="button" onclick="AppPrototype.closePolicyDetail()">返回政策列表</button></section>`;
  return `<article class="mobile-page mobile-policy-detail"><div class="mobile-detail-kicker"><span>${escapeHtml(item.type)}</span><small>${escapeHtml(item.category)}</small></div><h1>${escapeHtml(item.title)}</h1><p class="mobile-detail-meta">${escapeHtml(item.department)} · 发布于 ${escapeHtml(policyDateLabel(item.date))}</p><p class="mobile-detail-summary">${escapeHtml(item.summary)}</p><div class="mobile-detail-content">${renderPolicyDetailBody(item)}</div></article>`;
}

function renderMobileNotices() {
  if (state.noticeDetailId) return renderMobileNoticeDetail();
  const tabs = ['全部', '未读', '已读'];
  const notices = homeNotices.filter((notice) => state.noticeTab === '全部' || Boolean(state.noticeRead[notice.id]) === (state.noticeTab === '已读'));
  const unread = homeNotices.filter((notice) => !state.noticeRead[notice.id]).length;
  return `<div class="mobile-page mobile-notices"><section class="mobile-page-intro"><span>${unread ? `${unread} 条未读` : '全部已读'}</span><h1>通知公告</h1><p>平台规则、服务说明和工作提示集中查看。</p><button type="button" onclick="AppPrototype.markAllNoticesRead()">全部标记已读</button></section><nav class="mobile-segments mobile-sticky-tabs mobile-board-tabs">${tabs.map((label) => `<button type="button" class="${state.noticeTab === label ? 'active' : ''}" onclick="AppPrototype.setNoticeTab('${label}')">${label}</button>`).join('')}</nav><section class="mobile-notice-list">${notices.map((notice) => `<article class="mobile-notice-card ${state.noticeRead[notice.id] ? 'read' : ''}"><div><span>${icon('megaphone')} 通知公告</span><small>${escapeHtml(notice.meta)}</small></div><h2>${escapeHtml(notice.title)}${state.noticeRead[notice.id] ? '' : '<i></i>'}</h2><p>${escapeHtml(notice.summary)}</p><div class="mobile-notice-actions">${state.noticeRead[notice.id] ? '' : `<button type="button" onclick="AppPrototype.readNotice('${notice.id}')">我已知悉</button>`}<button type="button" class="primary" onclick="AppPrototype.openNotice('${notice.id}')">立即查看 ${icon('arrow-right')}</button></div></article>`).join('')}<footer class="feed-end"><span>${notices.length ? '没有更多了' : '当前暂无通知'}</span></footer></section></div>`;
}

function renderMobileNoticeDetail() {
  const notice = homeNotices.find((item) => item.id === state.noticeDetailId);
  if (!notice) return `<article class="mobile-page mobile-policy-detail mobile-detail-empty"><h1>该通知暂不可查看</h1><button type="button" onclick="AppPrototype.closeNoticeDetail()">返回通知列表</button></article>`;
  return `<article class="mobile-page mobile-policy-detail mobile-notice-detail"><div class="mobile-detail-kicker"><span>通知公告</span><small>${escapeHtml(notice.meta)}</small></div><h1>${escapeHtml(notice.title)}</h1><div class="mobile-detail-content">${renderNoticeDetailBody(notice)}</div></article>`;
}

function renderMobileProfile() {
  if (state.personalProgressId !== null) return renderMobileProgressDetail();
  if (state.mobilePersonalSection === 'edit') return renderMobileProfileEdit();
  if (state.mobilePersonalSection) return renderMobilePersonalSection();
  const user = state.session;
  const entries = [
    ['progress', 'route', '办理进度', '查看审核、分办、办理和回复状态', `${ownedStaffPosts().length} 条`],
    ['posts', 'file-text', '我的发言', '查看发言内容与办理进度', `${ownedStaffPosts().length} 条`],
    ['favorites', 'star', '收藏', '查看已收藏的帖子内容', `${personalFavorites.length} 条`],
    ['interactions', 'heart', '互动', '查看评论、点赞和举报记录', `${personalInteractions.length} 条`]
  ];
  return `<div class="mobile-page mobile-profile-hub"><section class="mobile-profile-identity"><div class="personal-avatar">${escapeHtml(user.name.slice(0, 1))}</div><div><h1>${escapeHtml(user.name)}</h1><p>${escapeHtml(user.department)} · 账号已审核</p></div><button type="button" title="编辑资料" onclick="AppPrototype.openMobilePersonalSection('edit')">${icon('settings')}</button></section><section class="mobile-personal-menu">${entries.map(([id, iconName, label, description, count]) => `<button type="button" onclick="AppPrototype.openMobilePersonalSection('${id}')"><i>${icon(iconName)}</i><span><strong>${label}</strong><small>${description}</small></span><em>${count}</em>${icon('chevron-right')}</button>`).join('')}</section><button type="button" class="mobile-logout-button" onclick="AppPrototype.exitStaffMobile()">${icon('log-out')}<span>退出登录</span></button></div>`;
}

function renderMobileProfileEdit() {
  const user = state.session;
  return `<div class="mobile-page mobile-profile-edit"><section class="mobile-profile-edit-card"><div class="mobile-profile-edit-avatar">${escapeHtml(user.name.slice(0, 1))}</div><p>完善个人资料，方便平台联系和业务协同。</p><form onsubmit="event.preventDefault();AppPrototype.saveMobileProfile()"><label><span>姓名</span><input id="mobile-profile-name" maxlength="20" value="${escapeHtml(user.name)}" required></label><label><span>所属部门</span><input value="${escapeHtml(user.department)}" readonly></label><label><span>联系电话</span><input id="mobile-profile-phone" type="tel" maxlength="11" value="${escapeHtml(user.phone)}" inputmode="numeric" required></label><section class="mobile-profile-settings"><button type="button" onclick="AppPrototype.notify()"><span><strong>匿名发言</strong><small>发布时可选择匿名显示</small></span>${icon('chevron-right')}</button><button type="button" onclick="AppPrototype.notify()"><span><strong>修改密码</strong><small>定期修改密码，保障账号安全</small></span>${icon('chevron-right')}</button></section><footer><button type="button" onclick="AppPrototype.closeMobilePersonalSection()">取消</button><button type="submit" class="primary">保存资料</button></footer></form></section></div>`;
}

function renderMobileProgressDetail() {
  const data = PrototypeData.read();
  const post = ownedStaffPosts(data).find((item) => String(item.id) === String(state.personalProgressId));
  if (!post) return `<div class="mobile-page mobile-progress-detail mobile-detail-empty"><h1>该进度暂不可查看</h1><button type="button" onclick="AppPrototype.closeAffairProgress()">返回办理进度</button></div>`;
  const progress = staffPostProgress(post, data);
  const affair = progress.affair;
  const meta = affair ? `${affair.id} · ${affair.owner || '待分办'} · 截止 ${affair.deadline || '待定'}` : `帖子 #${post.id} · ${post.time}`;
  const nodeActor = (stage, index) => {
    if (index === 0) return `${post.author || state.session?.name || '职工'}（提交人）`;
    if (stage.includes('承办')) return `${affair?.assigneeName || '承办人员'}（承办人员）`;
    if (stage.includes('分办') || stage.includes('审核') || stage.includes('公开')) return '王敏（分办人员）';
    if (stage.includes('办结')) return '王敏（复核人员）';
    return affair?.assigneeName ? `${affair.assigneeName}（办理人员）` : '王敏（办理人员）';
  };
  const timeline = progress.stages.map((stage, index) => {
    const nodeEvents = progress.events.filter((event, eventIndex) => Math.min(eventIndex, progress.current) === index);
    const completed = index < progress.current;
    const current = index === progress.current;
    const actor = nodeActor(stage, index);
    const records = nodeEvents.map((event) => `<div class="progress-node-record"><p>${escapeHtml(event.text)}</p><small class="progress-node-actor">操作人：${escapeHtml(event.actor || actor)}</small>${event.at ? `<time>${escapeHtml(event.at)}</time>` : ''}</div>`).join('');
    const currentDetail = current && progress.detail && !nodeEvents.some((event) => event.text === progress.detail) ? `<p class="progress-node-detail">${escapeHtml(progress.detail)}</p><small class="progress-node-actor">操作人：${escapeHtml(actor)}</small>` : '';
    return `<li class="${index <= progress.current ? 'done' : ''} ${current ? 'current' : ''} ${index > progress.current ? 'upcoming' : ''}"><i>${completed ? icon('check') : index + 1}</i><div><strong>${escapeHtml(stage)}</strong>${currentDetail}${records}</div></li>`;
  }).reverse().join('');
  return `<article class="mobile-page mobile-progress-detail"><section class="mobile-progress-detail-head"><span>${escapeHtml(post.board)}</span><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(meta)}</p><strong class="progress-status ${progress.tone}">${escapeHtml(staffProgressLabel(progress))}</strong></section><section class="mobile-progress-post"><h2>发帖信息</h2>${post.subtitle ? `<h3>${escapeHtml(post.subtitle)}</h3>` : ''}<p>${escapeHtml(post.body || post.excerpt || '')}</p></section><section class="mobile-progress-timeline"><h2>办理记录</h2><ol class="affair-progress-steps reverse">${timeline}</ol></section>${progress.canResubmit ? `<button type="button" class="mobile-progress-resubmit" onclick="AppPrototype.editRejectedPost('${escapeHtml(post.id)}')">${icon('pencil-line')} 修改后重新提交</button>` : ''}</article>`;
}

function renderMobilePersonalSection() {
  if (state.mobilePersonalSection === 'progress') {
    const data = PrototypeData.read();
    const posts = ownedStaffPosts(data);
    seedDemoProgressUpdates(data, posts);
    const unread = unreadStaffReplies(data);
    const { seen } = staffProgressSeen(data, posts);
    return `<div class="mobile-page mobile-personal-section mobile-progress-page"><section class="mobile-progress-summary"><span>个人进度</span><h1>办理进度</h1><p>查看本人发言的审核、分办、办理和回复状态。</p></section><section class="mobile-progress-list">${posts.map((post) => { const progress = staffPostProgress(post, data); const hasUpdate = seen[post.id] !== progressSignature(progress) || unread.some((item) => String(item.postId) === String(post.id)); return `<button type="button" onclick="AppPrototype.openPostProgress('${escapeHtml(post.id)}')"><div><span>${hasUpdate ? '<i aria-label="有更新"></i>' : ''}<b>${escapeHtml(post.board)}</b></span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(progress.detail)}</small></div><em class="progress-status ${progress.tone}">${escapeHtml(progress.label)}</em>${icon('chevron-right')}</button>`; }).join('') || '<p class="progress-empty">暂无发言进度</p>'}</section><footer class="feed-end"><span>共 ${posts.length} 条</span></footer></div>`;
  }
  if (state.mobilePersonalSection === 'posts') {
    const categories = staffProgressBoards;
    const active = categories.includes(state.personalPostCategory) ? state.personalPostCategory : categories[0];
    const posts = ownedStaffPosts().filter((post) => post.board === active);
    return `<div class="mobile-page mobile-personal-section"><nav class="mobile-segments mobile-sticky-tabs mobile-board-tabs">${categories.map((category) => `<button type="button" class="${active === category ? 'active' : ''}" onclick="AppPrototype.setPersonalPostCategory('${category}')">${category}</button>`).join('')}</nav><section class="mobile-feed mobile-personal-feed">${renderPersonalComments(posts)}</section></div>`;
  }
  if (state.mobilePersonalSection === 'favorites') {
    return `<div class="mobile-page mobile-personal-section"><section class="mobile-personal-list">${personalFavorites.map((item, index) => `<button type="button" onclick="AppPrototype.openPersonalFavorite(${index})"><span class="mobile-personal-type">${escapeHtml(item.category)}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.excerpt)}</p><small>${escapeHtml(item.detail)}</small>${icon('chevron-right')}</button>`).join('')}</section>${renderPersonalFavoriteDetail()}</div>`;
  }
  const categories = ['评论', '点赞', '举报'];
  const items = personalInteractions.filter((item) => item.type === state.personalInteractionCategory);
  return `<div class="mobile-page mobile-personal-section"><nav class="mobile-segments mobile-sticky-tabs">${categories.map((category) => `<button type="button" class="${state.personalInteractionCategory === category ? 'active' : ''}" onclick="AppPrototype.setPersonalInteractionCategory('${category}')">${category}</button>`).join('')}</nav><section class="mobile-personal-list">${items.map((item) => `<button type="button" onclick="AppPrototype.openInteractionDetail(${personalInteractions.indexOf(item)})"><span class="mobile-personal-type">${escapeHtml(item.type)}</span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small>${icon('chevron-right')}</button>`).join('')}</section>${renderInteractionDetail()}</div>`;
}

function renderMobileContent() {
  if (state.workspaceView === 'voices') return renderMobileVoices();
  if (state.workspaceView === 'policy') return renderMobilePolicy();
  if (state.workspaceView === 'notices') return renderMobileNotices();
  if (state.workspaceView === 'profile') return renderMobileProfile();
  return renderMobileHome();
}

function renderMobileBottomNav() {
  const items = [['dashboard', '首页', 'home'], ['voices', '心声', 'messages-square'], ['policy', '政策', 'book-open-check'], ['notices', '公告', 'bell'], ['profile', '我的', 'user-round']];
  return `<nav class="mobile-bottom-nav" aria-label="移动端主导航">${items.map(([id, label, iconName]) => `<button type="button" class="${state.workspaceView === id ? 'active' : ''}" onclick="AppPrototype.setWorkspaceView('${id}')">${icon(iconName)}<span>${label}</span>${id === 'notices' && homeNotices.some((notice) => !state.noticeRead[notice.id]) ? '<i></i>' : ''}</button>`).join('')}</nav>`;
}

function renderMobileWorkspace() {
  const canCompose = ['dashboard', 'voices'].includes(state.workspaceView);
  const detailOpen = (state.workspaceView === 'policy' && Boolean(state.policyDetailId || state.policyQuestionOpen || state.myPolicyQuestionsOpen || state.hotPolicyOpen)) || (state.workspaceView === 'notices' && Boolean(state.noticeDetailId)) || (state.workspaceView === 'profile' && Boolean(state.mobilePersonalSection));
  return `<div class="mobile-preview-stage"><section class="mobile-workspace role-staff">${renderMobileHeader()}<main class="mobile-main">${renderMobileContent()}</main>${canCompose ? `<button type="button" class="mobile-compose-fab" onclick="AppPrototype.openPostComposer()">${icon('pencil-line')}<span>我要发言</span></button>` : ''}${detailOpen ? '' : renderMobileBottomNav()}${renderRankingModal()}${state.staffDisplayMode === 'mobile' ? '' : renderHotPolicyModal()}${detailOpen ? '' : renderPolicyDetailModal()}${renderPolicyQuestionModal()}${renderMyPolicyQuestionsModal()}${renderPersonalEditModal()}${renderProgressListModal()}${state.staffDisplayMode === 'mobile' ? '' : renderAffairProgressModal()}${renderPostComposer()}</section></div>`;
}
