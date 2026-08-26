import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import { WorkspaceStateKey, createWorkspaceState } from '@/stores/workspace'

function routerFor(component = { template: '<div>child</div>' }) {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/workspace', component }],
  })
}

describe('WorkspaceShell', () => {
  it('shows the ChatGPT sign-in boundary for an anonymous visitor', async () => {
    const api = {
      me: vi.fn().mockRejectedValue({ status: 401, code: 'AUTH_REQUIRED', message: '请先登录项目工作台。' }),
      listParks: vi.fn(),
    }
    const state = createWorkspaceState(api)
    const router = routerFor()
    await router.push('/workspace')
    await router.isReady()
    const wrapper = mount(WorkspaceShell, { global: { plugins: [router], provide: { [WorkspaceStateKey as symbol]: state } } })
    await flushPromises()

    expect(wrapper.get('[data-testid="workspace-sign-in"]').attributes('href')).toContain('/signin-with-chatgpt')
    expect(wrapper.text()).toContain('登录后进入项目工作台')
    expect(api.listParks).not.toHaveBeenCalled()
  })

  it('clears park-scoped drafts when selected park changes', async () => {
    const api = {
      me: vi.fn().mockResolvedValue({ id: 'user-1', email: 'owner@example.test', orgRole: 'org_admin' }),
      listParks: vi.fn().mockResolvedValue([
        { id: 'park-a', name: '甲园区', role: 'admin' },
        { id: 'park-b', name: '乙园区', role: 'manager' },
      ]),
    }
    const state = createWorkspaceState(api)
    await state.bootstrap()
    state.importDraft.value = { filename: 'pending.xlsx' }
    state.pageDraft.value = { title: '未保存任务' }

    await state.selectPark('park-b')

    expect(state.selectedPark.value?.id).toBe('park-b')
    expect(state.importDraft.value).toBeNull()
    expect(state.pageDraft.value).toBeNull()
  })

  it('shows an allowlist denial instead of treating every signed-in user as a member', async () => {
    const api = {
      me: vi.fn().mockRejectedValue({ status: 403, code: 'WORKSPACE_ACCESS_DENIED', message: '当前账号未获准进入项目工作台。' }),
      listParks: vi.fn(),
    }
    const state = createWorkspaceState(api)
    const router = routerFor()
    await router.push('/workspace')
    await router.isReady()
    const wrapper = mount(WorkspaceShell, { global: { plugins: [router], provide: { [WorkspaceStateKey as symbol]: state } } })
    await flushPromises()

    expect(wrapper.text()).toContain('当前账号尚未加入项目工作台')
    expect(wrapper.find('[data-testid="workspace-sign-in"]').exists()).toBe(false)
  })
})

