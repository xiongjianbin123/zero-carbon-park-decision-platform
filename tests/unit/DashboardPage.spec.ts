import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import DashboardPage from '../../src/pages/dashboard/DashboardPage.vue'

describe('DashboardPage', () => {
  it('links the planning cockpit to energy operations', () => {
    const wrapper = mount(DashboardPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    expect(wrapper.get('[data-testid="dashboard-operation-link"]').text()).toContain('能源运营')
  })
})
