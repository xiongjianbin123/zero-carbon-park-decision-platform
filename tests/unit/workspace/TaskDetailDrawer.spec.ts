import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import TaskDetailDrawer from '@/components/workspace/TaskDetailDrawer.vue'

afterEach(() => { document.body.innerHTML = '' })

describe('TaskDetailDrawer', () => {
  it('renders its fixed layer directly under body so the sticky app header cannot cover it', () => {
    const wrapper = mount(TaskDetailDrawer, { props: {
      task: { id: 'task-1', title: '核对佐证', taskType: '材料复核', ownerName: '专员', plannedDate: '2026-09-30', status: 'open', reviewNote: '', evidenceCount: 0 },
      files: [], activity: [], writable: true,
    } })

    const portal = document.body.querySelector('[data-testid="task-detail-portal"]')
    expect(portal?.parentElement).toBe(document.body)
    wrapper.unmount()
  })
})
