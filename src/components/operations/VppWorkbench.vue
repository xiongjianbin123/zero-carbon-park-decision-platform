<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import TechPanel from '@/components/TechPanel.vue'
import type { VppConfig, VppStageId } from '@/types/park'

const props = defineProps<{ vpp: VppConfig }>()
const activeStageId = ref<VppStageId>(props.vpp.stages[0].id)
const activeStage = computed(() => props.vpp.stages.find((stage) => stage.id === activeStageId.value)!)
</script>

<template>
  <section class="vpp-workbench" data-testid="vpp-workbench">
    <header class="vpp-command">
      <div class="vpp-title">
        <small>VIRTUAL POWER PLANT · AGGREGATION OS</small>
        <h2>VPP 虚拟电厂聚合运营工作台</h2>
        <p>将分散资源组织成可预测、可响应、可交易、可核算的园区调节能力。</p>
      </div>
      <div class="readiness-dial" :style="{ '--readiness': `${vpp.readiness * 3.6}deg` }">
        <div><strong>{{ vpp.readiness }}</strong><span>VPP 就绪度</span></div>
      </div>
    </header>

    <div class="vpp-metrics">
      <MetricCard v-for="item in vpp.metrics" :key="item.id" :metric="item" />
    </div>

    <nav class="vpp-chain" aria-label="VPP 全流程工作区">
      <button
        v-for="(stage, index) in vpp.stages"
        :key="stage.id"
        class="vpp-stage"
        :class="[`tone-${stage.tone}`, { 'is-active': activeStageId === stage.id }]"
        :data-vpp-stage="stage.id"
        @click="activeStageId = stage.id"
      >
        <span>0{{ index + 1 }}</span>
        <div><small>{{ stage.eyebrow }}</small><strong>{{ stage.label }}</strong><em>{{ stage.status }}</em></div>
      </button>
    </nav>

    <div class="vpp-detail-grid">
      <TechPanel :title="activeStage.label" :eyebrow="activeStage.eyebrow">
        <div class="stage-detail" data-testid="vpp-stage-detail">
          <div class="stage-thesis" :class="`tone-${activeStage.tone}`">
            <div><small>{{ activeStage.headlineLabel }}</small><strong>{{ activeStage.headlineValue }}</strong></div>
            <p>{{ activeStage.summary }}</p>
          </div>
          <div class="stage-table">
            <article v-for="row in activeStage.rows" :key="row.label">
              <div><strong>{{ row.label }}</strong><small>{{ row.detail }}</small></div>
              <b>{{ row.value }}</b>
              <span>{{ row.status }}</span>
            </article>
          </div>
          <div class="stage-action"><small>当前下一步</small><strong>{{ activeStage.action }}</strong></div>
        </div>
      </TechPanel>

      <TechPanel title="VPP 运行边界" eyebrow="CONTROL BOUNDARY">
        <div class="boundary-stack">
          <article><span class="tone-green">可用</span><strong>50MW 可调资源</strong><p>来自工业柔性负荷与充电设施，仍需履约演练确认。</p></article>
          <article><span class="tone-orange">推演</span><strong>交易与收益策略</strong><p>当前数值用于产品演示和项目论证，不代替市场申报。</p></article>
          <article><span class="tone-pink">不可调度</span><strong>100MW / 200MWh 储能</strong><p>储能尚在规划阶段，不计入当前实际可用容量。</p></article>
        </div>
      </TechPanel>
    </div>
  </section>
</template>

