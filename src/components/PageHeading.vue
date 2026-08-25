<script setup lang="ts">
defineProps<{ index: string; title: string; subtitle: string; conclusion?: string }>()
</script>

<template>
  <header class="page-heading">
    <div class="page-index"><span>{{ index }}</span></div>
    <div class="page-title-group">
      <p class="page-eyebrow">{{ subtitle }}</p>
      <h1>{{ title }}</h1>
      <p v-if="conclusion" class="page-conclusion">{{ conclusion }}</p>
    </div>
    <div class="heading-actions"><slot /></div>
  </header>
</template>
