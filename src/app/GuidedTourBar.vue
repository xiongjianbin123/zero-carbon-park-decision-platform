<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGuidedTour } from '@/composables/useGuidedTour'

const route = useRoute()
const router = useRouter()
const tour = useGuidedTour()

watch(() => route.path, (path) => tour.syncRoute(path), { immediate: true })

function startTour() {
  tour.start(route.path)
}

async function move(direction: 'next' | 'previous') {
  tour[direction]()
  await router.push(tour.currentStop.value.route)
}
</script>

<template>
  <button v-if="!tour.active.value" class="tour-launch" data-testid="tour-start" @click="startTour"><span>▶</span><strong>开始引导汇报</strong><small>{{ tour.total.value }} 页园区汇报路径</small></button>
  <aside v-else class="tour-bar" aria-label="引导式汇报控制条">
    <div class="tour-progress"><strong>{{ String(tour.currentIndex.value + 1).padStart(2, '0') }} / {{ String(tour.total.value).padStart(2, '0') }}</strong><span>GUIDED BRIEFING</span></div>
    <div class="tour-copy"><small>{{ tour.currentStop.value.page }}</small><strong>{{ tour.currentStop.value.conclusion }}</strong><div><span v-for="point in tour.currentStop.value.talkingPoints" :key="point">{{ point }}</span></div></div>
    <div class="tour-actions"><button :disabled="tour.currentIndex.value === 0" @click="move('previous')">上一页</button><button data-testid="tour-next" :disabled="tour.currentIndex.value === tour.total.value - 1" @click="move('next')">下一页</button><button class="tour-stop" @click="tour.stop">退出汇报</button></div>
  </aside>
</template>

<style scoped>
.tour-launch { position: static; min-width: 132px; height: 46px; padding: 6px 9px; display: grid; grid-template-columns: 27px 1fr; gap: 1px 7px; text-align: left; cursor: pointer; color: var(--energy-cyan); border: 1px solid rgba(0,229,255,.5); background: linear-gradient(135deg, rgba(7,60,96,.96), rgba(5,24,51,.96)); box-shadow: 0 0 16px rgba(0,229,255,.1); }.tour-launch > span { grid-row: 1 / 3; align-self: center; width: 27px; height: 27px; display: grid; place-items: center; border-radius: 50%; background: rgba(0,229,255,.13); }.tour-launch strong { color: white; font-size: 12px; white-space: nowrap; }.tour-launch small { color: #789fb7; font-size: 9px; white-space: nowrap; }.tour-bar { position: fixed; z-index: 55; left: 22px; right: 22px; bottom: 18px; min-height: 112px; display: grid; grid-template-columns: 120px 1fr auto; gap: 18px; align-items: center; padding: 15px 18px; border: 1px solid rgba(0,229,255,.55); background: linear-gradient(100deg, rgba(5,25,54,.98), rgba(9,54,91,.98), rgba(5,25,54,.98)); box-shadow: 0 20px 45px rgba(0,0,0,.5), 0 0 25px rgba(0,229,255,.13); }.tour-bar::before { content: ''; position: absolute; top: 0; left: 12%; right: 12%; height: 1px; background: linear-gradient(90deg, transparent, var(--energy-cyan), transparent); box-shadow: 0 0 8px var(--energy-cyan); }.tour-progress { height: 70px; display: grid; align-content: center; border-right: 1px solid rgba(0,229,255,.2); }.tour-progress strong { color: var(--energy-cyan); font: 800 22px var(--font-data); }.tour-progress span { color: #6d95ad; font: 9px var(--font-data); letter-spacing: 1px; }.tour-copy small { color: var(--opportunity-orange); }.tour-copy > strong { display: block; color: white; font-size: 16px; margin: 5px 0 7px; }.tour-copy div { display: flex; flex-wrap: wrap; gap: 7px; }.tour-copy div span { color: #82a9bd; font-size: 12px; }.tour-copy div span::before { content: '◆'; color: var(--energy-cyan); font-size: 7px; margin-right: 5px; }.tour-actions { display: flex; gap: 7px; }.tour-actions button { padding: 8px 11px; cursor: pointer; border: 1px solid rgba(0,229,255,.3); color: #b3d2df; background: rgba(0,229,255,.06); }.tour-actions button:disabled { cursor: not-allowed; opacity: .35; }.tour-actions .tour-stop { border-color: rgba(255,107,157,.35); color: var(--risk-pink); background: rgba(255,107,157,.06); }
</style>
