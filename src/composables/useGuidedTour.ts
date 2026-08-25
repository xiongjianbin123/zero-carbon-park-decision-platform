import { computed, ref } from 'vue'
import { parkConfig } from '@/config/park'

const active = ref(false)
const currentIndex = ref(0)
const currentStop = computed(() => parkConfig.tour[currentIndex.value])
const total = computed(() => parkConfig.tour.length)

export function useGuidedTour() {
  function syncRoute(path: string) {
    const index = parkConfig.tour.findIndex((stop) => stop.route === path)
    if (index >= 0) currentIndex.value = index
  }

  function start(path: string) {
    syncRoute(path)
    active.value = true
  }

  function next() {
    currentIndex.value = Math.min(currentIndex.value + 1, parkConfig.tour.length - 1)
  }

  function previous() {
    currentIndex.value = Math.max(currentIndex.value - 1, 0)
  }

  function stop() {
    active.value = false
  }

  return { active, currentIndex, currentStop, total, start, next, previous, stop, syncRoute }
}