<style scoped>
.vpp-workbench { display: grid; gap: 14px; }
.vpp-command { min-height: 126px; display: grid; grid-template-columns: 1fr 112px; align-items: center; gap: 24px; padding: 18px 22px; position: relative; overflow: hidden; border: 1px solid rgba(0,229,255,.3); background: radial-gradient(circle at 77% 50%, rgba(0,229,255,.12), transparent 23%), linear-gradient(105deg, rgba(13,54,96,.92), rgba(5,24,51,.96)); }
.vpp-command::after { content: 'VPP'; position: absolute; right: 152px; top: -30px; color: rgba(0,229,255,.035); font: 900 142px/1 var(--font-data); letter-spacing: -9px; pointer-events: none; }
.vpp-title { position: relative; z-index: 1; }
.vpp-title small { color: var(--energy-cyan); font: 10px var(--font-data); letter-spacing: 2.2px; }
.vpp-title h2 { margin: 6px 0; color: white; font-size: 25px; letter-spacing: .6px; text-shadow: 0 0 16px rgba(0,229,255,.3); }
.vpp-title p { max-width: 850px; margin: 0; color: #93bacd; font-size: 14px; line-height: 1.6; }
.readiness-dial { width: 98px; height: 98px; display: grid; place-items: center; position: relative; z-index: 1; border-radius: 50%; background: conic-gradient(var(--energy-cyan) 0 var(--readiness), rgba(0,229,255,.1) var(--readiness)); box-shadow: 0 0 22px rgba(0,229,255,.2); }
.readiness-dial::after { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: #082345; border: 1px solid rgba(0,229,255,.18); }
.readiness-dial div { position: relative; z-index: 1; text-align: center; }
.readiness-dial strong, .readiness-dial span { display: block; }
.readiness-dial strong { color: white; font: 800 28px var(--font-data); }
.readiness-dial span { margin-top: 2px; color: #7fa9bc; font-size: 10px; }
.vpp-metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.vpp-chain { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); position: relative; border: 1px solid rgba(0,229,255,.18); background: rgba(5,25,52,.78); }
.vpp-chain::before { content: ''; position: absolute; left: 8%; right: 8%; top: 50%; height: 1px; background: linear-gradient(90deg, var(--energy-cyan), var(--success-green), var(--opportunity-orange)); box-shadow: 0 0 9px rgba(0,229,255,.3); }
.vpp-stage { min-width: 0; min-height: 78px; display: grid; grid-template-columns: 31px 1fr; gap: 8px; align-items: center; padding: 10px 11px; position: relative; z-index: 1; border: 0; border-right: 1px solid rgba(0,229,255,.1); background: rgba(5,24,50,.9); color: #789eb2; text-align: left; cursor: pointer; }
.vpp-stage:last-child { border-right: 0; }
.vpp-stage > span { width: 29px; height: 29px; display: grid; place-items: center; border: 1px solid currentColor; border-radius: 50%; background: #092444; color: currentColor; font: 700 10px var(--font-data); }
.vpp-stage small, .vpp-stage strong, .vpp-stage em { display: block; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vpp-stage small { color: #577f97; font: 8px var(--font-data); letter-spacing: .7px; }
.vpp-stage strong { margin-top: 4px; color: #a9c7d5; font-size: 13px; }
.vpp-stage em { margin-top: 3px; color: currentColor; font-size: 10px; font-style: normal; }
.vpp-stage:hover, .vpp-stage.is-active { background: linear-gradient(180deg, color-mix(in srgb, currentColor 12%, #0a2a50), #071b36); }
.vpp-stage.is-active { box-shadow: inset 0 -2px currentColor; }
.vpp-stage.is-active strong { color: white; }
.vpp-detail-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(330px, .55fr); gap: 14px; }
.stage-detail { display: grid; gap: 13px; }
.stage-thesis { min-height: 88px; display: grid; grid-template-columns: 180px 1fr; gap: 18px; align-items: center; padding: 14px; border-left: 2px solid currentColor; background: linear-gradient(90deg, color-mix(in srgb, currentColor 8%, transparent), transparent); }
.stage-thesis small, .stage-thesis strong { display: block; }
.stage-thesis small { color: #7199ad; }
.stage-thesis strong { margin-top: 5px; color: currentColor; font: 800 27px var(--font-data); text-shadow: 0 0 12px color-mix(in srgb, currentColor 35%, transparent); }
.stage-thesis p { margin: 0; color: #a1c0ce; line-height: 1.7; }
.stage-table { display: grid; border-top: 1px solid rgba(0,229,255,.12); }
.stage-table article { min-height: 68px; display: grid; grid-template-columns: 1fr 160px 100px; gap: 14px; align-items: center; padding: 10px 12px; border-bottom: 1px solid rgba(0,229,255,.1); }
.stage-table article > div strong, .stage-table article > div small { display: block; }
.stage-table article > div strong { color: white; font-size: 14px; }
.stage-table article > div small { margin-top: 4px; color: #7198ab; }
.stage-table article > b { color: var(--energy-cyan); font: 700 15px var(--font-data); }
.stage-table article > span { padding: 4px 7px; border: 1px solid rgba(0,229,255,.2); color: #8db4c6; font-size: 10px; text-align: center; }
.stage-action { display: grid; grid-template-columns: 110px 1fr; gap: 12px; padding: 12px 14px; background: rgba(123,216,119,.06); border: 1px solid rgba(123,216,119,.2); }
.stage-action small { color: var(--success-green); }
.stage-action strong { color: #c3d9e2; font-size: 13px; font-weight: 600; line-height: 1.55; }
.boundary-stack { display: grid; gap: 10px; }
.boundary-stack article { padding: 13px; border-left: 2px solid rgba(0,229,255,.25); background: rgba(4,20,43,.48); }
.boundary-stack span, .boundary-stack strong { display: block; }
.boundary-stack span { font: 10px var(--font-data); letter-spacing: 1px; }
.boundary-stack strong { margin: 5px 0; color: white; font-size: 14px; }
.boundary-stack p { margin: 0; color: #7fa4b6; line-height: 1.55; }
@media (max-width: 1280px) { .vpp-detail-grid { grid-template-columns: 1fr; }.vpp-chain { grid-template-columns: repeat(3, 1fr); }.vpp-chain::before { display: none; }.vpp-stage:nth-child(3) { border-right: 0; } }
</style>
