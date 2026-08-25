import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'
import AppShell from '../../src/app/AppShell.vue'

const routes = [
  { path: '/dashboard', component: { template: '<div>dashboard</div>' } },
  { path: '/roadmap', component: { template: '<div>roadmap</div>' } },
  { path: '/projects', component: { template: '<div>projects</div>' } },
  { path: '/policies', component: { template: '<div>policies</div>' } },
  { path: '/investment', component: { template: '<div>investment</div>' } },
  { path: '/operations', component: { template: '<div>operations</div>' } },
  { path: '/qa', component: { template: '<div>qa</div>' } },
]

describe('AppShell', () => {
  it('renders all seven navigation items and demo metadata', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/dashboard')
    await router.isReady()
    const wrapper = mount(AppShell, { global: { plugins: [router] } })

    expect(wrapper.findAll('[data-testid="primary-nav"] a')).toHaveLength(7)
    expect(wrapper.text()).toContain('能源运营')
    expect(wrapper.text()).toContain('晋北资源型工业零碳示范园区')
    expect(wrapper.text()).toContain('演示数据')
  })
})
