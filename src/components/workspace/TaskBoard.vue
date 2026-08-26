<script setup lang="ts">
import type { TaskStatus, WorkspaceTask } from '@/types/workspace'

withDefaults(defineProps<{ tasks: WorkspaceTask[]; busyId?: string; writable?: boolean }>(), { writable: true })
defineEmits<{ changeStatus: [task: WorkspaceTask, status: TaskStatus]; uploadEvidence: [task: WorkspaceTask, file: File] }>()

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'draft', label: '草稿' }, { value: 'open', label: '待处理' }, { value: 'in_progress', label: '处理中' },
  { value: 'blocked', label: '受阻' }, { value: 'done', label: '已完成' }, { value: 'cancelled', label: '已取消' },
]
</script>

<template>
  <div class="task-board">
    <article v-for="task in tasks" :key="task.id" class="task-row">
      <div class="task-main"><span>{{ task.taskType }}</span><strong>{{ task.title }}</strong><small>责任人 {{ task.ownerName }} · 计划 {{ task.plannedDate }}</small></div>
      <div class="task-evidence"><b>{{ task.evidenceCount }}</b><span>项佐证</span><label v-if="writable">上传<input aria-label="上传任务佐证" type="file" accept=".xlsx,.csv,.pdf,.png,.jpg,.jpeg" :disabled="busyId === task.id" @change="($event.target as HTMLInputElement).files?.[0] && $emit('uploadEvidence', task, ($event.target as HTMLInputElement).files![0])"></label></div>
      <select v-if="writable" aria-label="更新任务状态" :value="task.status" :disabled="busyId === task.id" @change="$emit('changeStatus', task, ($event.target as HTMLSelectElement).value as TaskStatus)"><option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option></select><span v-else class="readonly-status">{{ statusOptions.find(item => item.value === task.status)?.label }}</span>
    </article>
    <p v-if="!tasks.length" class="empty">尚无任务。可从指标诊断中的差距或缺数项创建。</p>
  </div>
</template>

<style scoped>
.task-board{display:grid;gap:8px}.task-row{display:grid;grid-template-columns:minmax(260px,1fr) auto 150px;align-items:center;gap:18px;padding:14px 16px;border:1px solid rgba(0,229,255,.17);border-left:2px solid rgba(0,229,255,.55);background:linear-gradient(100deg,rgba(12,40,80,.75),rgba(6,22,48,.82))}.task-main{min-width:0;display:grid;gap:4px}.task-main>span{color:var(--market-purple);font-size:11px}.task-main strong{overflow:hidden;color:var(--heading-white);text-overflow:ellipsis;white-space:nowrap}.task-main small{color:#729ab4}.task-evidence{display:flex;align-items:center;gap:6px;color:#789db5;font-size:12px}.task-evidence b{color:var(--energy-cyan);font:700 18px var(--font-data)}.task-evidence label{margin-left:7px;padding:5px 8px;border:1px solid rgba(0,229,255,.3);color:var(--energy-cyan);cursor:pointer}.task-evidence input{display:none}select{min-height:34px;border:1px solid rgba(0,229,255,.22);padding:0 8px;color:var(--heading-white);background:#071c3a}.readonly-status{justify-self:end;padding:4px 8px;border:1px solid rgba(0,229,255,.2);color:#8eb1c6;font-size:12px}.empty{margin:0;padding:24px;border:1px dashed rgba(0,229,255,.22);color:#789db5;text-align:center}@media(max-width:760px){.task-row{grid-template-columns:1fr}.task-evidence{justify-content:flex-start}.task-main strong{white-space:normal}.readonly-status{justify-self:start}}
</style>
