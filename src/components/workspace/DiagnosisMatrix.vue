<script setup lang="ts">
import type { IndicatorResult } from '@/types/workspace'

withDefaults(defineProps<{ results: IndicatorResult[]; writable?: boolean }>(), { writable: true })
defineEmits<{ createTask: [indicator: IndicatorResult] }>()

const labels = { achieved: '已达标', gap: '有差距', missing_data: '缺少数据', not_applicable: '不适用' }
</script>

<template>
  <div class="matrix-scroll"><table class="diagnosis-matrix"><thead><tr><th>指标</th><th>当前值</th><th>目标值</th><th>诊断状态</th><th>计算说明</th><th>动作</th></tr></thead>
    <tbody><tr v-for="item in results" :key="item.id"><td><strong>{{ item.title }}</strong><small>{{ item.key }}</small></td><td>{{ item.currentValue ?? '—' }} {{ item.currentValue === null ? '' : item.unit }}</td><td>{{ item.targetValue ?? '—' }} {{ item.targetValue === null ? '' : item.unit }}</td><td><span class="status" :class="item.status">{{ labels[item.status] }}</span></td><td class="note">{{ item.calculationNote }}</td><td><button v-if="writable && (item.status === 'gap' || item.status === 'missing_data')" :data-testid="`create-task-${item.id}`" @click="$emit('createTask', item)">转为任务</button><span v-else>—</span></td></tr></tbody>
  </table></div>
</template>

<style scoped>
.matrix-scroll{overflow:auto;border:1px solid rgba(0,229,255,.18);background:rgba(5,21,47,.78)}table{width:100%;min-width:920px;border-collapse:collapse}th,td{padding:11px 13px;border-bottom:1px solid rgba(0,229,255,.08);text-align:left;font-size:13px}th{color:#78a8c4;font-size:11px;letter-spacing:.7px;background:rgba(0,229,255,.035)}td{color:#a8c5d8}td strong{display:block;color:var(--heading-white)}td small{display:block;margin-top:3px;color:#557d98;font:10px var(--font-data)}.note{max-width:310px;line-height:1.5}.status{display:inline-flex;padding:3px 7px;border:1px solid currentColor;font-size:11px}.achieved{color:var(--success-green)}.gap{color:var(--opportunity-orange)}.missing_data{color:var(--risk-pink)}.not_applicable{color:#738da0}button{border:1px solid rgba(0,229,255,.4);padding:6px 9px;color:var(--energy-cyan);background:rgba(0,229,255,.07);cursor:pointer}
</style>
