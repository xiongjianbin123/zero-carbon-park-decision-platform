# 园区项目工作台 P0 设计规格

## 1. 目标

将现有“零碳园区全过程决策与申报咨询平台”从单一演示园区展示系统，升级为可承载真实园区项目的工作平台。P0 交付一条可验证闭环：

> 创建园区 → 导入数据 → 生成指标诊断 → 转换建设任务 → 上传佐证材料 → 导出成果。

同时保留现有公网示范园区的匿名浏览、七页导航、引导式汇报、政策检索、VPP 工作台和深蓝能源视觉。

## 2. 产品边界与已确认假设

- 产品定位为“单组织、多园区项目”，不做面向不同客户自助注册的通用 SaaS。
- 公网演示区保持匿名可访问，只使用现有虚构的“晋北资源型工业零碳示范园区”数据。
- 真实项目工作台必须登录；匿名用户不能读取项目名称、上传文件、指标结果和任务。
- 实时 EMS、电表、储能、光伏和 VPP 接口不进入 P0；首版以 Excel/CSV 导入建立可核验数据基线。
- 指标、投资和任务结果由确定性程序生成；MiniMax 不得修改数值、权限、任务状态或文件。
- P0 成果格式为 PDF 和 XLSX；DOCX 申报书自动组稿放在后续版本。

## 3. 方案决策

采用“现有 Vue 应用 + Cloudflare Worker + D1 + R2 + Sites 身份”方案。

不采用浏览器 `localStorage` 保存业务数据，因为其无法支持多设备、协作、权限和可靠备份。不采用独立外部数据库或自建 OAuth，避免在 P0 引入额外运维面。

结构化业务数据存入 D1，原始文件与 XLSX 成果存入 R2。诊断报告保存可重现的数据快照，由浏览器打印或另存为 PDF。现有政策目录和混合索引继续作为可重建静态资料，不复制进 D1。

## 4. 信息架构

### 4.1 双模式入口

顶部增加模式切换：

- **示范驾驶舱**：现有公网七页与引导式汇报；
- **项目工作台**：登录后进入真实园区工作流。

匿名用户点击“项目工作台”时，使用 Sites 提供的“Sign in with ChatGPT”流程，完成后返回 `/#/workspace`。不自建密码、短信码或第三方 OAuth 页面。

### 4.2 工作台路由

```text
#/workspace                 当前园区项目总览
#/workspace/onboarding      园区建档与基线设置
#/workspace/imports         数据导入中心
#/workspace/diagnosis       指标差距诊断
#/workspace/tasks           申报与建设任务闭环
#/workspace/deliverables    佐证材料与成果导出
```

工作台顶部固定显示当前园区、数据基准日、资料完整度和当前用户角色。切换园区时清空页面草稿和未提交导入预览，防止数据串项目。

## 5. 主用户流程

### 5.1 园区建档

1. 用户创建园区，填写名称、所在地、园区类型、主导产业、基准年、目标年和申报方向。
2. 系统创建空的数据基线，不把演示园区数字复制到真实项目。
3. 只有组织管理员可创建园区；创建者成为该园区的 `admin`，可按邮箱邀请工作台成员并设置项目角色。

### 5.2 数据导入

1. 用户选择导入模板：月度能源账单、时序负荷、园区企业清单或项目清单。
2. 浏览器解析 XLSX/CSV，展示列映射、行数、单位、空值和错误行；未确认时不写入平台。
3. 提交时同时上传原始文件和标准化记录。Worker 重新校验项目权限、文件类型、大小、字段、单位和数值范围。
4. 校验通过后，原始文件写入 R2，标准化数据按 `import_id` 分批使用 D1 batch 写入。任一批次失败时，按 `import_id` 删除已写入记录和当次 R2 对象，不留下部分导入或无主文件。
5. 成功后记录导入批次、来源文件、执行人、数据期间、成功行和驳回行。

P0 单文件限制为 10 MB，单个时序批次最多 35,040 个数据点；PDF 作为佐证材料保存，不做 OCR 或任意表格自动推断。

### 5.3 指标诊断

- 指标定义、单位、公式、目标值和必需数据集保存在受版本控制的 `indicatorDefinitions` 中。
- 诊断引擎只读取标准化数据，产生 `achieved`、`gap`、`missing_data` 或 `not_applicable` 状态。
- 每个结果保存指标版本、计算时间、输入数据批次、当前值、目标值、单位和计算说明。
- 数据不足时不使用演示值、行业均值或 MiniMax 补数，只列出缺失数据和下一步动作。

### 5.4 任务闭环

