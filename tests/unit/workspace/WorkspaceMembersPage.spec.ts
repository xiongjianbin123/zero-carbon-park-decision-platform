import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceMembersPage from '@/pages/workspace/WorkspaceMembersPage.vue'
import { WorkspaceStateKey, createWorkspaceState } from '@/stores/workspace'

const api = vi.hoisted(() => ({
  listMembers: vi.fn(), inviteMember: vi.fn(), updateMember: vi.fn(),
}))

vi.mock('@/services/workspaceApi', async (original) => ({ ...(await original()), workspaceApi: api }))

function workspace(role: 'admin' | 'viewer' = 'admin') {
  const state = createWorkspaceState({ me: vi.fn(), listParks: vi.fn() })
  state.auth.value = { id: 'owner-1', email: 'owner@example.test', orgRole: 'org_admin' }
  state.parks.value = [{
    id: 'park-1', name: '测试园区', region: '山西省', parkType: '工业园区', leadingIndustries: ['新材料'],
    baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区',
    role, status: 'active', dataBaselineDate: '2026-07-31',
  }]
  state.selectedParkId.value = 'park-1'
  return state
}

describe('WorkspaceMembersPage', () => {
  it('lets an administrator invite a member and change a project role', async () => {
    api.listMembers.mockResolvedValueOnce([
      { id: 'member-1', email: 'owner@example.test', role: 'admin', status: 'active' },
      { id: 'member-2', email: 'specialist@example.test', role: 'specialist', status: 'invited' },
    ])
    api.inviteMember.mockResolvedValueOnce({ id: 'member-3', email: 'new@example.test', role: 'viewer', status: 'invited' })
    api.updateMember.mockResolvedValueOnce({ id: 'member-2', email: 'specialist@example.test', role: 'manager', status: 'active' })
    const wrapper = mount(WorkspaceMembersPage, { global: { provide: { [WorkspaceStateKey as symbol]: workspace() } } })
    await flushPromises()

    expect(wrapper.text()).toContain('specialist@example.test')
    await wrapper.get('input[type="email"]').setValue('new@example.test')
    await wrapper.get('[data-testid="invite-member"]').trigger('submit')
    await flushPromises()
    expect(api.inviteMember).toHaveBeenCalledWith('park-1', { email: 'new@example.test', role: 'viewer' })

    await wrapper.get('[data-testid="member-role-member-2"]').setValue('manager')
    await flushPromises()
    expect(api.updateMember).toHaveBeenCalledWith('park-1', 'member-2', { role: 'manager' })
  })

  it('shows the member roster without write controls for a viewer', async () => {
    api.listMembers.mockResolvedValueOnce([{ id: 'member-1', email: 'viewer@example.test', role: 'viewer', status: 'active' }])
    const wrapper = mount(WorkspaceMembersPage, { global: { provide: { [WorkspaceStateKey as symbol]: workspace('viewer') } } })
    await flushPromises()

    expect(wrapper.text()).toContain('viewer@example.test')
    expect(wrapper.find('[data-testid="invite-member"]').exists()).toBe(false)
    expect(wrapper.find('select').exists()).toBe(false)
  })
})
