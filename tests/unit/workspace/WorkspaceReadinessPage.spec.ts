import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceReadinessPage from '@/pages/workspace/WorkspaceReadinessPage.vue'
import { WorkspaceStateKey, createWorkspaceState } from '@/stores/workspace'

const api = vi.hoisted(() => ({ latestDiagnosis: vi.fn(), listTasks: vi.fn() }))
vi.mock('@/services/workspaceApi', async (original) => ({ ...(await original()), workspaceApi: api }))

function state() {
  const value = createWorkspaceState({ me: vi.fn(), listParks: vi.fn() })
  value.parks.value = [{ id: 'park-1', name: '测试园区', region: '山西省', parkType: '工业园区', leadingIndustries: [], baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区', role: 'admin', status: 'active', dataBaselineDate: '2026-07-31' }]
  value.selectedParkId.value = 'park-1'
  return value
}

describe('WorkspaceReadinessPage', () => {
  it('shows readiness counts and the next action for every applicable indicator', async () => {
    api.latestDiagnosis.mockResolvedValueOnce({ version: 'p0.1', calculatedAt: '2026-08-27T08:00:00Z', dataBaselineDate: '2026-07-31', missingData: ['load_curve'], results: [
      { id: 'i1', key: 'green', title: '绿电占比', currentValue: 95, targetValue: 90, unit: '%', status: 'achieved', calculationNote: '已达标', missingData: [] },
      { id: 'i2', key: 'flex', title: '负荷调节能力', currentValue: null, targetValue: 5, unit: '%', status: 'missing_data', calculationNote: '缺少数据', missingData: ['load_curve'] },
    ] })
    api.listTasks.mockResolvedValueOnce([])
    const wrapper = mount(WorkspaceReadinessPage, { global: { provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    expect(wrapper.text()).toContain('申报准备度')
    expect(wrapper.text()).toContain('50%')
    expect(wrapper.text()).toContain('补充负荷曲线并重新诊断')
    expect(wrapper.findAll('[data-testid="readiness-row"]')).toHaveLength(2)
  })
})
