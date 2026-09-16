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
  if (state.workspaceView === 'policy' && state.policyDetailId) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回政策列表" onclick="AppPrototype.closePolicyDetail()">${icon('arrow-left')}<span>返回</span></button><strong>政策详情</strong><span></span></header>`;
  if (state.workspaceView === 'notices' && state.noticeDetailId) return `<header class="mobile-app-header mobile-detail-header"><button type="button" class="mobile-back-button" title="返回通知列表" onclick="AppPrototype.closeNoticeDetail()">${icon('arrow-left')}<span>返回</span></button><strong>通知详情</strong><span></span></header>`;
  return `<header class="mobile-app-header"><div class="mobile-brand"><span class="mobile-seal">湖北<br>供销</span><div><strong>湖北供销·心声</strong><small>${titles[state.workspaceView] || '职工服务'}</small></div></div><div class="mobile-header-actions"><button type="button" title="搜索" onclick="AppPrototype.notify()">${icon('search')}</button><button type="button" title="通知公告" onclick="AppPrototype.setWorkspaceView('notices')">${icon('bell')}<i>${homeNotices.filter((notice) => !state.noticeRead[notice.id]).length}</i></button><button type="button" title="退出移动端" onclick="AppPrototype.exitStaffMobile()">${icon('log-out')}</button></div></header>`;
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
  if (state.policyDetailId) return renderMobilePolicyDetail();
  const active = policyTabs.find(([id]) => id === state.policyTab) || policyTabs[0];
  const items = policyContent[active[0]];
  return `<div class="mobile-page mobile-knowledge"><section class="mobile-search-panel"><div><span>政策一键查询</span><h1>政策答疑与公开</h1></div><form onsubmit="AppPrototype.searchPolicy(event)">${icon('search')}<input id="policy-search" type="search" placeholder="搜索政策、问题或关键词"><button type="submit">搜索</button></form></section><nav class="mobile-segments mobile-sticky-tabs">${policyTabs.map(([id, label]) => `<button type="button" class="${state.policyTab === id ? 'active' : ''}" onclick="AppPrototype.setPolicyTab('${id}')">${label}</button>`).join('')}</nav>${active[0] === 'faq' ? renderPolicyQuestionTools() : ''}<section class="mobile-catalog"><header class="mobile-section-head"><div><span>${active[2]}</span><h2>${active[1]}</h2></div><small>${items.length} 条</small></header>${items.map((item) => `<button type="button" class="mobile-policy-row" onclick="AppPrototype.openPolicyDetail('${item.id}')"><span>${item.type}</span><div><strong>${item.title}</strong><small>${item.category} · ${item.department} · ${item.date}</small><p>${item.summary}</p></div>${icon('chevron-right')}</button>`).join('')}</section></div>`;
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
  return `<div class="mobile-page mobile-profile-page">${renderPersonalCenter()}</div>`;
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
  const detailOpen = (state.workspaceView === 'policy' && Boolean(state.policyDetailId)) || (state.workspaceView === 'notices' && Boolean(state.noticeDetailId));
  return `<div class="mobile-preview-stage"><section class="mobile-workspace role-staff">${renderMobileHeader()}<main class="mobile-main">${renderMobileContent()}</main>${canCompose ? `<button type="button" class="mobile-compose-fab" onclick="AppPrototype.openPostComposer()">${icon('pencil-line')}<span>我要发言</span></button>` : ''}${detailOpen ? '' : renderMobileBottomNav()}${renderRankingModal()}${detailOpen ? '' : renderPolicyDetailModal()}${renderPolicyQuestionModal()}${renderMyPolicyQuestionsModal()}${renderPersonalEditModal()}${renderProgressListModal()}${renderAffairProgressModal()}${renderPostComposer()}</section></div>`;
}
