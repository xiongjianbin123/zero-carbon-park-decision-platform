<script setup lang="ts">
import { parkConfig } from '@/config/park'
import GuidedTourBar from './GuidedTourBar.vue'

const navItems = [
  { label: '园区驾驶舱', path: '/dashboard', icon: '◈' },
  { label: '零碳建设路径', path: '/roadmap', icon: '⌁' },
  { label: '全过程项目地图', path: '/projects', icon: '◇' },
  { label: '政策与申报', path: '/policies', icon: '▤' },
  { label: '投资与资金', path: '/investment', icon: '◉' },
  { label: '能源运营', path: '/operations', icon: '⌬' },
  { label: '智能问数', path: '/qa', icon: '✦' },
]
</script>

<template>
  <header class="app-header">
    <div class="brand-block">
      <div class="brand-mark" aria-hidden="true"><span>零</span></div>
      <div>
        <strong>{{ parkConfig.meta.platformName }}</strong>
        <small>ZERO-CARBON PARK DECISION OS</small>
      </div>
    </div>
    <nav class="primary-nav" data-testid="primary-nav" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.path" :to="item.path">
        <span aria-hidden="true">{{ item.icon }}</span>{{ item.label }}
      </RouterLink>
    </nav>
    <div class="park-meta">
      <div><strong>{{ parkConfig.meta.parkName }}</strong><small>{{ parkConfig.meta.region }}</small></div>
      <span class="demo-badge">{{ parkConfig.meta.demoLabel }}</span>
      <GuidedTourBar />
    </div>
  </header>
</template>
