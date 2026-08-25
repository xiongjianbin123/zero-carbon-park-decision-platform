import { expect, test } from '@playwright/test'

const navItems = [
  { label: '园区驾驶舱', path: '/dashboard', page: '园区零碳综合态势' },
  { label: '零碳建设路径', path: '/roadmap', page: '2026—2030 零碳建设路径' },
  { label: '全过程项目地图', path: '/projects', page: '重点项目全过程地图' },
  { label: '政策与申报', path: '/policies', page: '政策知识与申报中枢' },
  { label: '投资与资金', path: '/investment', page: '投资拆解与资金拼图' },
  { label: '能源运营', path: '/operations', page: '园区能源运营与市场协同' },
  { label: '智能问数', path: '/qa', page: '园区智能问数' },
]

test('opens dashboard directly and visits all seven dark pages', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/dashboard$/)
  for (const item of navItems) {
    await page.getByRole('link', { name: item.label }).click()
    await expect(page).toHaveURL(new RegExp(`#${item.path}$`))
    await expect(page.getByRole('heading', { name: item.page })).toBeVisible()
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(6, 18, 41)')
  }
})

test('keeps the guided briefing launcher inside the application header', async ({ page }) => {
  await page.goto('/#/dashboard')
  const header = await page.locator('.app-header').boundingBox()
  const launcher = await page.getByTestId('tour-start').boundingBox()
  expect(header).not.toBeNull()
  expect(launcher).not.toBeNull()
  expect(launcher!.y).toBeGreaterThanOrEqual(header!.y)
  expect(launcher!.y + launcher!.height).toBeLessThanOrEqual(header!.y + header!.height)
})

test('supports guided briefing and high-value drilldowns', async ({ page }) => {
  await page.goto('/#/dashboard')
  await page.getByRole('button', { name: /开始引导汇报/ }).click()
  await expect(page.getByText('01 / 07')).toBeVisible()
  await page.getByRole('button', { name: '下一页' }).click()
  await expect(page).toHaveURL(/#\/roadmap$/)
  await expect(page.getByText('02 / 07')).toBeVisible()
  await page.getByRole('button', { name: '退出汇报' }).click()

  await page.getByRole('button', { name: /2028/ }).click()
  await expect(page.getByTestId('roadmap-detail')).toContainText('VPP')
  await page.getByRole('link', { name: '全过程项目地图' }).click()
  await page.locator('[data-node-id="grid-access"]').click()
  await expect(page.getByText('一次接线方案').last()).toBeVisible()
  await page.getByRole('link', { name: '政策与申报' }).click()
  await page.locator('[data-policy-view="申报对标"]').click()
  await expect(page.getByTestId('policy-view')).toContainText('国家试行指标对标')
  await page.locator('[data-policy-view="山西能源专题"]').click()
  await expect(page.getByTestId('policy-view')).toContainText('园区能源与市场场景图')
  await page.locator('[data-policy-view="政策更新雷达"]').click()
  await expect(page.getByTestId('policy-view')).toContainText('政策动态时间轴')
  await page.locator('[data-policy-view="政策知识库"]').click()
  await page.locator('.document-card').filter({ hasText: '国家级零碳园区建设指标体系（试行）' }).click()
  await expect(page.getByRole('heading', { name: '国家级零碳园区建设指标体系（试行）' })).toBeVisible()
  await page.getByRole('link', { name: '投资与资金' }).click()
  await page.locator('[data-sector-id="storage"]').click()
  await expect(page.getByTestId('investment-detail')).toContainText('9.0 亿元')
  await page.getByRole('link', { name: '智能问数' }).click()
  await page.locator('[data-question-id="funding-gap"]').click()
  await expect(page.getByTestId('evidence-answer')).toContainText('项目清单 V1.2')
})

test('runs energy-operation scenarios and exposes four fused work views', async ({ page }) => {
  await page.goto('/#/operations')
  await expect(page.getByRole('heading', { name: '园区能源运营与市场协同' })).toBeVisible()
  await expect(page.getByTestId('energy-chart').locator('[data-hour-point]')).toHaveCount(24)

  await page.locator('[data-scenario-id="summer-peak"]').click()
  await expect(page.getByTestId('scenario-summary')).toContainText('迎峰度夏')
  await expect(page.getByText('17:00 前将储能 SOC 提升至 85%')).toBeVisible()

  await page.locator('[data-operation-view="resources"]').click()
  await expect(page.getByTestId('operation-view')).toContainText('共享储能示范项目')
  await page.locator('[data-operation-view="market"]').click()
  await expect(page.getByTestId('operation-view')).toContainText('现货交易')
  await page.locator('[data-operation-view="risks"]').click()
  await expect(page.getByTestId('operation-view')).toContainText('责任单位')
})

test('opens the VPP workbench from the dashboard and completes the operating chain', async ({ page }) => {
  await page.goto('/#/dashboard')
  await page.getByTestId('dashboard-vpp-link').click()

  await expect(page).toHaveURL(/#\/operations\/vpp$/)
  await expect(page.getByRole('heading', { name: 'VPP 虚拟电厂聚合运营工作台' })).toBeVisible()
  await expect(page.locator('[data-vpp-stage]')).toHaveCount(6)

  await page.locator('[data-vpp-stage="trading"]').click()
  await expect(page.getByTestId('vpp-stage-detail')).toContainText('日前交易申报')
  await page.locator('[data-vpp-stage="settlement"]').click()
  await expect(page.getByTestId('vpp-stage-detail')).toContainText('收益结算')
})

test('keeps the platform title and seven-module navigation on separate readable rows', async ({ page }) => {
  for (const width of [1280, 1512, 1728]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/#/dashboard')

    const layout = await page.evaluate(() => {
      const header = document.querySelector('.app-header')!.getBoundingClientRect()
      const brand = document.querySelector('.brand-block')!.getBoundingClientRect()
      const nav = document.querySelector<HTMLElement>('[data-testid="primary-nav"]')!
      const navRect = nav.getBoundingClientRect()
      const heading = document.querySelector('.page-heading')!.getBoundingClientRect()
      return {
        navFits: nav.scrollWidth <= nav.clientWidth,
        navTop: navRect.top,
        brandBottom: brand.bottom,
        headerBottom: header.bottom,
        headingTop: heading.top,
      }
    })

    expect(layout.navFits, `navigation overflows at ${width}px`).toBe(true)
    expect(layout.navTop, `navigation crowds the platform title at ${width}px`).toBeGreaterThanOrEqual(layout.brandBottom)
    expect(layout.headingTop, `page title is covered by the header at ${width}px`).toBeGreaterThanOrEqual(layout.headerBottom)
  }
})

test('keeps investment cards balanced', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })

  await page.goto('/#/investment')
  const areas = await page.locator('.sector-tile').evaluateAll((tiles) => tiles.map((tile) => {
    const rect = tile.getBoundingClientRect()
    return rect.width * rect.height
  }))
  expect(Math.max(...areas) / Math.min(...areas)).toBeLessThan(1.2)
})
