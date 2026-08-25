<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import TechPanel from '@/components/TechPanel.vue'
import { askPolicy, fallbackPolicyCatalog, listDocuments, searchPolicies } from '@/services/policyApi'
import type { EvidenceAnswer, PolicyCategory, PolicyDocument, PolicyLevel, PolicySearchFilters, PolicySearchResult, PolicyStatus } from '@/types/policy'

const documents = ref<PolicyDocument[]>(fallbackPolicyCatalog)
const selectedId = ref(documents.value[0]?.id ?? '')
const query = ref('')
const level = ref<'all' | PolicyLevel>('all')
const category = ref<'all' | PolicyCategory>('all')
const status = ref<'all' | PolicyStatus>('all')
const searchResults = ref<PolicySearchResult[]>([])
const searching = ref(false)
const policyQuestion = ref('')
const policyAnswer = ref<EvidenceAnswer | null>(null)
const policyAnswerError = ref('')
const asking = ref(false)

const levelLabels: Record<PolicyLevel, string> = { national: '国家级', shanxi: '山西省', technical: '技术标准' }
const statusLabels: Record<PolicyStatus, string> = { effective: '现行', trial: '试行', drafting: '在编', repealed: '已废止' }
const filterOptions: { id: 'all' | PolicyLevel; label: string }[] = [
  { id: 'all', label: '全部' }, { id: 'national', label: '国家' }, { id: 'shanxi', label: '山西' }, { id: 'technical', label: '技术' },
]
const topics = ['国家级零碳园区', '碳排放核算', '清洁能源占比', '绿电直连', '新型储能', '虚拟电厂', '申报书与项目清单']

