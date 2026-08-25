# 零碳园区全过程决策与申报咨询平台

面向山西资源型工业园区转型的全过程决策与申报咨询平台。产品采用统一深蓝能源调度视觉，支持自由浏览、引导式汇报、项目与投资下钻、政策资料检索和园区智能问数。

## 最快启动

macOS Finder 中双击：

```text
scripts/start.command
```

脚本会在缺少依赖时自动执行 `npm install`，随后打开：

```text
http://127.0.0.1:5274/#/dashboard
```

脚本会同时启动页面和本地服务。也可从终端分别启动：

```bash
npm install
npm run api:dev
npm run dev -- --host 127.0.0.1 --port 5274
```

## 七个页面

- `#/dashboard`：园区驾驶舱
- `#/roadmap`：2026—2030 零碳建设路径
- `#/projects`：全过程项目地图
- `#/policies`：政策知识库、申报对标、山西能源专题和政策更新雷达
- `#/investment`：投资与资金地图
- `#/operations`：源网荷储态势、灵活资源池、VPP 虚拟电厂、市场协同推演和运行风险行动
- `#/operations/vpp`：直接进入 VPP 聚合运营工作台
- `#/qa`：园区智能问数

顶部“开始引导汇报”按上述顺序讲解七页；汇报过程中仍可使用顶部导航自由切换。

## 修改演示数据

所有业务数字、园区名称、项目、政策、能源运营场景、问答和汇报词都集中在：

```text
src/config/park.ts
```

修改后保存，开发服务会自动刷新。配置校验失败时，页面会直接显示具体错误字段，不会用随机数据回退。

当前成品使用虚构的“晋北资源型工业零碳示范园区”演示数据，基准日为 2026-08-25，不代表真实园区申报或投资结论。

## 能源运营能力融合

“能源运营”原生融合源网荷储运行态势和虚拟电厂市场经营能力，不依赖另外两个应用同时启动。VPP 工作台覆盖资源聚合、负荷预测、需求响应、交易策略、执行监控和收益结算六个连续环节。当前提供典型日、迎峰度夏、生产高峰三个确定性演示场景，页面明确区分规划中、建设中和已建成资源；运行曲线、市场价值和风险建议均为演示推演，不代表真实调度或交易指令。

## 政策资料与本地索引

政策目录位于 `public/policies/catalog.json`，本地文本与 PDF 位于 `public/policies/`。当前收录国家级零碳园区、国家能源局、山西省能源转型以及园区技术标准资料。

更新资料后重建索引：

```bash
npm run policies:import
npm run policies:index
```

## 智能问数本机配置

从 MiniMax 控制台复制 API Key 后，在 Finder 中双击：

```text
scripts/configure-minimax.command
```

根据终端提示粘贴密钥。输入内容不会显示，配置仅保存在本机已忽略的 `.env.local`，权限为仅当前用户可读写。完成后重启平台。

## 生成静态构建包

双击：

```text
scripts/build-static.command
```

或者运行：

```bash
npm run typecheck
npm run test -- --run
npm run test:server
npm run build
```

构建产物位于 `dist/`。本机完整部署请使用 `scripts/serve-static.command`，它会同时提供构建页面、政策检索和智能问数接口。

本机启动完整构建包：

```bash
PORT=4174 node server/index.mjs
```

打开 `http://127.0.0.1:4174/#/dashboard`。

## 本机常驻部署

项目附带 `deploy/com.xjb.zero-carbon-park.plist`。安装为 macOS LaunchAgent 后，平台会在登录时自动启动，并常驻：

```text
http://127.0.0.1:4174/#/dashboard
```

服务日志：

```text
/tmp/zero-carbon-park.out.log
/tmp/zero-carbon-park.err.log
```

## 验证命令

```bash
npm run typecheck
npm run test -- --run
npm run test:server
npm run test:e2e
npm run build
```

浏览器验收截图保存在 `artifacts/screenshots/`。

## 环境

- Node.js 20 或更高版本
- npm 10 或更高版本
- 首次运行浏览器测试时执行 `npx playwright install chromium`
