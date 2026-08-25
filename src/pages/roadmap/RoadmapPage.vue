<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import { parkConfig } from '@/config/park'

const selectedYear = ref(2027)
const current = computed(() => parkConfig.roadmap.years.find((item) => item.year === selectedYear.value)!)
const mixGradient = computed(() => {
  const colors = { cyan: '#00e5ff', orange: '#f5a623', green: '#7bd877', pink: '#ff6b9d', blue: '#4eb8ff' }
  let start = 0
  return `conic-gradient(${parkConfig.roadmap.technologyMix.map((item) => {
    const end = start + item.value
    const segment = `${colors[item.tone]} ${start}% ${end}%`
    start = end
    return segment
  }).join(',')})`
})
</script>

<template>
  <div class="page roadmap-page" data-page="roadmap">
    <PageHeading index="02" title="2026—2030 零碳建设路径" subtitle="FIVE-YEAR TRANSFORMATION ROADMAP" conclusion="先摸清底数，再以光储建设打开局面，最终形成市场化运营与碳管理闭环。" />
    <div class="metrics-grid"><MetricCard v-for="item in parkConfig.roadmap.metrics" :key="item.id" :metric="item" /></div>
    <div class="two-column roadmap-main">
      <TechPanel title="五年里程碑" eyebrow="MILESTONE SEQUENCE">
        <div class="timeline">
          <button v-for="(item, index) in parkConfig.roadmap.years" :key="item.year" class="year-button" :class="[{ 'is-active': item.year === selectedYear }, `state-${item.status}`]" :data-year="item.year" @click="selectedYear = item.year">
            <span>0{{ index + 1 }}</span><strong>{{ item.year }}</strong><i>{{ item.status === 'completed' ? '✓' : item.status === 'active' ? 'NOW' : '→' }}</i><b>{{ item.title }}</b>
          </button>
        </div>
        <div class="roadmap-detail" data-testid="roadmap-detail">
          <div class="detail-year"><small>SELECTED YEAR</small><strong>{{ current.year }}</strong><span>{{ current.title }}</span></div>
          <div class="detail-copy"><h3>{{ current.summary }}</h3><div class="project-tags"><span v-for="project in current.projects" :key="project">{{ project }}</span></div><p>预期贡献：<b>{{ current.contribution }}</b></p><RouterLink v-if="current.year >= 2028" data-testid="roadmap-operation-link" class="roadmap-link" to="/operations">进入能源运营，查看市场协同推演 →</RouterLink></div>
        </div>
      </TechPanel>
      <TechPanel title="技术组合" eyebrow="TECHNOLOGY MIX">
        <div class="mix-wrap">
          <div class="mix-ring" :style="{ background: mixGradient }"><div><strong>源网荷储</strong><span>碳协同</span></div></div>
          <div class="mix-legend"><div v-for="item in parkConfig.roadmap.technologyMix" :key="item.id" :class="`tone-${item.tone}`"><i /><span>{{ item.label }}</span><strong>{{ item.value }}{{ item.unit }}</strong></div></div>
        </div>
        <div class="mix-message"><span class="tone-cyan">关键判断</span><p>转型成败不取决于单一设备规模，而取决于光储、用能改造、绿电交易和碳核算能否同步闭环。</p></div>
      </TechPanel>
    </div>
    <TechPanel title="阶段成效目标" eyebrow="EXPECTED OUTCOMES">
      <div class="outcome-grid"><article v-for="(item, index) in parkConfig.roadmap.years" :key="item.year"><span>{{ item.year }}</span><div><b :style="{ width: `${20 + index * 20}%` }" /></div><strong>{{ item.contribution }}</strong></article></div>
    </TechPanel>
  </div>
</template>

