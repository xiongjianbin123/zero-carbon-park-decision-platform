import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OperationsPage from '../../src/pages/operations/OperationsPage.vue'

describe('OperationsPage', () => {
  it('switches scenarios and updates the operational decision', async () => {
    const wrapper = mount(OperationsPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    expect(wrapper.get('[data-testid="scenario-summary"]').text()).toContain('典型日')
    expect(wrapper.get('[data-testid="energy-chart"]').findAll('[data-hour-point]')).toHaveLength(24)

    await wrapper.get('[data-scenario-id="summer-peak"]').trigger('click')

    expect(wrapper.get('[data-testid="scenario-summary"]').text()).toContain('迎峰度夏')
    expect(wrapper.text()).toContain('17:00 前将储能 SOC 提升至 85%')
    expect(wrapper.text()).toContain('148')
  })

  it('exposes resources, market channels, and action risks in four views', async () => {
    const wrapper = mount(OperationsPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('[data-operation-view="resources"]').trigger('click')
    expect(wrapper.text()).toContain('规划中')
    expect(wrapper.text()).toContain('建设中')
    expect(wrapper.text()).toContain('已建成')

    await wrapper.get('[data-operation-view="market"]').trigger('click')
    expect(wrapper.text()).toContain('需求响应')
    expect(wrapper.text()).toContain('现货交易')
    expect(wrapper.text()).toContain('绿电交易')

    await wrapper.get('[data-operation-view="risks"]').trigger('click')
    expect(wrapper.text()).toContain('运行风险与行动')
    expect(wrapper.text()).toContain('责任单位')
  })

  it('runs the six-stage VPP aggregation workflow', async () => {
    const wrapper = mount(OperationsPage, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })

    await wrapper.get('[data-operation-view="vpp"]').trigger('click')
    expect(wrapper.get('[data-testid="vpp-workbench"]').text()).toContain('VPP 虚拟电厂')
    expect(wrapper.findAll('[data-vpp-stage]')).toHaveLength(6)

    await wrapper.get('[data-vpp-stage="trading"]').trigger('click')
    expect(wrapper.get('[data-testid="vpp-stage-detail"]').text()).toContain('日前交易申报')

    await wrapper.get('[data-vpp-stage="settlement"]').trigger('click')
    expect(wrapper.get('[data-testid="vpp-stage-detail"]').text()).toContain('收益结算')
  })
})
