<script setup lang="ts">
import MetricCard from '@/components/MetricCard.vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import { parkConfig } from '@/config/park'

const overview = parkConfig.overview
</script>

<template>
  <div class="page dashboard-page" data-page="dashboard">
    <PageHeading index="01" title="园区零碳综合态势" subtitle="ZERO-CARBON OPERATION COCKPIT" conclusion="把能源底数、建设机会、投资约束和减排目标放在同一张决策图上。">
      <div class="baseline"><span class="status-dot tone-green" /> 数据基准日 {{ parkConfig.meta.baselineDate }}</div>
    </PageHeading>

    <div class="metrics-grid">
      <MetricCard v-for="item in overview.metrics.slice(0, 4)" :key="item.id" :metric="item" />
    </div>

    <RouterLink class="vpp-entry" data-testid="dashboard-vpp-link" to="/operations/vpp">
      <div class="vpp-entry-mark"><span>VPP</span><strong>聚合运营</strong></div>
      <div class="vpp-entry-copy"><small>VIRTUAL POWER PLANT</small><strong>虚拟电厂运营工作台</strong><p>从资源聚合、负荷预测到交易、执行与结算，统一管理园区调节能力。</p></div>
      <div class="vpp-entry-data"><span><b>50</b>MW<small>当前可调</small></span><span><b>{{ parkConfig.operations.vpp.readiness }}</b>%<small>VPP 就绪度</small></span></div>
      <div class="vpp-entry-action">进入 VPP 工作台 <span>→</span></div>
    </RouterLink>

    <div class="dashboard-main">
      <TechPanel title="园区零碳转型关系图" eyebrow="ENERGY · CARBON · CAPITAL" class-name="hub-panel">
        <div class="hub-field" aria-label="园区零碳转型关系：光伏、储能、绿电、能效和碳管理围绕园区决策中枢协同">
          <svg viewBox="0 0 700 330" preserveAspectRatio="none" aria-hidden="true">
            <defs><linearGradient id="energyBeam"><stop stop-color="#00e5ff" stop-opacity="0"/><stop offset=".5" stop-color="#00e5ff"/><stop offset="1" stop-color="#00e5ff" stop-opacity="0"/></linearGradient></defs>
            <ellipse cx="350" cy="165" rx="260" ry="118" />
            <path d="M350 165 L105 62 M350 165 L595 62 M350 165 L75 258 M350 165 L625 258 M350 165 L350 306" />
          </svg>
          <div class="hub-core"><span>ZERO</span><strong>园区决策中枢</strong><small>源 · 网 · 荷 · 储 · 碳</small></div>
          <article v-for="(node, index) in overview.hubNodes" :key="node.id" class="hub-node" :class="[`node-${index + 1}`, `tone-${node.tone}`]">
            <i>{{ node.icon }}</i><div><strong>{{ node.value }}</strong><span>{{ node.label }}</span></div>
          </article>
        </div>
      </TechPanel>

      <TechPanel title="风险与机会信号" eyebrow="EXECUTIVE SIGNALS">
        <div class="signal-list">
          <article v-for="(signal, index) in overview.signals" :key="signal.id" :class="`tone-${signal.tone}`">
            <div class="signal-index">0{{ index + 1 }}</div>
            <div><span>{{ signal.category === 'risk' ? '重点风险' : signal.category === 'opportunity' ? '政策机会' : '预期成果' }}</span><strong>{{ signal.title }}</strong><p>{{ signal.detail }}</p></div>
          </article>
        </div>
        <div class="decision-pulse">
          <div class="pulse-ring"><strong>71</strong><span>转型准备度</span></div>
          <div><small>下一决策窗口</small><strong>储能接入专题会</strong><span>建议 10 个工作日内召开</span></div>
        </div>
      </TechPanel>
    </div>

    <div class="dashboard-strip">
      <TechPanel title="2026—2030 建设推进线" eyebrow="PROGRAM MOMENTUM">
        <div class="momentum-line">
          <div v-for="year in parkConfig.roadmap.years" :key="year.year" :class="`state-${year.status}`"><b>{{ year.year }}</b><span>{{ year.title }}</span></div>
        </div>
      </TechPanel>
      <TechPanel title="领导本周关注" eyebrow="THIS WEEK">
        <div class="focus-row"><span class="tone-pink">01 接入</span><span class="tone-orange">02 资金</span><span class="tone-cyan">03 申报</span><strong>三项任务需要跨部门联动</strong><RouterLink data-testid="dashboard-operation-link" to="/operations">进入能源运营 →</RouterLink></div>
      </TechPanel>
    </div>
  </div>
