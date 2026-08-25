import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import GuidedTourBar from '../../src/app/GuidedTourBar.vue'

describe('GuidedTourBar', () => {
  it('moves through seven stops and keeps the route synchronized', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/dashboard', component: { template: '<div />' } },
        { path: '/roadmap', component: { template: '<div />' } },
      ],
    })
    await router.push('/dashboard')
    await router.isReady()
    const wrapper = mount(GuidedTourBar, { global: { plugins: [router] } })

    await wrapper.get('[data-testid="tour-start"]').trigger('click')
    expect(wrapper.text()).toContain('01 / 07')
    await wrapper.get('[data-testid="tour-next"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/roadmap')
    expect(wrapper.text()).toContain('02 / 07')
  })
})
