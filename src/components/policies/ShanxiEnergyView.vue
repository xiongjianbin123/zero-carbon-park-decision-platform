<script setup lang="ts">
import TechPanel from '@/components/TechPanel.vue'
import { shanxiPolicyLinks, shanxiScenes } from '@/config/policyViews'
</script>

<template>
  <div class="shanxi-view">
    <TechPanel title="能源转型重点场景" eyebrow="TRANSITION SCENARIOS">
      <div class="scene-list"><article v-for="item in shanxiScenes" :key="item.title" :class="`tone-${item.tone}`"><i>{{ item.icon }}</i><div><strong>{{ item.title }}</strong><p>{{ item.detail }}</p></div></article></div>
    </TechPanel>

    <TechPanel title="园区能源与市场场景图" eyebrow="ENERGY & MARKET TOPOLOGY">
      <div class="energy-map">
        <div class="supply-row">
          <article class="node tone-green"><span>风光</span><strong>周边风光基地</strong><small>绿电采购与直连资源</small></article>
          <article class="node tone-cyan"><span>PV</span><strong>园区分布式光伏</strong><small>62 MW 开发潜力</small></article>
          <article class="node tone-blue"><span>网</span><strong>大电网支撑</strong><small>安全保供与缺口补充</small></article>
          <article class="node tone-orange"><span>储</span><strong>共享储能</strong><small>100 MW / 200 MWh</small></article>
        </div>
        <div class="flow-lines" aria-hidden="true" />
        <div class="hub"><span>ZERO CARBON ENERGY HUB</span><strong>园区综合能源中枢</strong><small>能源流 · 数据流 · 碳流</small></div>
        <div class="load-row">
          <article><span>电</span><strong>工业负荷</strong><small>生产用能与柔性调节</small></article>
          <article><span>热</span><strong>余热与蒸汽</strong><small>能源梯级利用</small></article>
          <article><span>充</span><strong>交通与充换电</strong><small>光储充协同</small></article>
          <article class="vpp"><span>VPP</span><strong>虚拟电厂</strong><small>80 MW 可调节负荷</small></article>
        </div>
        <div class="market-row"><span>电力现货</span><span>辅助服务</span><span>需求响应</span><span>绿电与绿证</span><span>碳资产管理</span></div>
      </div>
    </TechPanel>

    <TechPanel title="山西政策与项目关联" eyebrow="POLICY TO PROJECT">
      <div class="policy-links"><article v-for="item in shanxiPolicyLinks" :key="item.tag"><span>{{ item.tag }}</span><h3>{{ item.title }}</h3><p>{{ item.detail }}</p><small>关联方向：{{ item.related }}</small><a :href="item.sourceUrl" target="_blank" rel="noreferrer">查看政策来源 ↗</a></article></div>
    </TechPanel>
  </div>
</template>

<style scoped>
.shanxi-view { display: grid; grid-template-columns: 275px minmax(580px, 1fr) 350px; gap: 14px; align-items: start; }.scene-list { display: grid; gap: 9px; }.scene-list article { min-height: 70px; display: grid; grid-template-columns: 46px 1fr; gap: 10px; align-items: center; padding: 10px; border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: linear-gradient(100deg, color-mix(in srgb, currentColor 8%, transparent), rgba(3,18,41,.25)); }.scene-list i { width: 40px; height: 40px; display: grid; place-items: center; color: currentColor; border: 1px solid currentColor; font-style: normal; font-weight: 800; box-shadow: inset 0 0 12px color-mix(in srgb, currentColor 13%, transparent); }.scene-list strong { color: white; font-size: 14px; }.scene-list p { margin: 5px 0 0; color: #739aaf; font-size: 12px; line-height: 1.4; }
.energy-map { min-height: 540px; position: relative; display: grid; align-content: space-between; gap: 25px; padding: 10px; background: radial-gradient(circle at center, rgba(0,229,255,.11), transparent 34%), linear-gradient(rgba(0,229,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.035) 1px, transparent 1px); background-size: auto, 30px 30px, 30px 30px; }.supply-row, .load-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; position: relative; z-index: 2; }.node, .load-row article { min-height: 90px; display: grid; align-content: center; justify-items: center; padding: 8px; text-align: center; border: 1px solid color-mix(in srgb, currentColor 30%, transparent); background: rgba(5,27,55,.9); }.node span, .load-row span { width: 28px; height: 28px; display: grid; place-items: center; margin-bottom: 5px; color: currentColor; border: 1px solid currentColor; font: 800 10px var(--font-data); }.node strong, .load-row strong { color: white; font-size: 13px; }.node small, .load-row small { margin-top: 5px; color: #759caf; font-size: 10px; }.flow-lines { position: absolute; inset: 96px 11% 155px; z-index: 0; border-left: 1px solid rgba(0,229,255,.22); border-right: 1px solid rgba(0,229,255,.22); }.flow-lines::before, .flow-lines::after { content: ''; position: absolute; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, var(--energy-cyan), transparent); }.flow-lines::before { top: 0; }.flow-lines::after { bottom: 0; }.hub { width: 250px; min-height: 112px; display: grid; place-content: center; justify-self: center; position: relative; z-index: 2; text-align: center; border: 1px solid var(--energy-cyan); background: radial-gradient(circle, rgba(12,104,135,.9), #09284c 72%); box-shadow: 0 0 0 8px rgba(0,229,255,.035), 0 0 25px rgba(0,229,255,.22); clip-path: polygon(12% 0, 88% 0, 100% 25%, 100% 75%, 88% 100%, 12% 100%, 0 75%, 0 25%); }.hub span { color: var(--energy-cyan); font: 9px var(--font-data); letter-spacing: 1px; }.hub strong { margin: 6px 0; color: white; font-size: 18px; }.hub small { color: #8fb7c9; }.load-row article { color: var(--electric-blue); }.load-row .vpp { color: var(--success-green); }.market-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 5px; position: relative; z-index: 2; }.market-row span { min-height: 35px; display: grid; place-items: center; color: var(--opportunity-orange); border: 1px solid rgba(245,166,35,.3); background: rgba(245,166,35,.06); font-size: 11px; }
.policy-links { display: grid; gap: 10px; }.policy-links article { padding: 12px; border: 1px solid rgba(0,229,255,.15); background: rgba(3,18,41,.38); }.policy-links > article > span { color: var(--energy-cyan); font-size: 11px; }.policy-links h3 { margin: 8px 0 6px; color: white; font-size: 14px; line-height: 1.45; }.policy-links p { color: #789fb4; font-size: 12px; line-height: 1.5; }.policy-links small { display: block; color: var(--opportunity-orange); font-size: 11px; }.policy-links a { min-height: 34px; display: grid; place-items: center; margin-top: 10px; color: var(--energy-cyan); border: 1px solid rgba(0,229,255,.3); background: rgba(0,229,255,.06); text-decoration: none; font-size: 12px; }
@media (max-width: 1350px) { .shanxi-view { grid-template-columns: 260px 1fr; }.shanxi-view > :last-child { grid-column: 1 / 3; } }
</style>
