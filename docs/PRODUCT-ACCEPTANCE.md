# 园区项目工作台 P0 验收说明

## 验收范围

本次交付保留匿名可浏览的七页示范驾驶舱，并新增登录后使用的真实项目工作台。P0 业务闭环为：

> 园区建档 → 数据导入 → 指标诊断 → 建设与申报任务 → 佐证材料 → 成果交付

不在本次范围内：实时 EMS、电表、储能、光伏、VPP 生产接口，任意表头 AI 映射，以及 DOCX 申报书自动组稿。

## 人工验收路径

1. 匿名打开 `#/dashboard`、`#/policies` 和 `#/qa`，确认示范页面与政策检索可浏览。
2. 匿名打开 `#/workspace`，确认只能看到登录入口，不能读取园区名称或文件。
3. 登录准入管理员账号，在 `#/workspace/onboarding` 创建两个园区并切换。
4. 在 `#/workspace/imports` 下载四份模板；用有效样例确认预览后导入；用缺列或负数样例确认错误能定位到行。
5. 在 `#/workspace/diagnosis` 生成诊断，确认结果只出现“已达标、有差距、缺少数据、不适用”，并显示计算说明、基准日和版本。
6. 从差距或缺数指标创建任务，填写责任人和计划日期；上传佐证后更新状态。
7. 新建一个无佐证、无审核备注的任务，确认不能直接标记完成。
8. 在 `#/workspace/deliverables` 依次预览四类成果；确认后打印诊断报告或下载 XLSX。
9. 刷新并重新登录，确认导入批次、诊断、任务和成果仍存在；切换另一园区确认数据不串联。
10. 使用只读成员登录，确认页面不显示写操作，直接发起写 API 仍返回 403。

## 自动验收

```bash
npm run typecheck
npm run test -- --run
npm run test:server
npm run test:e2e
npm run build
```

新增端到端测试会实际完成建档、月度能源账单导入、诊断、差距转任务、佐证上传、任务完成、成果下载和刷新持久化，并在 390×844 视口检查工作台页头和横向溢出。

2026-08-26 发布候选包验证结果：TypeScript 检查通过；17 个单元测试文件共 47 项通过；服务、权限和存储测试共 51 项通过；浏览器验收共 14 项通过；生产构建与三项发布包结构审计通过。

## 安全与发布检查

- `dist/client/index.html`、`dist/server/index.js` 和 `dist/.openai/drizzle/0001_project_workbench.sql` 必须存在。
- `dist/` 不得包含 `.env.local`、`.dev.vars`、MiniMax API Key 或本地数据库内容。
- 公网 `POST /api/qa` 必须要求可信登录身份；匿名政策检索不受影响。
- 公网工作台必须配置首位组织管理员身份；园区和文件访问继续受成员权限控制。
- 公网未配置 MiniMax 密钥时应返回稳定的未配置状态，不得回退到客户端密钥或演示回答。
- `npm audit --omit=dev` 当前仅报告 ECharts `<6.1.0` 的一项中等级别上游公告；修复要求跨主版本升级到 6.1.0，P0 不使用不可信富文本生成图表配置，故不在本次发布中强制升级，后续应单独做图表回归后处理。

## 成果目录

- 四份导入模板：`public/templates/`
- 数据迁移：`drizzle/0001_project_workbench.sql`
- Worker 工作台服务：`server/workspace/`
- 工作台页面：`src/pages/workspace/`
- 浏览器闭环验收：`tests/e2e/workspace.spec.ts`
- 产品规格与实施记录：`docs/superpowers/`
