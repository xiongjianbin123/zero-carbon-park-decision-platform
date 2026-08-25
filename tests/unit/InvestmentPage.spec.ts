import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InvestmentPage from '../../src/pages/investment/InvestmentPage.vue'

describe('InvestmentPage', () => {
  it('drills from storage sector to its cost components', async () => {
    const wrapper = mount(InvestmentPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await wrapper.get('[data-sector-id="storage"]').trigger('click')
    const detail = wrapper.get('[data-testid="investment-detail"]').text()
    expect(detail).toContain('9.0 亿元')
    expect(detail).toContain('电芯')
    expect(detail).toContain('PCS')
    expect(detail).toContain('EMS')
  })

  it('connects energy-platform investment to operational value', async () => {
    const wrapper = mount(InvestmentPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await wrapper.get('[data-sector-id="platform"]').trigger('click')

    expect(wrapper.get('[data-testid="investment-operation-link"]').text()).toContain('运营价值')
  })
})
