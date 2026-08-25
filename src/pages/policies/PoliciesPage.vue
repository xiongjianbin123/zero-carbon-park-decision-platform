<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import ApplicationBenchmarkView from '@/components/policies/ApplicationBenchmarkView.vue'
import PolicyLibraryView from '@/components/policies/PolicyLibraryView.vue'
import PolicyRadarView from '@/components/policies/PolicyRadarView.vue'
import ShanxiEnergyView from '@/components/policies/ShanxiEnergyView.vue'
import { policyViewMetrics } from '@/config/policyViews'

type PolicyView = 'library' | 'benchmark' | 'shanxi' | 'radar'
interface PolicyViewOption { id: PolicyView; label: string; title: string; subtitle: string; component: typeof PolicyLibraryView }

const activeView = ref<PolicyView>('library')
const views: PolicyViewOption[] = [
  { id: 'library', label: '政策知识库', title: '政策知识与申报中枢', subtitle: 'POLICY INTELLIGENCE & APPLICATION', component: PolicyLibraryView },
  { id: 'benchmark', label: '申报对标', title: '国家级零碳园区申报对标', subtitle: 'APPLICATION READINESS & GAP', component: ApplicationBenchmarkView },
  { id: 'shanxi', label: '山西能源专题', title: '山西能源与园区转型专题', subtitle: 'SHANXI ENERGY TRANSITION', component: ShanxiEnergyView },
  { id: 'radar', label: '政策更新雷达', title: '政策更新雷达', subtitle: 'POLICY UPDATE & IMPACT', component: PolicyRadarView },
]
const current = computed(() => views.find((item) => item.id === activeView.value)!)
const metrics = computed(() => policyViewMetrics[activeView.value])
</script>

<template>
  <div class="page policies-page" data-page="policies">
    <PageHeading index="04" :title="current.title" :subtitle="current.subtitle">
      <nav class="view-tabs" aria-label="政策中心视图">
        <button v-for="item in views" :key="item.id" class="data-button" :class="{ 'is-active': activeView === item.id }" :data-policy-view="item.label" @click="activeView = item.id">{{ item.label }}</button>
      </nav>
    </PageHeading>

    <div class="metrics-grid view-metrics">
      <article v-for="item in metrics" :key="item.label" class="view-metric" :class="`tone-${item.tone}`">
        <span>{{ item.label }}</span><div><strong>{{ item.value }}</strong><b>{{ item.unit }}</b></div><small v-if="item.note">{{ item.note }}</small>
      </article>
    </div>

    <div class="policy-operation-bridge"><span>政策目标最终需要项目建设和运行绩效共同支撑。</span><RouterLink data-testid="policy-operation-link" to="/operations">查看能源运行绩效入口 →</RouterLink></div>

    <div data-testid="policy-view"><component :is="current.component" /></div>
  </div>
</template>

<style scoped>
.view-tabs { display: flex; gap: 7px; }.view-tabs button { min-height: 38px; padding: 0 13px; white-space: nowrap; font-size: 13px; }.view-metric { min-height: 89px; position: relative; overflow: hidden; padding: 12px 15px; border: 1px solid var(--panel-border); background: linear-gradient(145deg, rgba(18,47,91,.72), rgba(7,25,52,.88)); }.view-metric::before { content: ''; position: absolute; inset: 0 auto 0 0; width: 2px; background: currentColor; box-shadow: 0 0 9px currentColor; }.view-metric > span { color: #8db1c4; font-size: 13px; }.view-metric > div { display: flex; align-items: baseline; gap: 6px; margin-top: 7px; }.view-metric strong { color: currentColor; font: 800 27px/1 var(--font-data); text-shadow: 0 0 10px color-mix(in srgb, currentColor 35%, transparent); }.view-metric b { color: #9bbdce; font-size: 12px; }.view-metric small { position: absolute; right: 13px; bottom: 12px; color: #7098ad; font-size: 11px; }
.policy-operation-bridge { min-height: 38px; display: flex; align-items: center; justify-content: flex-end; gap: 14px; padding: 7px 11px; border: 1px solid rgba(123,216,119,.16); background: rgba(123,216,119,.04); color: #789dac; }.policy-operation-bridge a { color: var(--success-green); text-decoration: none; white-space: nowrap; }
@media (max-width: 1280px) { .page-heading { align-items: flex-start; }.view-tabs { flex-wrap: wrap; justify-content: flex-end; max-width: 570px; } }
</style>
