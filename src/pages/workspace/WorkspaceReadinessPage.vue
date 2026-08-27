<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { workspaceApi } from '@/services/workspaceApi'
import { buildReadinessRows, summarizeReadiness } from '@/services/readinessModel'
import { useWorkspaceState } from '@/stores/workspace'
import type { DiagnosisRun, WorkspaceTask } from '@/types/workspace'

const state = useWorkspaceState()
const diagnosis = ref<DiagnosisRun | null>(null)
const tasks = ref<WorkspaceTask[]>([])
const loading = ref(false)
const message = ref('')
const rows = computed(() => buildReadinessRows(diagnosis.value, tasks.value))
const summary = computed(() => summarizeReadiness(rows.value))
const labels = { ready: '可核对', in_progress: '推进中', action_required: '待补齐', not_applicable: '不适用' }

async function load() {
  if (!state.selectedParkId.value) return
  loading.value = true; message.value = ''
  try { [diagnosis.value, tasks.value] = await Promise.all([workspaceApi.latestDiagnosis(state.selectedParkId.value), workspaceApi.listTasks(state.selectedParkId.value)]) }
  catch (error) { diagnosis.value = null; tasks.value = []; message.value = (error as Error).message }
  finally { loading.value = false }
}
watch(() => state.selectedParkId.value, load)
onMounted(load)
</script>

<template>
  <div class="workspace-page readiness-page">
    <header class="page-title"><div><p>APPLICATION READINESS / 申报核对</p><h1>申报准备度</h1><span>由最新诊断、关联任务和佐证数量确定性汇总；任务完成不等于指标自动达标。</span></div><RouterLink to="/workspace/diagnosis">查看指标诊断</RouterLink></header>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <section v-if="rows.length" class="readiness-band">
      <div class="rate"><span>当前准备度</span><strong>{{ summary.readinessRate }}%</strong><small>{{ summary.ready }} / {{ summary.applicable }} 项可核对</small></div>
      <div class="rail" aria-label="申报准备度分布"><i class="ready" :style="{ flex: summary.ready || .01 }" /><i class="progress" :style="{ flex: summary.inProgress || .01 }" /><i class="required" :style="{ flex: summary.actionRequired || .01 }" /></div>
      <div class="counts"><span><b>{{ summary.ready }}</b> 可核对</span><span><b>{{ summary.inProgress }}</b> 推进中</span><span><b>{{ summary.actionRequired }}</b> 待补齐</span></div>
    </section>
    <section v-if="rows.length" class="readiness-matrix">
      <header><span>指标与状态</span><span>关联闭环</span><span>下一步动作</span></header>
      <article v-for="row in rows" :key="row.indicatorId" data-testid="readiness-row" :class="`is-${row.state}`">
        <div><b>{{ labels[row.state] }}</b><strong>{{ row.title }}</strong></div>
        <div class="links"><span>{{ row.taskCount }} 项任务</span><span>{{ row.evidenceCount }} 份佐证</span></div>
        <p>{{ row.nextAction }}</p>
      </article>
    </section>
    <section v-else-if="!loading" class="empty"><div><p>NO DIAGNOSIS BASELINE</p><h2>先生成园区指标诊断</h2><span>形成真实指标结果后，平台才能汇总申报准备度。</span></div><RouterLink to="/workspace/diagnosis">生成指标诊断</RouterLink></section>
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p,.empty p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.page-title a,.empty a{flex:none;padding:9px 13px;border:1px solid rgba(0,229,255,.35);color:var(--heading-white);text-decoration:none;background:rgba(0,229,255,.06)}.message{margin:0;padding:9px 12px;border-left:2px solid var(--opportunity-orange);color:#f4c576;background:rgba(245,166,35,.06)}.readiness-band{display:grid;grid-template-columns:190px 1fr;align-items:center;gap:10px 22px;padding:18px;border:1px solid rgba(0,229,255,.18);background:linear-gradient(110deg,rgba(11,39,78,.84),rgba(5,21,46,.88))}.rate{grid-row:1/3;display:grid}.rate span,.rate small{color:#769eb8;font-size:12px}.rate strong{color:var(--energy-cyan);font:800 34px var(--font-data)}.rail{height:8px;display:flex;overflow:hidden;background:#06162f}.rail i{display:block}.rail .ready{background:var(--success-green)}.rail .progress{background:var(--opportunity-orange)}.rail .required{background:var(--risk-pink)}.counts{display:flex;gap:22px;color:#779fb8;font-size:12px}.counts b{margin-right:4px;color:var(--heading-white);font:700 15px var(--font-data)}.readiness-matrix{display:grid}.readiness-matrix>header,.readiness-matrix article{display:grid;grid-template-columns:minmax(240px,1.1fr) 220px minmax(260px,1fr);align-items:center;gap:18px;padding:11px 14px}.readiness-matrix>header{color:#628aa6;font:10px var(--font-data);letter-spacing:1.3px}.readiness-matrix article{border-top:1px solid rgba(0,229,255,.1);background:rgba(7,27,57,.62)}.readiness-matrix article>div:first-child{display:grid;grid-template-columns:66px 1fr;align-items:center;gap:10px}.readiness-matrix article b{padding:3px 5px;border:1px solid currentColor;color:var(--energy-cyan);font-size:10px;text-align:center}.readiness-matrix article strong{color:var(--heading-white);font-size:14px}.links{display:flex;gap:13px;color:#7ea5be;font-size:12px}.readiness-matrix article p{margin:0;color:#9ab8ca;font-size:12px}.is-ready{box-shadow:inset 2px 0 var(--success-green)}.is-ready b{color:var(--success-green)!important}.is-in_progress{box-shadow:inset 2px 0 var(--opportunity-orange)}.is-in_progress b{color:var(--opportunity-orange)!important}.is-action_required{box-shadow:inset 2px 0 var(--risk-pink)}.is-action_required b{color:var(--risk-pink)!important}.is-not_applicable{opacity:.58}.empty{min-height:220px;display:flex;align-items:center;justify-content:space-between;gap:22px;padding:28px;border:1px dashed rgba(0,229,255,.22)}.empty h2{margin:4px 0;color:var(--heading-white)}.empty span{color:#769db7}@media(max-width:780px){.page-title,.empty{align-items:flex-start;flex-direction:column}.readiness-band{grid-template-columns:1fr}.rate{grid-row:auto}.readiness-matrix>header{display:none}.readiness-matrix article{grid-template-columns:1fr}.readiness-matrix article>div:first-child{grid-template-columns:66px 1fr}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
