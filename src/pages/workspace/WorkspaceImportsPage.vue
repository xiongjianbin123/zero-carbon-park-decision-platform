<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ImportPreviewTable from '@/components/workspace/ImportPreviewTable.vue'
import { parseImportFile } from '@/services/importWorkbook'
import { workspaceApi } from '@/services/workspaceApi'
import { useWorkspaceState } from '@/stores/workspace'
import type { ImportBatch, ImportKind, ImportPreview } from '@/types/workspace'

const state = useWorkspaceState()
const templates: { kind: ImportKind; title: string; file: string; detail: string }[] = [
  { kind: 'energy_monthly', title: '月度能源账单', file: 'monthly-energy.xlsx', detail: '用电、电费、绿电、燃气与热力' },
  { kind: 'load_curve', title: '时序负荷曲线', file: 'load-curve.xlsx', detail: '15 / 30 / 60 分钟负荷与源储功率' },
  { kind: 'enterprises', title: '园区企业清单', file: 'enterprises.xlsx', detail: '企业行业、产值与年度能耗' },
  { kind: 'projects', title: '建设项目清单', file: 'projects.xlsx', detail: '投资、容量、工期与预期减排' },
]
const batches = ref<ImportBatch[]>([])
const kind = ref<ImportKind>('energy_monthly')
const file = ref<File | null>(null)
const preview = ref<ImportPreview | null>(null)
const busy = ref(false)
const message = ref('')
const replaceId = ref<string | undefined>()
const canSubmit = computed(() => Boolean(file.value && preview.value?.normalizedRows.length && !preview.value.rowErrors.length && !busy.value))
const canWrite = computed(() => state.selectedPark.value?.role !== 'viewer')
const kindLabel = (value: ImportKind) => templates.find((item) => item.kind === value)?.title ?? value

async function load() {
  if (!state.selectedParkId.value) return
  try { batches.value = await workspaceApi.listImports(state.selectedParkId.value) } catch (error) { message.value = (error as Error).message }
}

async function chooseFile(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0] ?? null
  file.value = selected; preview.value = null; replaceId.value = undefined; message.value = ''
  if (!selected) return
  busy.value = true
  try { preview.value = await parseImportFile(selected, kind.value) } catch (error) { message.value = (error as Error).message }
  finally { busy.value = false }
}

async function submit() {
  const parkId = state.selectedParkId.value
  if (!parkId || !file.value || !canSubmit.value) return
  busy.value = true; message.value = ''
  try {
    const batch = await workspaceApi.uploadImport(parkId, kind.value, file.value, replaceId.value)
    message.value = `已导入 ${batch.acceptedRows} 行，数据基准已更新。`
    file.value = null; preview.value = null; replaceId.value = undefined
    await load()
  } catch (error) {
    const apiError = error as Error & { code?: string }
    if (apiError.code === 'DUPLICATE_IMPORT') {
      replaceId.value = batches.value.find((item) => item.kind === kind.value && item.filename === file.value?.name && item.status === 'succeeded')?.id
      message.value = replaceId.value ? '相同文件已导入。再次提交将替换原批次。' : apiError.message
    } else message.value = apiError.message
  } finally { busy.value = false }
}

watch(() => state.selectedParkId.value, () => { file.value = null; preview.value = null; void load() })
onMounted(load)
</script>

