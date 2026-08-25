# 政策知识库、本地混合检索与 MiniMax 接入设计规格

## 1. 目标

在现有“零碳园区全过程决策与申报咨询平台”六页结构内，扩展政策与申报能力，使平台能够：

1. 管理国家零碳园区、技术标准和山西能源政策资料；
2. 以政策原文、页码和官方链接为依据进行全文检索；
3. 将国家级零碳园区指标与园区现状逐项对标；
4. 把山西绿电直连、新型储能、虚拟电厂、市场交易和能碳管理串成园区业务场景；
5. 使用 MiniMax Token Plan 对检索结果进行归纳，返回带引用的中文答案；
6. 保持现有深蓝能源调度视觉、一键启动和本机构建交付方式。

## 2. 已确认的产品与文案原则

- 采用“核心政策文件本地化、动态信息保留官方链接”的混合资料方案。
- 采用“本地元数据过滤 + 中文全文检索 + MiniMax 回答”的问答方案。
- 不增加登录页，不改变六个一级路由。
- “政策与申报”页内部增加四个标签：政策知识库、申报对标、山西能源专题、政策更新雷达。
- “智能问数”页保留预置问题，同时增加自由提问和证据引用。
- 页面只表达政策、数据、缺口、责任和动作，不展示“本地索引运行正常”“官方来源已核验”“Token Plan”等实现说明。
- 页面不假定只有领导使用；“领导简报”统一改为“专题简报”。
- 核心正文不小于 13px，标题、按钮和关键数字延续当前稍大字号。
- 当前园区数字继续标注为演示数据；政策文件名称、文号、发布机构、发布日期、状态和官方链接必须是真实资料。

## 3. 信息架构

### 3.1 政策知识库

三栏结构：

- 左栏：搜索、国家/山西、政策/标准、现行/试行/在编过滤及资料列表；
- 中栏：文件元数据、原文片段、页码、官方原文入口和关联动作；
- 右栏：自由提问、引用资料、结论和“生成申报任务/加入项目节点/生成专题简报”动作。

文件状态只允许：`现行`、`试行`、`在编`、`已废止`。在编标准不得被描述为已生效要求。

### 3.2 申报对标

- 左栏展示园区资格、基准年碳盘查、指标测算、项目论证、建设方案、审核推荐六个阶段；
- 中栏展示国家试行核心指标和引导指标的门槛、当前值、差距及数据状态；
- 右栏展示缺口任务、责任单位和计划日期。

没有园区数据的指标显示“待核算”或“待录入”，不得使用估算值填充。

### 3.3 山西能源专题

- 左栏按绿电直连、新型储能、虚拟电厂、电力市场、绿电绿证、能碳管理分类；
- 中栏用“能源物理流 + 市场机制”双层拓扑展示周边新能源、园区光伏、大电网、共享储能、虚拟电厂和工业负荷；
- 右栏展示对应政策、适用场景和可形成的园区项目组合。

### 3.4 政策更新雷达

- 按发布日期展示近期国家和山西政策动态；
- 每条动态标记高影响、项目机会、持续跟踪或对标案例；
- 右侧只解释对当前园区申报、项目或投资工作的影响。

## 4. 首批资料范围

### 4.1 本地化核心文件

首批至少保存以下官方 PDF 或其官方页面正文，并生成本地文本索引：

1. 《关于开展零碳园区建设的通知》（发改环资〔2025〕910号）；
2. 附件1《零碳园区建设基本条件》；
3. 附件2《国家级零碳园区申报书大纲》；
4. 附件3《国家级零碳园区建设指标体系（试行）》；
5. 附件4《零碳园区碳排放核算方法（试行）》；
6. 《首批国家级零碳园区建设名单》；
7. 工业和信息化部绿色工厂、绿色工业园区相关文件或解读；
8. 工业领域零碳园区、能碳管理中心和产品碳足迹标准化方向文件；
9. 山西省零碳园区建设工作部署；
10. 山西省能源转型相关重点任务；
11. 山西省新型储能高质量发展相关方案；
12. 山西绿电园区、绿电直连、虚拟电厂及电力市场相关官方资料。

其余动态新闻和频繁变化的交易规则只保存元数据、摘要、发布日期和官方链接，定期复核。

### 4.2 资料元数据

每份资料保存：

```ts
interface PolicyDocument {
  id: string
  title: string
  documentNumber?: string
  level: 'national' | 'shanxi' | 'technical'
  category: 'policy' | 'indicator' | 'accounting' | 'standard' | 'energy' | 'case'
  status: 'effective' | 'trial' | 'drafting' | 'repealed'
  issuers: string[]
  publishedAt: string
  sourceUrl: string
  localFile?: string
  localText?: string
  tags: string[]
  summary: string
  relatedProjectIds: string[]
}
```

资料正文切分后的每个片段保存稳定 `chunkId`、`documentId`、页码或章节、正文和检索字段。

## 5. 本地混合检索

检索不引入外部向量数据库。首版组合三类信号：

1. 元数据过滤：地区、类别、状态、发布机构、标签；
2. 精确匹配：文件名、文号、完整短语；
3. 全文相关性：中文双字词组、数字/英文词项、词频和逆文档频率。

标题、文号和标签命中的权重大于正文命中。检索结果必须返回匹配片段、文件名称、页码/章节和官方链接。默认最多向模型提供 6 个片段，单片段长度和总上下文设上限，避免把整个资料库发送到模型。

数据文件边界：

```text
public/policies/catalog.json     资料目录与元数据
public/policies/files/           本地核心 PDF
public/policies/text/            从 PDF/官方页面提取的纯文本
public/policies/index.json       可重建的检索片段索引
```