const filteredDocuments = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return documents.value.filter((item) => {
    if (level.value !== 'all' && item.level !== level.value) return false
    if (category.value !== 'all' && item.category !== category.value) return false
    if (status.value !== 'all' && item.status !== status.value) return false
    if (!keyword) return true
    return [item.title, item.documentNumber, item.summary, ...item.tags, ...item.issuers]
      .filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))
  })
})
const current = computed(() => documents.value.find((item) => item.id === selectedId.value) ?? filteredDocuments.value[0] ?? documents.value[0])
const currentEvidence = computed(() => searchResults.value.filter((item) => item.documentId === current.value?.id).slice(0, 3))
const compactPolicyAnswer = computed(() => (policyAnswer.value?.answer ?? '').replace(/\*\*/g, '').replace(/^#{1,6}\s*/gm, '').trim())

async function runSearch() {
  const keyword = query.value.trim()
  if (!keyword) { searchResults.value = []; return }
  searching.value = true
  try {
    const filters: PolicySearchFilters = {}
    if (level.value !== 'all') filters.levels = [level.value]
    if (category.value !== 'all') filters.categories = [category.value]
    if (status.value !== 'all') filters.statuses = [status.value]
    searchResults.value = await searchPolicies(keyword, filters)
    if (searchResults.value[0]) selectedId.value = searchResults.value[0].documentId
  } catch { searchResults.value = [] } finally { searching.value = false }
}
function searchTopic(topic: string) { query.value = topic; void runSearch() }
async function submitPolicyQuestion() {
  const question = policyQuestion.value.trim()
  if (!question || asking.value) return
  asking.value = true
  policyAnswer.value = null
  policyAnswerError.value = ''
  try {
    policyAnswer.value = await askPolicy(question, '晋北资源型工业零碳示范园区：62MW光伏潜力、100MW/200MWh共享储能、80MW可调节负荷、1.7亿kWh绿电采购缺口。')
  } catch (error) {
    const code = (error as { code?: string }).code
    policyAnswerError.value = code === 'EVIDENCE_NOT_FOUND' ? '当前资料中暂未找到足够依据。' : '暂时无法完成回答，请稍后重试。'
  } finally { asking.value = false }
}

onMounted(async () => {
  documents.value = await listDocuments()
  if (!documents.value.some((item) => item.id === selectedId.value)) selectedId.value = documents.value[0]?.id ?? ''
})
</script>

<template>
  <div class="library-view">
    <TechPanel title="权威资料目录" eyebrow="POLICY DOCUMENTS">
      <form class="search-box" @submit.prevent="runSearch"><input v-model="query" aria-label="搜索政策资料" placeholder="搜索政策、指标或关键词" /><button type="submit">搜索</button></form>
      <div class="level-tabs"><button v-for="item in filterOptions" :key="item.id" class="data-button" :class="{ 'is-active': level === item.id }" @click="level = item.id">{{ item.label }}</button></div>
      <div class="select-filters">
        <select v-model="category" aria-label="资料类别"><option value="all">全部类别</option><option value="policy">政策文件</option><option value="indicator">指标体系</option><option value="accounting">核算方法</option><option value="standard">技术标准</option><option value="energy">能源政策</option><option value="case">建设案例</option></select>
        <select v-model="status" aria-label="资料状态"><option value="all">全部状态</option><option value="effective">现行</option><option value="trial">试行</option><option value="drafting">在编</option><option value="repealed">已废止</option></select>
      </div>
      <div class="document-list">
        <button v-for="item in filteredDocuments" :key="item.id" class="document-card data-button" :class="{ 'is-active': item.id === current?.id }" @click="selectedId = item.id">
          <span>{{ levelLabels[item.level] }}</span><time>{{ item.publishedAt }}</time><strong>{{ item.title }}</strong><small>{{ item.issuers.join(' / ') }}</small>
        </button>
      </div>
    </TechPanel>

    <TechPanel :title="current?.title ?? '政策资料'" eyebrow="DOCUMENT OVERVIEW">
      <template v-if="current">
        <div class="document-head"><div><span :class="`status-${current.status}`">{{ statusLabels[current.status] }}</span><b>{{ levelLabels[current.level] }}</b></div><time>{{ current.publishedAt }}</time></div>
        <p class="document-number">{{ current.documentNumber || '政策与技术资料' }}</p><p class="summary">{{ current.summary }}</p>
        <dl><div><dt>发布单位</dt><dd>{{ current.issuers.join(' / ') }}</dd></div><div><dt>资料标签</dt><dd><span v-for="tag in current.tags" :key="tag">{{ tag }}</span></dd></div></dl>
        <div class="document-actions"><a v-if="current.localFile" :href="`/policies/${current.localFile}`" target="_blank">查看本地文件</a><a :href="current.sourceUrl" target="_blank" rel="noreferrer">查看来源页面 ↗</a></div>
        <div v-if="currentEvidence.length" class="evidence-excerpts"><h3>相关段落</h3><article v-for="item in currentEvidence" :key="item.chunkId"><span>{{ item.evidenceId }}</span><p>{{ item.excerpt }}</p></article></div>
      </template>
    </TechPanel>

    <TechPanel title="专题快速入口" eyebrow="TOPIC NAVIGATION">
      <div class="topic-list"><button v-for="topic in topics" :key="topic" class="data-button" @click="searchTopic(topic)"><span>◇</span><strong>{{ topic }}</strong><i>→</i></button></div>
      <p class="search-state">{{ searching ? '正在检索…' : searchResults.length ? `找到 ${searchResults.length} 条相关内容` : '可按政策主题快速定位相关资料。' }}</p>
      <form class="policy-ask" @submit.prevent="submitPolicyQuestion">
        <label for="policy-question">政策咨询</label><textarea id="policy-question" v-model="policyQuestion" aria-label="输入政策咨询问题" placeholder="输入与园区政策、申报或项目相关的问题" maxlength="1000" /><button type="submit" :disabled="asking || !policyQuestion.trim()">{{ asking ? '分析中…' : '咨询' }}</button>
      </form>
      <div v-if="policyAnswer || policyAnswerError" class="policy-answer">
        <p>{{ policyAnswerError || compactPolicyAnswer }}</p>
        <div v-if="policyAnswer?.citations.length"><a v-for="item in policyAnswer.citations" :key="item.evidenceId" :href="item.sourceUrl" target="_blank" rel="noreferrer">{{ item.evidenceId }} · {{ item.title }}</a></div>
      </div>
      <a class="qa-link" href="#/qa">进入完整智能问数 →</a>
    </TechPanel>
  </div>
</template>

<style scoped>
.library-view { display: grid; grid-template-columns: 370px minmax(500px, 1fr) 320px; gap: 14px; align-items: start; }
.search-box { display: grid; grid-template-columns: 1fr 62px; height: 42px; border: 1px solid rgba(0,229,255,.24); background: rgba(3,18,41,.55); }.search-box input { min-width: 0; border: 0; outline: 0; padding: 0 11px; color: white; background: transparent; font-size: 13px; }.search-box button { border: 0; color: #052435; background: var(--energy-cyan); cursor: pointer; font-weight: 800; }.level-tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0; }.level-tabs button { min-height: 32px; font-size: 12px; }.select-filters { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }.select-filters select { min-width: 0; height: 34px; padding: 0 8px; color: #a9ccda; border: 1px solid rgba(0,229,255,.2); background: #092442; font-size: 12px; }.document-list { max-height: 520px; overflow: auto; display: grid; gap: 7px; padding-right: 3px; }.document-card { width: 100%; display: grid; grid-template-columns: auto 1fr; gap: 4px 8px; padding: 10px; text-align: left; }.document-card > span { color: var(--energy-cyan); font-size: 11px; }.document-card time { color: #6089a2; text-align: right; font: 10px var(--font-data); }.document-card strong { grid-column: 1 / 3; color: #d3e8f1; font-size: 13px; line-height: 1.45; }.document-card small { grid-column: 1 / 3; color: #7299ae; font-size: 11px; }
.document-head { display: flex; justify-content: space-between; gap: 12px; align-items: center; }.document-head div { display: flex; gap: 7px; }.document-head span, .document-head b { padding: 5px 8px; border: 1px solid currentColor; font-size: 11px; }.document-head span { color: var(--success-green); }.document-head .status-trial { color: var(--opportunity-orange); }.document-head .status-drafting { color: var(--electric-blue); }.document-head b { color: var(--energy-cyan); font-weight: 600; }.document-head time { color: #6f98af; font: 12px var(--font-data); }.document-number { color: var(--opportunity-orange); font: 13px var(--font-data); }.summary { min-height: 86px; padding: 17px; color: #c2dae5; border-left: 2px solid var(--energy-cyan); background: linear-gradient(90deg, rgba(0,229,255,.08), transparent); font-size: 16px; line-height: 1.75; }dl { margin: 18px 0; }dl > div { display: grid; grid-template-columns: 82px 1fr; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(0,229,255,.09); }dt { color: #7199b0; }dd { margin: 0; color: #b8d2df; }dd span { display: inline-block; margin: 0 6px 5px 0; padding: 4px 7px; color: var(--opportunity-orange); border: 1px solid rgba(245,166,35,.25); font-size: 11px; }.document-actions { display: flex; gap: 9px; }.document-actions a { min-height: 39px; display: grid; place-items: center; flex: 1; color: #06233a; background: var(--energy-cyan); text-decoration: none; font-weight: 800; }.document-actions a + a { color: var(--energy-cyan); border: 1px solid var(--energy-cyan); background: rgba(0,229,255,.07); }.evidence-excerpts h3 { margin: 20px 0 8px; color: white; font-size: 14px; }.evidence-excerpts article { display: grid; grid-template-columns: 36px 1fr; gap: 8px; padding: 8px 0; border-top: 1px solid rgba(0,229,255,.08); }.evidence-excerpts span { color: var(--success-green); font: 11px var(--font-data); }.evidence-excerpts p { margin: 0; color: #7fa5b9; font-size: 12px; line-height: 1.55; }
.topic-list { display: grid; gap: 6px; }.topic-list button { min-height: 39px; display: grid; grid-template-columns: 21px 1fr 15px; gap: 7px; align-items: center; padding: 7px 9px; text-align: left; }.topic-list span, .topic-list i { color: var(--energy-cyan); font-style: normal; }.topic-list strong { color: #bdd6e1; font-size: 13px; }.search-state { margin: 10px 0 0; color: #7199af; font-size: 12px; line-height: 1.6; }.policy-ask { display: grid; grid-template-columns: 1fr 66px; gap: 7px; margin-top: 13px; padding-top: 12px; border-top: 1px solid rgba(0,229,255,.13); }.policy-ask label { grid-column: 1 / 3; color: var(--energy-cyan); font-size: 13px; font-weight: 700; }.policy-ask textarea { min-height: 66px; resize: vertical; padding: 9px; color: white; border: 1px solid rgba(0,229,255,.22); outline: 0; background: rgba(3,18,41,.55); font: 12px/1.5 var(--font-display); }.policy-ask button { border: 1px solid var(--energy-cyan); color: #052435; background: var(--energy-cyan); cursor: pointer; font-weight: 800; }.policy-ask button:disabled { opacity: .45; cursor: not-allowed; }.policy-answer { margin-top: 9px; padding: 9px; border: 1px solid rgba(123,216,119,.22); background: rgba(123,216,119,.05); }.policy-answer > p { max-height: 140px; overflow: auto; margin: 0; white-space: pre-wrap; color: #b9d5df; font-size: 12px; line-height: 1.55; }.policy-answer div { display: grid; gap: 4px; margin-top: 8px; }.policy-answer a { color: var(--success-green); font-size: 11px; text-decoration: none; }.qa-link { min-height: 34px; display: grid; place-items: center; margin-top: 9px; color: var(--opportunity-orange); border: 1px solid rgba(245,166,35,.3); text-decoration: none; font-size: 12px; }
@media (max-width: 1280px) { .library-view { grid-template-columns: 340px 1fr; }.library-view > :last-child { grid-column: 1 / 3; } }
</style>
