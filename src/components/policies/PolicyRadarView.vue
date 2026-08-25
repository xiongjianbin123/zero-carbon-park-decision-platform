<script setup lang="ts">
import TechPanel from '@/components/TechPanel.vue'
import { parkImpactCards, policyRadarEvents } from '@/config/policyViews'
</script>

<template>
  <div class="radar-view">
    <TechPanel title="政策动态时间轴" eyebrow="POLICY TIMELINE">
      <div class="timeline">
        <a v-for="event in policyRadarEvents" :key="event.date" :href="event.sourceUrl" target="_blank" rel="noreferrer" class="event" :class="`tone-${event.tone}`">
          <time>{{ event.date }}</time><div><h3>{{ event.title }}</h3><p>{{ event.detail }}</p></div><span>{{ event.impact }}</span>
        </a>
      </div>
    </TechPanel>
    <TechPanel title="对园区工作的影响" eyebrow="IMPACT ON THE PARK">
      <div class="impact-list">
        <article v-for="item in parkImpactCards" :key="item.title"><strong>{{ item.title }}</strong><p>{{ item.detail }}</p><span>关联：{{ item.related }}</span></article>
      </div>
      <div class="actions"><button class="data-button">生成影响清单</button><button class="primary">更新项目任务</button></div>
    </TechPanel>
  </div>
</template>

<style scoped>
.radar-view { display: grid; grid-template-columns: minmax(580px, 1.35fr) minmax(420px, .9fr); gap: 14px; align-items: start; }.timeline { display: grid; }.event { min-height: 107px; display: grid; grid-template-columns: 88px 1fr auto; gap: 13px; position: relative; padding: 14px 10px 14px 22px; color: inherit; text-decoration: none; border-bottom: 1px solid rgba(0,229,255,.1); }.event::before { content: ''; position: absolute; left: 5px; top: 20px; width: 8px; height: 8px; border-radius: 50%; background: currentColor; box-shadow: 0 0 9px currentColor; }.event time { color: currentColor; font: 12px var(--font-data); }.event h3 { margin: 0 0 7px; color: white; font-size: 15px; }.event p { margin: 0; color: #7fa2b5; font-size: 13px; line-height: 1.55; }.event > span { align-self: start; padding: 5px 7px; color: currentColor; border: 1px solid currentColor; font-size: 11px; }.impact-list { display: grid; gap: 10px; }.impact-list article { padding: 13px; border: 1px solid rgba(0,229,255,.14); background: rgba(3,18,41,.36); }.impact-list strong { color: white; font-size: 14px; }.impact-list p { color: #7fa2b4; font-size: 13px; line-height: 1.55; }.impact-list span { color: var(--opportunity-orange); font-size: 12px; }.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }.actions button { min-height: 40px; }.actions .primary { color: #052435; border: 1px solid var(--energy-cyan); background: var(--energy-cyan); font-weight: 800; }
@media (max-width: 1100px) { .radar-view { grid-template-columns: 1fr; } }
</style>
