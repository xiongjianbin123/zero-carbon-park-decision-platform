import { mkdir } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

const pages = [
  ['dashboard', 'dashboard'],
  ['roadmap', 'roadmap'],
  ['projects', 'projects'],
  ['policies', 'policies'],
  ['investment', 'investment'],
  ['operations', 'operations'],
  ['qa', 'qa'],
] as const

test('captures seven desktop acceptance screenshots', async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [route, name] of pages) {
    await page.goto(`/#/${route}`)
    await expect(page.locator(`[data-page="${route}"]`)).toBeVisible()
    await page.screenshot({ path: `artifacts/screenshots/${name}-1440x900.png`, fullPage: true })
  }
})

test('captures the three policy workbench views', async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/policies')
  for (const [label, name] of [
    ['申报对标', 'policies-benchmark'],
    ['山西能源专题', 'policies-shanxi'],
    ['政策更新雷达', 'policies-radar'],
  ] as const) {
    await page.locator(`[data-policy-view="${label}"]`).click()
    await page.screenshot({ path: `artifacts/screenshots/${name}-1440x900.png`, fullPage: true })
  }
})

test('captures the three additional energy-operation work views', async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/operations')
  for (const [view, name] of [
    ['resources', 'operations-resources'],
    ['market', 'operations-market'],
    ['risks', 'operations-risks'],
  ] as const) {
    await page.locator(`[data-operation-view="${view}"]`).click()
    await page.screenshot({ path: `artifacts/screenshots/${name}-1440x900.png`, fullPage: true })
  }
})

test('captures responsive headers and the balanced investment map', async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#/dashboard')
  await page.screenshot({ path: 'artifacts/screenshots/dashboard-1280x900.png', fullPage: true })
  await page.setViewportSize({ width: 1512, height: 900 })
  await page.goto('/#/dashboard')
  await page.screenshot({ path: 'artifacts/screenshots/dashboard-1512x900.png', fullPage: true })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/#/investment')
  await page.screenshot({ path: 'artifacts/screenshots/investment-balanced-1280x900.png', fullPage: true })
})

test('captures the VPP aggregation workbench', async ({ page }) => {
  await mkdir('artifacts/screenshots', { recursive: true })
  await page.setViewportSize({ width: 1512, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/operations/vpp')
  await expect(page.getByTestId('vpp-workbench')).toBeVisible()
  await page.screenshot({ path: 'artifacts/screenshots/vpp-workbench-1512x900.png', fullPage: true })
})
