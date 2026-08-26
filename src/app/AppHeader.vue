<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { parkConfig } from '@/config/park'
import GuidedTourBar from './GuidedTourBar.vue'

const route = useRoute()
const demoNavItems = [
  { label: '园区驾驶舱', path: '/dashboard', icon: '◈' },
  { label: '零碳建设路径', path: '/roadmap', icon: '⌁' },
  { label: '全过程项目地图', path: '/projects', icon: '◇' },
  { label: '政策与申报', path: '/policies', icon: '▤' },
  { label: '投资与资金', path: '/investment', icon: '◉' },
  { label: '能源运营', path: '/operations', icon: '⌬' },
  { label: '智能问数', path: '/qa', icon: '✦' },
]
const workspaceNavItems = [
  { label: '项目总览', path: '/workspace', icon: '◫' },
  { label: '园区建档', path: '/workspace/onboarding', icon: '◇' },
]
const isWorkspace = computed(() => route.path.startsWith('/workspace'))
const navItems = computed(() => isWorkspace.value ? workspaceNavItems : demoNavItems)
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
      <div class="mode-switch" aria-label="应用模式"><RouterLink to="/dashboard">示范驾驶舱</RouterLink><RouterLink to="/workspace">项目工作台</RouterLink></div>
      <div v-if="!isWorkspace"><strong>{{ parkConfig.meta.parkName }}</strong><small>{{ parkConfig.meta.region }}</small></div>
      <div v-else><strong>真实园区项目</strong><small>PROJECT DELIVERY WORKSPACE</small></div>
      <span class="demo-badge">{{ isWorkspace ? '项目数据' : parkConfig.meta.demoLabel }}</span>
      <GuidedTourBar v-if="!isWorkspace" />
    </div>
  </header>
</template>
