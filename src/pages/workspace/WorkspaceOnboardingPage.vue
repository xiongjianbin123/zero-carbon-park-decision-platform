<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useWorkspaceState } from '@/stores/workspace'

const state = useWorkspaceState()
const saving = ref(false)
const message = ref('')
const form = reactive({ name: '', region: '山西省', parkType: '资源型工业园区', leadingIndustries: '', baselineYear: 2025, targetYear: 2030, applicationDirection: '国家级零碳园区' })

async function save() {
  saving.value = true; message.value = ''
  try {
    const park = await state.addPark({
      name: form.name.trim(), region: form.region.trim(), parkType: form.parkType.trim(),
      leadingIndustries: form.leadingIndustries.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
      baselineYear: Number(form.baselineYear), targetYear: Number(form.targetYear), applicationDirection: form.applicationDirection.trim(),
    })
    message.value = `已建立“${park.name}”空数据基线。`
  } catch (error) { message.value = (error as Error).message }
  finally { saving.value = false }
}
</script>

<template>
  <div class="workspace-page onboarding-page">
    <header class="workspace-heading"><p>PARK PROFILE / 园区档案</p><h1>建立真实项目基线</h1><span>只填写项目身份与年份，不导入示范数据。</span></header>
    <div v-if="state.auth.value?.orgRole !== 'org_admin'" class="permission-note">只有组织管理员可以创建园区。您仍可查看已分配项目。</div>
    <form v-else class="park-form" @submit.prevent="save">
      <label class="wide"><span>园区名称</span><input name="name" v-model="form.name" required maxlength="120" placeholder="例如：晋北新材料零碳园区"></label>
      <label><span>所在地区</span><input name="region" v-model="form.region" required maxlength="120"></label>
      <label><span>园区类型</span><input name="parkType" v-model="form.parkType" required maxlength="80"></label>
      <label class="wide"><span>主导产业</span><input name="leadingIndustries" v-model="form.leadingIndustries" required placeholder="用顿号或逗号分隔"></label>
      <label><span>基准年</span><input name="baselineYear" v-model="form.baselineYear" type="number" min="2000" max="2100" required></label>
      <label><span>目标年</span><input name="targetYear" v-model="form.targetYear" type="number" min="2000" max="2100" required></label>
      <label class="wide"><span>申报方向</span><input name="applicationDirection" v-model="form.applicationDirection" required maxlength="120"></label>
      <div class="form-actions wide"><p v-if="message" aria-live="polite">{{ message }}</p><button type="submit" :disabled="saving">{{ saving ? '正在建立…' : '建立空数据基线' }}</button></div>
    </form>
  </div>
</template>

<style scoped>
.onboarding-page { display:grid; gap:14px; }.workspace-heading { padding:12px 2px 14px; border-bottom:1px dashed rgba(0,229,255,.2); }.workspace-heading p { margin:0 0 4px; color:var(--energy-cyan); font:11px var(--font-data); letter-spacing:1.8px; }.workspace-heading h1 { margin:0; color:var(--heading-white); font-size:clamp(24px,2.2vw,32px); }.workspace-heading span { display:block; margin-top:6px; color:#83a9c2; }.park-form { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:20px; border:1px solid rgba(0,229,255,.2); background:linear-gradient(150deg,rgba(12,40,80,.78),rgba(7,23,50,.9)); }.park-form label { display:grid; gap:7px; }.park-form label>span { color:#8eb2c8; font-size:13px; }.park-form input { width:100%; min-height:42px; border:1px solid rgba(0,229,255,.22); padding:0 12px; color:var(--heading-white); background:rgba(2,13,32,.58); font-size:15px; }.park-form input:focus { border-color:var(--energy-cyan); box-shadow:0 0 0 3px rgba(0,229,255,.08); }.wide { grid-column:1/-1; }.form-actions { min-height:50px; display:flex; align-items:center; justify-content:flex-end; gap:18px; border-top:1px solid rgba(0,229,255,.1); padding-top:14px; }.form-actions p { margin:0 auto 0 0; color:var(--success-green); }.form-actions button { min-height:42px; padding:0 18px; border:1px solid var(--energy-cyan); color:#031322; background:var(--energy-cyan); font-weight:800; cursor:pointer; }.form-actions button:disabled{opacity:.6;cursor:wait}.permission-note{padding:22px;border:1px solid rgba(245,166,35,.4);color:var(--opportunity-orange);background:rgba(245,166,35,.07)}
@media(max-width:680px){.park-form{grid-template-columns:1fr;padding:15px}.wide{grid-column:1}.form-actions{align-items:stretch;flex-direction:column}.form-actions button{width:100%}}
</style>

