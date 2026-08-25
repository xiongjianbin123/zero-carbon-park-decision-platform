import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PoliciesPage from '../../src/pages/policies/PoliciesPage.vue'

const mountPolicies = () => mount(PoliciesPage, {
  global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
})

describe('PoliciesPage', () => {
  it('switches between all four approved policy views', async () => {
    const wrapper = mountPolicies()

    const expectations = [
      ['政策知识库', '权威资料目录'],
      ['申报对标', '国家试行指标对标'],
      ['山西能源专题', '园区能源与市场场景图'],
      ['政策更新雷达', '政策动态时间轴'],
    ]
    for (const [label, content] of expectations) {
      await wrapper.get(`[data-policy-view="${label}"]`).trigger('click')
      expect(wrapper.get('[data-testid="policy-view"]').text()).toContain(content)
    }
  })

  it('marks missing benchmark inputs without inventing values', async () => {
    const wrapper = mountPolicies()
    await wrapper.get('[data-policy-view="申报对标"]').trigger('click')

    expect(wrapper.text()).toContain('单位能耗碳排放')
    expect(wrapper.text()).toContain('待核算')
    expect(wrapper.text()).toContain('不低于 90%')
  })

  it('does not expose implementation status copy in the user interface', () => {
    const wrapper = mountPolicies()

    expect(wrapper.text()).not.toContain('本地混合索引')
    expect(wrapper.text()).not.toContain('官方来源已核验')
    expect(wrapper.text()).not.toContain('Token Plan')
  })

  it('provides document filters and policy consultation inside the library view', () => {
    const wrapper = mountPolicies()

    expect(wrapper.find('[aria-label="资料类别"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="资料状态"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="输入政策咨询问题"]').exists()).toBe(true)
  })

  it('links policy performance evidence to the operations workspace', () => {
    const wrapper = mountPolicies()

    expect(wrapper.get('[data-testid="policy-operation-link"]').text()).toContain('运行绩效')
  })
})
