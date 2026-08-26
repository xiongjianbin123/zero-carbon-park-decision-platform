import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceOnboardingPage from '@/pages/workspace/WorkspaceOnboardingPage.vue'
import WorkspaceOverviewPage from '@/pages/workspace/WorkspaceOverviewPage.vue'
import { WorkspaceStateKey, createWorkspaceState } from '@/stores/workspace'

describe('workspace onboarding and overview', () => {
  it('creates an empty park with the exact baseline fields for an org admin', async () => {
    const createPark = vi.fn().mockResolvedValue({
      id: 'park-new', name: '晋北新材料零碳园区', region: '山西省大同市', parkType: '工业园区',
      leadingIndustries: ['新材料'], baselineYear: 2025, targetYear: 2030,
      applicationDirection: '国家级零碳园区', role: 'admin', status: 'active', dataBaselineDate: null,
    })
    const state = createWorkspaceState({ me: vi.fn(), listParks: vi.fn(), createPark })
    state.auth.value = { id: 'user-1', email: 'owner@example.test', orgRole: 'org_admin' }
    const wrapper = mount(WorkspaceOnboardingPage, { global: { provide: { [WorkspaceStateKey as symbol]: state } } })

    await wrapper.get('input[name="name"]').setValue('晋北新材料零碳园区')
    await wrapper.get('input[name="region"]').setValue('山西省大同市')
    await wrapper.get('input[name="parkType"]').setValue('工业园区')
    await wrapper.get('input[name="leadingIndustries"]').setValue('新材料')
    await wrapper.get('input[name="baselineYear"]').setValue('2025')
    await wrapper.get('input[name="targetYear"]').setValue('2030')
    await wrapper.get('input[name="applicationDirection"]').setValue('国家级零碳园区')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(createPark).toHaveBeenCalledWith({
      name: '晋北新材料零碳园区', region: '山西省大同市', parkType: '工业园区',
      leadingIndustries: ['新材料'], baselineYear: 2025, targetYear: 2030,
      applicationDirection: '国家级零碳园区',
    })
    expect(state.selectedPark.value?.id).toBe('park-new')
  })

  it('renders exactly four compact high-value overview metrics', () => {
    const state = createWorkspaceState({ me: vi.fn(), listParks: vi.fn() })
    state.auth.value = { id: 'user-1', email: 'owner@example.test', orgRole: 'org_admin' }
    state.parks.value = [{
      id: 'park-1', name: '测试园区', region: '山西省', parkType: '工业园区', leadingIndustries: ['新材料'],
      baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区',
      role: 'admin', status: 'active', dataBaselineDate: null,
    }]
    state.selectedParkId.value = 'park-1'
    const wrapper = mount(WorkspaceOverviewPage, { global: { provide: { [WorkspaceStateKey as symbol]: state } } })

    const metrics = wrapper.findAll('[data-testid="workspace-metric"]')
    expect(metrics).toHaveLength(4)
    expect(metrics.map((item) => item.text())).toEqual(expect.arrayContaining(['数据完整度待诊断', '达标率待诊断', '打开任务0', '最近截止日暂无']))
  })
})
