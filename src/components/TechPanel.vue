<script setup lang="ts">
withDefaults(defineProps<{ title: string; eyebrow?: string; className?: string }>(), {
  eyebrow: '',
  className: '',
})
</script>

<template>
  <section class="tech-panel" :class="className">
    <div class="energy-line" aria-hidden="true" />
    <header class="panel-heading">
      <div><small v-if="eyebrow">{{ eyebrow }}</small><h2>{{ title }}</h2></div>
      <slot name="action" />
    </header>
    <div class="panel-content"><slot /></div>
  </section>
</template>
