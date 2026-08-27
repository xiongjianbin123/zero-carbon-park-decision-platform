<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import TaskBoard from '@/components/workspace/TaskBoard.vue'
import TaskDetailDrawer from '@/components/workspace/TaskDetailDrawer.vue'
import { workspaceApi } from '@/services/workspaceApi'
import { useWorkspaceState } from '@/stores/workspace'
import type { TaskActivity, TaskEvidenceFile, WorkspaceTask, TaskStatus } from '@/types/workspace'

const state = useWorkspaceState()
const tasks = ref<WorkspaceTask[]>([])
const busyId = ref('')
const message = ref('')
const showCreate = ref(false)
const selectedTask = ref<WorkspaceTask | null>(null)
const detailFiles = ref<TaskEvidenceFile[]>([])
const detailActivity = ref<TaskActivity[]>([])
const canWrite = computed(() => state.selectedPark.value?.role !== 'viewer')
const form = reactive({ taskType: '项目推进', title: '', ownerName: '', plannedDate: '', status: 'open' as const, reviewNote: '' })

async function load() { if (state.selectedParkId.value) try { tasks.value = await workspaceApi.listTasks(state.selectedParkId.value) } catch (error) { message.value = (error as Error).message } }
async function create() {
  if (!state.selectedParkId.value) return
  busyId.value = 'create'; message.value = ''
  try { tasks.value.push(await workspaceApi.createTask(state.selectedParkId.value, { ...form, sourceIndicatorId: null })); showCreate.value = false; form.title = ''; message.value = '任务已创建。' }
  catch (error) { message.value = (error as Error).message } finally { busyId.value = '' }
}
async function changeStatus(task: WorkspaceTask, status: TaskStatus) {
  if (!state.selectedParkId.value || status === task.status) return
  busyId.value = task.id; message.value = ''
  try { Object.assign(task, await workspaceApi.updateTask(state.selectedParkId.value, task.id, { status })); message.value = '任务状态已更新。' }
  catch (error) { message.value = (error as Error).message } finally { busyId.value = '' }
}
async function uploadEvidence(task: WorkspaceTask, file: File) {
  if (!state.selectedParkId.value) return
  busyId.value = task.id; message.value = ''
  try { await workspaceApi.uploadEvidence(state.selectedParkId.value, task.id, file); task.evidenceCount += 1; message.value = `已为“${task.title}”上传佐证。` }
  catch (error) { message.value = (error as Error).message } finally { busyId.value = '' }
}
async function openTask(task: WorkspaceTask) {
  if (!state.selectedParkId.value) return
  selectedTask.value = task; busyId.value = task.id; message.value = ''
  try { [detailFiles.value, detailActivity.value] = await Promise.all([workspaceApi.listTaskFiles(state.selectedParkId.value, task.id), workspaceApi.listTaskActivity(state.selectedParkId.value, task.id)]) }
  catch (error) { message.value = (error as Error).message }
  finally { busyId.value = '' }
}
async function saveReviewNote(note: string) {
  if (!state.selectedParkId.value || !selectedTask.value) return
  busyId.value = selectedTask.value.id; message.value = ''
  try { Object.assign(selectedTask.value, await workspaceApi.updateTask(state.selectedParkId.value, selectedTask.value.id, { reviewNote: note })); message.value = '审核备注已保存。' }
  catch (error) { message.value = (error as Error).message }
  finally { busyId.value = '' }
}
async function downloadEvidence(file: TaskEvidenceFile) {
  if (!state.selectedParkId.value) return
  try { const result = await workspaceApi.downloadEvidence(state.selectedParkId.value, file.id); const url = URL.createObjectURL(result.blob); const link = document.createElement('a'); link.href = url; link.download = result.filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 0) }
  catch (error) { message.value = (error as Error).message }
}
watch(() => state.selectedParkId.value, load)
onMounted(load)
</script>

<template>
  <div class="workspace-page tasks-page"><header class="page-title"><div><p>ACTION & EVIDENCE / 执行闭环</p><h1>任务与佐证</h1><span>任务状态明确流转；完成任务前须具备佐证材料或审核备注。</span></div><button v-if="canWrite" @click="showCreate = !showCreate">{{ showCreate ? '收起' : '新建任务' }}</button></header>
    <form v-if="showCreate" class="create-form" @submit.prevent="create"><label><span>任务标题</span><input v-model="form.title" required></label><label><span>任务类型</span><input v-model="form.taskType" required></label><label><span>责任人</span><input v-model="form.ownerName" required></label><label><span>计划日期</span><input v-model="form.plannedDate" type="date" required></label><button type="submit" :disabled="busyId === 'create'">保存任务</button></form>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <section class="task-summary"><span>全部任务 <b>{{ tasks.length }}</b></span><span>待办理 <b>{{ tasks.filter(item => !['done','cancelled'].includes(item.status)).length }}</b></span><span>已有佐证 <b>{{ tasks.reduce((sum,item) => sum + item.evidenceCount, 0) }}</b></span></section>
    <TaskBoard :tasks="tasks" :busy-id="busyId" :writable="canWrite" @change-status="changeStatus" @upload-evidence="uploadEvidence" @open-task="openTask" />
    <TaskDetailDrawer v-if="selectedTask" :task="selectedTask" :files="detailFiles" :activity="detailActivity" :busy="busyId === selectedTask.id" :writable="canWrite" @close="selectedTask = null" @save-review-note="saveReviewNote" @download="downloadEvidence" />
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.page-title button,.create-form button{min-height:38px;padding:0 14px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800}.create-form{display:grid;grid-template-columns:2fr 1fr 1fr 160px auto;align-items:end;gap:10px;padding:13px;border:1px solid rgba(0,229,255,.2);background:rgba(7,28,59,.8)}.create-form label{display:grid;gap:5px}.create-form span{color:#7ea5bd;font-size:11px}.create-form input{min-height:38px;border:1px solid rgba(0,229,255,.22);padding:0 9px;color:var(--heading-white);background:#061a38}.message{margin:0;padding:9px 12px;border-left:2px solid var(--opportunity-orange);color:#f4c576;background:rgba(245,166,35,.06)}.task-summary{display:flex;gap:28px;padding:11px 14px;border:1px solid rgba(0,229,255,.13);color:#789db5;font-size:12px}.task-summary b{margin-left:5px;color:var(--energy-cyan);font:700 16px var(--font-data)}@media(max-width:920px){.create-form{grid-template-columns:1fr 1fr}.create-form button{grid-column:1/-1}}@media(max-width:600px){.page-title{align-items:flex-start;flex-direction:column}.create-form{grid-template-columns:1fr}.create-form button{grid-column:1}.task-summary{justify-content:space-between;gap:8px}}
</style>
