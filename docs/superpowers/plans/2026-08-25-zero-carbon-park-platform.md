# 零碳园区全过程决策与申报咨询平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 交付一套六页、统一深色视觉、数据可追溯、可本地一键启动并可静态部署的山西零碳园区领导演示平台。

**Architecture:** 使用 Vue 3、TypeScript、Vue Router Hash 模式和 ECharts 构建纯前端单页应用。所有业务数据只从 `src/config/park.ts` 读取，衍生值通过纯函数计算；六页共享应用外壳和视觉令牌，引导汇报状态由轻量 composable 管理。

**Tech Stack:** Vue 3.5、TypeScript 5.9、Vite 8、Vue Router 4、ECharts 5、Vitest、Vue Test Utils、Playwright

**Spec:** `docs/superpowers/specs/2026-08-25-zero-carbon-park-platform-design.md`

## Global Constraints

- 六页统一使用 `#061229` 深蓝底色，不允许浅色内页。
- 业务数据唯一来源为 `src/config/park.ts`，禁止随机数和联网回退数据。
- 默认直接进入 `#/dashboard`，不设置登录页。
- 桌面正文不小于 14px，导航不小于 15px，关键数字为 28—36px。
- 首要验收视口为 1440×900，并兼容 1920×1080、1280×720 和最小 768px 宽度。
- 当前目录不是 Git 仓库；执行中不初始化仓库、不伪造提交步骤。

---

### Task 1: 工程骨架、统一配置和数据一致性

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `index.html`
- Create: `src/env.d.ts`
- Create: `src/types/park.ts`
- Create: `src/config/park.ts`
- Create: `src/utils/parkValidation.ts`
- Test: `tests/unit/parkValidation.spec.ts`

**Interfaces:**
- Produces: `parkConfig: Readonly<ParkConfig>`
- Produces: `validateParkConfig(config: ParkConfig): string[]`
- Produces: `sumInvestment(items: InvestmentSector[]): number`
- Produces: `sumFunding(items: FundingSource[]): number`

- [ ] **Step 1: 写失败的数据一致性测试**

```ts
import { describe, expect, it } from 'vitest'
import { parkConfig } from '../../src/config/park'
import { sumFunding, sumInvestment, validateParkConfig } from '../../src/utils/parkValidation'

describe('park configuration', () => {
  it('keeps investment and funding totals consistent', () => {
    expect(sumInvestment(parkConfig.investment.sectors)).toBe(67)
    expect(sumFunding(parkConfig.investment.fundingSources)).toBe(67)
  })

  it('resolves every QA metric reference', () => {
    expect(validateParkConfig(parkConfig)).toEqual([])
  })

  it('contains six guided-tour stops and at least twelve questions', () => {
    expect(parkConfig.tour).toHaveLength(6)
    expect(parkConfig.qa.length).toBeGreaterThanOrEqual(12)
  })
})
```

- [ ] **Step 2: 安装依赖并确认测试因缺少实现失败**

Run: `npm install && npm run test -- --run tests/unit/parkValidation.spec.ts`

Expected: FAIL，提示 `src/config/park` 或 `parkValidation` 不存在。

- [ ] **Step 3: 实现最小类型、配置和纯校验函数**

`ParkConfig` 明确定义 `meta`、`overview`、`roadmap`、`projects`、`policies`、`investment`、`qa` 和 `tour`。`validateParkConfig` 校验投资合计、资金合计、问答指标引用、路由数量和唯一 ID；金额按亿元保留两位精度比较。

- [ ] **Step 4: 运行数据测试**

Run: `npm run test -- --run tests/unit/parkValidation.spec.ts`

Expected: PASS，3 项测试全部通过。

---

### Task 2: 统一应用外壳、Hash 路由和视觉令牌