索引脚本只读取 `catalog.json` 和本地文本，不抓取未列入目录的网页。

## 6. MiniMax Token Plan 接入

### 6.1 安全边界

- API Key 只保存在项目根目录 `.env.local` 或操作系统环境变量；
- `.env.local` 必须加入 `.gitignore`，文件权限设为当前用户可读写；
- 前端代码、构建包、日志、测试夹具和错误信息不得包含 Key；
- 页面只显示业务化的“政策问答”状态，不显示供应商、套餐或 Key 状态；
- 服务端日志只记录请求耗时、命中资料数和错误类别，不记录 Key 与完整敏感问题。

### 6.2 接口

使用 MiniMax Token Plan 的 Anthropic 兼容接口：

- Base URL：`https://api.minimaxi.com/anthropic`
- 消息接口：`POST /v1/messages`
- 默认模型：`MiniMax-M3`
- 可通过 `MINIMAX_MODEL` 在 `.env.local` 覆盖，以适应账户实际可用模型。

使用官方 `@anthropic-ai/sdk`，不自行拼接认证头。请求使用低随机性系统提示词，要求：

- 只能根据传入证据和园区配置回答；
- 区分真实政策事实与演示园区数据；
- 不足以判断时明确列出缺少的数据；
- 引用使用传入的稳定证据编号，不生成不存在的文号或页码；
- 输出一句结论、关键依据、建议动作和引用编号。

### 6.3 本地 API

```text
GET  /api/health              服务状态，不返回密钥信息
GET  /api/policies            返回资料目录
POST /api/policies/search     返回本地检索结果
POST /api/qa                  检索证据并调用 MiniMax
```

`POST /api/qa` 输入问题和可选过滤条件，返回：

```ts
interface EvidenceAnswer {
  answer: string
  citations: Array<{
    evidenceId: string
    documentId: string
    title: string
    page?: string
    sourceUrl: string
    excerpt: string
  }>
}
```

无 Key 时返回 `503 MINIMAX_NOT_CONFIGURED`；无可用证据时返回 `422 EVIDENCE_NOT_FOUND`；上游限额或网络失败时返回可操作的中文错误，不回退为无证据生成。

## 7. 本地服务与交付

- 增加一个轻量 Node.js 服务，统一提供静态构建包和 `/api`；不引入数据库。
- `npm run dev` 继续启动 Vite；开发模式另启本地 API，并由 Vite 代理 `/api`。
- 正式本地部署由 Node 服务在 `127.0.0.1:4174` 同时提供 `dist/` 和 API。
- 原有纯 `dist/` 仍可作为静态展示包使用；没有本地 API 时，政策目录和预置问答可浏览，自由 AI 问答显示明确配置提示。
- 增加一个终端配置脚本，以隐藏输入方式写入 `.env.local`；用户无需在聊天或源代码中粘贴 Key。
- LaunchAgent 仍使用 `com.xjb.zero-carbon-park`，仅把执行入口切换到统一服务脚本。

## 8. 文件边界

```text
server/
  index.mjs                    HTTP、静态文件和 API 路由
  minimaxClient.mjs            MiniMax 调用与响应解析
  policyRepository.mjs         目录加载、全文检索和引用组装
scripts/
  import-policy-documents.mjs  按目录下载/提取核心文件
  build-policy-index.mjs       生成可重建索引
  configure-minimax.command    隐藏输入并写入本机配置
src/
  components/policies/         四个政策子视图与公共小组件
  pages/policies/PoliciesPage.vue
  pages/qa/QaPage.vue
  services/policyApi.ts        浏览器 API 客户端
  config/policyViews.ts        山西场景、指标与雷达展示配置
public/policies/               资料目录、PDF、文本和索引；构建时原样进入 dist
tests/
  unit/policySearch.spec.ts
  unit/PoliciesPage.spec.ts
  unit/QaPage.spec.ts
  server/policyRepository.test.mjs
  server/minimaxClient.test.mjs
  e2e/platform.spec.ts
```

现有 `src/config/park.ts` 继续只负责园区演示业务数据；真实政策目录不塞入该文件。

## 9. 验收标准

1. 政策页四个标签均可点击，布局与已批准预览一致。
2. 政策目录至少包含 12 份国家和山西官方资料，核心 PDF/正文已落地并可检索。
3. 搜索“清洁能源占比”“绿电直连”“虚拟电厂”等词能返回相关文件、片段和来源位置。
4. 申报对标准确展示国家试行门槛；无数据指标明确显示待核算/待录入。
5. 山西能源专题展示现有园区光伏、储能、灵活负荷和绿电缺口，并关联对应政策。
6. 政策雷达按日期排序，点击后能看到对项目或申报工作的影响。
7. 未配置 Key 时自由问答不发起外部请求，并给出本机配置指引。
8. 配置有效 Token Plan Key 后，自由问答返回正文与至少一个可点击引用；引用内容存在于检索结果中。
9. MiniMax 不可用时不生成无证据答案，预置确定性问答仍可使用。
10. Key 不出现在前端构建包、日志、Git 忽略范围外文件和测试快照中。
11. `npm run typecheck`、单元测试、服务端测试、E2E 测试和 `npm run build` 全部通过。
12. `http://127.0.0.1:4174/#/dashboard` 可由 LaunchAgent 常驻运行，新功能可直接使用。

## 10. 明确不做

- 首版不引入向量数据库、用户权限、在线编辑后台或自动爬取全网政策；
- 不对真实园区是否满足申报条件作无数据推断；
- 不让模型修改园区配置、项目节点或本地文件；页面动作首版生成可审阅草稿，不自动落库；
- 不把在编标准包装为现行标准；
- 不修改与本轮无关的驾驶舱、路线图、项目和投资业务逻辑。
