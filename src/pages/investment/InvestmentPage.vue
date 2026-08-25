<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import { parkConfig } from '@/config/park'

const selectedSectorId = ref('renewable')
const current = computed(() => parkConfig.investment.sectors.find((item) => item.id === selectedSectorId.value)!)
const colors = { cyan: '#00e5ff', blue: '#4eb8ff', green: '#7bd877', orange: '#f5a623', pink: '#ff6b9d' }
const fundingGradient = computed(() => {
  let start = 0
  return `conic-gradient(${parkConfig.investment.fundingSources.map((item) => {
    const end = start + item.amount / 67 * 100
    const value = `${colors[item.tone]} ${start}% ${end}%`
    start = end
    return value
  }).join(',')})`
})
</script>

<template>
  <div class="page investment-page" data-page="investment">
    <PageHeading index="05" title="投资拆解与资金拼图" subtitle="CAPEX & FUNDING STRUCTURE" conclusion="总投资不是一个孤立数字，而是项目、成本、投资主体和政策资金的完整拼图。" />
    <div class="metrics-grid"><MetricCard v-for="item in parkConfig.investment.metrics" :key="item.id" :metric="item" /></div>
    <div class="investment-layout">
      <TechPanel title="项目投资地图" eyebrow="67 BILLION YUAN CAPEX MAP">
        <div class="treemap">
          <button v-for="sector in parkConfig.investment.sectors" :key="sector.id" class="sector-tile" :class="[{ 'is-active': sector.id === selectedSectorId }, `tone-${sector.tone}`, `sector-${sector.id}`]" :data-sector-id="sector.id" @click="selectedSectorId = sector.id">
            <span>{{ sector.name }}</span><strong>{{ sector.amount.toFixed(1) }}</strong><small>亿元</small><i>{{ sector.scale }}</i>
          </button>
        </div>
      </TechPanel>
      <TechPanel title="资金来源结构" eyebrow="CAPITAL STACK">
        <div class="funding-top">
          <div class="funding-ring" :style="{ background: fundingGradient }"><div><strong>67.0</strong><span>亿元总盘子</span></div></div>
          <div class="funding-list"><article v-for="item in parkConfig.investment.fundingSources" :key="item.id" :class="`tone-${item.tone}`"><i /><span>{{ item.name }}</span><strong>{{ item.amount.toFixed(1) }}亿</strong><small>{{ Math.round(item.amount / 67 * 100) }}%</small></article></div>
        </div>
        <div class="capital-callout"><span>资金判断</span><p>31 亿元投资主体已明确；金融资金与专项政策仍需依赖项目审批和现金流闭环。</p></div>
      </TechPanel>
    </div>
    <TechPanel :title="`${current.name} · 投资下钻`" eyebrow="SECTOR COST BREAKDOWN">
      <div class="sector-detail" data-testid="investment-detail">
        <div class="sector-summary" :class="`tone-${current.tone}`"><span>{{ current.scale }}</span><strong>{{ current.amount.toFixed(1) }} 亿元</strong><small>{{ current.components.length }} 项成本构成</small><RouterLink v-if="['renewable', 'storage', 'platform'].includes(current.id)" data-testid="investment-operation-link" to="/operations">查看建成后的运营价值 →</RouterLink></div>
        <div class="component-bars"><article v-for="component in current.components" :key="component.label"><div><span>{{ component.label }}</span><strong>{{ component.amount.toFixed(1) }} 亿元</strong></div><i><b :style="{ width: `${component.amount / current.amount * 100}%` }" /></i></article></div>
      </div>
    </TechPanel>
  </div>
</template>

