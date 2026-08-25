<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '@/components/MetricCard.vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import { parkConfig } from '@/config/park'

const selectedProjectId = ref('storage-demo')
const selectedNodeId = ref('grid-access')
const selectedProject = computed(() => parkConfig.projects.items.find((item) => item.id === selectedProjectId.value)!)
const selectedNode = computed(() => selectedProject.value.nodes.find((node) => node.id === selectedNodeId.value) ?? selectedProject.value.nodes[0])

function selectProject(id: string, nodeId: string) {
  selectedProjectId.value = id
  selectedNodeId.value = nodeId
}
</script>

<template>
  <div class="page projects-page" data-page="projects">
    <PageHeading index="03" title="重点项目全过程地图" subtitle="PROJECT LIFECYCLE CONTROL" conclusion="把每个重点项目拆到审批节点、责任单位、材料证据和下一步动作。" />
    <div class="metrics-grid"><MetricCard v-for="item in parkConfig.projects.metrics" :key="item.id" :metric="item" /></div>
    <div class="project-layout">
      <TechPanel title="重点项目清单" eyebrow="PROJECT PORTFOLIO">
        <div class="project-list">
          <button v-for="item in parkConfig.projects.items" :key="item.id" class="project-card data-button" :class="[{ 'is-active': item.id === selectedProjectId }, `tone-${item.status === 'risk' ? 'pink' : 'cyan'}`]" @click="selectProject(item.id, item.currentNodeId)">
            <div><span>{{ item.category }}</span><strong>{{ item.name }}</strong></div><b>{{ item.progress }}%</b>
            <div class="project-progress"><i :style="{ width: `${item.progress}%` }" /></div><small>{{ item.investment.toFixed(1) }} 亿元 · 当前 {{ item.nodes.find((node) => node.id === item.currentNodeId)?.label }}</small>
          </button>
        </div>
      </TechPanel>
      <div class="project-center">
        <TechPanel :title="`${selectedProject.name} · 全过程节点`" eyebrow="16-STAGE DELIVERY MAP">
          <div class="lifecycle-grid">
            <button v-for="(node, index) in selectedProject.nodes" :key="node.id" class="life-node" :class="[{ 'is-active': node.id === selectedNode.id }, `state-${node.status}`]" :data-node-id="node.id" @click="selectedNodeId = node.id">
              <span>{{ String(index + 1).padStart(2, '0') }}</span><i>{{ node.status === 'completed' ? '✓' : node.status === 'risk' ? '!' : '◆' }}</i><strong>{{ node.label }}</strong>
            </button>
          </div>
        </TechPanel>
        <TechPanel title="当前节点证据卡" eyebrow="ACCOUNTABILITY & EVIDENCE">
          <div class="node-evidence">
            <div class="node-hero"><span :class="`state-${selectedNode.status}`">{{ selectedNode.status === 'completed' ? '已完成' : selectedNode.status === 'risk' ? '重点预警' : selectedNode.status === 'active' ? '推进中' : '待启动' }}</span><h3>{{ selectedNode.label }}</h3><p>{{ selectedNode.owner }}</p></div>
            <div class="evidence-block"><small>材料完成</small><strong>{{ selectedNode.completedMaterials.length }} / {{ selectedNode.requiredMaterials.length }}</strong><div class="mini-progress"><i :style="{ width: `${selectedNode.requiredMaterials.length ? selectedNode.completedMaterials.length / selectedNode.requiredMaterials.length * 100 : 0}%` }" /></div></div>
            <div class="evidence-block missing"><small>材料缺口</small><div class="tag-row"><span v-for="item in selectedNode.missingMaterials" :key="item">{{ item }}</span><span v-if="!selectedNode.missingMaterials.length" class="ok">当前无缺口</span></div></div>
            <div class="evidence-block risk"><small>风险判断</small><p>{{ selectedNode.risk }}</p></div>
            <div class="evidence-block action"><small>建议动作</small><p>{{ selectedNode.recommendation }}</p><RouterLink v-if="selectedNode.id === 'operation'" data-testid="project-operation-link" to="/operations">进入能源运营查看能力形成 →</RouterLink></div>
          </div>
        </TechPanel>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-layout { display: grid; grid-template-columns: 320px 1fr; gap: 14px; align-items: start; }.project-list { display: grid; gap: 10px; }.project-card { width: 100%; padding: 13px; text-align: left; display: grid; grid-template-columns: 1fr auto; gap: 7px; }.project-card span, .project-card strong, .project-card small { display: block; }.project-card span { color: currentColor; font-size: 11px; }.project-card strong { color: white; font-size: 15px; margin-top: 3px; }.project-card b { color: currentColor; font: 700 21px var(--font-data); }.project-progress { grid-column: 1 / 3; height: 3px; background: #143353; }.project-progress i { display: block; height: 100%; background: currentColor; box-shadow: 0 0 7px currentColor; }.project-card small { grid-column: 1 / 3; color: #7199b0; }
.project-center { display: grid; gap: 14px; }.lifecycle-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: 11px 5px; position: relative; }.lifecycle-grid::before { content: ''; position: absolute; left: 5%; right: 5%; top: 32px; height: 1px; background: linear-gradient(90deg, var(--success-green), var(--energy-cyan), var(--risk-pink), #23516f); opacity: .55; }.life-node { min-width: 0; border: 0; background: transparent; color: #668da5; cursor: pointer; position: relative; z-index: 1; text-align: center; }.life-node span { display: block; font: 10px var(--font-data); }.life-node i { width: 36px; height: 36px; margin: 4px auto 7px; display: grid; place-items: center; transform: rotate(45deg); border: 1px solid #2a5d79; background: #0a2f52; font-style: normal; font-size: 10px; }.life-node i::first-letter { transform: rotate(-45deg); }.life-node strong { color: #82a8bd; font-size: 12px; white-space: nowrap; }.life-node.state-completed i { background: #1a5a40; border-color: var(--success-green); color: var(--success-green); }.life-node.state-active i { border-color: var(--energy-cyan); color: var(--energy-cyan); }.life-node.state-risk i { border-color: var(--risk-pink); color: var(--risk-pink); box-shadow: 0 0 12px rgba(255,107,157,.25); }.life-node.is-active strong { color: white; }.life-node.is-active i { transform: rotate(45deg) scale(1.12); box-shadow: 0 0 14px currentColor; }
.node-evidence { display: grid; grid-template-columns: 1.15fr .7fr 1.15fr 1.35fr 1.35fr; gap: 10px; }.node-evidence > div { min-height: 114px; padding: 13px; border: 1px solid rgba(0,229,255,.12); background: rgba(5,24,50,.42); }.node-hero > span { color: var(--energy-cyan); font-size: 11px; }.node-hero > span.state-risk { color: var(--risk-pink); }.node-hero h3 { color: white; margin: 7px 0; font-size: 20px; }.node-hero p, .evidence-block p { color: #86adc2; margin: 0; line-height: 1.55; }.evidence-block small { color: #688fa8; display: block; }.evidence-block > strong { color: var(--energy-cyan); font: 700 25px var(--font-data); display: block; margin: 7px 0; }.mini-progress { height: 4px; background: #123452; }.mini-progress i { display: block; height: 100%; background: var(--energy-cyan); }.tag-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }.tag-row span { padding: 5px 7px; color: var(--opportunity-orange); border: 1px solid rgba(245,166,35,.3); background: rgba(245,166,35,.06); }.tag-row .ok { color: var(--success-green); border-color: rgba(123,216,119,.3); }.evidence-block.risk { border-color: rgba(255,107,157,.2); }.evidence-block.risk small { color: var(--risk-pink); }.evidence-block.action { border-color: rgba(123,216,119,.2); }.evidence-block.action small { color: var(--success-green); }
.evidence-block.action a { display: inline-block; margin-top: 8px; color: var(--energy-cyan); text-decoration: none; font-size: 11px; }
@media (max-width: 1250px) { .project-layout { grid-template-columns: 260px 1fr; }.lifecycle-grid { grid-template-columns: repeat(4, 1fr); }.node-evidence { grid-template-columns: repeat(2, 1fr); }.node-evidence .action { grid-column: 1 / 3; } }
</style>