<style scoped>
.roadmap-main { align-items: stretch; }.timeline { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; position: relative; padding: 18px 2px 26px; }.timeline::before { content: ''; position: absolute; top: 74px; left: 8%; right: 8%; height: 2px; background: linear-gradient(90deg, var(--success-green) 0 20%, var(--energy-cyan) 20% 40%, #244f72 40%); box-shadow: 0 0 8px rgba(0,229,255,.25); }
.year-button { border: 0; background: transparent; min-width: 0; color: #7098b1; cursor: pointer; text-align: center; position: relative; z-index: 1; }.year-button > span { display: block; color: #4d7590; font: 10px var(--font-data); letter-spacing: 2px; }.year-button strong { display: block; color: white; font: 800 19px var(--font-data); margin: 4px 0 11px; }.year-button i { width: 44px; height: 44px; margin: auto; display: grid; place-items: center; border-radius: 50%; color: #6f9ab4; background: #0a2f53; border: 1px solid #296284; font: 700 10px var(--font-data); font-style: normal; transition: all .2s ease; }.year-button b { display: block; margin-top: 10px; color: #83a9bd; }.year-button:hover i, .year-button.is-active i { transform: scale(1.08); border-color: var(--energy-cyan); color: white; box-shadow: 0 0 16px rgba(0,229,255,.35); }.year-button.state-completed i { background: #1b603f; border-color: var(--success-green); }.year-button.is-active i { background: #087c99; }.year-button.is-active b, .year-button.is-active strong { color: var(--energy-cyan); }
.roadmap-detail { min-height: 190px; display: grid; grid-template-columns: 130px 1fr; gap: 22px; align-items: center; padding: 22px; border: 1px solid rgba(0,229,255,.15); background: linear-gradient(120deg, rgba(0,229,255,.07), transparent 52%); }.detail-year { border-right: 1px solid rgba(0,229,255,.2); }.detail-year small, .detail-year span { display: block; color: #779eb5; }.detail-year strong { display: block; color: var(--energy-cyan); font: 800 41px var(--font-data); text-shadow: 0 0 14px rgba(0,229,255,.35); }.detail-year span { font-size: 17px; color: white; }.detail-copy h3 { margin: 0 0 14px; color: white; font-size: 17px; line-height: 1.6; }.project-tags { display: flex; flex-wrap: wrap; gap: 8px; }.project-tags span { padding: 6px 9px; color: var(--opportunity-orange); border: 1px solid rgba(245,166,35,.3); background: rgba(245,166,35,.06); }.detail-copy p { color: #79a2b9; margin: 15px 0 0; }.detail-copy b { color: var(--success-green); }
.roadmap-link { display: inline-block; margin-top: 12px; color: var(--energy-cyan); text-decoration: none; font-size: 12px; }
.mix-wrap { min-height: 255px; display: flex; align-items: center; justify-content: center; gap: 34px; }.mix-ring { width: 180px; height: 180px; border-radius: 50%; position: relative; box-shadow: 0 0 26px rgba(0,229,255,.12); }.mix-ring::after { content: ''; position: absolute; inset: 28px; background: var(--deep-sea); border-radius: 50%; box-shadow: inset 0 0 18px rgba(0,229,255,.08); }.mix-ring div { position: absolute; inset: 0; z-index: 1; display: grid; align-content: center; text-align: center; }.mix-ring strong, .mix-ring span { display: block; }.mix-ring strong { color: white; font-size: 18px; }.mix-ring span { color: var(--energy-cyan); margin-top: 4px; }.mix-legend { min-width: 140px; display: grid; gap: 13px; }.mix-legend div { display: grid; grid-template-columns: 8px 1fr auto; gap: 8px; align-items: center; }.mix-legend i { width: 7px; height: 7px; background: currentColor; box-shadow: 0 0 7px currentColor; }.mix-legend span { color: #9bbdce; }.mix-legend strong { font: 700 16px var(--font-data); color: currentColor; }
.mix-message { padding: 14px; border-top: 1px dashed rgba(0,229,255,.16); }.mix-message span { font-size: 12px; }.mix-message p { margin: 5px 0 0; line-height: 1.6; color: #8fb3c7; }
.outcome-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }.outcome-grid article { min-width: 0; }.outcome-grid span { color: var(--energy-cyan); font: 700 14px var(--font-data); }.outcome-grid div { height: 4px; margin: 7px 0; background: #102f4f; }.outcome-grid b { display: block; height: 100%; background: linear-gradient(90deg, var(--energy-cyan), var(--success-green)); box-shadow: 0 0 7px rgba(0,229,255,.4); }.outcome-grid strong { color: #779db5; font-size: 12px; line-height: 1.4; display: block; }
@media (max-width: 1100px) { .outcome-grid { grid-template-columns: 1fr; }.mix-wrap { justify-content: flex-start; }.roadmap-detail { grid-template-columns: 110px 1fr; } }
</style>
