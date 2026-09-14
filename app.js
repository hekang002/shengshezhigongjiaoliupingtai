const accounts = [
  { id: 'staff', phone: '13800002026', password: '123456', role: 'staff', name: '张晓雨', department: '合作指导处', status: 'approved' },
  { id: 'handler', phone: '13600002026', password: '123456', role: 'handler', name: '陈凯', department: '经济发展处', status: 'approved' },
  { id: 'handler-office', phone: '13600002027', password: '123456', role: 'handler', name: '刘敏', department: '办公室', status: 'approved' },
  { id: 'handler-cooperation', phone: '13600002028', password: '123456', role: 'handler', name: '周磊', department: '合作指导处', status: 'approved' },
  { id: 'admin', phone: '13500002026', password: '123456', role: 'admin', name: '王敏', department: '平台管理组', status: 'approved' },
  { id: 'leader', phone: '18800002026', password: '123456', role: 'leader', name: '李建国', department: '省社机关', status: 'approved' },
  { id: 'pending', phone: '13900002026', password: '123456', role: 'staff', name: '周宁', department: '待完善', status: 'pending', submitted: '2026-09-10 09:36' },
  { id: 'rejected', phone: '13700002026', password: '123456', role: 'staff', name: '孙晨', department: '待完善', status: 'rejected', submitted: '2026-09-09 14:18' }
];

const dashboards = {
  staff: {
    title: '职工工作台', desc: '查看个人提醒、交流动态和已提交事项的最新进展。',
    metrics: [['待办提醒', '3', '2 项待回复', 'warn'], ['我的发言', '12', '较上月 +4', ''], ['收到回复', '8', '本周新增 3 条', 'info'], ['已办结事项', '6', '办结率 86%', '']],
    listTitle: '与我相关', rows: [['关于优化机关食堂晚餐供应时段的建议', '已受理 · 办公室', '办理中', '今天 10:12'], ['县域冷链项目验收资料整理经验分享', '业务交流 · 12 条新回复', '交流中', '昨天 16:40'], ['新入职职工业务导师制度建议', '建言献策 · 等待受理', '待受理', '09-08']],
    insight: '本周交流提醒', insightText: '你关注的“县域冷链”话题新增 12 条高质量经验分享。', progress: [['我的事项办理进度', '72%'], ['本月互动完成度', '64%']], action: '查看我的帖子'
  },
  handler: {
    title: '承办工作台', desc: '聚焦待办事项、答复草稿和超期风险，推动办理闭环。',
    metrics: [['待办理事项', '12', '较昨日 +2', 'warn'], ['即将超期', '3', '请优先处置', 'warn'], ['答复草稿', '5', '2 份待提交', 'info'], ['本月办结', '28', '办结率 91%', '']],
    listTitle: '我的待办', rows: [['基层社农资配送时效问题', '限时：09 月 12 日 · 紧急', '即将超期', '09-10'], ['建议建立产销信息跨单位共享机制', '限时：09 月 15 日 · 合作指导处', '办理中', '09-10'], ['食堂晚餐供应时段优化建议', '待补充办理依据', '待补充', '09-09']],
    insight: '办理提示', insightText: '有 3 项事项将在 48 小时内到期，请优先补充办理意见。', progress: [['本月事项按期办结', '91%'], ['答复公开完成率', '76%']], action: '进入事项办理'
  },
  admin: {
    title: '平台管理工作台', desc: '统筹内容治理、账号审核和事项分办，维护平台平稳运行。',
    metrics: [['待审核内容', '8', '含 3 条评论', 'warn'], ['待分办事项', '6', '2 件需要确认', 'warn'], ['平台用户', '2,468', '本周新增 19 人', 'info'], ['今日访问', '386', '较昨日 +8.4%', '']],
    listTitle: '待处理事务', rows: [['新注册账号审核', '待审核 2 条 · 请核验手机号', '待审核', '今天 09:36'], ['“农资配送”事项分办建议', '来源：心声诉求板块', '待分办', '今天 08:52'], ['评论审核提醒', '含 1 条敏感表达待确认', '待审核', '昨天 17:20']],
    insight: '运行提示', insightText: '今日发布内容均已完成机审，人工审核队列保持在可控范围。', progress: [['内容审核及时率', '96%'], ['事项分办完成率', '88%']], action: '进入内容审核'
  },
  leader: {
    title: '领导运行视图', desc: '掌握平台运行、热点议题与重点事项闭环情况。',
    metrics: [['运行事项', '86', '本周新增 9 项', 'info'], ['闭环办结率', '92.6%', '较上月 +2.1%', ''], ['热点议题', '14', '3 项持续升温', 'warn'], ['重点事项', '5', '均在办理时限内', '']],
    listTitle: '重点事项', rows: [['基层社农资保供配送机制优化', '牵头：经济发展处 · 重点督办', '办理中', '09-10'], ['县域流通网络建设意见征集', '牵头：合作指导处 · 公开答复', '已答复', '09-09'], ['职工后勤服务满意度提升', '牵头：办公室 · 持续跟踪', '跟踪中', '09-08']],
    insight: '专题洞察', insightText: '“基层服务效率”本周讨论热度上升 23%，建议关注农资保供与配送协同。', progress: [['重点事项按期推进', '100%'], ['职工诉求闭环质量', '93%']], action: '查看专题分析'
  }
};

