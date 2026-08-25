<script setup lang="ts">
import TechPanel from '@/components/TechPanel.vue'
import { applicationGaps, applicationStages, benchmarkIndicators } from '@/config/policyViews'
</script>

<template>
  <div class="benchmark-view">
    <TechPanel title="申报推进阶段" eyebrow="APPLICATION PROCESS">
      <div class="stage-list">
        <article v-for="(stage, index) in applicationStages" :key="stage.id" class="stage" :class="`status-${stage.status}`">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div><strong>{{ stage.label }}<b v-if="stage.status !== 'pending'">{{ stage.status === 'done' ? '已完成' : '进行中' }}</b></strong><small>{{ stage.note }}</small></div>
        </article>
      </div>
    </TechPanel>

    <TechPanel title="国家试行指标对标" eyebrow="NATIONAL TRIAL INDICATORS">
      <div class="indicator-list">
        <article v-for="item in benchmarkIndicators" :key="item.id" class="indicator" :class="`status-${item.status}`">
          <header><strong>{{ item.label }}</strong><span>{{ item.kind }} · {{ item.target }}</span><b>{{ item.value }}</b></header>
          <div v-if="item.progress" class="scale"><i :style="{ width: `${item.progress}%` }" /><em :style="{ left: `${item.threshold}%` }" /></div>
          <div v-else class="pending-box">{{ item.note }}</div>
          <p v-if="item.progress">{{ item.note }}</p>
        </article>
      </div>
    </TechPanel>

    <TechPanel title="当前缺口与责任动作" eyebrow="GAPS & ACTIONS">
      <div class="gap-list">
        <article v-for="item in applicationGaps" :key="item.title" class="gap-card">
          <header><span>{{ item.priority }}</span><time>{{ item.due }}</time></header>
          <h3>{{ item.title }}</h3><p>{{ item.detail }}</p>
          <footer><span>责任单位</span><b>{{ item.owner }}</b></footer>
        </article>
      </div>
      <div class="actions"><button class="data-button">导出缺口清单</button><button class="primary">生成申报计划</button></div>
    </TechPanel>
  </div>
</template>

<style scoped>
.benchmark-view { display: grid; grid-template-columns: 270px minmax(500px, 1fr) 360px; gap: 14px; align-items: start; }
.stage-list { display: grid; }.stage { min-height: 74px; display: grid; grid-template-columns: 34px 1fr; gap: 9px; position: relative; }.stage:not(:last-child)::after { content: ''; position: absolute; left: 14px; top: 32px; bottom: 0; width: 1px; background: rgba(0,229,255,.18); }.stage > span { width: 29px; height: 29px; display: grid; place-items: center; z-index: 1; color: #638ca5; border: 1px solid rgba(0,229,255,.25); background: #071b38; font: 11px var(--font-data); }.stage.status-done > span { color: #052435; border-color: var(--success-green); background: var(--success-green); }.stage.status-active > span { color: #052435; border-color: var(--opportunity-orange); background: var(--opportunity-orange); box-shadow: 0 0 12px rgba(245,166,35,.25); }.stage strong, .stage small { display: block; }.stage strong { color: #d5e9f2; font-size: 14px; }.stage strong b { float: right; color: var(--success-green); font-size: 12px; }.stage.status-active strong b { color: var(--opportunity-orange); }.stage small { margin-top: 6px; color: #6d93a9; font-size: 12px; line-height: 1.4; }
.indicator-list { display: grid; gap: 10px; }.indicator { padding: 12px; border: 1px solid rgba(0,229,255,.13); background: rgba(3,18,41,.35); }.indicator header { display: grid; grid-template-columns: 1fr auto auto; gap: 12px; align-items: baseline; }.indicator strong { color: #d9ebf3; font-size: 14px; }.indicator header span { color: #7298af; font-size: 12px; }.indicator header b { min-width: 76px; color: var(--opportunity-orange); text-align: right; font: 800 19px var(--font-data); }.indicator.status-gap header b { color: var(--risk-pink); }.scale { height: 9px; position: relative; margin-top: 12px; background: rgba(76,121,148,.2); }.scale i { display: block; height: 100%; background: var(--risk-pink); box-shadow: 0 0 10px rgba(255,107,157,.45); }.scale em { position: absolute; top: -4px; bottom: -4px; width: 1px; background: var(--opportunity-orange); box-shadow: 0 0 8px var(--opportunity-orange); }.pending-box { min-height: 39px; display: grid; place-items: center; margin-top: 10px; color: #82a7bb; border: 1px dashed rgba(245,166,35,.32); background: rgba(245,166,35,.04); font-size: 12px; }.indicator p { margin: 8px 0 0; color: #7197ac; font-size: 12px; }
.gap-list { display: grid; gap: 9px; }.gap-card { padding: 12px; border: 1px solid rgba(245,166,35,.24); background: linear-gradient(100deg, rgba(245,166,35,.07), rgba(3,18,41,.3)); }.gap-card header, .gap-card footer { display: flex; justify-content: space-between; gap: 8px; }.gap-card header { color: var(--opportunity-orange); font: 11px var(--font-data); }.gap-card h3 { margin: 8px 0 6px; color: white; font-size: 14px; }.gap-card p { margin: 0; color: #7ea2b5; font-size: 12px; line-height: 1.5; }.gap-card footer { margin-top: 9px; padding-top: 8px; color: #7398ad; border-top: 1px solid rgba(0,229,255,.08); font-size: 11px; }.gap-card footer b { color: #b3cfda; }.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 11px; }.actions button { min-height: 39px; }.actions .primary { color: #052435; border: 1px solid var(--energy-cyan); background: var(--energy-cyan); font-weight: 800; }
@media (max-width: 1250px) { .benchmark-view { grid-template-columns: 250px minmax(430px, 1fr); }.benchmark-view > :last-child { grid-column: 1 / 3; } }
</style>
