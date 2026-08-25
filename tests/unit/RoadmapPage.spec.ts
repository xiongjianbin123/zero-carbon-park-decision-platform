import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RoadmapPage from '../../src/pages/roadmap/RoadmapPage.vue'

describe('RoadmapPage', () => {
  it('updates milestone detail when a year is selected', async () => {
    const wrapper = mount(RoadmapPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await wrapper.get('[data-year="2028"]').trigger('click')
    const detail = wrapper.get('[data-testid="roadmap-detail"]').text()
    expect(detail).toContain('绿电交易')
    expect(detail).toContain('VPP')
    expect(wrapper.get('[data-testid="roadmap-operation-link"]').text()).toContain('进入能源运营')
  })
})
