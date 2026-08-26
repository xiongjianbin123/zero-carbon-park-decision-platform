<script setup lang="ts">
import type { ImportPreview } from '@/types/workspace'

defineProps<{ preview: ImportPreview }>()
</script>

<template>
  <section class="preview-panel" aria-label="导入校验结果">
    <header><div><span>浏览器校验结果</span><strong>{{ preview.normalizedRows.length }} 行数据</strong></div><b :class="{ error: preview.rowErrors.length }">{{ preview.rowErrors.length ? `${preview.rowErrors.length} 项错误` : '可以提交' }}</b></header>
    <div v-if="preview.rowErrors.length" class="error-list">
      <p v-for="item in preview.rowErrors.slice(0, 12)" :key="`${item.row}-${item.field}-${item.code}`">第 {{ item.row }} 行 · {{ item.message }}</p>
    </div>
    <div v-else class="table-scroll">
      <table><thead><tr><th v-for="header in preview.headers" :key="header">{{ header }}</th></tr></thead>
        <tbody><tr v-for="(row, index) in preview.normalizedRows.slice(0, 5)" :key="index"><td v-for="header in preview.headers" :key="header">{{ Object.values(row)[preview.headers.indexOf(header)] ?? '—' }}</td></tr></tbody>
      </table>
      <p v-if="preview.normalizedRows.length > 5" class="preview-note">仅显示前 5 行；提交时将处理全部数据。</p>
    </div>
  </section>
</template>

<style scoped>
.preview-panel{border:1px solid rgba(0,229,255,.22);background:rgba(4,18,42,.72)}header{display:flex;justify-content:space-between;gap:16px;padding:13px 15px;border-bottom:1px solid rgba(0,229,255,.12)}header div{display:grid;gap:3px}header span{color:#759db7;font-size:12px}header strong{color:var(--heading-white)}header b{align-self:center;color:var(--success-green);font-size:12px}.error{color:var(--risk-pink)!important}.error-list{padding:10px 15px;color:#ff9ebb}.error-list p{margin:5px 0}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;white-space:nowrap}th,td{padding:9px 12px;border-bottom:1px solid rgba(0,229,255,.08);text-align:left;font-size:12px}th{color:var(--energy-cyan);background:rgba(0,229,255,.04)}td{color:#a8c5d8}.preview-note{margin:0;padding:9px 12px;color:#6f97b2;font-size:12px}
</style>
