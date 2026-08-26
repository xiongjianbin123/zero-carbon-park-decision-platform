<script setup lang="ts">
import { computed, ref } from 'vue'
import DeliverablePreview from '@/components/workspace/DeliverablePreview.vue'
import { workspaceApi } from '@/services/workspaceApi'
import { useWorkspaceState } from '@/stores/workspace'
import type { ExportPreview, ExportType, WorkspaceExport } from '@/types/workspace'

const state = useWorkspaceState()
const items: { type: ExportType; title: string; format: string; detail: string }[] = [
  { type: 'diagnosis_report', title: '园区指标诊断报告', format: '打印 / PDF', detail: '指标值、差距、缺数与计算依据' },
  { type: 'task_register', title: '建设与申报任务表', format: 'XLSX', detail: '责任人、计划日期、状态与佐证数量' },
  { type: 'project_investment', title: '项目投资清单', format: 'XLSX', detail: '项目投资、容量、工期与预期减排' },
  { type: 'evidence_catalog', title: '申报佐证材料目录', format: 'XLSX', detail: '文件归属、摘要校验与上传时间' },
]
const selected = ref<ExportType | null>(null)
const preview = ref<ExportPreview | null>(null)
const exported = ref<WorkspaceExport | null>(null)
const busy = ref(false)
const message = ref('')
const canWrite = computed(() => state.selectedPark.value?.role !== 'viewer')

async function previewItem(type: ExportType) {
  if (!state.selectedParkId.value) return
  busy.value = true; message.value = ''; selected.value = type; exported.value = null
  try { preview.value = await workspaceApi.previewExport(state.selectedParkId.value, type) } catch (error) { preview.value = null; message.value = (error as Error).message }
  finally { busy.value = false }
}
async function confirm() {
  if (!state.selectedParkId.value || !selected.value || !preview.value) return
  busy.value = true; message.value = ''
  try {
    const result = await workspaceApi.confirmExport(state.selectedParkId.value, selected.value)
    exported.value = result.export
    message.value = selected.value === 'diagnosis_report' ? '诊断报告快照已生成，可打印或另存为 PDF。' : '成果文件已生成，可下载。'
  } catch (error) { message.value = (error as Error).message } finally { busy.value = false }
}
function printReport() { window.print() }
async function downloadFile() {
  if (!state.selectedParkId.value || !exported.value) return
  busy.value = true; message.value = ''
  try {
    const file = await workspaceApi.downloadExport(state.selectedParkId.value, exported.value.id)
    const url = URL.createObjectURL(file.blob)
    const link = document.createElement('a')
    link.href = url; link.download = file.filename; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  } catch (error) { message.value = (error as Error).message } finally { busy.value = false }
}
</script>

<template>
  <div class="workspace-page deliverables-page"><header class="page-title"><div><p>PROJECT OUTPUT / 成果交付</p><h1>项目成果包</h1><span>先核对数据快照，再确认生成；每份成果保留数据基准与指标版本。</span></div></header>
    <section class="deliverable-grid"><article v-for="item in items" :key="item.type" data-testid="deliverable-card" :class="{ active: selected === item.type }"><header><span>{{ item.format }}</span><b>{{ item.type.split('_').map(part => part[0]).join('').toUpperCase() }}</b></header><h2>{{ item.title }}</h2><p>{{ item.detail }}</p><button @click="previewItem(item.type)" :disabled="busy">预览数据快照</button></article></section>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <section v-if="preview" class="confirm-panel"><DeliverablePreview :preview="preview" /><div class="confirm-actions"><span>{{ canWrite ? '预览无误后生成正式成果' : '当前为只读预览' }}</span><button v-if="canWrite && !exported" data-testid="confirm-export" @click="confirm" :disabled="busy">确认生成</button><button v-else-if="exported && selected === 'diagnosis_report'" @click="printReport">打印 / 另存为 PDF</button><button v-else-if="exported && state.selectedParkId.value" :data-download-url="workspaceApi.exportDownloadUrl(state.selectedParkId.value, exported.id)" @click="downloadFile" :disabled="busy">下载 XLSX</button></div></section>
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.deliverable-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.deliverable-grid article{min-height:166px;display:flex;flex-direction:column;padding:15px;border:1px solid rgba(0,229,255,.16);background:linear-gradient(145deg,rgba(12,40,80,.75),rgba(6,22,48,.87))}.deliverable-grid article.active{border-color:var(--energy-cyan);box-shadow:inset 2px 0 var(--energy-cyan)}article header{display:flex;justify-content:space-between}article header span{color:var(--market-purple);font:11px var(--font-data)}article header b{color:#476f8b;font:10px var(--font-data)}article h2{margin:11px 0 4px;color:var(--heading-white);font-size:18px}article p{margin:0;color:#769db6;font-size:13px}article button{align-self:flex-start;margin-top:auto;padding:7px 10px;border:1px solid rgba(0,229,255,.38);color:var(--energy-cyan);background:rgba(0,229,255,.06);cursor:pointer}.message{margin:0;padding:9px 12px;border-left:2px solid var(--success-green);color:#9be3bf;background:rgba(28,206,143,.06)}.confirm-panel{display:grid;gap:8px}.confirm-actions{display:flex;align-items:center;justify-content:flex-end;gap:14px}.confirm-actions span{margin-right:auto;color:#6f97b2;font-size:12px}.confirm-actions button,.confirm-actions a{min-height:38px;display:inline-flex;align-items:center;padding:0 15px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800;text-decoration:none}@media(max-width:680px){.deliverable-grid{grid-template-columns:1fr}.confirm-actions{align-items:stretch;flex-direction:column}.confirm-actions span{margin:0}.confirm-actions button,.confirm-actions a{justify-content:center}}@media print{.deliverable-grid,.message,.confirm-actions,.page-title p{display:none}.confirm-panel{display:block}}
</style>
