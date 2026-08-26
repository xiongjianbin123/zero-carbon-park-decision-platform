<script setup lang="ts">
import { useWorkspaceState } from '@/stores/workspace'
const state = useWorkspaceState()
const metrics = [
  { label: '数据完整度', value: '待诊断', tone: 'cyan' },
  { label: '达标率', value: '待诊断', tone: 'green' },
  { label: '打开任务', value: '0', tone: 'yellow' },
  { label: '最近截止日', value: '暂无', tone: 'red' },
]
</script>

<template>
  <div class="workspace-page">
    <header class="workspace-heading"><div><p>PROJECT BASELINE / 项目基线</p><h1>{{ state.selectedPark.value?.name }}</h1><span>从数据基线开始形成可追踪的诊断、任务与成果。</span></div><RouterLink class="compact-action" to="/workspace/onboarding">编辑园区档案</RouterLink></header>
    <section class="workspace-metrics" aria-label="项目概况">
      <article v-for="metric in metrics" :key="metric.label" data-testid="workspace-metric" :class="`is-${metric.tone}`"><span>{{ metric.label }}</span><strong>{{ metric.value }}</strong></article>
    </section>
    <section class="next-action-panel"><div class="action-marker">01</div><div><p>NEXT REQUIRED ACTION</p><h2>导入第一批园区基础数据</h2><span>建议从月度能源账单开始，再补充时序负荷、企业清单和项目清单。</span></div><span class="action-state">等待数据</span></section>
  </div>
</template>

<style scoped>
.workspace-page { display:grid; gap:12px; }.workspace-heading { min-height:86px; display:flex; align-items:center; justify-content:space-between; gap:20px; padding:12px 2px 14px; border-bottom:1px dashed rgba(0,229,255,.2); }.workspace-heading p,.next-action-panel p { margin:0 0 4px; color:var(--energy-cyan); font:11px var(--font-data); letter-spacing:1.8px; }.workspace-heading h1 { max-width:900px; margin:0; overflow-wrap:anywhere; color:var(--heading-white); font-size:clamp(24px,2.2vw,32px); }.workspace-heading span { display:block; margin-top:6px; color:#83a9c2; }.compact-action { flex:none; padding:9px 13px; border:1px solid rgba(0,229,255,.35); color:var(--heading-white); text-decoration:none; background:rgba(0,229,255,.06); }
.workspace-metrics { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }.workspace-metrics article { min-height:78px; display:flex; flex-direction:column; justify-content:center; padding:12px 15px; border:1px solid rgba(0,229,255,.16); border-left:2px solid currentColor; background:linear-gradient(145deg,rgba(13,43,83,.72),rgba(7,25,52,.84)); }.workspace-metrics span { color:#7ca3bd; font-size:13px; }.workspace-metrics strong { margin-top:5px; color:currentColor; font:800 22px var(--font-data); }.is-cyan{color:var(--energy-cyan)}.is-green{color:var(--success-green)}.is-yellow{color:var(--opportunity-orange)}.is-red{color:var(--risk-pink)}
.next-action-panel { min-height:150px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:18px; padding:22px; border:1px solid rgba(0,229,255,.2); background:linear-gradient(90deg,rgba(14,45,87,.76),rgba(8,25,53,.82)); }.action-marker { width:48px; height:48px; display:grid; place-items:center; color:var(--energy-cyan); border:1px solid var(--energy-cyan); font:700 15px var(--font-data); transform:rotate(45deg); }.action-marker::first-line { transform:rotate(-45deg); }.next-action-panel h2 { margin:0; color:var(--heading-white); font-size:20px; }.next-action-panel span { color:#83a9c2; }.action-state { padding:5px 9px; border:1px solid var(--opportunity-orange); color:var(--opportunity-orange)!important; font-size:12px; }
@media(max-width:850px){.workspace-metrics{grid-template-columns:1fr 1fr}.workspace-heading{align-items:flex-start;flex-direction:column}.next-action-panel{grid-template-columns:auto 1fr}.action-state{grid-column:2}}@media(max-width:480px){.workspace-metrics{grid-template-columns:1fr}.next-action-panel{grid-template-columns:1fr}.action-marker{display:none}.action-state{grid-column:1;justify-self:start}}
</style>