- 用户可从 `gap` 或 `missing_data` 结果生成任务草稿。
- 任务必须有标题、类型、责任人、计划日期和状态；证据清单可在建立任务后补充。
- 状态只允许 `draft`、`open`、`in_progress`、`blocked`、`done`。
- 任务完成时必须有至少一份佐证文件或一条审核备注，避免只改状态无证据。
- 任务变更记录执行人、时间、变更前后状态和备注。

### 5.5 成果导出

P0 提供四种成果：

1. 园区指标诊断报告 PDF；
2. 建设与申报任务表 XLSX；
3. 项目投资清单 XLSX；
4. 申报佐证材料目录 XLSX。

成果必须标记园区、数据基准日、生成时间、指标版本和数据缺口。导出前生成预览；XLSX 在用户确认后保存到 R2 并下载，诊断报告保存快照和摘要后打开打印视图，由浏览器另存为 PDF。

## 6. 视觉与交互

- 沿用现有深蓝能源调度色调、字号、页头层级和可视化风格。
- 固定颜色语义：青色为能源与实时状态，绿色为达标与完成，黄色为机会与待推进，红色为风险与缺口，紫色为投资和市场价值。
- 工作台采用紧凑的专业密度，不新增占满首屏的超大数字卡。
- 总览页首屏只保留四个高价值信息：数据完整度、达标率、打开任务数和最近截止日。
- 所有表格支持空状态、错误行定位、键盘操作、横向滚动和导出；关键操作使用明确文案，不只使用图标。
- 移动端保证浏览、任务更新和文件查看；批量导入和复杂映射明确提示在桌面端完成。

## 7. 运行架构

```text
浏览器 Vue 3
  ├─ 公网示范页（现有配置）
  ├─ 项目工作台（登录后）
  ├─ XLSX/CSV 解析与导入预览
  └─ PDF/XLSX 成果预览与下载
             │
Cloudflare Worker
  ├─ 身份解析和项目级授权
  ├─ 园区、导入、诊断、任务、文件和成果 API
  ├─ 确定性指标诊断引擎
  ├─ 现有政策混合检索
  └─ 有证据的 MiniMax 答复
             │
  ┌──────┴──────┐
D1 (DB)              R2 (FILES)
结构化数据          原始文件与成果
```

`.openai/hosting.json` 使用逻辑绑定 `d1: "DB"` 和 `r2: "FILES"`；实际 Cloudflare 资源由 Sites 管理。浏览器储存只保存页面密度、最后访问标签等非权威 UI 偏好。

## 8. 身份、角色与数据隔离

Worker 只信任 Sites 转发的 `oai-authenticated-user-id` 和 `oai-authenticated-user-email`，不信任前端传入的用户 ID、邮箱或角色。

用户完成 ChatGPT 登录后仍需通过 `workspace_users` 组织准入检查。已登录但未被邀请的用户不能创建园区或获取园区列表。

组织角色只有 `org_admin` 和 `org_member`；`org_admin` 可创建园区和邀请组织成员，`org_member` 只能访问已分配的园区。园区内部再使用以下项目角色：

角色与权限：

- `admin`：园区编辑、成员、导入、诊断、任务、文件和导出；
- `manager`：除成员管理外的项目业务操作；
- `specialist`：导入、诊断、任务和文件操作，不能删除园区；
- `viewer`：只读项目数据与成果。

所有 `/api/workspace/*` 请求先验证身份，再在 D1 查询 `park_members`。每条查询必须携带 `park_id`，R2 键必须以 `parks/{parkId}/` 开头。不依赖前端隐藏按钮实现授权。

平台所有者身份在部署时从 Sites 项目所有者 ID 安全写入运行环境，作为初始组织管理员。管理员按邮箱创建待接受的 `workspace_users` 记录，被邀请人首次登录时绑定 Sites 用户 ID。不使用“第一个登录用户自动成为管理员”的方式。

MiniMax 自由问答在公网环境要求登录，预置确定性问答和政策检索仍允许匿名使用，以控制调用成本和滥用。

## 9. D1 数据模型

数据库定义位于 `db/schema.ts`，迁移位于 `drizzle/`。Worker 通过小型 `db` helper 和 D1 prepared statements 访问，不在各路由中直接拼接 SQL。

P0 数据表：

