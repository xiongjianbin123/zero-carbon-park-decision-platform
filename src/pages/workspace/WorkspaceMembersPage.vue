<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { workspaceApi } from '@/services/workspaceApi'
import { useWorkspaceState } from '@/stores/workspace'
import type { ParkRole, WorkspaceMember } from '@/types/workspace'

const state = useWorkspaceState()
const members = ref<WorkspaceMember[]>([])
const busyId = ref('')
const message = ref('')
const canManage = computed(() => state.selectedPark.value?.role === 'admin')
const invite = reactive({ email: '', role: 'viewer' as ParkRole })
const roles: { value: ParkRole; label: string }[] = [
  { value: 'admin', label: '项目管理员' }, { value: 'manager', label: '项目经理' },
  { value: 'specialist', label: '专业人员' }, { value: 'viewer', label: '只读成员' },
]

async function load() {
  if (!state.selectedParkId.value) return
  message.value = ''
  try { members.value = await workspaceApi.listMembers(state.selectedParkId.value) }
  catch (error) { message.value = (error as Error).message }
}
async function inviteMember() {
  if (!state.selectedParkId.value) return
  busyId.value = 'invite'; message.value = ''
  try {
    members.value.push(await workspaceApi.inviteMember(state.selectedParkId.value, { ...invite }))
    invite.email = ''; invite.role = 'viewer'; message.value = '成员邀请已创建。'
  } catch (error) { message.value = (error as Error).message }
  finally { busyId.value = '' }
}
async function changeRole(member: WorkspaceMember, role: ParkRole) {
  if (!state.selectedParkId.value || role === member.role) return
  busyId.value = member.id; message.value = ''
  try { Object.assign(member, await workspaceApi.updateMember(state.selectedParkId.value, member.id, { role })); message.value = '成员角色已更新。' }
  catch (error) { message.value = (error as Error).message }
  finally { busyId.value = '' }
}
watch(() => state.selectedParkId.value, load)
onMounted(load)
</script>

<template>
  <div class="workspace-page members-page">
    <header class="page-title"><div><p>PROJECT TEAM / 协作权限</p><h1>项目成员</h1><span>按园区分配角色；登录身份与项目权限分别校验。</span></div></header>
    <form v-if="canManage" data-testid="invite-member" class="invite-panel" @submit.prevent="inviteMember">
      <label><span>成员邮箱</span><input v-model="invite.email" type="email" required placeholder="name@example.com"></label>
      <label><span>项目角色</span><select v-model="invite.role"><option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option></select></label>
      <button type="submit" :disabled="busyId === 'invite'">发送邀请</button>
    </form>
    <p v-if="message" class="message" aria-live="polite">{{ message }}</p>
    <section class="member-list" aria-label="项目成员列表">
      <article v-for="member in members" :key="member.id">
        <div class="member-mark">{{ member.email.slice(0, 1).toUpperCase() }}</div>
        <div><strong>{{ member.email }}</strong><span>{{ member.status === 'active' ? '已加入' : member.status === 'invited' ? '等待首次登录' : '已停用' }}</span></div>
        <select v-if="canManage" :data-testid="`member-role-${member.id}`" :value="member.role" :disabled="busyId === member.id" aria-label="调整成员角色" @change="changeRole(member, ($event.target as HTMLSelectElement).value as ParkRole)"><option v-for="role in roles" :key="role.value" :value="role.value">{{ role.label }}</option></select>
        <b v-else>{{ roles.find(role => role.value === member.role)?.label }}</b>
      </article>
      <p v-if="!members.length" class="empty">当前园区还没有成员记录。</p>
    </section>
  </div>
</template>

<style scoped>
.workspace-page{display:grid;gap:12px}.page-title{padding:12px 2px 14px;border-bottom:1px dashed rgba(0,229,255,.2)}.page-title p{margin:0 0 4px;color:var(--energy-cyan);font:11px var(--font-data);letter-spacing:1.8px}.page-title h1{margin:0;color:var(--heading-white);font-size:clamp(24px,2.2vw,32px)}.page-title span{display:block;margin-top:6px;color:#83a9c2}.invite-panel{display:grid;grid-template-columns:minmax(260px,1fr) 210px auto;align-items:end;gap:10px;padding:14px;border:1px solid rgba(0,229,255,.18);background:rgba(7,28,59,.8)}label{display:grid;gap:5px}label span{color:#7ea5bd;font-size:11px}input,select{min-height:40px;border:1px solid rgba(0,229,255,.22);padding:0 10px;color:var(--heading-white);background:#061a38}.invite-panel button{min-height:40px;padding:0 16px;border:1px solid var(--energy-cyan);color:#031322;background:var(--energy-cyan);font-weight:800}.message{margin:0;padding:9px 12px;border-left:2px solid var(--success-green);color:#9be3bf;background:rgba(28,206,143,.06)}.member-list{display:grid;gap:7px}.member-list article{display:grid;grid-template-columns:42px minmax(220px,1fr) 210px;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(0,229,255,.15);background:linear-gradient(100deg,rgba(12,40,80,.72),rgba(6,22,48,.82))}.member-mark{width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(0,229,255,.45);color:var(--energy-cyan);font:800 14px var(--font-data);transform:rotate(45deg)}.member-list article>div:nth-child(2){display:grid;gap:3px}.member-list strong{color:var(--heading-white)}.member-list span{color:#739bb5;font-size:12px}.member-list b{justify-self:end;color:#9fc3d8;font-size:12px}.empty{margin:0;padding:24px;border:1px dashed rgba(0,229,255,.22);color:#789db5;text-align:center}@media(max-width:680px){.invite-panel,.member-list article{grid-template-columns:1fr}.member-mark{display:none}.member-list b{justify-self:start}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>
