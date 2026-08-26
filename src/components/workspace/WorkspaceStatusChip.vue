<script setup lang="ts">
defineProps<{ tone?: 'cyan' | 'green' | 'yellow' | 'red' | 'purple'; label: string }>()
</script>

<template><span class="workspace-chip" :class="`is-${tone || 'cyan'}`">{{ label }}</span></template>

<style scoped>
.workspace-chip { display: inline-flex; align-items: center; min-height: 24px; padding: 2px 8px; border: 1px solid currentColor; border-radius: 2px; background: color-mix(in srgb, currentColor 8%, transparent); font: 600 12px/1 var(--font-display); white-space: nowrap; }
.is-cyan { color: var(--energy-cyan); }.is-green { color: var(--success-green); }.is-yellow { color: var(--opportunity-orange); }.is-red { color: var(--risk-pink); }.is-purple { color: var(--market-purple); }
</style>