- `workspace_users`：Sites 用户 ID、受信邮箱、组织角色、邀请状态和最后登录；
- `parks`：园区档案、基准年、目标年、状态和创建者；
- `park_members`：园区、用户、邮箱、角色和成员状态；
- `imports`：导入类型、文件、数据期间、行数、状态和执行人；
- `energy_monthly`：月度电、气、热、蒸汽、费用、绿电和报告期；
- `load_curve_points`：时间戳、负荷、光伏、储能充放电和记录间隔；
- `enterprises`：企业名称、行业、年产值、综合能耗、用电量和重点用能标记；
- `park_projects`：建设项目、类型、状态、投资、容量、计划日期和预期减排；
- `indicator_results`：指标版本、当前值、目标值、单位、状态、输入批次和计算说明；
- `tasks`：来源指标、任务类型、标题、责任人、期限、状态和备注；
- `files`：R2 键、文件名、类型、大小、归属对象、上传人和校验摘要；
- `exports`：成果类型、数据基准、诊断快照摘要、可选 R2 键、生成人和生成时间；
- `audit_logs`：园区、用户、操作、对象、结果和时间。

索引只根据实际查询建立：`workspace_users(email)` 和 `park_members(park_id, user_id)` 唯一索引、各业务表的 `(park_id, period/status)` 组合索引、打开任务的部分索引。迁移生成后检查 SQL，并用 `EXPLAIN QUERY PLAN` 验证高频查询使用预期索引。

## 10. R2 对象结构

```text
parks/{parkId}/imports/{importId}/{safeFilename}
parks/{parkId}/evidence/{fileId}/{safeFilename}
parks/{parkId}/exports/{exportId}/{safeFilename}
```

文件下载必须经过 Worker 权限检查，不向前端暴露永久公开 R2 URL。上传名称移除路径字符并保留原始显示名，允许类型限于 XLSX、CSV、PDF、PNG 和 JPEG。

## 11. API 边界

公开接口保留：

```text
GET  /api/health
GET  /api/policies
POST /api/policies/search
```

登录后接口：

```text
GET    /api/auth/me
GET    /api/workspace/parks
POST   /api/workspace/parks
GET    /api/workspace/parks/:parkId
PATCH  /api/workspace/parks/:parkId
GET    /api/workspace/parks/:parkId/members
POST   /api/workspace/parks/:parkId/members
PATCH  /api/workspace/parks/:parkId/members/:memberId
GET    /api/workspace/parks/:parkId/imports
POST   /api/workspace/parks/:parkId/imports
POST   /api/workspace/parks/:parkId/diagnosis
GET    /api/workspace/parks/:parkId/diagnosis/latest
GET    /api/workspace/parks/:parkId/tasks
POST   /api/workspace/parks/:parkId/tasks
PATCH  /api/workspace/parks/:parkId/tasks/:taskId
POST   /api/workspace/parks/:parkId/files
GET    /api/workspace/parks/:parkId/files/:fileId
POST   /api/workspace/parks/:parkId/exports
GET    /api/workspace/parks/:parkId/exports/:exportId
POST   /api/qa
```

`POST /api/qa` 在公网环境要求登录，只向 MiniMax 发送最多 6 条政策证据和已选园区的必要摄要。不发送原始文件、成员信息、完整负荷曲线或无关业务数据。

## 12. 导入数据契约

P0 提供四份固定模板，不实现任意表头的 AI 自动映射。

### 12.1 月度能源账单

必填：月份、用电量 kWh、电费元。可选：绿电电量 kWh、天然气 m³、热力 GJ、蒸汽 t。

### 12.2 时序负荷

必填：时间、负荷 kW。可选：光伏 kW、储能充电 kW、储能放电 kW。同一批次间隔必须一致，只支持 15 分钟、30 分钟或 60 分钟。

### 12.3 企业清单

必填：企业名称、行业。可选：年产值万元、综合能耗 tce、年用电量 kWh、重点用能单位。

### 12.4 项目清单

必填：项目名称、类型、状态。可选：投资万元、容量数值、容量单位、计划开工、计划投产、预期减排 tCO₂e。

## 13. 错误处理与一致性

- API 错误统一返回 `code`、`message` 和可选的 `fieldErrors`，不返回 SQL、R2 键、密钥或堆栈。
- 身份缺失返回 401，无项目权限返回 403，记录不存在返回 404，数据校验失败返回 422，重复导入返回 409。
- 导入以文件摘要 + 园区 + 数据类型检测重复；用户必须明确选择替换或取消，不默认重复追加。
- 诊断生成新版本，不覆盖历史结果。任务继续引用生成它的指标结果版本。
- 所有写操作在成功或失败时写入审计记录；日志不保存文件正文、MiniMax 密钥或完整问题。
- D1 或 R2 不可用时，公网示范页和静态政策检索仍可访问；工作台显示服务不可用，绝不回退到演示数据写入真实项目。

