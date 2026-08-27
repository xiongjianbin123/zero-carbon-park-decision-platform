<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkspaceState } from '@/stores/workspace'
import WorkspaceTopbar from './WorkspaceTopbar.vue'

const state = useWorkspaceState()
const route = useRoute()
const signInHref = `/signin-with-chatgpt?return_to=${encodeURIComponent('/#/workspace')}`
const isAnonymous = computed(() => state.error.value?.status === 401)
const isDenied = computed(() => state.error.value?.status === 403)
const isOnboarding = computed(() => route.name === 'workspace-onboarding' || route.path.endsWith('/onboarding'))

onMounted(() => { if (!state.initialized.value) void state.bootstrap() })
</script>

<template>
  <section class="workspace-shell">
    <div v-if="state.loading.value" class="workspace-gate" aria-live="polite"><span class="gate-signal" />正在读取项目工作台…</div>
    <div v-else-if="isAnonymous" class="workspace-gate is-sign-in">
      <p class="gate-kicker">PROJECT WORKSPACE</p><h1>登录后进入项目工作台</h1>
      <p>示范驾驶舱仍可自由浏览。真实园区、文件、诊断和任务仅向已准入成员开放。</p>
      <a data-testid="workspace-sign-in" class="workspace-primary-action" :href="signInHref">使用 ChatGPT 登录</a>
    </div>
    <div v-else-if="isDenied" class="workspace-gate is-denied">
      <p class="gate-kicker">ACCESS CONTROL</p><h1>当前账号尚未加入项目工作台</h1>
      <p>请联系组织管理员按登录邮箱邀请。登录只确认身份，不会自动授予园区权限。</p>
    </div>
    <div v-else-if="state.error.value" class="workspace-gate is-denied">
      <p class="gate-kicker">SERVICE STATUS</p><h1>项目工作台暂时不可用</h1><p>{{ state.error.value.message }}</p>
      <button class="workspace-secondary-action" @click="state.bootstrap">重新加载</button>
    </div>
    <template v-else-if="state.auth.value">
      <WorkspaceTopbar />
      <nav class="workspace-nav" aria-label="项目工作台导航">
        <RouterLink to="/workspace">项目总览</RouterLink><RouterLink to="/workspace/onboarding">园区建档</RouterLink><RouterLink to="/workspace/imports">数据导入</RouterLink><RouterLink to="/workspace/diagnosis">指标诊断</RouterLink><RouterLink to="/workspace/readiness">申报准备度</RouterLink><RouterLink to="/workspace/tasks">任务与佐证</RouterLink><RouterLink to="/workspace/deliverables">成果交付</RouterLink><RouterLink to="/workspace/members">项目成员</RouterLink>
      </nav>
      <div v-if="!state.parks.value.length && !isOnboarding" class="workspace-empty">
        <div><span>EMPTY BASELINE</span><h1>先建立第一个园区项目</h1><p>建档只创建空基线，不会复制示范园区的任何数字。</p></div>
        <RouterLink v-if="state.auth.value.orgRole === 'org_admin'" class="workspace-primary-action" to="/workspace/onboarding">开始园区建档</RouterLink>
      </div>
      <RouterView v-else />
    </template>
  </section>
</template>

<style scoped>
.workspace-shell { display: grid; gap: 12px; color: var(--info-text); font-size: 15px; }
.workspace-gate,.workspace-empty { min-height: 360px; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; padding: clamp(28px, 5vw, 72px); position: relative; overflow: hidden; border: 1px solid rgba(0,229,255,.26); background: linear-gradient(135deg, rgba(12,42,83,.88), rgba(5,18,41,.92)); }
.workspace-gate::after,.workspace-empty::after { content:''; position:absolute; width:280px; height:280px; right:-90px; top:20px; border:1px solid rgba(0,229,255,.13); transform:rotate(45deg); box-shadow:0 0 60px rgba(0,229,255,.06); }
.workspace-gate h1,.workspace-empty h1 { max-width: 760px; margin: 5px 0 8px; color: var(--heading-white); font-size: clamp(26px, 3vw, 40px); letter-spacing: .5px; }.workspace-gate p,.workspace-empty p { max-width: 680px; line-height: 1.75; }
.gate-kicker,.workspace-empty span { margin:0; color:var(--energy-cyan); font:11px var(--font-data); letter-spacing:2.5px; }.is-denied .gate-kicker { color:var(--opportunity-orange); }
.workspace-primary-action,.workspace-secondary-action { z-index:1; display:inline-flex; align-items:center; min-height:42px; margin-top:16px; padding:0 18px; border:1px solid var(--energy-cyan); color:#031322; background:var(--energy-cyan); font-weight:800; text-decoration:none; cursor:pointer; box-shadow:0 0 18px rgba(0,229,255,.2); }.workspace-secondary-action { color:var(--heading-white); background:rgba(0,229,255,.08); }
.workspace-nav { display:flex; min-height:42px; border:1px solid rgba(0,229,255,.15); background:rgba(6,24,52,.72); overflow-x:auto; }.workspace-nav a { display:flex; align-items:center; padding:0 18px; color:#7da7c2; text-decoration:none; font-size:14px; font-weight:700; white-space:nowrap; border-right:1px solid rgba(0,229,255,.09); }.workspace-nav a.router-link-exact-active { color:var(--heading-white); background:rgba(0,229,255,.09); box-shadow:inset 0 -2px var(--energy-cyan); }
.workspace-empty { min-height:300px; flex-direction:row; align-items:center; justify-content:space-between; gap:24px; }.workspace-empty .workspace-primary-action { flex:none; }
.gate-signal { width:9px; height:9px; margin-bottom:12px; border-radius:50%; background:var(--energy-cyan); box-shadow:0 0 14px var(--energy-cyan); animation:pulse 1.2s ease infinite; }
@keyframes pulse { 50% { opacity:.35; transform:scale(.75); } }
@media (max-width: 680px) { .workspace-empty { align-items:flex-start; flex-direction:column; }.workspace-gate,.workspace-empty { min-height:300px; padding:26px 20px; }.workspace-gate::after,.workspace-empty::after { opacity:.45; } }
</style>
