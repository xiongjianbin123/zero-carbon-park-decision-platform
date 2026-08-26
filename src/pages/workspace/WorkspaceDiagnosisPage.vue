<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import DiagnosisMatrix from '@/components/workspace/DiagnosisMatrix.vue'
import { workspaceApi } from '@/services/workspaceApi'
import { useWorkspaceState } from '@/stores/workspace'
import type { DiagnosisRun, IndicatorResult } from '@/types/workspace'

const state = useWorkspaceState()
const diagnosis = ref<DiagnosisRun | null>(null)
const busy = ref(false)
const message = ref('')
const selectedIndicator = ref<IndicatorResult | null>(null)
const canWrite = computed(() => state.selectedPark.value?.role !== 'viewer')
const task = reactive({ taskType: '诊断整改', title: '', ownerName: '', plannedDate: '', status: 'open' as const, reviewNote: '' })

async function load() {
  if (!state.selectedParkId.value) return
  message.value = ''
  try { diagnosis.value = await workspaceApi.latestDiagnosis(state.selectedParkId.value) }
  catch (error) { diagnosis.value = null; if ((error as { status?: number }).status !== 404) message.value = (error as Error).message }
}
async function generate() {
  if (!state.selectedParkId.value) return
  busy.value = true; message.value = ''
  try { diagnosis.value = await workspaceApi.generateDiagnosis(state.selectedParkId.value); message.value = '已基于当前项目数据重新计算指标。' }
  catch (error) { message.value = (error as Error).message } finally { busy.value = false }
}
function openTask(indicator: IndicatorResult) {
  selectedIndicator.value = indicator
  task.title = indicator.status === 'missing_data' ? `补齐：${indicator.title}` : `整改：${indicator.title}`
  task.taskType = indicator.status === 'missing_data' ? '数据补齐' : '指标整改'
}
async function createTask() {
  if (!state.selectedParkId.value || !selectedIndicator.value) return
  busy.value = true; message.value = ''
  try {
    await workspaceApi.createTask(state.selectedParkId.value, { ...task, sourceIndicatorId: selectedIndicator.value.id })
    message.value = '任务已创建，可在任务与佐证页面继续办理。'; selectedIndicator.value = null
  } catch (error) { message.value = (error as Error).message } finally { busy.value = false }
}
watch(() => state.selectedParkId.value, load)
onMounted(load)
</script>

<template>
  <div class="workspace-page diagnosis-page">
    <header class="page-title"><div><p>DETERMINISTIC CHECK / 指标诊断</p><h1>零碳建设差距矩阵</h1><span>每次计算保留指标版本、数据基准日与计算说明。</span></div><button v-if="canWrite" @click="generate" :disabled="busy">{{ diagnosis ? '按当前数据重新诊断' : '生成首次诊断' }}</button></header>
    <section v-if="diagnosis" class="diagnosis-meta"><div><span>指标版本</span><strong>{{ diagnosis.version }}</strong></div><div><span>数据基准日</span><strong>{{ diagnosis.dataBaselineDate || '尚未形成' }}</strong></div><div><span>计算时间</span><strong>{{ new Date(diagnosis.calculatedAt).toLocaleString('zh-CN') }}</strong></div><div><span>数据缺口</span><strong>{{ diagnosis.missingData.length }}</strong></div></section>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <DiagnosisMatrix v-if="diagnosis" :results="diagnosis.results" :writable="canWrite" @create-task="openTask" />
    <section v-else class="empty"><span>NO DIAGNOSIS</span><h2>尚未形成园区指标诊断</h2><p>可先导入月度能源账单；缺少的资料会明确标为“缺少数据”，不会用示范值补齐。</p><RouterLink to="/workspace/imports">前往数据导入</RouterLink></section>
    <form v-if="selectedIndicator" data-testid="diagnosis-task-form" class="task-form" @submit.prevent="createTask"><header><div><span>FROM INDICATOR</span><strong>{{ selectedIndicator.title }}</strong></div><button type="button" @click="selectedIndicator = null">关闭</button></header><div class="fields"><label><span>任务标题</span><input v-model="task.title" required></label><label><span>任务类型</span><input v-model="task.taskType" required></label><label><span>责任人</span><input v-model="task.ownerName" required></label><label><span>计划日期</span><input v-model="task.plannedDate" type="date" required></label></div><button class="submit" type="submit" :disabled="busy">创建整改任务</button></form>
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.page-title button,.submit{min-height:40px;padding:0 14px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800;cursor:pointer}.diagnosis-meta{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid rgba(0,229,255,.16);background:rgba(7,27,58,.72)}.diagnosis-meta div{display:grid;gap:4px;padding:11px 14px;border-right:1px solid rgba(0,229,255,.1)}.diagnosis-meta span{color:#6c96b0;font-size:11px}.diagnosis-meta strong{color:var(--heading-white);font-size:13px}.message{margin:0;padding:9px 12px;border-left:2px solid var(--success-green);color:#9be3bf;background:rgba(28,206,143,.06)}.empty{padding:34px;border:1px dashed rgba(0,229,255,.22);background:rgba(7,25,53,.62)}.empty>span{color:var(--energy-cyan);font:10px var(--font-data);letter-spacing:1.6px}.empty h2{margin:7px 0;color:var(--heading-white)}.empty p{color:#7fa5bd}.empty a{color:var(--energy-cyan)}.task-form{position:fixed;z-index:80;right:24px;bottom:24px;width:min(620px,calc(100vw - 48px));padding:16px;border:1px solid var(--energy-cyan);background:#071a38;box-shadow:0 20px 70px rgba(0,0,0,.55)}.task-form header{display:flex;justify-content:space-between;margin-bottom:13px}.task-form header div{display:grid}.task-form header span{color:var(--market-purple);font:10px var(--font-data)}.task-form header strong{color:var(--heading-white)}.task-form header button{border:0;color:#7fa4bc;background:transparent;cursor:pointer}.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.fields label{display:grid;gap:5px}.fields span{color:#7da4bc;font-size:11px}.fields input{min-height:38px;border:1px solid rgba(0,229,255,.22);padding:0 9px;color:var(--heading-white);background:#03132b}.submit{margin-top:13px;float:right}@media(max-width:700px){.page-title{align-items:flex-start;flex-direction:column}.diagnosis-meta{grid-template-columns:1fr 1fr}.fields{grid-template-columns:1fr}.task-form{right:12px;bottom:12px;width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto}}
</style>