## 14. MiniMax 边界

- 公网密钥只作为 Sites 托管秘密环境变量 `MINIMAX_API_KEY`，不从本机 `.env.local` 自动复制，不出现在仓库、构建包、日志或聊天。
- 默认模型继续为 `MiniMax-M3`，基础地址继续为 `https://api.minimaxi.com/anthropic`。
- 无密钥、无检索证据、上游失败或超限时不生成无证据答案。
- 问答输出必须只引用当次检索结果中存在的证据编号。

## 15. 文件边界

```text
db/schema.ts                         D1 表定义
drizzle/                             受版本控制的 SQL 迁移
server/workspace/                    身份、D1/R2 访问、导入、诊断、任务与导出
server/worker.mjs                    仅负责公开 API 与 workspace 路由编排
src/pages/workspace/                 项目工作台页面
src/components/workspace/            建档、导入、诊断、任务与成果组件
src/services/workspaceApi.ts          登录工作台 API 客户端
src/config/indicatorDefinitions.ts    确定性指标定义
public/templates/                     四份数导入模板
tests/unit/workspace/                 页面和诊断单元测试
tests/server/workspace/               权限、导入、计算和存储测试
tests/e2e/workspace.spec.ts           闭环浏览器验收
```

`server/worker.mjs` 不继续膨胀为单文件业务层；新能力按上述边界拆分，现有公开政策接口保持不变。

## 16. 测试策略

### 16.1 单元测试

- 四种导入模板的有效、缺列、错单位、重复时间和负数数据；
- 指标引擎的达标、差距、缺数和不适用分支；
- 任务状态转换和完成证据约束；
- 成果模型中的园区、基准、版本和缺口字段。

### 16.2 Worker 集成测试

- 匿名、非成员、不同角色和跨园区访问；
- D1 写入失败时 R2 回滚，文件不存在时 D1 不留孤立记录；
- 重复导入、诊断版本、任务引用和审计日志；
- 公开政策检索不依赖 D1/R2。

### 16.3 浏览器验收

- 匿名用户继续浏览现有七页，点击工作台进入登录流程；
- 登录用户完成“建档→导入→诊断→任务→佐证→导出”；
- 切换园区不串数据，只读用户不看到写操作且 API 同样拒绝；
- 1440×900、1280×900 和 390×844 下页头、表格、弹窗和按钮无遮挡；
- 导入错误行可定位，长文件名、长园区名和大数字不破坏布局。

### 16.4 发布验证

- 生产构建包含 `dist/client` 和 `dist/server/index.js`，不含 `.env.local` 或 `.dev.vars`；
- D1 迁移位于 `dist/.openai/drizzle/`；
- 公网首页、静态资源、政策检索、登录工作台和文件权限均使用生产 URL 验证。

## 17. P0 验收标准

1. 匿名用户可正常使用现有公网示范驾驶舱和政策检索。
2. 匿名用户不能获取任何真实园区列表、数据或文件元数据。
3. 已登录管理员可创建两个园区并安全切换，项目数据不串联。
4. 四种导入模板均可下载，有效样例可提交，无效行在提交前明确标出。
5. 原始文件保存在 R2，标准化数据和导入记录保存在 D1，页面刷新和重新登录后仍存在。
6. 指标诊断对有数据指标输出可回溯计算，对无数据指标输出明确缺口，不引入演示值。
7. 任务可从指标缺口生成，指派责任人、设置日期、更新状态并关联佐证。
8. 无佐证文件且无审核备注的任务不能标记为完成。
9. 可预览并下载四种成果，成果包含基准日、版本和数据缺口。
10. `viewer` 的写请求被 API 拒绝；非成员不能通过猜测 ID 访问项目。
11. 公网 MiniMax 密钥不进入代码、Git、构建包和日志；未安全配置时不发起模型请求。
12. 现有 25 项单元测试、18 项服务测试和 12 项 E2E 测试保持通过，新增 P0 测试全部通过，生产构建成功。
13. 公网重新部署后完成首页、工作台、园区隔离、导入、文件下载、政策检索和成果下载的线上验证。

## 18. 明确不做

- 不接入实时 EMS、电表、储能、光伏、调度或交易平台。
- 不做多租户自助注册、订阅、计费或外部身份提供方。
- 不做任意 Excel 的 AI 自动映射，不做 PDF OCR 和表格抽取。
- 不做申报书 DOCX 自动组稿、电子签章和在线审批。
- 不让 MiniMax 自动修改指标、任务、成员、文件或项目数据。
- 不自动抓取全网政策，现有受控政策入库流程保持不变。
