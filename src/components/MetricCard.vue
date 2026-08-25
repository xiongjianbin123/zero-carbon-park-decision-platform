<script setup lang="ts">
import type { Metric } from '@/types/park'

defineProps<{ metric: Metric }>()
</script>

<template>
  <article class="metric-card" :class="`tone-${metric.tone}`">
    <div class="metric-label">{{ metric.label }}</div>
    <div class="metric-value"><strong>{{ metric.display }}</strong><span>{{ metric.unit }}</span></div>
    <p v-if="metric.note">{{ metric.note }}</p>
  </article>
</template>
