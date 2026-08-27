<script setup lang="ts">
import { ref, watch } from 'vue'
import type { TaskActivity, TaskEvidenceFile, WorkspaceTask } from '@/types/workspace'

const props = defineProps<{ task: WorkspaceTask; files: TaskEvidenceFile[]; activity: TaskActivity[]; busy?: boolean; writable?: boolean }>()
const emit = defineEmits<{ close: []; saveReviewNote: [note: string]; download: [file: TaskEvidenceFile] }>()
const note = ref(props.task.reviewNote)
watch(() => props.task.id, () => { note.value = props.task.reviewNote })

const actionLabels: Record<string, string> = { 'task.create': '创建任务', 'task.update': '更新任务', 'file.upload': '上传佐证' }
function sizeLabel(size: number) { return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB` }
</script>

<template>
  <Teleport to="body">
  <div data-testid="task-detail-portal" class="drawer-backdrop" @click.self="emit('close')">
    <aside class="task-drawer" role="dialog" aria-modal="true" aria-label="任务详情">
      <header><div><p>{{ task.taskType }}</p><h2>{{ task.title }}</h2><span>{{ task.ownerName }} · {{ task.plannedDate }}</span></div><button aria-label="关闭任务详情" @click="emit('close')">×</button></header>
      <section><div class="section-heading"><h3>佐证材料</h3><b>{{ files.length }}</b></div><button v-for="file in files" :key="file.id" class="file-row" @click="emit('download', file)"><span><strong>{{ file.filename }}</strong><small>{{ sizeLabel(file.size) }} · {{ file.uploadedAt.slice(0, 10) }}</small></span><em>下载</em></button><p v-if="!files.length" class="empty">尚未上传佐证材料。</p></section>
      <section><div class="section-heading"><h3>审核备注</h3></div><textarea v-model="note" aria-label="审核备注" maxlength="2000" placeholder="记录复核结论、材料缺口或完成依据"></textarea><button v-if="writable" data-testid="save-review-note" class="primary" :disabled="busy" @click="emit('saveReviewNote', note.trim())">保存审核备注</button></section>
      <section><div class="section-heading"><h3>操作记录</h3><b>{{ activity.length }}</b></div><ol class="activity"><li v-for="item in activity" :key="item.id"><i /><div><strong>{{ actionLabels[item.action] || item.action }}</strong><span>{{ item.createdAt.replace('T', ' ').slice(0, 16) }}</span></div></li></ol><p v-if="!activity.length" class="empty">暂无操作记录。</p></section>
    </aside>
  </div>
  </Teleport>
</template>

<style scoped>
.drawer-backdrop{position:fixed;z-index:80;inset:0;display:flex;justify-content:flex-end;background:rgba(1,8,22,.68);backdrop-filter:blur(3px)}.task-drawer{width:min(520px,92vw);height:100%;overflow:auto;padding:22px;display:grid;align-content:start;gap:18px;border-left:1px solid rgba(0,229,255,.35);background:linear-gradient(160deg,#0b2a54,#06152f 62%);box-shadow:-18px 0 55px rgba(0,0,0,.4)}header{display:flex;justify-content:space-between;gap:20px;padding-bottom:16px;border-bottom:1px dashed rgba(0,229,255,.22)}header p{margin:0;color:var(--market-purple);font:11px var(--font-data);letter-spacing:1.3px}header h2{margin:5px 0;color:var(--heading-white);font-size:23px}header span{color:#7da5bf;font-size:12px}header button{align-self:flex-start;width:34px;height:34px;border:1px solid rgba(0,229,255,.25);color:var(--heading-white);background:rgba(0,229,255,.04);font-size:22px}section{display:grid;gap:8px}.section-heading{display:flex;align-items:center;justify-content:space-between}.section-heading h3{margin:0;color:var(--heading-white);font-size:15px}.section-heading b{color:var(--energy-cyan);font:700 15px var(--font-data)}.file-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px;border:1px solid rgba(0,229,255,.14);color:inherit;background:rgba(0,229,255,.035);text-align:left}.file-row span{display:grid;gap:3px;min-width:0}.file-row strong{overflow:hidden;color:#dceef7;text-overflow:ellipsis;white-space:nowrap}.file-row small{color:#6f96b0}.file-row em{color:var(--energy-cyan);font-size:12px;font-style:normal}textarea{min-height:104px;resize:vertical;padding:10px;border:1px solid rgba(0,229,255,.2);color:var(--heading-white);background:#061a38;line-height:1.65}.primary{justify-self:start;min-height:36px;padding:0 13px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800}.activity{display:grid;gap:0;margin:0;padding:0;list-style:none}.activity li{display:grid;grid-template-columns:14px 1fr;gap:9px;min-height:44px}.activity i{width:7px;height:7px;margin-top:6px;border-radius:50%;background:var(--energy-cyan);box-shadow:0 0 9px rgba(0,229,255,.55)}.activity div{display:flex;justify-content:space-between;gap:10px;border-bottom:1px solid rgba(0,229,255,.08)}.activity strong{color:#cce3ef;font-size:13px}.activity span{color:#648da8;font:10px var(--font-data)}.empty{margin:0;padding:12px;border:1px dashed rgba(0,229,255,.16);color:#6f96b0;font-size:12px;text-align:center}@media(max-width:600px){.drawer-backdrop{position:fixed;align-items:flex-end}.task-drawer{width:100vw;height:88vh;padding:18px;border-top:1px solid rgba(0,229,255,.35);border-left:0}.activity div{display:grid}.file-row strong{white-space:normal}}@media(prefers-reduced-motion:reduce){.drawer-backdrop{backdrop-filter:none}}
</style>
