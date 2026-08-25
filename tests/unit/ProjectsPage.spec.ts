import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProjectsPage from '../../src/pages/projects/ProjectsPage.vue'

describe('ProjectsPage', () => {
  it('shows responsibility, missing materials and recommendation for grid access', async () => {
    const wrapper = mount(ProjectsPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await wrapper.get('[data-node-id="grid-access"]').trigger('click')
    expect(wrapper.text()).toContain('供电公司')
    expect(wrapper.text()).toContain('一次接线方案')
    expect(wrapper.text()).toContain('110kV')
  })

  it('connects the operation lifecycle node to the operations workspace', async () => {
    const wrapper = mount(ProjectsPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    await wrapper.get('[data-node-id="operation"]').trigger('click')

    expect(wrapper.get('[data-testid="project-operation-link"]').text()).toContain('能源运营')
  })
})
