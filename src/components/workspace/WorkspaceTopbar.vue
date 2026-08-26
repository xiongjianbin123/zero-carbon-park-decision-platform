<script setup lang="ts">
import { computed } from 'vue'
import { useWorkspaceState } from '@/stores/workspace'
import WorkspaceStatusChip from './WorkspaceStatusChip.vue'

const state = useWorkspaceState()
const roleLabel = computed(() => ({ admin: '园区管理员', manager: '项目经理', specialist: '专业人员', viewer: '只读成员' }[state.selectedPark.value?.role || 'viewer']))
</script>

<template>
  <section class="baseline-track" aria-label="项目基线状态">
    <label class="park-picker">
      <span>当前园区</span>
      <select :value="state.selectedParkId.value || ''" @change="state.selectPark(($event.target as HTMLSelectElement).value)">
        <option v-if="!state.parks.value.length" value="">尚未建档</option>
        <option v-for="park in state.parks.value" :key="park.id" :value="park.id">{{ park.name }}</option>
      </select>
    </label>
    <div class="track-node"><span>数据基准日</span><strong>{{ state.selectedPark.value?.dataBaselineDate || '尚未形成' }}</strong></div>
    <div class="track-node"><span>资料完整度</span><strong class="cyan">待诊断</strong></div>
    <div class="track-node"><span>当前角色</span><WorkspaceStatusChip :label="roleLabel" :tone="state.selectedPark.value?.role === 'viewer' ? 'yellow' : 'cyan'" /></div>
  </section>
</template>

<style scoped>
.baseline-track { min-width: 0; display: grid; grid-template-columns: minmax(230px, 1.6fr) repeat(3, minmax(150px, .75fr)); border: 1px solid rgba(0,229,255,.24); background: linear-gradient(90deg, rgba(10,34,71,.94), rgba(8,26,57,.82)); box-shadow: inset 0 1px rgba(255,255,255,.025), 0 10px 28px rgba(0,0,0,.17); }
.park-picker,.track-node { min-width: 0; min-height: 66px; display: flex; flex-direction: column; justify-content: center; padding: 9px 15px; position: relative; border-right: 1px solid rgba(0,229,255,.12); }
.track-node::before { content: ''; position: absolute; left: -3px; top: 30px; width: 5px; height: 5px; border-radius: 50%; background: var(--energy-cyan); box-shadow: 0 0 9px var(--energy-cyan); }
.park-picker span,.track-node>span { margin-bottom: 5px; color: #709ab8; font: 11px var(--font-data); letter-spacing: 1px; }
.park-picker select { width: 100%; min-width: 0; border: 0; border-bottom: 1px solid rgba(0,229,255,.35); padding: 3px 24px 5px 0; color: var(--heading-white); background: transparent; font-size: 15px; font-weight: 700; text-overflow: ellipsis; }
.park-picker option { color: #10203a; }.track-node strong { overflow: hidden; color: var(--heading-white); font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }.track-node .cyan { color: var(--energy-cyan); }
@media (max-width: 900px) { .baseline-track { grid-template-columns: 1fr 1fr; }.park-picker,.track-node { border-bottom: 1px solid rgba(0,229,255,.1); }.track-node::before { display:none; } }
@media (max-width: 560px) { .baseline-track { grid-template-columns: 1fr; }.park-picker,.track-node { min-height: 58px; border-right: 0; } }
</style>