**Files:**
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/router/index.ts`
- Create: `src/app/AppShell.vue`
- Create: `src/app/AppHeader.vue`
- Create: `src/components/MetricCard.vue`
- Create: `src/components/TechPanel.vue`
- Create: `src/components/PageHeading.vue`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Test: `tests/unit/AppShell.spec.ts`

**Interfaces:**
- Produces: route names `dashboard`, `roadmap`, `projects`, `policies`, `investment`, `qa`
- Produces: reusable `MetricCard`, `TechPanel`, `PageHeading`

- [ ] **Step 1: 写失败的外壳和导航测试**

```ts
it('renders all six navigation items and demo metadata', async () => {
  const wrapper = mount(AppShell, { global: { plugins: [router] } })
  await router.isReady()
  expect(wrapper.findAll('[data-testid="primary-nav"] a')).toHaveLength(6)
  expect(wrapper.text()).toContain('晋北资源型工业零碳示范园区')
  expect(wrapper.text()).toContain('演示数据')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- --run tests/unit/AppShell.spec.ts`

Expected: FAIL，提示 `AppShell.vue` 不存在。

- [ ] **Step 3: 实现路由、外壳、基础组件和全局样式**

应用外壳固定包含品牌、导航、园区名称、基准日和演示标签；根路由和未知路由重定向到 `/dashboard`。令牌完整实现规格中的 10 个颜色值、字号、焦点样式、网格背景、面板发光角和能量脉冲线，并在 `prefers-reduced-motion` 下关闭动画。

- [ ] **Step 4: 运行外壳测试和类型检查**

Run: `npm run test -- --run tests/unit/AppShell.spec.ts && npm run typecheck`

Expected: PASS。

---

### Task 3: 园区驾驶舱与零碳建设路径

**Files:**
- Create: `src/pages/dashboard/DashboardPage.vue`
- Create: `src/pages/dashboard/TransformationHub.vue`
- Create: `src/pages/roadmap/RoadmapPage.vue`
- Create: `src/pages/roadmap/RoadmapTimeline.vue`
- Create: `src/components/EChart.vue`
- Test: `tests/unit/RoadmapPage.spec.ts`

**Interfaces:**
- `EChart` consumes `option: EChartsOption` and `ariaLabel: string`
- `RoadmapTimeline` consumes `items: RoadmapYear[]` and emits `select(year: number)`

- [ ] **Step 1: 写失败的路线年份交互测试**

```ts
it('updates milestone detail when a year is selected', async () => {
  const wrapper = mount(RoadmapPage)
  await wrapper.get('[data-year="2028"]').trigger('click')
  expect(wrapper.get('[data-testid="roadmap-detail"]').text()).toContain('绿电交易')
  expect(wrapper.get('[data-testid="roadmap-detail"]').text()).toContain('VPP')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- --run tests/unit/RoadmapPage.spec.ts`

Expected: FAIL，页面组件不存在。

- [ ] **Step 3: 实现两个页面和图表生命周期封装**

驾驶舱首屏展示四项 KPI、中心关系图和三类风险机会；路线页展示四项 KPI、五年时间轴、选中年份详情和技术组合环。业务文案和数值全部从 `parkConfig` 读取。

- [ ] **Step 4: 运行测试与构建**

Run: `npm run test -- --run tests/unit/RoadmapPage.spec.ts && npm run build`

Expected: PASS 且生成 `dist/`。

---

### Task 4: 全过程项目地图与政策申报中心

**Files:**
- Create: `src/pages/projects/ProjectsPage.vue`
- Create: `src/pages/projects/ProjectLifecycle.vue`
- Create: `src/pages/policies/PoliciesPage.vue`
- Create: `src/pages/policies/PolicyCompleteness.vue`
- Test: `tests/unit/ProjectsPage.spec.ts`
- Test: `tests/unit/PoliciesPage.spec.ts`

**Interfaces:**
- `ProjectLifecycle` consumes `project: ParkProject` and emits `selectNode(nodeId: string)`
- `PolicyCompleteness` consumes `conditions: PolicyCondition[]`

- [ ] **Step 1: 写失败的项目节点测试**

```ts
it('shows responsibility, missing materials and recommendation for grid access', async () => {
  const wrapper = mount(ProjectsPage)
  await wrapper.get('[data-node-id="grid-access"]').trigger('click')
  expect(wrapper.text()).toContain('供电公司')
  expect(wrapper.text()).toContain('一次接线方案')
  expect(wrapper.text()).toContain('110kV')
})
```

- [ ] **Step 2: 写失败的政策切换测试**

```ts
it('updates conditions when policy selection changes', async () => {
  const wrapper = mount(PoliciesPage)
  await wrapper.get('[data-policy-id="energy-saving-fund"]').trigger('click')
  expect(wrapper.get('[data-testid="policy-detail"]').text()).toContain('节能降碳专项资金')
  expect(wrapper.findAll('[data-testid="policy-condition"]')).toHaveLength(17)
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm run test -- --run tests/unit/ProjectsPage.spec.ts tests/unit/PoliciesPage.spec.ts`

Expected: FAIL，两个页面尚未实现。

- [ ] **Step 4: 实现项目、节点、政策和条件交互**

项目页支持项目和 16 个节点选择；政策页支持四项政策选择，完整度环和条件列表始终来自当前政策。颜色按完成绿、待补橙、缺失粉编码。

- [ ] **Step 5: 运行两个页面测试**

Run: `npm run test -- --run tests/unit/ProjectsPage.spec.ts tests/unit/PoliciesPage.spec.ts`

Expected: PASS。

---

### Task 5: 投资资金地图与证据化领导问数

**Files:**
- Create: `src/pages/investment/InvestmentPage.vue`
- Create: `src/pages/investment/InvestmentTreemap.vue`
- Create: `src/pages/qa/QaPage.vue`
- Create: `src/pages/qa/EvidenceAnswer.vue`
- Test: `tests/unit/InvestmentPage.spec.ts`
- Test: `tests/unit/QaPage.spec.ts`

**Interfaces:**
- `InvestmentTreemap` emits `selectSector(sectorId: string)`
- `EvidenceAnswer` consumes `item: QaItem`

- [ ] **Step 1: 写失败的投资拆解测试**

```ts
it('drills from storage sector to its cost components', async () => {
  const wrapper = mount(InvestmentPage)
  await wrapper.get('[data-sector-id="storage"]').trigger('click')
  const detail = wrapper.get('[data-testid="investment-detail"]').text()
  expect(detail).toContain('9.0 亿元')
  expect(detail).toContain('电芯')
  expect(detail).toContain('PCS')
  expect(detail).toContain('EMS')
})
```

- [ ] **Step 2: 写失败的证据问答测试**

```ts
it('returns deterministic evidence for the funding-gap question', async () => {
  const wrapper = mount(QaPage)
  await wrapper.get('[data-question-id="funding-gap"]').trigger('click')
  const answer = wrapper.get('[data-testid="evidence-answer"]').text()
  expect(answer).toContain('18.6 亿元')
  expect(answer).toContain('项目清单 V1.2')
  expect(answer).toContain('2026-08-25')
})
```

- [ ] **Step 3: 运行测试确认失败**

Run: `npm run test -- --run tests/unit/InvestmentPage.spec.ts tests/unit/QaPage.spec.ts`

Expected: FAIL。

- [ ] **Step 4: 实现投资钻取、资金环图和问答切换**

投资页呈现 67 亿元拆解和资金来源；问答页呈现至少 12 个预置问题、结论、关键数字、依据、行动建议、证据标签和基准日。输入框只用于过滤预置问题，不生成新答案。

- [ ] **Step 5: 运行页面测试和完整单元测试**

Run: `npm run test -- --run`

Expected: 全部 PASS。

---

### Task 6: 引导式汇报

**Files:**
- Create: `src/composables/useGuidedTour.ts`
- Create: `src/app/GuidedTourBar.vue`
- Modify: `src/app/AppShell.vue`
- Test: `tests/unit/GuidedTourBar.spec.ts`

**Interfaces:**
- Produces: `useGuidedTour()` with `active`, `currentIndex`, `currentStop`, `start()`, `next()`, `previous()`, `stop()`, `syncRoute(path)`

- [ ] **Step 1: 写失败的汇报导航测试**

```ts
it('moves through six stops and keeps the route synchronized', async () => {
  const wrapper = mount(GuidedTourBar, { global: { plugins: [router] } })
  await wrapper.get('[data-testid="tour-start"]').trigger('click')
  expect(wrapper.text()).toContain('01 / 06')
  await wrapper.get('[data-testid="tour-next"]').trigger('click')
  expect(router.currentRoute.value.path).toBe('/roadmap')
  expect(wrapper.text()).toContain('02 / 06')
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test -- --run tests/unit/GuidedTourBar.spec.ts`

Expected: FAIL。

- [ ] **Step 3: 实现汇报状态和汇报条**

汇报条显示页码、领导结论、2—3 个要点、上一页、下一页和退出按钮。自由导航时调用 `syncRoute`，刷新后 `active` 恢复为 `false`。

- [ ] **Step 4: 运行汇报测试与全量单元测试**

Run: `npm run test -- --run`

Expected: 全部 PASS。

---

### Task 7: 端到端、响应式和视觉验收

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/platform.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Create: `artifacts/screenshots/.gitkeep`
- Modify: `src/styles/global.css`

**Interfaces:**
- Consumes: six Hash routes and `data-testid` selectors from Tasks 2—6
- Produces: six 1440×900 screenshots under `artifacts/screenshots/`

- [ ] **Step 1: 写六页导航与交互端到端测试**

```ts
test('opens dashboard directly and visits all six pages', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/dashboard$/)
  for (const item of navItems) {
    await page.getByRole('link', { name: item.label }).click()
    await expect(page).toHaveURL(new RegExp(`#${item.path}$`))
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(6, 18, 41)')
  }
})
```

- [ ] **Step 2: 运行端到端测试并记录失败**

Run: `npm run test:e2e`

Expected: 如有布局或选择器问题，测试明确失败在具体页面。

- [ ] **Step 3: 修复仅由验收暴露的布局与可访问性问题**

在 1440×900、1280×720 和 768×1024 三个视口检查溢出；为图表补充 `aria-label`，为键盘焦点补充可见轮廓，并确保 1100px 以下改为单列。

- [ ] **Step 4: 生成六页截图并视觉检查**

Run: `npm run test:e2e -- tests/e2e/visual.spec.ts`

Expected: `artifacts/screenshots/` 下存在六张 1440×900 PNG；无浅色页面、文字重叠、裁切或空图表。

---

### Task 8: 一键启动、静态构建包和交付说明

**Files:**
- Create: `scripts/start.command`
- Create: `scripts/build-static.command`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Produces: double-clickable `scripts/start.command`
- Produces: double-clickable `scripts/build-static.command`
- Produces: verified `dist/`

- [ ] **Step 1: 实现本地启动和构建脚本**

`start.command` 切换到项目根目录、仅在缺少 `node_modules` 时执行 `npm install`，随后运行 `npm run dev -- --host 127.0.0.1`。`build-static.command` 执行测试、类型检查和构建，任一步失败即返回非零状态。

- [ ] **Step 2: 编写 README**

README 明确写出环境要求、双击启动、命令行启动、统一配置文件位置、构建方法、静态包位置、演示数据边界和六个路由。

- [ ] **Step 3: 运行最终验证**

Run: `npm run typecheck && npm run test -- --run && npm run test:e2e && npm run build`

Expected: 所有命令退出码为 0，`dist/index.html` 存在。

- [ ] **Step 4: 用静态服务器验证构建包**

Run: `npx vite preview --host 127.0.0.1 --port 4173`

Expected: 访问 `http://127.0.0.1:4173/#/dashboard` 可打开完整驾驶舱，六页导航正常。