</template>

<style scoped>
.baseline { color: #89b2c9; font-family: var(--font-data); font-size: 12px; display: flex; align-items: center; gap: 7px; }
.dashboard-main { display: grid; grid-template-columns: minmax(0, 1.62fr) minmax(390px, .88fr); gap: 14px; }
.vpp-entry { min-height: 102px; display: grid; grid-template-columns: 105px minmax(330px, 1fr) auto 190px; gap: 18px; align-items: center; padding: 13px 16px; position: relative; overflow: hidden; color: inherit; text-decoration: none; border: 1px solid rgba(0,229,255,.3); background: radial-gradient(circle at 8% 50%, rgba(0,229,255,.14), transparent 18%), linear-gradient(100deg, rgba(10,52,89,.86), rgba(5,25,53,.92)); box-shadow: inset 0 0 28px rgba(0,229,255,.025); }
.vpp-entry::after { content: ''; position: absolute; left: 5%; right: 5%; bottom: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--energy-cyan), transparent); box-shadow: 0 0 10px var(--energy-cyan); }
.vpp-entry:hover { border-color: rgba(0,229,255,.65); background: radial-gradient(circle at 8% 50%, rgba(0,229,255,.2), transparent 20%), linear-gradient(100deg, rgba(10,58,98,.94), rgba(5,28,58,.96)); }
.vpp-entry-mark { width: 82px; height: 62px; display: grid; place-content: center; text-align: center; position: relative; color: var(--energy-cyan); border: 1px solid rgba(0,229,255,.55); background: rgba(0,229,255,.055); clip-path: polygon(13% 0, 100% 0, 87% 100%, 0 100%); }
.vpp-entry-mark span { font: 900 22px var(--font-data); letter-spacing: 2px; }.vpp-entry-mark strong { margin-top: 3px; color: white; font-size: 10px; }
.vpp-entry-copy small, .vpp-entry-copy strong { display: block; }.vpp-entry-copy small { color: var(--energy-cyan); font: 9px var(--font-data); letter-spacing: 1.8px; }.vpp-entry-copy strong { margin-top: 4px; color: white; font-size: 17px; }.vpp-entry-copy p { margin: 5px 0 0; color: #82aabd; font-size: 12px; }
.vpp-entry-data { display: flex; gap: 22px; }.vpp-entry-data > span { min-width: 84px; color: #8db1c2; font: 12px var(--font-data); }.vpp-entry-data b { margin-right: 3px; color: var(--success-green); font-size: 25px; }.vpp-entry-data small { display: block; margin-top: 3px; color: #688fa4; font-family: var(--font-display); }
.vpp-entry-action { justify-self: end; padding: 10px 12px; color: var(--energy-cyan); border-left: 1px solid rgba(0,229,255,.22); font-weight: 700; white-space: nowrap; }.vpp-entry-action span { margin-left: 7px; font-size: 18px; }
.hub-field { min-height: 325px; position: relative; overflow: hidden; background: radial-gradient(circle at center, rgba(0, 189, 229, .18), transparent 48%); }
.hub-field svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hub-field ellipse { fill: none; stroke: rgba(0, 229, 255, .18); stroke-width: 1; stroke-dasharray: 7 7; }
.hub-field path { fill: none; stroke: url(#energyBeam); stroke-width: 1.2; }
.hub-core { position: absolute; left: 50%; top: 49%; transform: translate(-50%, -50%); width: 156px; height: 156px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; background: radial-gradient(circle, #13809f, #0a365d 62%, #071d3c); border: 1px solid var(--energy-cyan); box-shadow: 0 0 0 12px rgba(0, 229, 255, .04), 0 0 36px rgba(0, 229, 255, .25); }
.hub-core::after { content: ''; position: absolute; inset: -16px; border: 1px dashed rgba(0, 229, 255, .25); border-radius: 50%; }
.hub-core span { color: var(--energy-cyan); font: 11px var(--font-data); letter-spacing: 4px; }
.hub-core strong { margin: 7px 0; font-size: 18px; }
.hub-core small { color: #9cc8da; }
.hub-node { position: absolute; display: flex; align-items: center; gap: 10px; min-width: 155px; }
.hub-node i { width: 48px; height: 48px; display: grid; place-items: center; font-style: normal; font-weight: 800; border-radius: 50%; border: 1px solid currentColor; background: #0a3358; box-shadow: 0 0 14px color-mix(in srgb, currentColor 25%, transparent); }
.hub-node strong, .hub-node span { display: block; }
.hub-node strong { font: 700 18px var(--font-data); color: currentColor; }
.hub-node span { color: #8eb5ca; margin-top: 3px; }
.node-1 { left: 3%; top: 7%; } .node-2 { right: 2%; top: 7%; } .node-3 { left: 1%; bottom: 11%; } .node-4 { right: 1%; bottom: 11%; } .node-5 { left: calc(50% - 75px); bottom: 0; }
.signal-list { display: grid; gap: 9px; }
.signal-list article { display: grid; grid-template-columns: 37px 1fr; gap: 9px; padding: 11px 10px; border-left: 2px solid currentColor; background: linear-gradient(90deg, color-mix(in srgb, currentColor 8%, transparent), transparent); }
.signal-index { color: currentColor; font: 700 14px var(--font-data); }
.signal-list span, .signal-list strong { display: block; }
.signal-list span { color: currentColor; font-size: 11px; }
.signal-list strong { color: var(--heading-white); font-size: 15px; margin-top: 2px; }
.signal-list p { margin: 4px 0 0; color: #83a9bd; line-height: 1.45; }
.decision-pulse { display: flex; align-items: center; gap: 18px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed rgba(0, 229, 255, .18); }
.pulse-ring { width: 85px; height: 85px; flex: none; border-radius: 50%; display: grid; place-content: center; text-align: center; background: conic-gradient(var(--energy-cyan) 0 71%, rgba(0,229,255,.1) 71%); position: relative; }
.pulse-ring::after { content: ''; position: absolute; inset: 7px; border-radius: 50%; background: var(--deep-sea); }
.pulse-ring strong, .pulse-ring span { position: relative; z-index: 1; }
.pulse-ring strong { color: var(--energy-cyan); font: 800 25px var(--font-data); }
.pulse-ring span { font-size: 10px; color: #85aec4; }
.decision-pulse > div:last-child { display: grid; gap: 5px; }
.decision-pulse small { color: var(--opportunity-orange); }.decision-pulse strong { color: white; font-size: 16px; }.decision-pulse span { color: #789fb6; }
.dashboard-strip { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; }
.dashboard-strip :deep(.panel-heading) { min-height: 45px; padding: 8px 14px; }.dashboard-strip :deep(.panel-content) { padding: 11px 15px; }
.momentum-line { display: flex; justify-content: space-between; position: relative; }.momentum-line::before { content: ''; position: absolute; left: 5%; right: 5%; top: 11px; height: 1px; background: linear-gradient(90deg, var(--success-green), var(--energy-cyan) 28%, #28597a 28%); }
.momentum-line div { text-align: center; position: relative; z-index: 1; }.momentum-line b { display: block; color: white; font: 13px var(--font-data); }.momentum-line span { color: #789db4; font-size: 12px; }.momentum-line .state-active b { color: var(--energy-cyan); }.momentum-line .state-completed b { color: var(--success-green); }
.focus-row { min-height: 34px; display: flex; gap: 14px; align-items: center; }.focus-row span { font: 700 12px var(--font-data); }.focus-row strong { color: white; margin-left: auto; }
.focus-row a { color: var(--energy-cyan); text-decoration: none; white-space: nowrap; }
@media (max-width: 1280px) { .vpp-entry { grid-template-columns: 90px 1fr auto; }.vpp-entry-data { display: none; } }
@media (max-width: 1100px) { .dashboard-main, .dashboard-strip { grid-template-columns: 1fr; }.vpp-entry { grid-template-columns: 82px 1fr; }.vpp-entry-action { grid-column: 2; justify-self: start; padding-left: 0; border-left: 0; } }
</style>
