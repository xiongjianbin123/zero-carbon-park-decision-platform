<script setup lang="ts">
import type { ExportPreview } from '@/types/workspace'

defineProps<{ preview: ExportPreview }>()
</script>

<template>
  <section class="deliverable-preview" aria-label="成果预览">
    <header><span>成果快照预览</span><strong>{{ preview.recordCount }} 条记录</strong></header>
    <dl><div><dt>园区</dt><dd>{{ preview.snapshot.park?.name || '—' }}</dd></div><div><dt>数据基准日</dt><dd>{{ preview.snapshot.dataBaselineDate || '尚未形成' }}</dd></div><div><dt>指标版本</dt><dd>{{ preview.snapshot.indicatorVersion || '尚未形成' }}</dd></div><div><dt>生成时间</dt><dd>{{ preview.snapshot.generatedAt || '—' }}</dd></div></dl>
    <p v-if="preview.snapshot.missingData?.length">数据缺口：{{ preview.snapshot.missingData.join('、') }}</p>
  </section>
</template>

<style scoped>
.deliverable-preview{padding:15px;border:1px solid rgba(0,229,255,.28);background:rgba(3,18,42,.88)}header{display:flex;justify-content:space-between;padding-bottom:11px;border-bottom:1px solid rgba(0,229,255,.12)}header span{color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.2px}header strong{color:var(--heading-white)}dl{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0 0}dl div{padding:9px;background:rgba(0,229,255,.035)}dt{color:#648da8;font-size:11px}dd{margin:4px 0 0;color:#b6cede;font-size:13px}p{margin:10px 0 0;color:var(--opportunity-orange);font-size:12px}@media(max-width:680px){dl{grid-template-columns:1fr 1fr}}
</style>
