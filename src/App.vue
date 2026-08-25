<script setup lang="ts">
import AppShell from '@/app/AppShell.vue'
import { parkConfig } from '@/config/park'
import { validateParkConfig } from '@/utils/parkValidation'

const configErrors = validateParkConfig(parkConfig)
</script>

<template>
  <AppShell v-if="configErrors.length === 0" />
  <main v-else class="config-error">
    <span>CONFIGURATION ERROR</span><h1>统一配置校验失败</h1><p>请修正以下字段后重新启动：</p><ul><li v-for="error in configErrors" :key="error">{{ error }}</li></ul>
  </main>
</template>

<style scoped>
.config-error { min-height: 100vh; padding: 10vh 12vw; background: #061229; color: #b8d4f0; }.config-error span { color: #ff6b9d; font-family: var(--font-data); }.config-error h1 { color: white; }.config-error li { margin: 8px 0; color: #f5a623; }
</style>
