import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import QaPage from '../../src/pages/qa/QaPage.vue'
import { askPolicy } from '../../src/services/policyApi'

vi.mock('../../src/services/policyApi', () => ({ askPolicy: vi.fn() }))

describe('QaPage', () => {
  beforeEach(() => vi.mocked(askPolicy).mockReset())

  it('returns deterministic evidence for the funding-gap question', async () => {
    const wrapper = mount(QaPage)
    await wrapper.get('[data-question-id="funding-gap"]').trigger('click')
    const answer = wrapper.get('[data-testid="evidence-answer"]').text()
    expect(answer).toContain('18.6 亿元')
    expect(answer).toContain('项目清单 V1.2')
    expect(answer).toContain('2026-08-25')
  })

  it('submits a free question and renders policy evidence citations', async () => {
    vi.mocked(askPolicy).mockResolvedValue({
      answer: '**一句结论：**\n园区应优先补齐绿电供需平衡和储能调节方案。\n\n**关键依据：**\n- 支持绿电直连 [E01]。',
      citations: [{ evidenceId: 'E01', documentId: 'shanxi-zero-carbon-parks-2026', title: '山西省零碳园区建设工作部署', sourceUrl: 'https://example.com/policy', excerpt: '支持绿电直连和配套储能建设。' }],
    })
    const wrapper = mount(QaPage)

    await wrapper.get('[aria-label="输入园区或政策问题"]').setValue('山西零碳园区应如何配置储能？')
    await wrapper.get('[data-testid="ask-policy"]').trigger('submit')
    await flushPromises()

    expect(askPolicy).toHaveBeenCalledOnce()
    expect(wrapper.get('[data-testid="ai-answer"]').text()).toContain('优先补齐绿电供需平衡')
    expect(wrapper.get('[data-testid="ai-answer"]').text()).not.toContain('**')
    expect(wrapper.get('[data-testid="ai-answer"]').text()).toContain('E01')
    expect(wrapper.get('[data-testid="ai-answer"]').text()).toContain('山西省零碳园区建设工作部署')
  })
})