const policyBanners = [
  { title: '推进基层供销社高质量发展', summary: '围绕为农服务体系建设，明确本季度重点工作与协同要求。', tag: '政策解读', image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1600&q=82' },
  { title: '农产品流通体系建设行动要点', summary: '聚焦县域商业、冷链物流和产销对接，提升流通服务能力。', tag: '专项行动', image: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1600&q=82' },
  { title: '关于做好秋季农资保供工作的通知', summary: '加强货源组织和基层网点服务，保障重点地区农资稳定供应。', tag: '工作通知', image: 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e8?auto=format&fit=crop&w=1600&q=82' },
  { title: '再生资源回收网络建设指引', summary: '推动回收站点规范化、资源化与数字化协同发展。', tag: '行业指引', image: 'https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=1600&q=82' },
  { title: '职工服务与交流平台使用规范', summary: '明确发言边界、内容审核和互动处置，营造良好交流环境。', tag: '平台规则', image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=82' }
];

const portalPosts = [
  { id: 1, board: '建言献策', title: '建议建立农产品产销信息跨单位共享机制', excerpt: '市县供销社、基层网点与直属企业掌握的供需信息仍存在时间差，建议按周形成标准化供需清单，供相关单位及时对接使用。', content: ['目前，市县供销社、基层网点和直属企业掌握的供需信息分散在不同业务系统中，发布时间、统计口径和更新频率也不一致，实际对接时往往还需要反复核实。', '建议由合作指导处牵头统一信息模板，按周汇总主要农产品的品类、数量、规格、可供时间和目标区域，并明确各单位更新责任人及截止时间。', '对涉及采购、仓储和配送的跨单位事项，可同步增加承办联系人，形成“信息发布—需求确认—资源匹配—结果反馈”的闭环，减少重复沟通。'], media: { src: 'https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=82', alt: '农产品产销对接场景', caption: '统一供需信息口径，有助于基层网点与市场渠道及时对接。' }, author: '山野微风', time: '今天 09:24', likes: 42, favorites: 16, comments: 18, status: '已受理', commentList: [{ author: '合作指导处', text: '已纳入本周调研范围，正在汇总各单位情况。', status: '已通过' }] },
  { id: 2, board: '心声诉求', title: '关于优化机关食堂晚餐供应时段的建议', excerpt: '部分处室加班较多，现有晚餐领取时间偏早，希望结合实际用餐数据适当调整，满足加班职工的就餐需求。', author: '一盏清茶', time: '今天 08:47', likes: 27, favorites: 9, comments: 9, status: '办理中', commentList: [{ author: '办公室', text: '已纳入本周服务优化安排，后续将公布调整结果。', status: '已通过' }] },
  { id: 3, board: '业务交流', title: '县域冷链项目验收资料整理经验分享', excerpt: '整理了一套验收材料目录和常见退回原因，供近期负责同类项目的同事参考，也欢迎补充其他地区的有效做法。', author: '江城行者', time: '昨天 11:06', likes: 65, favorites: 34, comments: 22, status: '交流中', commentList: [{ author: '向阳而行', text: '目录很实用，已补充一份冷库设备验收清单。', status: '已通过' }] },
  { id: 4, board: '回音壁', title: '关于集中采购办公耗材配送周期问题的答复', excerpt: '经核查，已与供应商重新约定常用耗材补货时限，并建立缺货预警机制，后续将持续跟踪配送执行情况。', author: '办公室', time: '09 月 06 日', likes: 31, favorites: 11, comments: 6, status: '已答复', commentList: [{ author: '后勤服务组', text: '本周已完成第一轮补货，配送周期已缩短。', status: '已通过' }] },
  { id: 5, board: '建言献策', title: '关于完善基层社经营目标考核的建议', excerpt: '建议在统一考核框架下增加为农服务质量和基层网点覆盖指标，兼顾经营规模与服务成效，避免单一数量导向。', author: '基层同行', time: '今天 07:56', likes: 35, favorites: 14, comments: 12, status: '已受理' },
  { id: 6, board: '建言献策', title: '建立跨区域农产品品牌联合推广机制', excerpt: '可依托省级平台整合各地特色农产品资源，通过统一活动策划、渠道对接和内容传播，降低单个县域品牌推广成本。', author: '品牌观察', time: '昨天 17:18', likes: 48, favorites: 22, comments: 16, status: '已受理' },
  { id: 7, board: '建言献策', title: '优化基层网点数字化设备配置建议', excerpt: '部分基层网点终端设备使用年限较长，建议结合业务量和设备状态分批更新，并同步开展操作培训与运维保障。', author: '数字供销', time: '昨天 15:34', likes: 29, favorites: 10, comments: 8, status: '待受理' },
  { id: 8, board: '建言献策', title: '完善职工创新项目容错激励机制', excerpt: '建议对业务创新中非主观故意造成的问题建立容错清单，同时设置过程评价和成果转化奖励，鼓励基层主动探索。', author: '改革之声', time: '昨天 10:12', likes: 39, favorites: 19, comments: 14, status: '办理中' },
  { id: 9, board: '建言献策', title: '建立为农服务项目专家库建议', excerpt: '针对基层项目建设和技术服务需求，建议按农业技术、冷链物流、品牌运营等领域建立专家库，提供常态化咨询支持。', author: '田野智库', time: '09 月 09 日', likes: 33, favorites: 17, comments: 11, status: '已受理' },
  { id: 10, board: '建言献策', title: '推进社有企业青年人才双向交流', excerpt: '建议建立机关与社有企业、市县社之间的青年人才轮岗机制，明确周期、岗位任务和评价方式，促进经验互补。', author: '青春供销', time: '09 月 08 日', likes: 44, favorites: 21, comments: 19, status: '办理中' },
  { id: 11, board: '心声诉求', title: '关于改善基层社职工通勤保障的建议', excerpt: '部分基层网点公共交通覆盖不足，晚间值班通勤较为不便，希望结合实际调研优化班车线路或提供相应保障。', author: '基层小周', time: '昨天 16:42', likes: 25, favorites: 7, comments: 10, status: '办理中' },
  { id: 12, board: '心声诉求', title: '建议优化业务系统账号权限办理流程', excerpt: '新入职和岗位调整人员账号权限办理环节较多，建议明确线上申请材料与审批时限，减少重复提交和线下确认。', author: '系统用户', time: '昨天 13:28', likes: 18, favorites: 6, comments: 7, status: '已回复' },
  { id: 13, board: '心声诉求', title: '关于增设职工健康咨询服务的诉求', excerpt: '希望定期组织健康讲座和基础咨询，重点关注久坐办公、颈椎腰椎及心理健康问题，提升职工健康管理意识。', author: '健康同行', time: '09 月 09 日', likes: 37, favorites: 16, comments: 13, status: '已受理' },
  { id: 14, board: '心声诉求', title: '老旧办公楼饮水设备维护问题', excerpt: '部分楼层饮水设备制水速度较慢，偶有故障提示，希望增加巡检频次并明确报修后的响应时限。', author: '楼层守望', time: '09 月 09 日', likes: 16, favorites: 4, comments: 5, status: '办理中' },
  { id: 15, board: '心声诉求', title: '关于优化出差报销审批流程的建议', excerpt: '部分公务出差存在材料重复填写和审批节点较多的问题，建议进一步打通业务系统数据，提升报销办理效率。', author: '轻装出行', time: '09 月 08 日', likes: 30, favorites: 12, comments: 11, status: '待受理' },
  { id: 16, board: '心声诉求', title: '基层社职工培训名额分配建议', excerpt: '建议结合岗位需求和个人发展意愿分配培训名额，并向长期在基层一线工作的职工适当倾斜，增强培训实效。', author: '成长计划', time: '09 月 07 日', likes: 28, favorites: 10, comments: 9, status: '已回复' },
  { id: 17, board: '业务交流', title: '农资集采集配降本增效做法分享', excerpt: '通过汇总区域内基层网点需求、统一谈判采购和优化配送路线，有效降低单品采购成本并缩短到货周期。', author: '农资先锋', time: '昨天 18:06', likes: 58, favorites: 31, comments: 25, status: '交流中' },
  { id: 18, board: '业务交流', title: '再生资源回收网点运营数据复盘', excerpt: '结合近三个月回收品类、周转效率和人员配置数据，梳理网点经营中的主要波动原因与可优化环节。', author: '绿源先锋', time: '昨天 14:26', likes: 41, favorites: 23, comments: 15, status: '交流中' },
  { id: 19, board: '业务交流', title: '县域流通项目节点管理经验', excerpt: '围绕项目立项、招标、建设、验收等关键节点建立周清单和风险提示机制，便于各方及时掌握推进状态。', author: '项目管家', time: '昨天 09:51', likes: 47, favorites: 26, comments: 18, status: '交流中' },
  { id: 20, board: '业务交流', title: '基层社资产盘活中的税务处理交流', excerpt: '整理了资产租赁、合作经营和产权转让等常见情形涉及的税务处理要点，供各基层社结合实际参考。', author: '财税同行', time: '09 月 09 日', likes: 36, favorites: 29, comments: 14, status: '交流中' },
  { id: 21, board: '业务交流', title: '农产品品牌共建案例与问题清单', excerpt: '梳理多地区联合品牌建设中的授权管理、质量标准、渠道分工和利益联结机制，方便后续项目对照使用。', author: '品牌服务组', time: '09 月 08 日', likes: 52, favorites: 28, comments: 20, status: '交流中' },
  { id: 22, board: '业务交流', title: '农业社会化服务项目验收要点', excerpt: '结合项目验收常见问题，整理服务台账、作业记录、满意度评价和资金使用材料的核对要点。', author: '服务观察员', time: '09 月 07 日', likes: 43, favorites: 24, comments: 17, status: '交流中' },
  { id: 23, board: '回音壁', title: '关于基层社网点设备更新问题的答复', excerpt: '已组织相关单位摸底设备使用情况，后续将按照急用先行、分批实施的原则推进更新，并同步完善运维支持。', author: '合作指导处', time: '昨天 16:08', likes: 34, favorites: 13, comments: 8, status: '已答复' },
  { id: 24, board: '回音壁', title: '关于职工培训名额分配问题的答复', excerpt: '后续培训名额分配将兼顾岗位需求、基层一线和职工发展意愿，具体规则将在每期培训通知中同步说明。', author: '人事处', time: '昨天 12:30', likes: 26, favorites: 9, comments: 6, status: '已答复' },
  { id: 25, board: '回音壁', title: '业务系统权限流程优化处理结果', excerpt: '已完成账号权限申请材料梳理，线上审批流程正在调整，计划于本月内上线试运行并收集使用反馈。', author: '平台管理组', time: '09 月 09 日', likes: 22, favorites: 8, comments: 5, status: '已办结' },
  { id: 26, board: '回音壁', title: '职工通勤保障诉求办理进展', excerpt: '已收集相关基层网点通勤线路和时间数据，正在与交通服务单位沟通可行的优化方案。', author: '办公室', time: '09 月 08 日', likes: 19, favorites: 6, comments: 4, status: '已答复' }
].map((post) => ({ ...post, commentList: post.commentList || [{ author: '平台管理组', text: '内容已收到，相关单位将结合实际工作跟进。', status: '已通过' }] }));

const homeNotices = [
  { id: 'notice-1', channel: '其他', category: '其他', icon: 'book-open', title: '平台发言与信息发布规范（试行）', summary: '请按平台规范发布内容，涉及业务材料时注意信息安全和隐私保护。', meta: '社区规则 · 09-10' },
  { id: 'notice-2', channel: '建言献策', category: '建言献策', icon: 'shield-check', title: '职工交流平台内容审核规范', summary: '了解内容审核范围、处理方式和申诉反馈渠道，保障交流内容及时被看见。', meta: '内容规范 · 09-09' },
  { id: 'notice-3', channel: '心声诉求', category: '心声诉求', icon: 'lock-keyhole', title: '平台个人信息与隐私保护说明', summary: '平台将按最小必要原则处理账号信息和互动数据，请查看相关保护说明。', meta: '隐私说明 · 09-08' },
  { id: 'notice-4', channel: '其他', category: '其他', icon: 'user-round-check', title: '匿名发言使用与保护说明', summary: '匿名发言仍需遵守平台规则，平台将依法依规保护合理诉求和个人隐私。', meta: '匿名说明 · 09-07' },
  { id: 'notice-5', channel: '回音壁', category: '回音壁', icon: 'clipboard-check', title: '问题整改反馈公开说明', summary: '共性问题的办理结果、整改措施和公开进展将持续在平台同步。', meta: '整改公示 · 09-06' },
  { id: 'notice-6', channel: '业务交流', category: '业务交流', icon: 'megaphone', title: '为农服务重点工作交流提示', summary: '欢迎围绕基层服务、县域流通和产销对接补充一线经验与可行建议。', meta: '工作动态 · 09-05' }
];

const personalPostIds = [1, 8, 16];
const personalComments = personalPostIds;
const personalPostRecords = {
  1: { publication: '公开发布', reviewed: true, shares: 6, reports: 0 },
  8: { publication: '私密发布', reviewed: true, shares: 2, reports: 0 },
  16: { publication: '私密发布', reviewed: true, shares: 1, reports: 0 }
};
const personalAffairs = [
  { title: '建议建立农产品产销信息跨单位共享机制', category: '建言献策', status: '已受理', update: '合作指导处已受理 · 今天 09:24', step: '正在汇总各单位供需信息' },
  { title: '关于优化机关食堂晚餐供应时段的建议', category: '心声诉求', status: '办理中', update: '办公室办理中 · 今天 10:12', step: '正在结合用餐数据研究调整方案' },
  { title: '新入职职工业务导师制度建议', category: '建言献策', status: '待办理', update: '我发布的内容', step: '等待承办部门受理' },
  { title: '办公耗材配送周期问题反馈', category: '回音壁', status: '已回复', update: '已收到办理答复', step: '承办部门已反馈办理结果' },
  { title: '业务系统账号权限流程优化', category: '心声诉求', status: '办理中', update: '平台管理组办理', step: '正在核对账号权限流程' },
  { title: '基层职工培训名额分配建议', category: '建言献策', status: '已回复', update: '人事处已答复', step: '承办部门已反馈办理结果' },
  { title: '基层社职工通勤保障建议', category: '心声诉求', status: '待办理', update: '等待受理', step: '等待承办部门受理' }
];
const personalInteractions = [
  { type: '评论', title: '县域冷链项目验收资料整理经验分享', detail: '评论已通过审核 · 昨天 16:40', icon: 'message-circle' },
  { type: '点赞', title: '农资保供配送如何打通村级服务末端', detail: '已点赞 · 昨天 14:22', icon: 'thumbs-up' },
  { type: '举报', title: '某条不当信息', detail: '处理中 · 09 月 07 日', icon: 'flag' }
];
const personalFavorites = [
  { title: '建立新入职职工业务导师制度', category: '建言献策', detail: '青年新锐 · 13 条讨论 · 09 月 08 日', excerpt: '围绕新入职职工的岗位适应和经验传承，建议建立周期明确、评价清晰的业务导师制度。' },
  { title: '县域冷链项目验收资料整理经验分享', category: '业务交流', detail: '江城行者 · 22 条讨论 · 昨天 16:40', excerpt: '整理了一套验收材料目录和常见退回原因，供近期负责同类项目的同事参考。' }
];


const policyTabs = [
  ['policy', '政策解读', '按分类查看政策文件、制度口径、办事指引及关联附件。'],
  ['faq', '常见问答', '查看统一发布的常见问题及标准答复。'],
  ['rectification', '整改公开', '查看共性问题办理结果、整改措施及公开进展。']
];

const policyContent = {
  policy: [
    { id: 'policy-1', type: '政策文件', title: '湖北省供销合作社系统农业社会化服务工作指引', category: '为农服务', department: '合作指导处', date: '2026-09-08', summary: '明确服务主体、服务内容、项目实施和台账管理要求。', content: '围绕农业社会化服务项目实施，统一服务流程、质量要求和资料归档口径，为市县供销社及基层服务主体开展工作提供操作依据。', attachment: '农业社会化服务工作指引.pdf' },
    { id: 'policy-2', type: '制度口径', title: '省社机关差旅费管理制度口径说明', category: '财务管理', department: '财务资产处', date: '2026-09-06', summary: '说明差旅审批、交通住宿标准和报销材料要求。', content: '出差人员应履行事前审批程序，并按照规定等级选择交通工具和住宿标准。报销时需提交审批单、行程凭证和合法票据。', attachment: '差旅费报销材料清单.docx' },
    { id: 'policy-3', type: '办事指引', title: '基层社项目申报操作指引（2026 年版）', category: '项目申报', department: '经济发展处', date: '2026-09-03', summary: '梳理项目申报条件、材料清单、审核节点及反馈方式。', content: '申报单位应对照年度项目通知准备申报表、实施方案、资金预算和必要证明材料，并在规定时间内通过统一入口提交。', attachment: '基层社项目申报材料模板.zip' },
    { id: 'policy-4', type: '政策文件', title: '县域流通服务网络建设重点任务清单', category: '流通服务', department: '经济发展处', date: '2026-08-29', summary: '明确县域集采集配、冷链物流和基层网点建设重点任务。', content: '重点推进县域集采集配中心、乡镇综合服务站和村级服务网点协同建设，完善农产品上行与生活资料下行双向流通体系。', attachment: '县域流通服务网络任务清单.pdf' }
  ],
  faq: [
    { id: 'faq-1', type: '常见问答', title: '基层社项目申报需要准备哪些材料？', category: '项目申报', department: '经济发展处', date: '2026-09-07', summary: '统一说明申报表、实施方案、预算和相关证明材料要求。', answer: '申报单位应按通知要求提交项目申报表、实施方案、资金预算及必要的资质证明材料。具体格式以当年度申报通知所附模板为准。' },
    { id: 'faq-2', type: '常见问答', title: '差旅报销附件需要保留哪些材料？', category: '财务管理', department: '财务资产处', date: '2026-09-05', summary: '说明审批单、行程凭证、住宿票据等材料要求。', answer: '应保留出差审批单、交通行程凭证、住宿发票及公务卡支付记录等材料；发生特殊情况的，还应附情况说明和相应审批依据。' },
    { id: 'faq-3', type: '常见问答', title: '职工参加业务培训如何登记学时？', category: '教育培训', department: '人事处', date: '2026-09-02', summary: '明确培训学时登记入口、证明材料和审核时限。', answer: '培训结束后，由职工提交培训通知、签到或结业证明等材料，经所在处室确认后统一登记。线上培训按平台生成的有效学习记录核定。' },
    { id: 'faq-4', type: '常见问答', title: '跨单位共享业务数据应履行什么手续？', category: '数据管理', department: '信息中心', date: '2026-08-28', summary: '说明数据用途、共享范围和安全责任确认要求。', answer: '申请单位应明确数据用途、使用范围、使用期限和责任人，经数据归口部门审核后按最小必要原则授权。涉及敏感信息的，应先完成脱敏处理。' }
  ],
  rectification: [
    { id: 'rectification-1', type: '整改公开', title: '基层报销材料重复提交问题整改情况', category: '财务管理', department: '财务资产处', date: '2026-09-05', summary: '统一材料清单，减少重复填报和线下确认。', result: '已完成重复材料梳理并形成统一清单。', measure: '调整线上表单字段，明确一次提交、多环节复用。', progress: '已完成' },
    { id: 'rectification-2', type: '整改公开', title: '项目申报结果反馈不及时问题整改进展', category: '项目申报', department: '经济发展处', date: '2026-09-03', summary: '明确反馈时限，并增加关键节点提醒。', result: '已统一项目受理、初审和结果反馈时限。', measure: '在申报台账中增加节点负责人和到期提醒，结果形成后统一反馈。', progress: '整改中' },
    { id: 'rectification-3', type: '整改公开', title: '职工培训学时登记口径不统一整改情况', category: '教育培训', department: '人事处', date: '2026-08-31', summary: '统一登记字段、证明材料和审核标准。', result: '已发布统一登记说明并完成历史数据复核。', measure: '统一线上登记模板，由各处室指定专人按月核对。', progress: '已完成' },
    { id: 'rectification-4', type: '整改公开', title: '基层网点业务系统账号开通较慢整改进展', category: '数据管理', department: '信息中心', date: '2026-08-27', summary: '压缩账号申请环节，明确受理和反馈时限。', result: '已取消重复确认环节，账号申请材料由五项压缩至三项。', measure: '建立统一申请入口，申请状态由系统自动提醒经办人。', progress: '整改中' }
  ]
};

const discussionRankings = [
  { id: 'd1', board: '业务交流', title: '县域冷链项目验收资料整理经验分享', meta: '江城行者 · 22 条讨论', essenceScore: 46, heatScore: 42, updated: '今天 11:06' },
  { id: 'd2', board: '建言献策', title: '建议建立农产品产销信息跨单位共享机制', meta: '山野微风 · 18 条讨论', essenceScore: 45, heatScore: 40, updated: '今天 09:24' },
  { id: 'd3', board: '业务交流', title: '农资保供配送如何打通村级服务末端', meta: '田野新声 · 31 条讨论', essenceScore: 40, heatScore: 44, updated: '今天 08:38' },
  { id: 'd4', board: '经验分享', title: '基层社农产品产销对接的三种有效模式', meta: '供销观察员 · 26 条讨论', essenceScore: 44, heatScore: 39, updated: '昨天 17:20' },
  { id: 'd5', board: '建言献策', title: '建立新入职职工业务导师制度', meta: '青年新锐 · 13 条讨论', essenceScore: 48, heatScore: 33, updated: '昨天 15:42' },
  { id: 'd6', board: '业务交流', title: '再生资源回收网点数字化改造要点', meta: '绿源先锋 · 19 条讨论', essenceScore: 41, heatScore: 38, updated: '昨天 13:18' },
  { id: 'd7', board: '经验分享', title: '乡镇基层社闲置资产盘活案例复盘', meta: '荆楚合作人 · 17 条讨论', essenceScore: 43, heatScore: 35, updated: '09 月 09 日' },
  { id: 'd8', board: '业务交流', title: '县域流通网络建设中的仓配协同经验', meta: '城乡连线 · 24 条讨论', essenceScore: 37, heatScore: 40, updated: '09 月 09 日' },
  { id: 'd9', board: '心声诉求', title: '关于优化机关食堂晚餐供应时段的建议', meta: '一盏清茶 · 9 条讨论', essenceScore: 36, heatScore: 39, updated: '09 月 09 日' },
  { id: 'd10', board: '经验分享', title: '农产品区域公用品牌共建的协作路径', meta: '品牌服务组 · 15 条讨论', essenceScore: 42, heatScore: 32, updated: '09 月 08 日' },
  { id: 'd11', board: '业务交流', title: '青年职工跨单位轮岗交流实践建议', meta: '青春供销 · 12 条讨论', essenceScore: 39, heatScore: 34, updated: '09 月 08 日' },
  { id: 'd12', board: '经验分享', title: '为农服务中心运营质效提升清单', meta: '基层服务处 · 21 条讨论', essenceScore: 38, heatScore: 34, updated: '09 月 07 日' },
  { id: 'd13', board: '业务交流', title: '农业社会化服务标准衔接问题讨论', meta: '合作经济研究 · 16 条讨论', essenceScore: 40, heatScore: 30, updated: '09 月 07 日' },
  { id: 'd14', board: '建言献策', title: '社有企业财务共享协作机制建议', meta: '财务同行 · 11 条讨论', essenceScore: 37, heatScore: 31, updated: '09 月 06 日' },
  { id: 'd15', board: '业务交流', title: '基层网点农资库存预警经验交流', meta: '农资服务岗 · 14 条讨论', essenceScore: 36, heatScore: 31, updated: '09 月 06 日' },
  { id: 'd16', board: '建言献策', title: '完善县域农产品采购需求发布机制', meta: '市场运营组 · 10 条讨论', essenceScore: 38, heatScore: 28, updated: '09 月 05 日' },
  { id: 'd17', board: '经验分享', title: '基层社直播助农活动复盘', meta: '电商服务站 · 18 条讨论', essenceScore: 34, heatScore: 31, updated: '09 月 05 日' },
  { id: 'd18', board: '业务交流', title: '农产品质量追溯台账填报要点', meta: '质量管理组 · 9 条讨论', essenceScore: 35, heatScore: 28, updated: '09 月 04 日' },
  { id: 'd19', board: '建言献策', title: '优化乡镇服务网点业务协同建议', meta: '一线职工 · 8 条讨论', essenceScore: 33, heatScore: 28, updated: '09 月 04 日' },
  { id: 'd20', board: '业务交流', title: '秋季农资配送路线优化交流', meta: '配送中心 · 12 条讨论', essenceScore: 32, heatScore: 27, updated: '09 月 03 日' }
];

const affairRankings = [
  { id: 'a1', title: '基层社农资保供配送机制优化', meta: '经济发展处 · 办理中', essenceScore: 48, progressScore: 46, updated: '今天 10:26' },
  { id: 'a2', title: '县域流通网络建设意见征集', meta: '合作指导处 · 已答复', essenceScore: 45, progressScore: 47, updated: '今天 09:48' },
  { id: 'a3', title: '职工后勤服务满意度提升', meta: '办公室 · 跟踪中', essenceScore: 43, progressScore: 44, updated: '今天 08:52' },
  { id: 'a4', title: '新入职职工业务导师制度建议', meta: '人事处 · 办理中', essenceScore: 46, progressScore: 40, updated: '昨天 16:10' },
  { id: 'a5', title: '农产品产销信息跨单位共享机制', meta: '合作指导处 · 已受理', essenceScore: 44, progressScore: 41, updated: '昨天 14:35' },
  { id: 'a6', title: '机关食堂晚餐供应时段优化', meta: '办公室 · 已回复', essenceScore: 40, progressScore: 43, updated: '昨天 11:20' },
  { id: 'a7', title: '办公耗材配送周期问题答复', meta: '后勤服务组 · 已办结', essenceScore: 36, progressScore: 46, updated: '09 月 09 日' },
  { id: 'a8', title: '再生资源回收站点规范化改造', meta: '经济发展处 · 办理中', essenceScore: 42, progressScore: 39, updated: '09 月 09 日' },
  { id: 'a9', title: '农产品冷链设施共建需求协调', meta: '合作指导处 · 已分办', essenceScore: 41, progressScore: 39, updated: '09 月 08 日' },
  { id: 'a10', title: '基层社经营人才专项培训', meta: '人事处 · 推进中', essenceScore: 38, progressScore: 41, updated: '09 月 08 日' },
  { id: 'a11', title: '社有企业内控流程优化建议', meta: '财务审计处 · 办理中', essenceScore: 39, progressScore: 38, updated: '09 月 07 日' },
  { id: 'a12', title: '职工心理健康服务资源补充', meta: '机关党委 · 已受理', essenceScore: 37, progressScore: 39, updated: '09 月 07 日' },
  { id: 'a13', title: '平台内容审核指引修订', meta: '平台管理组 · 已答复', essenceScore: 35, progressScore: 40, updated: '09 月 06 日' },
  { id: 'a14', title: '重点农资价格监测机制完善', meta: '经济发展处 · 推进中', essenceScore: 40, progressScore: 34, updated: '09 月 06 日' },
  { id: 'a15', title: '基层网点数字设备更新计划', meta: '合作指导处 · 已分办', essenceScore: 37, progressScore: 36, updated: '09 月 05 日' },
  { id: 'a16', title: '县域冷链项目验收资料优化', meta: '经济发展处 · 办理中', essenceScore: 35, progressScore: 37, updated: '09 月 05 日' },
  { id: 'a17', title: '职工培训名额分配规则调整', meta: '人事处 · 已回复', essenceScore: 34, progressScore: 36, updated: '09 月 04 日' },
  { id: 'a18', title: '业务系统账号权限流程优化', meta: '平台管理组 · 推进中', essenceScore: 36, progressScore: 33, updated: '09 月 04 日' },
  { id: 'a19', title: '基层职工通勤保障需求协调', meta: '办公室 · 已受理', essenceScore: 33, progressScore: 34, updated: '09 月 03 日' },
  { id: 'a20', title: '办公区域饮水设备维护安排', meta: '后勤服务组 · 已办结', essenceScore: 31, progressScore: 35, updated: '09 月 03 日' }
];

const affairBoardById = {
  a1: '业务交流', a2: '建言献策', a3: '心声诉求', a4: '建言献策', a5: '建言献策',
  a6: '心声诉求', a7: '回音壁', a8: '业务交流', a9: '心声诉求', a10: '业务交流',
  a11: '建言献策', a12: '心声诉求', a13: '业务交流', a14: '建言献策', a15: '心声诉求',
  a16: '业务交流', a17: '建言献策', a18: '业务交流', a19: '心声诉求', a20: '回音壁'
};

const rankFormula = {
  discussion: { title: '精华贴', formula: '精华分 + 讨论热度分', scoreKey: 'heatScore', scoreLabel: '热度' },
  progress: { title: '本周热议', formula: '精华分 + 事项推进分', scoreKey: 'progressScore', scoreLabel: '推进' }
};

function getRankingItems(type) {
  const items = type === 'discussion' ? discussionRankings : affairRankings;
  const scoreKey = rankFormula[type].scoreKey;
  return [...items].sort((a, b) => (b.essenceScore + b[scoreKey]) - (a.essenceScore + a[scoreKey]) || a.title.localeCompare(b.title, 'zh-CN'));
}

function rankingItemToPost(item, type, index) {
  const isDiscussion = type === 'discussion';
  const existingPost = portalPosts.find((post) => post.title === item.title);
  const metaParts = item.meta.split(' · ');
  const scoreKey = rankFormula[type].scoreKey;
  const total = item.essenceScore + item[scoreKey];
  return {
    ...(existingPost || {}),
    id: (isDiscussion ? 1000 : 2000) + index,
    board: existingPost?.board || item.board || (isDiscussion ? '精华贴' : affairBoardById[item.id]),
    title: item.title,
    excerpt: existingPost?.excerpt || (isDiscussion
      ? `该内容精华分 ${item.essenceScore}、讨论热度分 ${item.heatScore}，综合得分 ${total}。围绕相关业务实践和一线经验展开交流。`
      : `该事项精华分 ${item.essenceScore}、推进分 ${item.progressScore}，综合得分 ${total}。当前正按责任分工持续推进办理。`),
    author: existingPost?.author || metaParts[0],
    time: item.updated,
    likes: existingPost?.likes ?? item.essenceScore,
    favorites: existingPost?.favorites ?? Math.max(6, Math.round(item.essenceScore / 2)),
    comments: existingPost?.comments ?? (isDiscussion ? Number.parseInt(metaParts[1], 10) || item.heatScore : item.progressScore),
    status: existingPost?.status || (isDiscussion ? '精华' : metaParts[1] || '推进中'),
    commentList: existingPost?.commentList || [{ author: '平台管理组', text: '欢迎结合实际工作补充意见和办理建议。', status: '已通过' }]
  };
}

const roleMeta = { staff: ['职工', 'user-round'], handler: ['承办', 'briefcase-business'], admin: ['管理', 'shield-check'], leader: ['领导', 'chart-spline'] };
const MANAGEMENT_APP_URL = new URL('管理端原型设计/?v=20260914-account-center', document.baseURI).href;
function openHandlerWorkspace(account) { sessionStorage.setItem('prototype-handler-account-id', account.id); const url = new URL(MANAGEMENT_APP_URL); url.searchParams.set('role', 'handler'); window.location.href = url.href; }
function openManagementWorkspace(roleOrAccount) { const account = typeof roleOrAccount === 'string' ? accounts.find((item) => item.role === roleOrAccount && item.status === 'approved') : roleOrAccount; if (!account) return showToast('暂无可用的演示账号。'); const role = account.role === 'admin' ? 'platform' : account.role; sessionStorage.setItem('prototype-management-account-id', account.id); if (role === 'handler') sessionStorage.setItem('prototype-handler-account-id', account.id); const url = new URL(MANAGEMENT_APP_URL); url.searchParams.set('role', role); window.location.href = url.href; }
const state = { view: 'login', loginMode: 'password', error: '', notice: '', session: null, staffDisplayMode: 'desktop', workspaceView: 'dashboard', profileOpen: false, accountCenterOpen: false, accountCenterTab: 'basic', personalTab: 'posts', personalPostCategory: '全部', personalExpandedPostId: null, personalEditOpen: false, postComposerOpen: false, smsRemaining: 0, portalTab: '全部', homeContentTab: '全部', policyTab: 'policy', policyDetailId: null, bannerDetail: null, noticeTab: '全部', noticeRead: {}, bannerIndex: 0, postActions: {}, expandedPostId: null, commentPostId: null, reportPostId: null, replyTarget: '', rankModal: null };
const icon = (name) => `<i data-lucide="${name}" class="icon"></i>`;
const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
const byId = (id) => document.getElementById(id);
const phoneValue = (value) => (value || '').replace(/\s/g, '');
const validatePhone = (value) => /^1\d{10}$/.test(phoneValue(value));
const validateSms = (value) => value === '202608';
const setState = (next) => { Object.assign(state, next); render(); };

function showToast(message) { const toast = byId('toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300); }
function field(label, id, placeholder, iconName, type = 'text', action = '', value = '') { return `<div class="field"><div class="field-label"><label for="${id}">${label}</label></div><div class="input-box">${icon(iconName)}<input id="${id}" type="${type}" autocomplete="off" placeholder="${placeholder}" value="${escapeHtml(value)}">${action}</div></div>`; }
function renderStatus() { return state.error ? `<div class="form-error">${escapeHtml(state.error)}</div>` : state.notice ? `<div class="form-notice">${escapeHtml(state.notice)}</div>` : '<div class="form-error"></div>'; }

function renderBrand() { return `<section class="brand-panel"><div class="brand-bar"><div class="seal">湖北<br>供销</div><div class="brand-title"><strong>湖北供销·心声</strong><span>湖北省供销合作总社职工交流平台</span></div></div><div class="brand-copy"><div class="eyebrow-light">服务“三农” · 连接城乡 · 合作共赢</div><h1>湖北供销·心声</h1><p class="slogan">让每一条真实声音，都有回应。</p><p>面向湖北省供销合作系统，沉淀为农服务、综合改革、县域流通与再生资源等业务经验，推动问题被看见、被办理、被反馈。</p></div><div class="brand-feature"><div><strong>2,468</strong>平台职工</div><div><strong>92.6%</strong>事项闭环率</div><div><strong>86</strong>运行事项</div></div><div class="brand-foot">内部工作平台 · 请勿发布涉密文件及敏感数据</div></section>`; }
function renderTabs() { return `<div class="auth-tabs" role="tablist"><button class="${state.loginMode === 'password' ? 'active' : ''}" type="button" onclick="AppPrototype.setLoginMode('password')">账号密码登录</button><button class="${state.loginMode === 'sms' ? 'active' : ''}" type="button" onclick="AppPrototype.setLoginMode('sms')">短信验证码登录</button></div>`; }
function renderRoleLaunchers() { return `<div class="login-rule">角色演示入口</div><div class="role-launchers"><button type="button" class="role-launcher mobile-role-launcher" onclick="AppPrototype.launchStaffMobile()">${icon('smartphone')}<strong>职工移动端</strong><span>直接进入</span></button>${Object.entries(roleMeta).map(([role, [label, iconName]]) => role === 'admin' ? `<button type="button" class="role-launcher" onclick="window.location.href=MANAGEMENT_APP_URL">${icon(iconName)}<strong>${label}视图</strong><span>进入管理端</span></button>` : ['handler', 'leader'].includes(role) ? `<button type="button" class="role-launcher" onclick="AppPrototype.openManagementWorkspace('${role}')">${icon(iconName)}<strong>${label}视图</strong><span>进入管理端</span></button>` : `<button type="button" class="role-launcher" onclick="AppPrototype.prefillRole('${role}')">${icon(iconName)}<strong>${label}视图</strong><span>载入账号</span></button>`).join('')}</div>`; }
function renderLogin() { const loginFields = state.loginMode === 'password' ? `${field('账号或手机号', 'identifier', '例如：staff 或 13800002026', 'user-round', 'text', '', 'staff')}${field('登录密码', 'password', '请输入登录密码', 'lock-keyhole', 'password', '', '123456')}` : `${field('手机号码', 'phone', '请输入已审核通过的手机号码', 'smartphone')}${field('短信验证码', 'sms', '演示验证码：202608', 'message-square', 'text', '<button type="button" class="sms-button" onclick="AppPrototype.sendSms()">获取验证码</button>')}`; return `<div class="auth-card"><div class="auth-kicker">WELCOME TO THE PLATFORM</div><h2>登录平台</h2><p class="auth-description">请选择登录方式，验证身份后进入对应工作视图。</p>${renderTabs()}${loginFields}${renderStatus()}<button class="form-command" type="button" onclick="AppPrototype.submitLogin()">登录</button><div class="auth-links"><button class="link-button" type="button" onclick="AppPrototype.setView('reset')">忘记密码</button><button class="link-button" type="button" onclick="AppPrototype.setView('register')">账号申请与审核查询 <span aria-hidden="true">→</span></button></div>${renderRoleLaunchers()}<p class="auth-help">已默认填入职工演示账号 staff 和密码 123456。注册申请提交后，需由管理员审核通过。</p></div>`; }
function renderRegister() { return `<div class="auth-card"><div class="auth-kicker">ACCOUNT APPLICATION & STATUS</div><h2>账号申请与审核查询</h2><p class="auth-description">可查询已有申请的审核结果，或提交新的职工账号申请。</p><section class="query-box"><strong>查询审核状态</strong><p>输入注册手机号，查看账号是否已审核通过。</p><div class="query-actions"><div class="input-box">${icon('smartphone')}<input id="queryPhone" autocomplete="off" placeholder="请输入注册手机号"></div><button type="button" onclick="AppPrototype.queryApproval()">查询状态</button></div></section><div class="auth-section-rule">提交账号申请</div>${field('手机号码', 'registerPhone', '请输入常用手机号码', 'smartphone')}${field('申请部门', 'registerDepartment', '请输入所属部门', 'building-2')}${field('设置密码', 'registerPassword', '不少于 6 位', 'lock-keyhole', 'password')}${field('确认密码', 'registerConfirm', '请再次输入登录密码', 'lock-keyhole', 'password')}${field('短信验证码', 'registerSms', '演示验证码：202608', 'message-square', 'text', '<button type="button" class="sms-button" onclick="AppPrototype.sendSms()">获取验证码</button>')}${renderStatus()}<button class="form-command" type="button" onclick="AppPrototype.submitRegistration()">提交注册申请</button><div class="auth-links"><button class="link-button" type="button" onclick="AppPrototype.setView('login')">← 返回登录</button></div><p class="auth-help">审核通过后，可使用账号密码或短信验证码进入职工视图。</p></div>`; }
function renderReset() { return `<div class="auth-card"><div class="auth-kicker">RESET YOUR PASSWORD</div><h2>忘记密码</h2><p class="auth-description">仅限已审核通过的账号使用短信验证码重置密码。</p>${field('手机号码', 'resetPhone', '请输入已审核通过的手机号码', 'smartphone')}${field('短信验证码', 'resetSms', '演示验证码：202608', 'message-square', 'text', '<button type="button" class="sms-button" onclick="AppPrototype.sendSms()">获取验证码</button>')}${field('新密码', 'resetPassword', '不少于 6 位', 'lock-keyhole', 'password')}${field('确认新密码', 'resetConfirm', '请再次输入新密码', 'lock-keyhole', 'password')}${renderStatus()}<button class="form-command" type="button" onclick="AppPrototype.submitReset()">确认重置密码</button><div class="auth-links"><button class="link-button" type="button" onclick="AppPrototype.setView('login')">← 返回登录</button></div></div>`; }
function renderAuth() { const content = state.view === 'register' ? renderRegister() : state.view === 'reset' ? renderReset() : renderLogin(); return `<div class="auth-shell">${renderBrand()}<section class="form-panel">${content}</section></div>`; }

function getAccount(identifier) { const value = phoneValue(identifier); return accounts.find((account) => account.id === value || account.phone === value); }
function authError(message) { setState({ error: message, notice: '' }); }
function clearFeedback() { state.error = ''; state.notice = ''; }
function recordLogin(account, result, message, method = state.loginMode) { const data = PrototypeData.read(); data.loginLogs.unshift({ account: account || '未识别账号', platform: '统一登录页', method: method === 'sms' ? '短信验证码' : '账号密码', result, message, at: new Date().toLocaleString('sv-SE', { hour12: false }) }); PrototypeData.save(data); }
function submitLogin() { clearFeedback(); let account, identifier; if (state.loginMode === 'password') { identifier = byId('identifier')?.value.trim(); const password = byId('password')?.value; if (!identifier || !password) return authError('请输入账号（或手机号）和登录密码。'); account = getAccount(identifier); if (!account || account.password !== password) { recordLogin(identifier, '失败', '账号或登录密码不正确'); return authError('账号或登录密码不正确。'); } } else { identifier = byId('phone')?.value; const sms = byId('sms')?.value.trim(); if (!validatePhone(identifier)) return authError('请输入正确的 11 位手机号码。'); if (!validateSms(sms)) { recordLogin(identifier, '失败', '演示验证码不正确'); return authError('短信验证码不正确，演示验证码为 202608。'); } account = getAccount(identifier); if (!account) { recordLogin(identifier, '失败', '账号尚未注册'); return authError('该手机号尚未注册，请先提交账号申请。'); } } if (account.status === 'pending') { recordLogin(account.id, '失败', '账号待审核'); return authError('该账号正在等待管理员审核，暂不能登录。'); } if (account.status === 'rejected' || account.enabled === false) { recordLogin(account.id, '失败', '账号不可用'); return authError('该账号未启用或审核未通过，请联系平台管理员。'); } recordLogin(account.id, '成功', '登录成功'); if (['handler', 'leader'].includes(account.role)) return openManagementWorkspace(account); setState({ session: account, view: 'workspace', staffDisplayMode: 'desktop', workspaceView: 'dashboard', error: '', notice: '' }); }
function submitRegistration() { clearFeedback(); const phone = phoneValue(byId('registerPhone')?.value); const department = byId('registerDepartment')?.value.trim(); const password = byId('registerPassword')?.value || ''; const confirm = byId('registerConfirm')?.value || ''; const sms = byId('registerSms')?.value.trim(); if (!validatePhone(phone)) return authError('请输入正确的 11 位手机号码。'); if (!department) return authError('请输入申请部门。'); if (getAccount(phone)) return authError('该手机号已存在，请直接登录或找回密码。'); if (password.length < 6) return authError('登录密码至少需要 6 位。'); if (password !== confirm) return authError('两次输入的密码不一致。'); if (!validateSms(sms)) return authError('短信验证码不正确，演示验证码为 202608。'); const submitted = new Date().toLocaleString('sv-SE', { hour12: false }); const account = { id: `app-${Date.now()}`, phone, password, role: 'staff', name: `新职工${phone.slice(-4)}`, department, status: 'pending', submitted }; accounts.push(account); const data = PrototypeData.read(); data.accounts.push({ id: account.id, phone, name: account.name, department, status: 'pending', submitted, createdAt: submitted }); PrototypeData.save(data); sessionStorage.setItem(`prototype-account-${phone}`, JSON.stringify({ id: account.id, phone, password, role: 'staff', name: account.name, department, submitted })); setState({ view: 'login', loginMode: 'password', error: '', notice: '申请已提交，等待管理员审核后方可登录。' }); }
function submitReset() { clearFeedback(); const phone = phoneValue(byId('resetPhone')?.value); const sms = byId('resetSms')?.value.trim(); const password = byId('resetPassword')?.value || ''; const confirm = byId('resetConfirm')?.value || ''; if (!validatePhone(phone)) return authError('请输入正确的 11 位手机号码。'); const account = getAccount(phone); if (!account) return authError('该手机号尚未注册。'); if (account.status !== 'approved') return authError(account.status === 'pending' ? '账号正在等待管理员审核，暂不能重置密码。' : '账号审核未通过，暂不能重置密码。'); if (!validateSms(sms)) return authError('短信验证码不正确，演示验证码为 202608。'); if (password.length < 6) return authError('新密码至少需要 6 位。'); if (password !== confirm) return authError('两次输入的密码不一致。'); account.password = password; setState({ view: 'login', loginMode: 'password', notice: '密码已重置，请使用新密码登录。', error: '' }); }
function queryApproval() { clearFeedback(); const phone = phoneValue(byId('queryPhone')?.value); if (!validatePhone(phone)) return authError('请输入正确的 11 位注册手机号码。'); const account = getAccount(phone); if (!account) return authError('未查询到该手机号的账号申请记录。'); const message = account.status === 'approved' ? '该账号已审核通过，可以直接登录平台。' : account.status === 'pending' ? '该账号正在等待管理员审核，请稍后查询。' : '该账号审核未通过，请联系平台管理员。'; setState({ error: '', notice: message }); }
function sendSms() { showToast('验证码已发送（演示验证码：202608）'); }

function renderTopbar() { const initials = state.session.name.slice(0, 1); return `<header class="workspace-topbar"><div class="topbar-brand"><div class="seal">湖北<br>供销</div><div><strong>湖北供销·心声</strong><span>职工交流平台</span></div></div><div class="topbar-search">${icon('search')}<span>搜索事项、帖子和答复</span></div><div class="staff-profile-wrap"><button class="staff-profile-trigger" type="button" aria-haspopup="menu" aria-expanded="${state.profileOpen}" title="打开用户菜单" onclick="AppPrototype.toggleProfileMenu()"><span class="profile-dot">${initials}</span><strong>${escapeHtml(state.session.name)}</strong>${icon(state.profileOpen ? 'chevron-up' : 'chevron-down')}</button>${state.profileOpen ? `<div class="staff-profile-menu" role="menu"><div class="staff-profile-summary"><span class="profile-dot">${initials}</span><div><strong>${escapeHtml(state.session.name)}</strong><small>${escapeHtml(state.session.id)}</small></div></div><button role="menuitem" onclick="AppPrototype.profileAction('center')">${icon('user-round')}<span>个人中心</span></button><button class="staff-profile-logout" role="menuitem" onclick="AppPrototype.profileAction('logout')">${icon('log-out')}<span>退出登录</span></button></div>` : ''}</div></header>`; }
function renderSidebar() { const role = state.session.role; const nav = role === 'admin' ? [['dashboard', '工作台', 'gauge'], ['review', '账号审核', 'user-round-check', accounts.filter((item) => item.status === 'pending').length], ['content', '内容审核', 'shield-check', 8], ['assign', '事项分办', 'git-pull-request-arrow', 6], ['statistics', '数据统计', 'chart-no-axes-combined']] : role === 'handler' ? [['dashboard', '承办工作台', 'briefcase-business'], ['tasks', '我的待办', 'inbox', 3], ['drafts', '答复草稿', 'files', 5], ['progress', '办理统计', 'chart-no-axes-combined']] : role === 'leader' ? [['dashboard', '运行概览', 'chart-spline'], ['topics', '热点议题', 'messages-square', 14], ['handling', '重点事项', 'clipboard-check', 5], ['analysis', '专题分析', 'chart-no-axes-combined']] : [['dashboard', '首页', 'home'], ['voices', '供销心声', 'messages-square'], ['policy', '政策答疑与公开', 'book-open-check'], ['notices', '通知公告', 'bell', homeNotices.filter((notice) => !state.noticeRead[notice.id]).length], ['profile', '个人中心', 'user-round']]; return `<aside class="workspace-sidebar"><div class="side-caption">${role === 'admin' ? '平台治理' : role === 'handler' ? '事项办理' : role === 'leader' ? '决策视图' : '职工协同'}</div>${nav.map(([id, label, iconName, count]) => `<button class="side-item ${state.workspaceView === id || (id === 'dashboard' && state.workspaceView === 'dashboard') ? 'active' : ''}" onclick="AppPrototype.setWorkspaceView('${id}')">${icon(iconName)}<span>${label}</span>${count ? `<span class="badge">${count}</span>` : ''}</button>`).join('')}<div class="sidebar-note">合理诉求充分保护<br>违规内容依法依规处理</div></aside>`; }
function metricCard([label, value, note, type]) { return `<article class="metric ${type || ''}"><label>${label}</label><strong>${value}</strong><span>${note}</span></article>`; }
function statusClass(value) { return /超期|待受理|待审核|待分办|待补充/.test(value) ? 'warn' : /已答复|已办结/.test(value) ? 'done' : ''; }
function getRankTotal(item, type) { const { scoreKey } = rankFormula[type]; return item.essenceScore + item[scoreKey]; }
function renderRankingRow(item, type, index, full = false) {
  const config = rankFormula[type];
  const score = item[config.scoreKey];
  const total = getRankTotal(item, type);
  return `<button type="button" class="ranking-item" onclick="AppPrototype.notify()" title="${config.formula}：${item.essenceScore} + ${score} = ${total}"><b>${index + 1}</b><span class="rank-copy"><strong>${item.title}</strong><small>${item.meta}${full ? ` · ${item.updated}` : ''}</small></span><span class="rank-score"><em>${total}</em><small>精华 ${item.essenceScore} + ${config.scoreLabel} ${score}</small></span></button>`;
}
function renderRankingPanel(type, { limit = 10, showMore = true, className = '' } = {}) {
  const config = rankFormula[type];
  const items = getRankingItems(type).slice(0, limit);
  return `<section class="portal-panel ranking-panel ${className}"><header class="portal-panel-head"><div class="ranking-heading"><h2>${config.title}</h2></div>${showMore ? `<button type="button" onclick="AppPrototype.openRanking('${type}')">更多 ${icon('arrow-right')}</button>` : ''}</header><div class="ranking-list">${items.map((item, index) => renderRankingRow(item, type, index)).join('')}</div></section>`;
}
function getPortalPosts() {
  return portalPosts.filter((post) => !post.managedUnavailable && !['私密发布', '待审核', '退回修改', '已驳回', '已隐藏'].includes(post.status) && (state.portalTab === '全部' || post.board === state.portalTab));
}
function renderPortalTabs() {
  const tabNames = ['全部', ...new Set([...PrototypeData.read().boards.map((board) => board.name), ...portalPosts.map((post) => post.board)])];
  return `<nav class="portal-tabs" aria-label="内容板块">${tabNames.map((tab, index) => `<button type="button" class="${state.portalTab === tab ? 'active' : ''}" onclick="AppPrototype.setPortalTabByIndex(${index})">${escapeHtml(tab)}</button>`).join('')}</nav>`;
}
function renderHomeContentTabs() {
  const tabNames = ['全部', '精华贴', '本周热议'];
  return `<nav class="portal-tabs home-content-tabs" aria-label="首页内容">${tabNames.map((tab) => `<button type="button" class="${state.homeContentTab === tab ? 'active' : ''}" onclick="AppPrototype.setHomeContentTab('${tab}')">${tab}</button>`).join('')}</nav>`;
}
function renderPortalFeed({ posts = getPortalPosts(), title = '内容动态', numbered = false } = {}) {
  return `<section class="portal-panel portal-feed"><header class="portal-panel-head"><h2>${title}</h2><button type="button" onclick="AppPrototype.openPostComposer()">我要发言 ${icon('pencil-line')}</button></header>${posts.map((post, index) => renderPortalPost(post, numbered ? index + 1 : null)).join('')}<footer class="feed-end"><span>没有更多了</span></footer></section>`;
}
function renderPostComposer() {
  if (!state.postComposerOpen) return '';
  const boards = PrototypeData.postingBoards().filter((board) => board.name !== '回音壁');
  return `<div class="ranking-backdrop" onclick="AppPrototype.closePostComposer(event)"><section class="ranking-modal post-compose-modal" role="dialog" aria-modal="true" aria-labelledby="post-compose-title"><header class="ranking-modal-head"><div><span>供销心声</span><h2 id="post-compose-title">发表帖子</h2></div><button type="button" class="ranking-close" title="关闭" onclick="AppPrototype.closePostComposer()">${icon('x')}</button></header><div class="post-compose-fields"><label>发表栏目<select id="new-post-board">${boards.map((board) => `<option value="${escapeHtml(board.id)}">${escapeHtml(board.name)}</option>`).join('')}</select></label><label>帖子标题<input id="new-post-title" maxlength="100" placeholder="填写标题"></label><label>正文内容<textarea id="new-post-body" maxlength="3000" placeholder="写下具体问题、建议或工作经验"></textarea></label><p id="post-compose-error" class="post-compose-error" role="alert" hidden></p></div><footer class="post-compose-actions"><button type="button" onclick="AppPrototype.closePostComposer()">取消</button><button type="button" class="primary" onclick="AppPrototype.submitPost()">提交审核</button></footer></section></div>`;
}
function renderHomeContent() {
  if (state.homeContentTab === '精华贴') {
    const posts = getRankingItems('discussion').slice(0, 20).map((item, index) => rankingItemToPost(item, 'discussion', index));
    return renderPortalFeed({ posts, title: '精华贴', numbered: true });
  }
  if (state.homeContentTab === '本周热议') {
    const posts = getRankingItems('progress').slice(0, 20).map((item, index) => rankingItemToPost(item, 'progress', index));
    return renderPortalFeed({ posts, title: '本周热议', numbered: true });
  }
  return renderPortalFeed({ posts: portalPosts.filter((post) => !post.managedUnavailable && !['私密发布', '待审核', '退回修改', '已驳回', '已隐藏'].includes(post.status)), title: '内容动态', numbered: true });
}
function renderHomeNotices() {
  return `<section class="portal-panel notice-panel"><header class="portal-panel-head"><h2>通知公告</h2><button type="button" onclick="AppPrototype.setWorkspaceView('notices')">更多 ${icon('arrow-right')}</button></header>${homeNotices.slice(0, 5).map((notice) => `<button class="notice-item" type="button" onclick="AppPrototype.showHomeNotice('${notice.id}')"><strong>${notice.title}</strong><span>${notice.meta}</span></button>`).join('')}</section>`;
}
function renderHomeAffairs() {
  return `<section class="portal-panel my-affairs-panel"><header class="portal-panel-head"><h2>我的事项</h2><button type="button" onclick="AppPrototype.showMyAffairs()">查看全部 ${icon('arrow-right')}</button></header>${personalAffairs.slice(0, 5).map((affair, index) => `<button class="affair-item" type="button" onclick="AppPrototype.showMyAffairs(${index})"><div><strong>${escapeHtml(affair.title)}</strong><span>${escapeHtml(affair.category)} · ${escapeHtml(affair.update)}</span></div><em class="status ${statusClass(affair.status)}">${escapeHtml(affair.status)}</em></button>`).join('')}</section>`;
}
function activeManagedBanners(data = PrototypeData.read()) {
  return (data.banners || []).filter((item) => item.enabled && (item.type === 'external' || (item.type === 'post' ? [...data.posts, ...(data.echoPublications || [])] : item.type === 'notice' ? data.notices : [...data.policies, ...data.questions]).some((target) => String(target.id) === String(item.targetId) && ['已发布', '已答复', '已反馈', '已办结'].includes(target.status) && target.enabled !== false && !target.deleted))).sort((a, b) => a.sort - b.sort);
}
function renderStaffPortal() {
  const managedBanners = activeManagedBanners();
  const banners = managedBanners.length ? managedBanners.map((item) => ({ ...item, tag: '湖北供销 · 心声' })) : policyBanners;
  const banner = banners[state.bannerIndex % banners.length];
  return `<div class="page-head portal-head"><div><div class="page-kicker">职工协同</div><h1>综合门户</h1><p>政策宣传、交流内容与个人事项的集中入口</p></div><span class="date">2026 年 09 月 10 日 · 星期四</span></div>
    <section class="portal-grid staff-home-grid">
      <div class="portal-content-column">
        <section class="policy-carousel" style="background-image:linear-gradient(90deg, rgba(25,30,31,.64), rgba(25,30,31,.12)), url('${escapeHtml(banner.image)}')">
          <div class="policy-copy"><span>${escapeHtml(banner.tag)}</span><h2>${escapeHtml(banner.title)}</h2><p>${escapeHtml(banner.summary)}</p><button type="button" onclick="AppPrototype.openBanner(${state.bannerIndex % banners.length})">查看详情 ${icon('arrow-right')}</button></div>
          <div class="carousel-tools"><button type="button" class="carousel-arrow" title="上一条" onclick="AppPrototype.changeBanner(-1)">${icon('chevron-left')}</button><div class="carousel-dots">${banners.map((_, index) => `<button type="button" class="${index === state.bannerIndex % banners.length ? 'active' : ''}" aria-label="第 ${index + 1} 条轮播图" onclick="AppPrototype.setBanner(${index})"></button>`).join('')}</div><button type="button" class="carousel-arrow" title="下一条" onclick="AppPrototype.changeBanner(1)">${icon('chevron-right')}</button></div>
        </section>
        ${renderHomeContentTabs()}
        ${renderHomeContent()}
      </div>
      <aside class="portal-utility-column">
        ${renderHomeNotices()}
        ${renderHomeAffairs()}
      </aside>
    </section>`;
}
function renderSupplyVoice() {
  return `<div class="supply-voice-page">
    <div class="page-head portal-head"><div><div class="page-kicker">职工协同</div><h1>供销心声</h1><p>汇集职工建言、诉求、业务经验与办理回音</p></div><span class="date">2026 年 09 月 10 日 · 星期四</span></div>
    <section class="portal-grid supply-voice-grid">
      <div class="portal-main-column">${renderPortalTabs()}${renderPortalFeed()}</div>
      <aside class="portal-side-column">${renderRankingPanel('discussion')}${renderRankingPanel('progress')}</aside>
    </section>
  </div>`;
}
function getPolicyDetail(id) {
  return Object.values(policyContent).flat().find((item) => item.id === id);
}
function policyDateLabel(date) {
  return date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1 年 $2 月 $3 日');
}
function renderPolicyCatalogItem(item) {
  return `<article class="knowledge-catalog-item"><div class="knowledge-catalog-type">${item.type}</div><div class="knowledge-catalog-copy"><div class="knowledge-catalog-meta"><span>${item.category}</span><small>${item.department} · 发布于 ${policyDateLabel(item.date)}</small></div><h3>${item.title}</h3><p>${item.summary}</p></div><button type="button" class="knowledge-detail-link" onclick="AppPrototype.openPolicyDetail('${item.id}')">查看详情 ${icon('arrow-right')}</button></article>`;
}
function renderPolicyPage() {
  const active = policyTabs.find(([id]) => id === state.policyTab) || policyTabs[0];
  const items = policyContent[active[0]];
  const allItems = Object.values(policyContent).flat().sort((a, b) => b.date.localeCompare(a.date));
  const hotItems = allItems.slice(0, 4);
  return `<div class="knowledge-page">
    <section class="knowledge-hero">
      <div class="knowledge-hero-copy"><span>职工服务 · 政策答疑与公开</span><h1>政策一键查询</h1><p>政策解读、常见问答、整改公开信息集中查看</p></div>
      <form class="knowledge-search" onsubmit="AppPrototype.searchPolicy(event)"><div class="knowledge-search-mode"><b>全部内容</b><span>支持标题、分类和部门关键词</span></div><div class="knowledge-search-box">${icon('search')}<input id="policy-search" type="search" placeholder="请输入政策、问题或关键词" aria-label="搜索政策内容"><button type="submit">搜索</button></div><div class="knowledge-hot-search"><span>热门搜索：</span><button type="button" onclick="AppPrototype.searchPolicyTerm('为农服务')">为农服务</button><button type="button" onclick="AppPrototype.searchPolicyTerm('项目申报')">项目申报</button><button type="button" onclick="AppPrototype.searchPolicyTerm('整改公开')">整改公开</button></div></form>
    </section>
    <section class="knowledge-section knowledge-hot-section">
      <header class="knowledge-section-head"><div><span class="knowledge-section-mark"></span><h2>热门政策</h2></div><span>近期更新</span></header>
      <div class="knowledge-hot-list">${hotItems.map((item) => `<button type="button" class="knowledge-hot-item" onclick="AppPrototype.openPolicyDetail('${item.id}')"><span class="knowledge-hot-tag">${item.type}</span><span class="knowledge-hot-title">${item.title}</span><span class="knowledge-hot-date">${item.date.slice(5).replace('-', '月')}日</span>${icon('arrow-up-right')}</button>`).join('')}</div>
    </section>
    <nav class="knowledge-entry-cards" aria-label="政策内容分类">${policyTabs.map(([id, label, description], index) => `<button type="button" class="knowledge-entry-card ${state.policyTab === id ? 'active' : ''}" onclick="AppPrototype.setPolicyTab('${id}')"><span class="knowledge-entry-icon">${icon(id === 'policy' ? 'file-text' : id === 'faq' ? 'circle-help' : 'clipboard-check')}</span><span><strong>${label}</strong><small>${index === 0 ? '政策文件与办事指引' : index === 1 ? '问题与标准答复' : '结果与公开进展'}</small></span>${icon('arrow-right')}</button>`).join('')}</nav>
    <section class="knowledge-section knowledge-catalog">
      <header class="knowledge-section-head"><div><span class="knowledge-section-mark"></span><h2>政策清单</h2></div><span>共 ${items.length} 条 · ${active[1]}</span></header>
      <nav class="knowledge-catalog-tabs" aria-label="政策清单分类">${policyTabs.map(([id, label]) => `<button type="button" class="${state.policyTab === id ? 'active' : ''}" onclick="AppPrototype.setPolicyTab('${id}')">${label}</button>`).join('')}</nav>
      <div class="knowledge-catalog-list">${items.map(renderPolicyCatalogItem).join('')}</div>
      <footer class="knowledge-catalog-foot">当前展示 ${items.length} 条公开内容</footer>
    </section>
  </div>`;
}
function renderPolicyNotices() {
  const unreadCount = homeNotices.filter((notice) => !state.noticeRead[notice.id]).length;
  const noticeTabs = [['全部', 'all'], ['建言献策', '建言献策'], ['心声诉求', '心声诉求'], ['业务交流', '业务交流'], ['回音壁', '回音壁'], ['其他', '其他']];
  const activeNoticeChannel = noticeTabs.find(([label]) => label === state.noticeTab)?.[1] || 'all';
  const notices = activeNoticeChannel === 'all' ? homeNotices : homeNotices.filter((notice) => notice.channel === activeNoticeChannel);
  const visibleUnreadCount = notices.filter((notice) => !state.noticeRead[notice.id]).length;
  return `<section class="knowledge-section knowledge-notice-section"><header class="knowledge-notice-head"><div><span class="knowledge-section-mark"></span><div><h2>通知公告</h2><p>及时查看平台规则、服务说明和工作提示</p></div></div><div class="knowledge-notice-head-actions"><span class="knowledge-notice-count">${unreadCount ? `${unreadCount} 条未读` : '全部已读'}</span><button type="button" onclick="AppPrototype.markAllNoticesRead()">全部标记已读</button></div></header><nav class="knowledge-notice-tabs" aria-label="通知公告分类">${noticeTabs.map(([label, value]) => `<button type="button" class="${state.noticeTab === label ? 'active' : ''}" onclick="AppPrototype.setNoticeTab('${label}')">${label}${value === 'all' && unreadCount ? ` <b>${unreadCount}</b>` : value !== 'all' && visibleUnreadCount && state.noticeTab === label ? ` <b>${visibleUnreadCount}</b>` : ''}</button>`).join('')}</nav><div class="knowledge-notice-list">${notices.length ? notices.map((notice) => { const read = Boolean(state.noticeRead[notice.id]); return `<article class="knowledge-notice-item ${read ? 'read' : 'unread'}"><div class="knowledge-notice-item-top"><span class="knowledge-notice-kind">${icon(notice.icon)} ${notice.category}</span><small>${notice.meta}</small></div><h3>${notice.title}${read ? '' : '<i class="knowledge-notice-unread-dot" aria-label="未读"></i>'}</h3><p>${notice.summary}</p><div class="knowledge-notice-actions"><button type="button" onclick="AppPrototype.readNotice('${notice.id}')">我已知悉</button><button type="button" class="primary" onclick="AppPrototype.openNotice('${notice.id}')">立即查看 ${icon('arrow-right')}</button></div></article>`; }).join('') : '<p class="knowledge-notice-empty">当前分类暂无通知。</p>'}</div><footer class="knowledge-notice-foot">${unreadCount ? '还有未读通知，请及时查看。' : '已全部读完'}</footer></section>`;
}
function renderNoticePage() {
  return `<div class="knowledge-page"><div class="page-head portal-head"><div><div class="page-kicker">职工服务</div><h1>通知公告</h1><p>及时查看平台规则、服务说明和工作提示</p></div><span class="date">2026 年 09 月 10 日 · 星期四</span></div>${renderPolicyNotices()}</div>`;
}
function renderPersonalPosts(posts) {
  if (!posts.length) return '<p class="personal-empty">当前分类暂无发言。</p>';
  return posts.map((post) => {
    const publication = personalPostRecords[post.id] || { publication: ['建言献策', '心声诉求'].includes(post.board) ? '待审核' : '已公开', reviewed: false };
    const publicationIcon = publication.publication === '私密发布' ? 'lock-keyhole' : publication.publication === '待审核' ? 'clock-3' : 'globe-2';
    const badge = `<em class="personal-publication ${publication.publication === '私密发布' ? 'private' : publication.publication === '待审核' ? 'pending' : ''}">${icon(publicationIcon)}${publication.reviewed ? '审核通过 · ' : ''}${publication.publication}</em>`;
    return renderPortalPost(post).replace('</div><h3>', `${badge}</div><h3>`);
  }).join('');
}
const renderPersonalComments = renderPersonalPosts;
function renderPersonalCenter() {
  const user = state.session;
  const unreadCount = homeNotices.filter((notice) => !state.noticeRead[notice.id]).length;
  const tabs = [['posts', '我的发言', 'file-text'], ['affairs', '我的事项', 'route'], ['favorites', '收藏', 'star'], ['interactions', '互动', 'heart']];
  const categories = ['全部', '建言献策', '心声诉求', '业务交流'];
  const activeCategory = categories.includes(state.personalPostCategory) ? state.personalPostCategory : '全部';
  const myComments = portalPosts.filter((post) => personalPostIds.includes(post.id) && (activeCategory === '全部' || post.board === activeCategory));
  const tabBody = state.personalTab === 'posts' ? `<div class="personal-filter-bar">${categories.map((category) => `<button type="button" class="${activeCategory === category ? 'active' : ''}" onclick="AppPrototype.setPersonalPostCategory('${category}')">${category}</button>`).join('')}</div><div class="personal-list">${renderPersonalComments(myComments)}</div>` : state.personalTab === 'affairs' ? `<div class="personal-list">${personalAffairs.map((affair) => `<article class="personal-affair-row"><div class="personal-affair-icon">${icon(affair.status === '已受理' ? 'inbox' : 'loader-circle')}</div><div class="personal-row-main"><div class="personal-row-meta"><span>${affair.category}</span><small>${affair.update}</small></div><h3>${affair.title}</h3><p>${affair.step}</p><div class="personal-affair-line"><b class="status ${statusClass(affair.status)}">${affair.status}</b><span>受理　→　办理　→　回复　→　办结</span></div></div><button type="button" class="personal-row-action" onclick="AppPrototype.notify()">查看进度 ${icon('arrow-right')}</button></article>`).join('')}</div>` : state.personalTab === 'favorites' ? `<div class="personal-list">${personalFavorites.map((item) => `<article class="personal-post-row"><div class="personal-row-main"><div class="personal-row-meta"><span>${item.category}</span><small>${item.detail}</small></div><h3>${item.title}</h3><p>${item.excerpt}</p><div class="personal-row-stats">${icon('star')} 已收藏</div></div><button type="button" class="personal-row-action" onclick="AppPrototype.notify()">查看内容 ${icon('arrow-right')}</button></article>`).join('')}</div>` : `<div class="personal-list">${personalInteractions.map((item) => `<article class="personal-interaction-row"><div class="personal-interaction-icon">${icon(item.icon)}</div><div class="personal-row-main"><div class="personal-row-meta"><span>${item.type}</span><small>${item.detail}</small></div><h3>${item.title}</h3></div><button type="button" class="personal-row-action" onclick="AppPrototype.notify()">查看记录 ${icon('arrow-right')}</button></article>`).join('')}</div>`;
  return `<div class="personal-page"><div class="page-head portal-head"><div><div class="page-kicker">职工服务</div><h1>个人中心</h1><p>管理个人资料，查看发言、事项与互动记录</p></div><span class="date">2026 年 09 月 10 日 · 星期四</span></div><section class="personal-profile"><div class="personal-identity"><div class="personal-avatar">${escapeHtml(user.name.slice(0, 1))}</div><div><h2>${escapeHtml(user.name)}</h2><p>${escapeHtml(user.department)}　·　账号已审核</p><span>${escapeHtml(user.phone.slice(0, 3) + '****' + user.phone.slice(-4))}</span></div></div><button type="button" class="personal-profile-action" onclick="AppPrototype.openPersonalEdit()">编辑资料 ${icon('pencil-line')}</button></section><section class="personal-summary-grid"><div><strong>${personalComments.length}</strong><span>我的发言</span></div><div><strong>2</strong><span>办理中事项</span></div><div><strong>8</strong><span>收到回复</span></div><div><strong>${unreadCount}</strong><span>未读通知</span></div></section><section class="personal-panel"><nav class="personal-tabs" aria-label="个人中心分类">${tabs.map(([id, label, iconName]) => `<button type="button" class="${state.personalTab === id ? 'active' : ''}" onclick="AppPrototype.setPersonalTab('${id}')">${icon(iconName)}<span>${label}</span></button>`).join('')}</nav><div class="personal-tab-body">${tabBody}</div></section></div>`;
}
function renderPersonalEditModal() {
  if (!state.personalEditOpen) return '';
  const user = state.session;
  return `<div class="ranking-backdrop" onclick="AppPrototype.closePersonalEdit(event)"><section class="ranking-modal personal-edit-modal" role="dialog" aria-modal="true" aria-labelledby="personal-edit-title"><header class="ranking-modal-head"><div><span>账号设置</span><h2 id="personal-edit-title">编辑资料</h2><p>维护个人信息、账号安全和发言隐私</p></div><button type="button" class="ranking-close" title="关闭" onclick="AppPrototype.closePersonalEdit()">${icon('x')}</button></header><div class="personal-edit-body"><div class="personal-edit-avatar">${escapeHtml(user.name.slice(0, 1))}</div><div class="personal-edit-fields"><label>姓名<input value="${escapeHtml(user.name)}" readonly></label><label>所属部门<input value="${escapeHtml(user.department)}" readonly></label><label>联系电话<input value="${escapeHtml(user.phone.slice(0, 3) + '****' + user.phone.slice(-4))}" readonly></label><div class="personal-edit-setting"><div><strong>匿名发言</strong><span>发布时可选择匿名显示</span></div><button type="button" onclick="AppPrototype.notify()">设置</button></div><div class="personal-edit-setting"><div><strong>登录密码</strong><span>定期修改密码，保障账号安全</span></div><button type="button" onclick="AppPrototype.notify()">修改密码</button></div></div></div><footer class="personal-edit-foot"><button type="button" onclick="AppPrototype.closePersonalEdit()">关闭</button><button type="button" class="primary" onclick="AppPrototype.notify()">保存资料</button></footer></section></div>`;
}
function renderPolicyDetailBody(item) {
  if (item.type === '常见问答') {
    return `<section class="knowledge-detail-section"><h3>标准答复</h3><p>${item.answer}</p></section>`;
  }
  if (item.type === '整改公开') {
    return `<section class="knowledge-detail-grid"><div><span>办理结果</span><p>${item.result}</p></div><div><span>整改措施</span><p>${item.measure}</p></div><div><span>公开进展</span><strong class="knowledge-progress">${item.progress}</strong></div></section>`;
  }
  return `<section class="knowledge-detail-section"><h3>内容说明</h3><p>${item.content}</p></section><section class="knowledge-attachment"><div>${icon('paperclip')}<div><span>关联附件</span><strong>${item.attachment}</strong></div></div><button type="button" onclick="AppPrototype.notify()">查看附件</button></section>`;
}
function renderPolicyDetailModal() {
  if (!state.policyDetailId) return '';
  const item = getPolicyDetail(state.policyDetailId);
  if (!item) return '';
  return `<div class="ranking-backdrop" onclick="AppPrototype.closePolicyDetail(event)"><section class="ranking-modal knowledge-modal" role="dialog" aria-modal="true" aria-labelledby="knowledge-modal-title"><header class="ranking-modal-head"><div><span>${item.type}</span><h2 id="knowledge-modal-title">${item.title}</h2><p>${item.category} · ${item.department} · 发布于 ${policyDateLabel(item.date)}</p></div><button type="button" class="ranking-close" title="关闭" onclick="AppPrototype.closePolicyDetail()">${icon('x')}</button></header><div class="knowledge-modal-body"><p class="knowledge-summary">${item.summary}</p>${renderPolicyDetailBody(item)}</div></section></div>`;
}
function renderBannerDetailModal() {
  const item = state.bannerDetail;
  if (!item) return '';
  return `<div class="ranking-backdrop" onclick="AppPrototype.closeBannerDetail(event)"><section class="ranking-modal knowledge-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(item.title)}"><header class="ranking-modal-head"><div><span>${escapeHtml(item.label)}</span><h2>${escapeHtml(item.title)}</h2></div><button type="button" class="ranking-close" title="关闭" onclick="AppPrototype.closeBannerDetail()">${icon('x')}</button></header><div class="knowledge-modal-body"><p class="knowledge-summary">${escapeHtml(item.summary || '')}</p><section class="knowledge-detail-section"><h3>内容说明</h3><p>${escapeHtml(item.body || '')}</p></section></div></section></div>`;
}
function renderRankingModal() {
  if (!state.rankModal) return '';
  const type = state.rankModal;
  const config = rankFormula[type];
  const items = getRankingItems(type);
  return `<div class="ranking-backdrop" onclick="AppPrototype.closeRanking(event)"><section class="ranking-modal" role="dialog" aria-modal="true" aria-labelledby="ranking-modal-title"><header class="ranking-modal-head"><div><span>完整榜单</span><h2 id="ranking-modal-title">${config.title}</h2><p>${config.formula}，按综合分由高到低排列</p></div><button type="button" class="ranking-close" title="关闭" onclick="AppPrototype.closeRanking()">${icon('x')}</button></header><div class="ranking-modal-list">${items.map((item, index) => renderRankingRow(item, type, index, true)).join('')}</div><footer class="ranking-modal-foot">共 ${items.length} 条 · 综合分降序</footer></section></div>`;
}
function getPostFullContent(post) {
  if (Array.isArray(post.content)) return post.content;
  const boardContext = {
    '建言献策': '建议将结合业务实际进一步细化实施步骤、责任分工和预期成效，便于相关单位研究采纳。',
    '心声诉求': '相关情况已按诉求类型进行梳理，将重点核对影响范围和办理条件，推动形成可执行的解决方案。',
    '业务交流': '文中做法已按照适用场景、关键步骤和注意事项进行整理，便于不同单位结合自身条件参考使用。',
    '回音壁': '办理过程坚持问题核实、责任落实和结果反馈相衔接，后续还将持续跟踪实际效果。'
  };
  return [
    post.excerpt,
    `围绕“${post.title}”，${boardContext[post.board] || '相关内容将结合实际工作进一步研究，并持续收集各方意见。'}在推进过程中，将重点关注问题是否得到有效回应，同时兼顾制度衔接、执行成本和基层实际承受能力。`,
    `下一步将根据办理和讨论情况动态补充信息，及时公开重要进展；对需要跨单位协同的事项，将明确沟通节点和反馈方式，避免信息重复流转。`
  ];
}
function renderPortalPost(post, sequence = null) {
  const actions = state.postActions[post.id] || {};
  const expanded = state.expandedPostId === post.id;
  const commentsOpen = state.commentPostId === post.id;
  const reportOpen = state.reportPostId === post.id;
  const likes = post.likes;
  const favorites = post.favorites;
  const fullContent = expanded ? getPostFullContent(post).map((paragraph, index) => `<p>${escapeHtml(paragraph)}</p>${index === 0 && post.media ? `<figure class="portal-post-media"><img src="${escapeHtml(post.media.src)}" alt="${escapeHtml(post.media.alt)}"><figcaption>${escapeHtml(post.media.caption)}</figcaption></figure>` : ''}`).join('') : '';
  return `<article class="portal-post-card ${sequence ? 'numbered' : ''}">${sequence ? `<b class="post-sequence">${String(sequence).padStart(2, '0')}</b>` : ''}<div class="portal-post-card-head"><span>${escapeHtml(post.board)}</span><i></i><small>${escapeHtml(post.author)} · ${escapeHtml(post.time)}</small></div><h3>${escapeHtml(post.title)}</h3><p class="${expanded ? 'expanded' : ''}">${escapeHtml(post.excerpt)}</p>${expanded ? `<div class="portal-post-full">${fullContent}</div>` : ''}<button type="button" class="read-more" aria-expanded="${expanded}" onclick="AppPrototype.togglePostExpanded(${post.id})">${expanded ? '收起全文' : '阅读全文'} ${icon(expanded ? 'chevron-up' : 'chevron-down')}</button><div class="post-actions"><button type="button" class="${actions.liked ? 'active' : ''}" onclick="AppPrototype.togglePostAction(${post.id}, 'liked')">${icon('thumbs-up')} ${actions.liked ? '已赞' : '点赞'} ${likes}</button><button type="button" class="${commentsOpen || actions.commented ? 'active' : ''}" onclick="AppPrototype.toggleComments(${post.id})">${icon('message-circle')} ${post.comments + (actions.newComment ? 1 : 0)} 条评论</button><button type="button" class="${actions.favorited ? 'active' : ''}" onclick="AppPrototype.togglePostAction(${post.id}, 'favorited')">${icon('star')} ${actions.favorited ? '已收藏' : '收藏'} ${favorites}</button><button type="button" onclick="AppPrototype.sharePost(${post.id})">${icon('share-2')} 分享 ${post.shares || 0}</button><button type="button" class="danger-action ${actions.reported ? 'active' : ''}" onclick="AppPrototype.toggleReport(${post.id})">${icon('flag')} 举报</button></div>${commentsOpen ? `<section class="comment-zone"><div class="comment-list">${post.commentList.map((comment, index) => `<article><div><strong>${escapeHtml(comment.author)}</strong><span class="comment-status">${escapeHtml(comment.status)}</span></div><p>${escapeHtml(comment.text)}</p><button type="button" onclick="AppPrototype.replyToComment(${post.id}, ${index})">回复</button></article>`).join('')}${actions.newComment ? `<article><div><strong>我</strong><span class="comment-status reviewing">审核中</span></div><p>${escapeHtml(actions.newComment)}</p></article>` : ''}</div><div class="comment-compose"><textarea id="comment-${post.id}" placeholder="${escapeHtml(state.replyTarget ? `回复 @${state.replyTarget}` : '发表评论，提交后将进入审核')}"></textarea><button type="button" onclick="AppPrototype.submitComment(${post.id})">发布评论</button></div></section>` : ''}${reportOpen ? `<section class="report-zone"><label for="report-${post.id}">举报原因</label><textarea id="report-${post.id}" placeholder="请说明举报原因"></textarea><div><button type="button" class="cancel-report" onclick="AppPrototype.toggleReport(${post.id})">取消</button><button type="button" class="submit-report" onclick="AppPrototype.submitReport(${post.id})">提交举报</button></div></section>` : ''}</article>`;
}

function sharedPostFor(data, id) {
  let post = data.posts.find((item) => String(item.id) === String(id));
  if (post) return post;
  const portal = portalPosts.find((item) => String(item.id) === String(id));
  if (!portal) return null;
  if (portal.sharedEcho) return (data.echoPublications || []).find((item) => item.status === '已发布' && 6000 + Number(item.sourcePostId || 0) === Number(id)) || null;
  post = { id: portal.id, title: portal.title, board: portal.board, author: portal.author, status: portal.status, risk: '低风险', body: portal.content?.join('\n') || portal.excerpt, time: portal.time, engagement: PrototypeData.emptyEngagement() };
  data.posts.push(post);
  return post;
}
function engagementActor() {
  return { accountId: state.session?.id || 'staff', name: state.session?.name || '职工', department: state.session?.department || '未配置', at: new Date().toLocaleString('zh-CN', { hour12: false }) };
}
function recordDaily(engagement, field, delta = 1) {
  const date = new Date().toLocaleDateString('sv-SE');
  let item = engagement.daily.find((row) => row.date === date);
  if (!item) { item = { date, views: 0, likes: 0, comments: 0, favorites: 0, shares: 0 }; engagement.daily.push(item); }
  item[field] = Math.max(0, Number(item[field] || 0) + delta);
}
function recordPostView(id) {
  const data = PrototypeData.read(), post = sharedPostFor(data, id);
  if (!post) return;
  const engagement = PrototypeData.ensureEngagement(post), accountId = state.session?.id || 'staff';
  engagement.uniqueViewAccounts = Array.isArray(engagement.uniqueViewAccounts) ? engagement.uniqueViewAccounts : [];
  engagement.views += 1;
  if (!engagement.uniqueViewAccounts.includes(accountId)) { engagement.uniqueViewAccounts.push(accountId); engagement.uniqueViews += 1; }
  recordDaily(engagement, 'views');
  PrototypeData.save(data);
}
function renderDashboard() { if (state.session.role === 'staff') return renderStaffPortal(); const data = dashboards[state.session.role]; return `<div class="page-head"><div><div class="page-kicker">${roleMeta[state.session.role][0]}协同</div><h1>${data.title}</h1><p>${data.desc}</p></div><span class="date">2026 年 09 月 10 日 · 星期四</span></div><section class="metric-grid">${data.metrics.map(metricCard).join('')}</section><section class="content-grid"><article class="panel"><div class="panel-header"><h2>${data.listTitle}</h2><button type="button" onclick="AppPrototype.notify()">查看全部 →</button></div>${data.rows.map(([title, detail, status, date]) => `<div class="table-row"><div><strong>${title}</strong><small>${detail}</small></div><span class="status ${statusClass(status)}">${status}</span><span class="row-date">${date}</span></div>`).join('')}</article><aside class="panel summary"><div class="summary-lead"><strong>${data.insight}</strong><p>${data.insightText}</p></div>${data.progress.map(([label, value]) => `<div class="progress-item"><div class="progress-label"><span>${label}</span><b>${value}</b></div><div class="progress-track"><div class="progress-fill" style="width:${value}"></div></div></div>`).join('')}<button class="quick-action" type="button" onclick="AppPrototype.notify()">${data.action}</button></aside></section>`; }
function renderReview() { const pending = accounts.filter((account) => account.status === 'pending'); return `<div class="page-head"><div><div class="page-kicker">平台治理</div><h1>账号审核</h1><p>核验职工注册信息，审核通过后方可登录平台。</p></div><span class="date">待审核 ${pending.length} 条</span></div><div class="review-tabs"><button class="active">待审核（${pending.length}）</button><button onclick="AppPrototype.notify()">已审核记录</button></div><section class="review-panel">${pending.length ? pending.map((account) => `<div class="review-row"><div class="review-name"><strong>${account.name}</strong><span>${account.phone}</span></div><span>${account.department}</span><span>申请时间：${account.submitted}</span><div class="review-action"><button class="small-btn approve" type="button" onclick="AppPrototype.reviewAccount('${account.id}', 'approved')">通过</button><button class="small-btn reject" type="button" onclick="AppPrototype.reviewAccount('${account.id}', 'rejected')">驳回</button></div></div>`).join('') : '<div class="empty">当前没有待审核的注册申请</div>'}</section>`; }
function renderWorkspaceContent() { if (state.session.role === 'staff' && state.workspaceView === 'voices') return renderSupplyVoice(); if (state.session.role === 'staff' && state.workspaceView === 'policy') return renderPolicyPage(); if (state.session.role === 'staff' && state.workspaceView === 'notices') return renderNoticePage(); if (state.session.role === 'staff' && state.workspaceView === 'profile') return renderPersonalCenter(); return state.session.role === 'admin' && state.workspaceView === 'review' ? renderReview() : renderDashboard(); }
function renderAccountCenterModal() {
  if (!state.accountCenterOpen || !state.session) return '';
  const user = state.session, tab = state.accountCenterTab;
  const basic = `<div class="account-basic"><aside><div class="account-avatar">${escapeHtml(user.name.slice(0,1))}</div><h3>${escapeHtml(user.name)}</h3><p>服务基层 · 倾听心声 · 协同办理</p><dl><div><dt>账号</dt><dd>${escapeHtml(user.id)}</dd></div><div><dt>部门</dt><dd>${escapeHtml(user.department)}</dd></div><div><dt>当前角色</dt><dd>${escapeHtml(roleMeta[user.role]?.[0] || '职工')}</dd></div></dl></aside><section><label><span><b>*</b> 昵称</span><input class="input" id="account-center-name" value="${escapeHtml(user.name)}"></label><div class="account-gender"><span><b>*</b> 性别</span>${['男','女','未知'].map((item) => `<label><input type="radio" name="account-center-gender" value="${item}" ${(user.gender || '未知') === item ? 'checked' : ''}><span>${item}</span></label>`).join('')}</div><button class="account-primary" onclick="AppPrototype.saveAccountCenter()">更新信息</button></section></div>`;
  const security = `<form class="account-security" onsubmit="event.preventDefault();AppPrototype.changeAccountPassword()">${[['原密码','account-old-password'],['新密码','account-new-password'],['确认密码','account-confirm-password']].map(([label,id]) => `<label><span><b>*</b> ${label}</span><input class="input" id="${id}" type="password" placeholder="请输入"></label>`).join('')}<button class="account-primary" type="submit">修改密码</button></form>`;
  const devices = `<div class="account-devices"><h3>我的在线设备</h3><div class="account-table-wrap"><table><thead><tr><th>序号</th><th>登录平台</th><th>IP 地址</th><th>登录地址</th><th>浏览器</th><th>系统</th><th>登录时间</th><th>操作</th></tr></thead><tbody><tr><td>1</td><td>PC</td><td>117.152.223.105</td><td>中国湖北省武汉市</td><td>Chrome</td><td>OS X</td><td>2026-09-14 14:26</td><td><button onclick="AppPrototype.notify()">强制下线</button></td></tr></tbody></table></div></div>`;
  return `<div class="account-modal-backdrop" onclick="AppPrototype.closeAccountCenter(event)"><section class="account-modal" role="dialog" aria-modal="true" aria-label="个人中心"><header><h2>个人中心</h2><button onclick="AppPrototype.closeAccountCenter()" title="关闭">${icon('x')}</button></header><nav>${[['basic','基本设置'],['security','安全设置'],['devices','在线设备']].map(([id,label]) => `<button class="${tab === id ? 'active' : ''}" onclick="AppPrototype.setAccountCenterTab('${id}')">${label}</button>`).join('')}</nav><div class="account-modal-body">${tab === 'basic' ? basic : tab === 'security' ? security : devices}</div></section></div>`;
}
function renderWorkspace() { if (state.session.role === 'staff' && state.staffDisplayMode === 'mobile') return renderMobileWorkspace(); return `<div class="workspace role-${state.session.role}">${renderTopbar()}${renderSidebar()}<main class="workspace-main">${renderWorkspaceContent()}</main>${renderRankingModal()}${renderPolicyDetailModal()}${renderBannerDetailModal()}${state.session.role === 'staff' ? renderPersonalEditModal() + renderPostComposer() : ''}${renderAccountCenterModal()}</div>`; }
function syncPrototypeData() {
  const data = window.PrototypeData?.read();
  if (!data) return;
  for (const shared of data.accounts || []) { let account = accounts.find((a) => a.phone === shared.phone); if (!account) { try { const saved = JSON.parse(sessionStorage.getItem(`prototype-account-${shared.phone}`)); if (saved?.phone === shared.phone) { account = saved; accounts.push(account); } } catch (_) { /* No local demo credentials. */ } } if (account) { account.status = shared.status; account.enabled = shared.enabled !== false; account.name = shared.name; account.department = shared.department; } }
  const managedPostIds = new Set(data.posts.map((source) => String(source.id)));
  for (const post of portalPosts) if (managedPostIds.has(String(post.id))) post.managedUnavailable = true;
  for (const source of data.posts) {
    let post = portalPosts.find((item) => item.id === source.id);
    if (!post) { post = { id: source.id, likes: 0, favorites: 0, comments: 0, commentList: [] }; portalPosts.unshift(post); }
    const engagement = PrototypeData.ensureEngagement(source);
    const publishedComments = data.comments.filter((c) => String(c.postId) === String(source.id) && c.status === '已发布');
    const actorId = state.session?.id;
    state.postActions[source.id] = { ...(state.postActions[source.id] || {}), liked: Boolean(actorId && engagement.likeUsers.some((item) => item.accountId === actorId)), favorited: Boolean(actorId && engagement.favoriteUsers.some((item) => item.accountId === actorId)), commented: Boolean(actorId && data.comments.some((item) => String(item.postId) === String(source.id) && item.authorId === actorId)), reported: Boolean(actorId && data.reports.some((item) => String(item.postId) === String(source.id) && item.reporterId === actorId)) };
    const localComment = state.postActions[source.id].newComment;
    if (localComment && data.comments.some((c) => String(c.postId) === String(source.id) && c.authorId === actorId && c.text === localComment && c.status !== '待审核')) delete state.postActions[source.id].newComment;
    Object.assign(post, { title: source.title, board: source.board, author: source.author, status: source.status, time: source.time, excerpt: source.body, content: [source.body], managedUnavailable: source.enabled === false || source.deleted === true, likes: engagement.likes, favorites: engagement.favorites, shares: engagement.shares, comments: engagement.historicComments + publishedComments.length, commentList: publishedComments.map((c) => ({ author: c.author, text: c.text, status: '已通过' })) });
  }
  const echoPublications = (data.echoPublications || []).filter((item) => item.status === '已发布');
  const publishedIds = new Set(echoPublications.map((item) => 6000 + Number(item.sourcePostId || 0)));
  for (let i = portalPosts.length - 1; i >= 0; i--) if (portalPosts[i].sharedEcho && !publishedIds.has(portalPosts[i].id)) portalPosts.splice(i, 1);
  for (const publication of echoPublications) {
    const id = 6000 + Number(publication.sourcePostId || 0);
    const affair = data.affairs.find((item) => item.id === publication.affairId);
    let reply = portalPosts.find((p) => p.id === id);
    if (!reply) { reply = { id, sharedEcho: true, likes: 0, favorites: 0, comments: 0, commentList: [] }; portalPosts.unshift(reply); }
    const engagement = PrototypeData.ensureEngagement(publication);
    const publishedComments = data.comments.filter((item) => String(item.postId) === String(id) && item.status === '已发布');
    const actorId = state.session?.id;
    state.postActions[id] = { ...(state.postActions[id] || {}), liked: Boolean(actorId && engagement.likeUsers.some((item) => item.accountId === actorId)), favorited: Boolean(actorId && engagement.favoriteUsers.some((item) => item.accountId === actorId)), commented: Boolean(actorId && data.comments.some((item) => String(item.postId) === String(id) && item.authorId === actorId)), reported: Boolean(actorId && data.reports.some((item) => String(item.postId) === String(id) && item.reporterId === actorId)) };
    Object.assign(reply, { board: '回音壁', author: affair?.owner || '平台管理组', title: publication.title, excerpt: publication.body, content: [publication.body], status: affair?.status === '已办结' ? '已办结' : '已答复', time: publication.publishedAt || '最新反馈', likes: engagement.likes, favorites: engagement.favorites, shares: engagement.shares, comments: engagement.historicComments + publishedComments.length, commentList: publishedComments.map((item) => ({ author: item.author, text: item.text, status: '已通过' })) });
  }
  personalAffairs.splice(0, personalAffairs.length, ...data.affairs.map((a) => ({ title: a.title, category: a.id, status: a.status, update: `${a.owner} · 截止 ${a.deadline}`, step: a.status === '已反馈' || a.status === '已办结' ? a.draft : a.progress || a.events.at(-1)?.text || '等待承办部门更新进展' })));
  const sharedNoticeIds = new Set(data.notices.map((n) => n.id));
  for (let i = homeNotices.length - 1; i >= 0; i--) if (sharedNoticeIds.has(homeNotices[i].id)) homeNotices.splice(i, 1);
  for (const notice of data.notices.filter((n) => n.status === '已发布')) homeNotices.unshift({ id: notice.id, channel: '其他', category: '其他', icon: 'megaphone', title: notice.title, summary: notice.body, meta: `${notice.scope} · 最新公告` });
  for (const type of ['policy', 'faq']) for (let i = policyContent[type].length - 1; i >= 0; i--) if (policyContent[type][i].sharedPublication) policyContent[type].splice(i, 1);
  const managedPolicyTitles = new Set((data.policies || []).map((item) => item.title));
  const managedQuestionTitles = new Set((data.questions || []).map((item) => item.title));
  for (let i = policyContent.policy.length - 1; i >= 0; i--) if (managedPolicyTitles.has(policyContent.policy[i].title)) policyContent.policy.splice(i, 1);
  for (let i = policyContent.faq.length - 1; i >= 0; i--) if (managedQuestionTitles.has(policyContent.faq[i].title)) policyContent.faq.splice(i, 1);
  for (const policy of (data.policies || []).filter((item) => item.status === '已发布')) policyContent.policy.unshift({ id: `shared-${policy.id}`, sharedPublication: true, type: '政策文件', title: policy.title, category: policy.category, department: policy.department, date: policy.publishedAt, summary: policy.summary, content: policy.body, attachment: policy.attachment || '' });
  for (const question of (data.questions || []).filter((item) => item.status === '已发布' && item.answer)) policyContent.faq.unshift({ id: `shared-${question.id}`, sharedPublication: true, type: '常见问答', title: question.title, category: question.category, department: question.department, date: question.answeredAt || question.submittedAt, summary: question.answer, answer: question.answer });
}
function render() { syncPrototypeData(); byId('app').innerHTML = state.view === 'workspace' && state.session ? renderWorkspace() : renderAuth(); const mobileStaffView = state.view === 'workspace' && state.session?.role === 'staff' && state.staffDisplayMode === 'mobile'; const knowledgeView = !mobileStaffView && state.view === 'workspace' && state.session?.role === 'staff' && ['policy', 'notices'].includes(state.workspaceView); const personalView = !mobileStaffView && state.view === 'workspace' && state.session?.role === 'staff' && state.workspaceView === 'profile'; document.documentElement.classList.toggle('mobile-staff-view', mobileStaffView); document.documentElement.classList.toggle('knowledge-view', knowledgeView); document.documentElement.classList.toggle('personal-view', personalView); document.body.classList.toggle('modal-open', Boolean(state.rankModal || state.policyDetailId || state.bannerDetail || state.postComposerOpen || state.personalEditOpen)); window.lucide?.createIcons?.(); }

window.AppPrototype = {
  setView(view) { setState({ view, error: '', notice: '' }); },
  setLoginMode(loginMode) { setState({ loginMode, error: '', notice: '' }); },
  sendSms,
  submitLogin,
  submitRegistration,
  submitReset,
  queryApproval,
  setPortalTab(portalTab) { setState({ portalTab }); },
  setHomeContentTab(homeContentTab) { setState({ homeContentTab, expandedPostId: null, commentPostId: null, reportPostId: null }); },
  setPolicyTab(policyTab) { setState({ policyTab, policyDetailId: null }); },
  setNoticeTab(noticeTab) { setState({ noticeTab }); },
  showHomeNotice(id) { setState({ workspaceView: 'notices', noticeTab: '全部' }); requestAnimationFrame(() => { const index = homeNotices.findIndex((notice) => notice.id === id); document.querySelectorAll('.knowledge-notice-item')[index]?.scrollIntoView({ block: 'center' }); }); },
  showMyAffairs(index) { setState({ workspaceView: 'profile', personalTab: 'affairs' }); if (index !== undefined) requestAnimationFrame(() => document.querySelectorAll('.personal-affair-row')[index]?.scrollIntoView({ block: 'center' })); },
  setPersonalTab(personalTab) { setState({ personalTab }); },
  openMobilePersonal(personalTab = 'posts') { setState({ personalTab, workspaceView: 'profile' }); },
  openPersonalEdit() { setState({ personalEditOpen: true }); },
  closePersonalEdit(event) { if (event && event.target !== event.currentTarget) return; setState({ personalEditOpen: false }); },
  setPersonalPostCategory(personalPostCategory) { setState({ personalPostCategory, personalExpandedPostId: null }); },
  togglePersonalPost(id) { setState({ personalExpandedPostId: state.personalExpandedPostId === id ? null : id }); },
  searchPolicy(event) { event?.preventDefault(); const value = byId('policy-search')?.value.trim(); showToast(value ? `已为你检索“${value}”（原型演示）。` : '请输入政策、问题或关键词。'); },
  searchPolicyTerm(term) { const input = byId('policy-search'); if (input) input.value = term; showToast(`已为你检索“${term}”（原型演示）。`); },
  readNotice(id) { if (state.noticeRead[id]) return; setState({ noticeRead: { ...state.noticeRead, [id]: true } }); showToast('通知已标记为已读。'); },
  openNotice(id) { const notice = homeNotices.find((item) => item.id === id); if (!notice) return; const noticeRead = { ...state.noticeRead, [id]: true }; setState({ noticeRead }); showToast(`已打开“${notice.title}”。`); },
  markAllNoticesRead() { if (homeNotices.every((notice) => state.noticeRead[notice.id])) return showToast('通知已全部读完。'); setState({ noticeRead: Object.fromEntries(homeNotices.map((notice) => [notice.id, true])) }); showToast('已将全部通知标记为已读。'); },
  openPolicyDetail(policyDetailId) { setState({ policyDetailId }); },
  closePolicyDetail(event) { if (event && event.target !== event.currentTarget) return; setState({ policyDetailId: null }); },
  setBanner(bannerIndex) { setState({ bannerIndex }); },
  changeBanner(offset) { const count = activeManagedBanners().length || policyBanners.length; setState({ bannerIndex: (state.bannerIndex + offset + count) % count }); },
  openBanner(index) {
    const data = PrototypeData.read();
    const banners = activeManagedBanners(data);
    if (!banners.length) return this.notify();
    const item = banners[index];
    if (!item) return;
    if (item.type === 'external') return window.open(item.url, '_blank', 'noopener,noreferrer');
    if (item.type === 'post') { const echo = (data.echoPublications || []).find((entry) => String(entry.id) === String(item.targetId)); const postId = echo ? 6000 + Number(echo.sourcePostId || 0) : Number(item.targetId); if (!echo) recordPostView(postId); return setState({ workspaceView: 'voices', portalTab: '全部', expandedPostId: postId }); }
    const target = (item.type === 'notice' ? data.notices : [...data.policies, ...data.questions]).find((entry) => String(entry.id) === String(item.targetId));
    if (!target || target.status !== '已发布') return showToast('关联内容已下架');
    setState({ bannerDetail: { title: target.title, label: item.type === 'notice' ? '通知公告' : '政策与问答', summary: target.summary || '', body: target.body || target.answer } });
  },
  closeBannerDetail(event) { if (event && event.target !== event.currentTarget) return; setState({ bannerDetail: null }); },
  openRanking(rankModal) { setState({ rankModal }); },
  closeRanking(event) { if (event && event.target !== event.currentTarget) return; setState({ rankModal: null }); },
  togglePostExpanded(id) { const opening = state.expandedPostId !== id; if (opening) recordPostView(id); setState({ expandedPostId: opening ? id : null, commentPostId: null, reportPostId: null }); },
  togglePostAction(id, action) {
    const config = { liked: ['likes', 'likeUsers'], favorited: ['favorites', 'favoriteUsers'] }[action];
    if (!config) return;
    const data = PrototypeData.read(), post = sharedPostFor(data, id);
    if (!post) return showToast('帖子记录不存在。');
    const engagement = PrototypeData.ensureEngagement(post), actor = engagementActor(), [countField, usersField] = config;
    const index = engagement[usersField].findIndex((item) => item.accountId === actor.accountId);
    const active = index < 0;
    if (active) engagement[usersField].unshift(actor); else engagement[usersField].splice(index, 1);
    engagement[countField] = Math.max(0, Number(engagement[countField] || 0) + (active ? 1 : -1));
    recordDaily(engagement, countField, active ? 1 : -1);
    PrototypeData.save(data);
    const postActions = { ...state.postActions, [id]: { ...(state.postActions[id] || {}), [action]: active } };
    setState({ postActions });
  },
  toggleComments(id) { setState({ commentPostId: state.commentPostId === id ? null : id, reportPostId: null, replyTarget: '' }); },
  replyTo(author) { state.replyTarget = author; const textarea = document.querySelector('.comment-compose textarea'); if (textarea) textarea.focus(); },
  replyToComment(id, index) { const author = portalPosts.find((post) => post.id === id)?.commentList[index]?.author; if (author) this.replyTo(author); },
  submitComment(id) { const value = byId(`comment-${id}`)?.value.trim(); if (!value) return showToast('请输入评论内容后再发布。'); const text = `${state.replyTarget ? `回复 @${state.replyTarget}：` : ''}${value}`; const data = PrototypeData.read(); const blocked = PrototypeData.blockedWord(text, '评论', data); if (blocked) blocked.hitCount = (Number.isFinite(blocked.hitCount) ? blocked.hitCount : 0) + 1; const match = PrototypeData.protectedMatch(text, '评论', data); if (match) match.list.hitCount += 1; const requiresReview = Boolean(blocked || match); const createdAt = new Date().toLocaleString('sv-SE', { hour12: false }); data.comments.push({ id: `PL-${Date.now()}`, postId: id, author: state.session?.name || '职工', authorId: state.session?.id || 'staff', department: state.session?.department || '未配置', text, createdAt, status: requiresReview ? '待审核' : '已发布', risk: blocked ? '敏感词命中' : match ? '受保护名单待复核' : '低风险', sensitiveHits: blocked ? [blocked.term] : [], protectedListId: match?.list.id || null }); const post = sharedPostFor(data, id); if (post) recordDaily(PrototypeData.ensureEngagement(post), 'comments'); PrototypeData.save(data); const postActions = { ...state.postActions, [id]: { ...(state.postActions[id] || {}), newComment: text, commented: true } }; setState({ postActions, replyTarget: '' }); showToast(requiresReview ? '评论已提交，命中审核规则，等待人工复核。' : '评论已发布。'); },
  openPostComposer() { if (state.session?.role !== 'staff') return showToast('请切换至职工视图发表帖子。'); setState({ postComposerOpen: true }); },
  closePostComposer(event) { if (event && event.target !== event.currentTarget) return; setState({ postComposerOpen: false }); },
  submitPost() {
    const boardId = byId('new-post-board')?.value, title = byId('new-post-title')?.value.trim(), body = byId('new-post-body')?.value.trim();
    const error = byId('post-compose-error');
    const fail = (message) => { error.textContent = message; error.hidden = false; };
    if (!title || !body) return fail('请填写帖子标题和正文。');
    const data = PrototypeData.read(), board = PrototypeData.postingBoards(data).find((item) => item.id === boardId);
    if (!board) return fail('该栏目已停用，请选择其他栏目。');
    if (board.name === '回音壁') return fail('回音壁由承办人员发布，职工不能在该栏目发帖。');
    const blocked = PrototypeData.blockedWord(`${title}\n${body}`, '发帖', data);
    if (blocked) blocked.hitCount = (Number.isFinite(blocked.hitCount) ? blocked.hitCount : 0) + 1;
    const match = PrototypeData.protectedMatch(`${title}\n${body}`, '发帖', data);
    if (match) match.list.hitCount += 1;
    const id = Date.now();
    const privateBoard = ['建言献策', '心声诉求'].includes(board.name);
    const requiresReview = Boolean(blocked || match);
    const status = privateBoard ? '私密发布' : requiresReview ? '待审核' : '已发布';
    data.posts.unshift({ id, board: board.name, title, body, author: state.session?.name || '职工', time: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), status, enabled: true, deleted: false, risk: blocked ? '敏感词命中' : match ? '受保护名单待复核' : '低风险', sensitiveHits: blocked ? [blocked.term] : [], protectedListId: match?.list.id || null, flowSnapshot: PrototypeData.flowFor(board.name, data), engagement: PrototypeData.emptyEngagement() });
    PrototypeData.save(data); personalPostIds.unshift(id); setState({ postComposerOpen: false }); showToast(privateBoard ? '帖子已私密发布，审核人员确认后可公开。' : requiresReview ? '帖子已提交，命中审核规则，等待人工复核。' : '帖子已发布。');
  },
  setPortalTabByIndex(index) { const names = ['全部', ...new Set([...PrototypeData.read().boards.map((board) => board.name), ...portalPosts.map((post) => post.board)])]; setState({ portalTab: names[index] || '全部' }); },
  toggleReport(id) { setState({ reportPostId: state.reportPostId === id ? null : id, commentPostId: null }); },
  submitReport(id) { const reason = byId(`report-${id}`)?.value.trim(); if (!reason) return showToast('请填写举报原因。'); const data = PrototypeData.read(); data.reports.push({ id: `JB-${Date.now()}`, postId: id, reporterId: state.session?.id || 'staff', reason, status: '待核查' }); PrototypeData.save(data); setState({ reportPostId: null, postActions: { ...state.postActions, [id]: { ...(state.postActions[id] || {}), reported: true } } }); showToast('举报已提交，平台管理员将尽快核查。'); },
  sharePost(id, channel = 'copy') { const data = PrototypeData.read(), post = sharedPostFor(data, id); if (!post) return showToast('帖子记录不存在。'); const engagement = PrototypeData.ensureEngagement(post); engagement.shares += 1; engagement.shareChannels[channel] = Number(engagement.shareChannels[channel] || 0) + 1; recordDaily(engagement, 'shares'); PrototypeData.save(data); render(); showToast('帖子链接已复制，分享次数已记录。'); },
  launchStaffMobile() { if (typeof renderMobileWorkspace !== 'function') return showToast('移动端模块尚未加载，请刷新页面后重试。'); const account = accounts.find((item) => item.role === 'staff' && item.status === 'approved'); if (!account) return showToast('暂无可用的职工演示账号。'); setState({ session: account, view: 'workspace', staffDisplayMode: 'mobile', workspaceView: 'dashboard', error: '', notice: '' }); },
  exitStaffMobile() { setState({ session: null, view: 'login', staffDisplayMode: 'desktop', workspaceView: 'dashboard', postComposerOpen: false, personalEditOpen: false, policyDetailId: null }); },
  prefillRole(role) { const account = accounts.find((item) => item.role === role && item.status === 'approved'); setState({ view: 'login', staffDisplayMode: 'desktop', loginMode: 'password', error: '', notice: `已载入${roleMeta[role][0]}演示账号，可直接登录。` }); setTimeout(() => { if (byId('identifier')) { byId('identifier').value = account.id; byId('password').value = account.password; } }, 0); },
  openManagementWorkspace,
  switchRole(role) { const account = accounts.find((item) => item.role === role && item.status === 'approved'); if (role === 'handler') return openHandlerWorkspace(account); setState({ session: account, staffDisplayMode: 'desktop', workspaceView: 'dashboard', rankModal: null, policyDetailId: null }); },
  setWorkspaceView(workspaceView) { setState({ workspaceView, rankModal: null, policyDetailId: null }); },
  toggleProfileMenu() { setState({ profileOpen: !state.profileOpen }); },
  profileAction(action) { if (action === 'logout') return this.logout(); setState({ profileOpen: false, accountCenterOpen: true, accountCenterTab: 'basic' }); },
  closeAccountCenter(event) { if (event && event.target !== event.currentTarget) return; setState({ accountCenterOpen: false }); },
  setAccountCenterTab(tab) { setState({ accountCenterTab: ['basic','security','devices'].includes(tab) ? tab : 'basic' }); },
  saveAccountCenter() { const name = byId('account-center-name')?.value.trim(); if (!name) return showToast('请填写用户昵称'); const data = PrototypeData.read(), shared = data.accounts.find((item) => item.id === state.session.id); state.session.name = name; state.session.gender = document.querySelector('input[name="account-center-gender"]:checked')?.value || '未知'; if (shared) { shared.name = name; shared.gender = state.session.gender; PrototypeData.save(data); } setState({ accountCenterOpen: false }); showToast('个人信息已更新'); },
  changeAccountPassword() { const oldPassword = byId('account-old-password')?.value, password = byId('account-new-password')?.value, confirm = byId('account-confirm-password')?.value; if (!oldPassword || !password || !confirm) return showToast('请完整填写密码信息'); if (oldPassword !== state.session.password) return showToast('原密码不正确'); if (password.length < 6) return showToast('新密码不能少于 6 位'); if (password !== confirm) return showToast('两次输入的新密码不一致'); state.session.password = password; showToast('密码修改成功'); },
  reviewAccount(id, status) { const account = accounts.find((item) => item.id === id); if (!account) return; account.status = status; render(); showToast(status === 'approved' ? `${account.name} 已审核通过，可登录平台。` : `${account.name} 已驳回。`); },
  logout() { if (state.session) recordLogin(state.session.id, '成功', '退出登录', 'password'); setState({ view: 'login', session: null, staffDisplayMode: 'desktop', workspaceView: 'dashboard', profileOpen: false, accountCenterOpen: false, rankModal: null, policyDetailId: null, error: '', notice: '已安全退出登录。' }); },
  notify() { showToast('该功能为原型演示，正式版本将进入对应业务模块。'); }
};

document.addEventListener('keydown', (event) => { if (event.key !== 'Escape') return; if (state.policyDetailId) return setState({ policyDetailId: null }); if (state.rankModal) setState({ rankModal: null }); });
render();
