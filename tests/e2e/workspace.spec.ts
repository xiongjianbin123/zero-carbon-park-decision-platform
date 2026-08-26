import { expect, test } from '@playwright/test'

const uniquePark = () => `晋北闭环测试园区-${Date.now()}`

test('completes the real park workflow and persists it after reload', async ({ page }) => {
  const parkName = uniquePark()
  await page.goto('/#/workspace/onboarding')
  await expect(page.getByRole('heading', { name: '建立真实项目基线' })).toBeVisible()

  await page.locator('input[name="name"]').fill(parkName)
  await page.locator('input[name="region"]').fill('山西省大同市')
  await page.locator('input[name="parkType"]').fill('资源型工业园区')
  await page.locator('input[name="leadingIndustries"]').fill('新材料、装备制造')
  await page.locator('input[name="baselineYear"]').fill('2025')
  await page.locator('input[name="targetYear"]').fill('2030')
  await page.locator('input[name="applicationDirection"]').fill('国家级零碳园区')
  await page.getByRole('button', { name: '建立空数据基线' }).click()
  await expect(page.getByText(`已建立“${parkName}”空数据基线。`)).toBeVisible()

  await page.getByRole('link', { name: '数据导入' }).click()
  await page.locator('input[type="file"]').setInputFiles('public/templates/monthly-energy.xlsx')
  await expect(page.getByText('可以提交')).toBeVisible()
  await page.getByRole('button', { name: '确认导入项目基线' }).click()
  await expect(page.getByText(/已导入 \d+ 行/)).toBeVisible()

  await page.getByRole('link', { name: '指标诊断', exact: true }).click()
  await page.getByRole('button', { name: '生成首次诊断' }).click()
  await expect(page.getByText('有差距').first()).toBeVisible()
  await expect(page.getByText('缺少数据').first()).toBeVisible()
  await page.getByRole('button', { name: '转为任务' }).first().click()
  const taskForm = page.getByTestId('diagnosis-task-form')
  await taskForm.locator('label').filter({ hasText: '责任人' }).locator('input').fill('能源专员')
  await taskForm.locator('input[type="date"]').fill('2026-09-30')
  await taskForm.getByRole('button', { name: '创建整改任务' }).click()
  await expect(page.getByText('任务已创建')).toBeVisible()

  await page.getByRole('link', { name: '任务与佐证' }).click()
  await expect(page.getByText('能源专员')).toBeVisible()
  await page.locator('input[aria-label="上传任务佐证"]').setInputFiles('public/templates/monthly-energy.xlsx')
  await expect(page.getByText(/已为.+上传佐证/)).toBeVisible()
  await page.locator('select[aria-label="更新任务状态"]').selectOption('done')
  await expect(page.getByText('任务状态已更新。')).toBeVisible()

  await page.getByRole('link', { name: '成果交付' }).click()
  const taskDeliverable = page.locator('[data-testid="deliverable-card"]').filter({ hasText: '建设与申报任务表' })
  await taskDeliverable.getByRole('button', { name: '预览数据快照' }).click()
  await expect(page.getByLabel('成果预览')).toContainText(parkName)
  await page.getByTestId('confirm-export').click()
  const downloadButton = page.getByRole('button', { name: '下载 XLSX' })
  const href = await downloadButton.getAttribute('data-download-url')
  expect(href).toMatch(/^\/api\/workspace\/parks\/.+\/exports\/.+\?download=1$/)
  const fileResponse = await page.request.get(href!)
  expect(fileResponse.status()).toBe(200)
  expect(fileResponse.headers()['content-type']).toContain('spreadsheetml.sheet')
  expect((await fileResponse.body()).subarray(0, 2).toString()).toBe('PK')
  const downloadPromise = page.waitForEvent('download')
  await downloadButton.click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toContain('.xlsx')

  await page.reload()
  await page.locator('.park-picker select').selectOption({ label: parkName })
  await page.getByRole('link', { name: '任务与佐证' }).click()
  await expect(page.getByText('能源专员')).toBeVisible()
  await expect(page.locator('select[aria-label="更新任务状态"]')).toHaveValue('done')
})

test('keeps project pages readable at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/workspace')
  await expect(page.locator('.workspace-nav')).toBeVisible()
  const layout = await page.evaluate(() => {
    const header = document.querySelector('.app-header')?.getBoundingClientRect()
    const topbar = document.querySelector('.baseline-track')?.getBoundingClientRect()
    const nav = document.querySelector<HTMLElement>('.workspace-nav')
    return { headerBottom: header?.bottom ?? 0, topbarTop: topbar?.top ?? 0, bodyOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, navScrollable: (nav?.scrollWidth ?? 0) >= (nav?.clientWidth ?? 0) }
  })
  expect(layout.topbarTop).toBeGreaterThanOrEqual(layout.headerBottom)
  expect(layout.bodyOverflow).toBe(false)
  expect(layout.navScrollable).toBe(true)
})
