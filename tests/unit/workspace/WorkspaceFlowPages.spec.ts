import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceImportsPage from '@/pages/workspace/WorkspaceImportsPage.vue'
import WorkspaceDiagnosisPage from '@/pages/workspace/WorkspaceDiagnosisPage.vue'
import WorkspaceTasksPage from '@/pages/workspace/WorkspaceTasksPage.vue'
import WorkspaceDeliverablesPage from '@/pages/workspace/WorkspaceDeliverablesPage.vue'
import WorkspaceOverviewPage from '@/pages/workspace/WorkspaceOverviewPage.vue'
import { WorkspaceStateKey, createWorkspaceState } from '@/stores/workspace'

const api = vi.hoisted(() => ({
  listImports: vi.fn(), uploadImport: vi.fn(),
  latestDiagnosis: vi.fn(), generateDiagnosis: vi.fn(), createTask: vi.fn(),
  listTasks: vi.fn(), updateTask: vi.fn(), uploadEvidence: vi.fn(),
  listTaskFiles: vi.fn(), listTaskActivity: vi.fn(), downloadEvidence: vi.fn(),
  previewExport: vi.fn(), confirmExport: vi.fn(), listExports: vi.fn(),
}))

vi.mock('@/services/workspaceApi', async (original) => ({ ...(await original()), workspaceApi: api }))

function state() {
  const value = createWorkspaceState({ me: vi.fn(), listParks: vi.fn() })
  value.auth.value = { id: 'user-1', email: 'owner@example.test', orgRole: 'org_admin' }
  value.parks.value = [{
    id: 'park-1', name: '测试园区', region: '山西省', parkType: '工业园区', leadingIndustries: ['新材料'],
    baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区',
    role: 'admin', status: 'active', dataBaselineDate: '2026-07-31',
  }]
  value.selectedParkId.value = 'park-1'
  return value
}