<template>
  <div class="workspace-page imports-page">
    <header class="page-title"><div><p>DATA INTAKE / 数据入口</p><h1>园区数据导入</h1><span>下载固定模板，提交前先在浏览器校验，确认无误后写入项目基线。</span></div><RouterLink to="/workspace/diagnosis">进入指标诊断</RouterLink></header>
    <section class="template-strip" aria-label="固定导入模板"><a v-for="item in templates" :key="item.kind" data-testid="template-download" :href="`/templates/${item.file}`" download><i>{{ item.kind === 'load_curve' ? '15m' : 'XLSX' }}</i><span><strong>{{ item.title }}</strong><small>{{ item.detail }}</small></span><b>下载模板 ↓</b></a></section>
    <form v-if="canWrite" class="import-console" @submit.prevent="submit">
      <label><span>数据类型</span><select v-model="kind" @change="file = null; preview = null; replaceId = undefined"><option v-for="item in templates" :key="item.kind" :value="item.kind">{{ item.title }}</option></select></label>
      <label class="file-pick"><span>选择已填写文件</span><input type="file" accept=".xlsx,.csv" @change="chooseFile"><small>仅 XLSX / CSV，单文件不超过 10MB。</small></label>
      <button type="submit" :disabled="!canSubmit">{{ busy ? '正在处理…' : replaceId ? '确认替换原批次' : '确认导入项目基线' }}</button>
    </form><p v-else class="message">当前角色为只读成员，可查看模板与历史批次，不能提交导入。</p>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <ImportPreviewTable v-if="preview" :preview="preview" />
    <section class="history"><header><h2>导入批次</h2><span>{{ batches.length }} 批</span></header><div class="history-row" v-for="batch in batches" :key="batch.id"><strong>{{ kindLabel(batch.kind) }}</strong><span>{{ batch.filename }}</span><span>{{ batch.acceptedRows }} 行</span><span>{{ batch.periodEnd || '无期间' }}</span><b :class="batch.status">{{ batch.status === 'succeeded' ? '已生效' : batch.status === 'replaced' ? '已替换' : batch.status }}</b></div><p v-if="!batches.length">尚未导入真实园区数据。</p></section>
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.page-title a{flex:none;padding:8px 11px;border:1px solid rgba(0,229,255,.32);color:var(--energy-cyan);text-decoration:none}.template-strip{display:grid;grid-template-columns:1fr 1fr;gap:8px}.template-strip a{min-width:0;display:grid;grid-template-columns:42px 1fr auto;align-items:center;gap:11px;padding:12px;border:1px solid rgba(0,229,255,.16);color:inherit;background:rgba(7,27,57,.76);text-decoration:none}.template-strip i{display:grid;place-items:center;width:40px;height:36px;border:1px solid rgba(0,229,255,.35);color:var(--energy-cyan);font:10px var(--font-data);font-style:normal}.template-strip span{min-width:0;display:grid}.template-strip strong{color:var(--heading-white)}.template-strip small{overflow:hidden;color:#698fa9;text-overflow:ellipsis;white-space:nowrap}.template-strip b{color:var(--energy-cyan);font-size:11px}.import-console{display:grid;grid-template-columns:220px 1fr auto;align-items:end;gap:12px;padding:15px;border:1px solid rgba(0,229,255,.2);background:linear-gradient(120deg,rgba(12,40,80,.75),rgba(6,22,48,.86))}.import-console label{display:grid;gap:6px}.import-console label>span{color:#83abc3;font-size:12px}.import-console select,.import-console input{min-height:40px;border:1px solid rgba(0,229,255,.24);padding:0 10px;color:var(--heading-white);background:#061a38}.file-pick small{color:#5e87a2}.import-console button{min-height:40px;padding:0 16px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800}.import-console button:disabled{opacity:.35;cursor:not-allowed}.message{margin:0;padding:9px 12px;border-left:2px solid var(--opportunity-orange);color:#f6c66b;background:rgba(245,166,35,.06)}.history{border:1px solid rgba(0,229,255,.14)}.history>header{display:flex;justify-content:space-between;padding:11px 14px;border-bottom:1px solid rgba(0,229,255,.1)}.history h2{margin:0;color:var(--heading-white);font-size:15px}.history>header span,.history>p{color:#6f97b1}.history>p{padding:10px 14px}.history-row{display:grid;grid-template-columns:150px minmax(150px,1fr) 80px 120px 70px;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(0,229,255,.07);color:#83a8bf;font-size:12px}.history-row strong{color:#d2e5ef}.history-row b{color:var(--opportunity-orange)}.history-row .succeeded{color:var(--success-green)}@media(max-width:850px){.template-strip{grid-template-columns:1fr}.import-console{grid-template-columns:1fr}.history-row{grid-template-columns:1fr 1fr}.history-row span:nth-of-type(1){grid-column:1/-1}}@media(max-width:520px){.page-title{align-items:flex-start;flex-direction:column}.template-strip a{grid-template-columns:38px 1fr}.template-strip b{grid-column:2}.history-row{grid-template-columns:1fr}}
</style>