<style scoped>
.investment-layout { display: grid; grid-template-columns: 1.35fr 1fr; gap: 14px; }.treemap { min-height: 346px; display: grid; grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: repeat(3, 1fr); gap: 6px; }.sector-tile { border: 1px solid color-mix(in srgb, currentColor 24%, transparent); color: var(--energy-cyan); background: linear-gradient(145deg, color-mix(in srgb, currentColor 18%, #0a1a3a), #081d3b); cursor: pointer; text-align: left; padding: 14px; position: relative; overflow: hidden; transition: transform .18s ease, border-color .18s ease; }.sector-tile::after { content: ''; position: absolute; inset: auto -20% -60% 25%; height: 100%; background: radial-gradient(circle, color-mix(in srgb, currentColor 16%, transparent), transparent 65%); }.sector-tile:hover, .sector-tile.is-active { transform: translateY(-2px); border-color: currentColor; box-shadow: inset 0 0 24px color-mix(in srgb, currentColor 8%, transparent), 0 0 14px color-mix(in srgb, currentColor 12%, transparent); }.sector-tile span, .sector-tile strong, .sector-tile small, .sector-tile i { display: block; position: relative; z-index: 1; }.sector-tile span { color: white; font-size: 15px; font-weight: 700; }.sector-tile strong { font: 800 28px var(--font-data); color: currentColor; margin-top: 7px; }.sector-tile small { color: #8fb2c5; }.sector-tile i { font-style: normal; color: #7399ae; font-size: 11px; margin-top: 7px; }.sector-renewable { grid-row: 1 / 3; }.sector-hydrogen { grid-column: 2 / 4; }.sector-efficiency { grid-column: 1 / 2; }.funding-top { min-height: 290px; display: grid; grid-template-columns: 210px 1fr; gap: 22px; align-items: center; }.funding-ring { width: 195px; height: 195px; border-radius: 50%; position: relative; box-shadow: 0 0 30px rgba(0,229,255,.13); }.funding-ring::after { content: ''; position: absolute; inset: 30px; background: #081d3d; border-radius: 50%; }.funding-ring > div { position: absolute; inset: 0; z-index: 1; display: grid; place-content: center; text-align: center; }.funding-ring strong { color: white; font: 800 31px var(--font-data); }.funding-ring span { color: #83abc0; }.funding-list { display: grid; gap: 13px; }.funding-list article { display: grid; grid-template-columns: 8px 1fr auto 34px; align-items: center; gap: 7px; }.funding-list i { width: 8px; height: 8px; background: currentColor; box-shadow: 0 0 8px currentColor; }.funding-list span { color: #9ebdcd; }.funding-list strong { color: currentColor; font: 700 14px var(--font-data); }.funding-list small { color: #6e93a9; text-align: right; }.capital-callout { padding: 14px; border-top: 1px dashed rgba(0,229,255,.18); }.capital-callout span { color: var(--opportunity-orange); }.capital-callout p { color: #87adc1; line-height: 1.55; margin: 5px 0 0; }.sector-detail { display: grid; grid-template-columns: 270px 1fr; gap: 24px; }.sector-summary { display: flex; flex-direction: column; justify-content: center; padding: 17px; border-left: 2px solid currentColor; background: linear-gradient(90deg, color-mix(in srgb, currentColor 10%, transparent), transparent); }.sector-summary span { color: #9ebccb; }.sector-summary strong { color: currentColor; font: 800 28px var(--font-data); margin: 8px 0; }.sector-summary small { color: #658ca4; }.sector-summary a { color: var(--energy-cyan); text-decoration: none; margin-top: 13px; font-size: 12px; }.component-bars { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px 14px; }.component-bars article > div { display: flex; justify-content: space-between; gap: 8px; color: #83a8bc; font-size: 12px; }.component-bars strong { color: white; }.component-bars i { display: block; height: 3px; background: #123451; margin-top: 6px; }.component-bars b { display: block; height: 100%; background: linear-gradient(90deg, var(--energy-cyan), var(--electric-blue)); box-shadow: 0 0 6px rgba(0,229,255,.35); }
.treemap { grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(160px, 1fr)); }
.sector-renewable, .sector-hydrogen, .sector-efficiency { grid-column: auto; grid-row: auto; }
@media (max-width: 1200px) { .investment-layout { grid-template-columns: 1fr; }.sector-detail { grid-template-columns: 230px 1fr; } }
</style>