describe('workspace flow pages', () => {
  it('offers exactly four fixed templates and an explicit preview-before-import flow', async () => {
    api.listImports.mockResolvedValueOnce([])
    const wrapper = mount(WorkspaceImportsPage, { global: { provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    expect(wrapper.findAll('[data-testid="template-download"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('月度能源账单')
    expect(wrapper.text()).toContain('提交前先在浏览器校验')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
  })

  it('renders all four diagnosis statuses and opens a task draft from a gap', async () => {
    api.latestDiagnosis.mockResolvedValueOnce({
      version: 'p0.1', calculatedAt: '2026-08-26T08:00:00Z', dataBaselineDate: '2026-07-31', missingData: ['load_curve'],
      results: [
        { id: 'i1', key: 'a', title: '达标项', currentValue: 95, targetValue: 90, unit: '%', status: 'achieved', calculationNote: '公式A', missingData: [] },
        { id: 'i2', key: 'b', title: '差距项', currentValue: 50, targetValue: 90, unit: '%', status: 'gap', calculationNote: '公式B', missingData: [] },
        { id: 'i3', key: 'c', title: '缺数项', currentValue: null, targetValue: 1.5, unit: '倍', status: 'missing_data', calculationNote: '缺负荷', missingData: ['load_curve'] },
        { id: 'i4', key: 'd', title: '不适用项', currentValue: null, targetValue: 1, unit: 'MW', status: 'not_applicable', calculationNote: '不适用', missingData: [] },
      ],
    })
    const wrapper = mount(WorkspaceDiagnosisPage, { global: { provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    for (const label of ['已达标', '有差距', '缺少数据', '不适用']) expect(wrapper.text()).toContain(label)
    await wrapper.get('[data-testid="create-task-i2"]').trigger('click')
    expect(wrapper.get('form[data-testid="diagnosis-task-form"]').isVisible()).toBe(true)
  })

  it('lists tasks with explicit status controls and evidence action', async () => {
    api.listTasks.mockResolvedValueOnce([{
      id: 'task-1', title: '补充负荷曲线', taskType: '数据补齐', ownerName: '能源专员',
      plannedDate: '2026-09-30', status: 'open', reviewNote: '', evidenceCount: 0,
    }])
    const wrapper = mount(WorkspaceTasksPage, { global: { stubs: { teleport: true }, provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    expect(wrapper.text()).toContain('补充负荷曲线')
    expect(wrapper.find('select[aria-label="更新任务状态"]').exists()).toBe(true)
    expect(wrapper.get('input[aria-label="上传任务佐证"]').attributes('accept')).toContain('.pdf')
  })

  it('opens task evidence and activity, then persists a review note', async () => {
    const task = {
      id: 'task-detail', title: '复核绿电交易凭证', taskType: '材料复核', ownerName: '申报专员',
      plannedDate: '2026-09-30', status: 'in_progress', reviewNote: '', evidenceCount: 1,
    }
    api.listTasks.mockResolvedValueOnce([task])
    api.listTaskFiles.mockResolvedValueOnce([{
      id: 'file-1', ownerType: 'task', ownerId: task.id, filename: '绿电交易凭证.pdf',
      contentType: 'application/pdf', size: 2048, checksum: 'abc123', validationSummary: '校验通过', uploadedAt: '2026-08-27T08:00:00Z',
    }])
    api.listTaskActivity.mockResolvedValueOnce([{
      id: 'activity-1', action: 'file.upload', result: 'succeeded', summary: `task:${task.id}`, createdAt: '2026-08-27T08:00:00Z',
    }])
    api.updateTask.mockResolvedValueOnce({ ...task, reviewNote: '凭证已核对，可纳入申报材料。' })
    const wrapper = mount(WorkspaceTasksPage, { global: { stubs: { teleport: true }, provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    await wrapper.get('[data-testid="open-task-task-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('绿电交易凭证.pdf')
    expect(wrapper.text()).toContain('上传佐证')
    await wrapper.get('textarea[aria-label="审核备注"]').setValue('凭证已核对，可纳入申报材料。')
    await wrapper.get('[data-testid="save-review-note"]').trigger('click')
    await flushPromises()
    expect(api.updateTask).toHaveBeenCalledWith('park-1', 'task-detail', { reviewNote: '凭证已核对，可纳入申报材料。' })
  })

  it('offers four deliverables and does not confirm before preview', async () => {
    api.listExports.mockResolvedValueOnce([])
    const wrapper = mount(WorkspaceDeliverablesPage, { global: { provide: { [WorkspaceStateKey as symbol]: state() } } })

    expect(wrapper.findAll('[data-testid="deliverable-card"]')).toHaveLength(4)
    expect(wrapper.text()).toContain('园区指标诊断报告')
    expect(wrapper.text()).toContain('建设与申报任务表')
    expect(api.confirmExport).not.toHaveBeenCalled()
  })

  it('lists persisted export history and exposes download only when a file exists', async () => {
    api.listExports.mockResolvedValueOnce([
      { id: 'export-2', type: 'task_register', summary: '测试园区:2', downloadAvailable: true, generatedAt: '2026-08-27T09:00:00Z' },
      { id: 'export-1', type: 'diagnosis_report', summary: '测试园区:6', downloadAvailable: false, generatedAt: '2026-08-27T08:00:00Z' },
    ])
    const wrapper = mount(WorkspaceDeliverablesPage, { global: { provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    expect(wrapper.text()).toContain('历史成果')
    expect(wrapper.text()).toContain('建设与申报任务表')
    expect(wrapper.findAll('[data-testid="history-download"]')).toHaveLength(1)
    expect(wrapper.text()).toContain('打印快照')
  })

  it('renders compact task-state and evidence-coverage rails from real workspace data', async () => {
    api.listImports.mockResolvedValueOnce([{ id: 'import-1', kind: 'energy_monthly', filename: 'energy.xlsx', periodStart: '2026-01-01', periodEnd: '2026-07-31', intervalMinutes: null, acceptedRows: 7, rejectedRows: 0, status: 'succeeded', createdAt: '2026-08-27', completedAt: '2026-08-27' }])
    api.listTasks.mockResolvedValueOnce([
      { id: 'task-1', title: '任务一', taskType: '项目推进', ownerName: '甲', plannedDate: '2026-09-01', status: 'done', reviewNote: '', evidenceCount: 2, sourceIndicatorId: 'i1' },
      { id: 'task-2', title: '任务二', taskType: '数据补齐', ownerName: '乙', plannedDate: '2026-09-20', status: 'open', reviewNote: '', evidenceCount: 0, sourceIndicatorId: 'i2' },
    ])
    api.latestDiagnosis.mockResolvedValueOnce({ version: 'p0.1', calculatedAt: '2026-08-27', dataBaselineDate: '2026-07-31', missingData: [], results: [
      { id: 'i1', key: 'a', title: '指标一', currentValue: 95, targetValue: 90, unit: '%', status: 'achieved', calculationNote: '达标', missingData: [] },
      { id: 'i2', key: 'b', title: '指标二', currentValue: 50, targetValue: 90, unit: '%', status: 'gap', calculationNote: '差距', missingData: [] },
    ] })
    const wrapper = mount(WorkspaceOverviewPage, { global: { stubs: ['RouterLink'], provide: { [WorkspaceStateKey as symbol]: state() } } })
    await flushPromises()

    expect(wrapper.text()).toContain('任务推进态势')
    expect(wrapper.text()).toContain('佐证覆盖率')
    expect(wrapper.text()).toContain('50%')
    expect(wrapper.find('[data-testid="task-state-rail"]').exists()).toBe(true)
  })

  it('removes task write controls for a viewer', async () => {
    api.listTasks.mockResolvedValueOnce([{
      id: 'task-view', title: '只读任务', taskType: '数据补齐', ownerName: '专员',
      plannedDate: '2026-09-30', status: 'open', reviewNote: '', evidenceCount: 1,
    }])
    const viewerState = state()
    viewerState.parks.value[0].role = 'viewer'
    const wrapper = mount(WorkspaceTasksPage, { global: { provide: { [WorkspaceStateKey as symbol]: viewerState } } })
    await flushPromises()

    expect(wrapper.text()).toContain('只读任务')
    expect(wrapper.find('select[aria-label="更新任务状态"]').exists()).toBe(false)
    expect(wrapper.find('input[aria-label="上传任务佐证"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('新建任务')
  })
})
