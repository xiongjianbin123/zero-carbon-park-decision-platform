<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeading from '@/components/PageHeading.vue'
import TechPanel from '@/components/TechPanel.vue'
import { parkConfig } from '@/config/park'
import { askPolicy } from '@/services/policyApi'
import type { EvidenceAnswer } from '@/types/policy'

const selectedQuestionId = ref('funding-gap')
const query = ref('')
const freeQuestion = ref('')
const aiAnswer = ref<EvidenceAnswer | null>(null)
const answerError = ref('')
const answering = ref(false)
const filteredQuestions = computed(() => parkConfig.qa.filter((item) => !query.value || item.question.includes(query.value)))
const current = computed(() => parkConfig.qa.find((item) => item.id === selectedQuestionId.value)!)
const answerBlocks = computed(() => (aiAnswer.value?.answer ?? '').split(/\n+/).map((line) => {
  const raw = line.trim()
  const heading = /^#{1,6}\s/.test(raw) || /^\*\*.+\*\*[:：]?$/.test(raw)
  const clean = raw.replace(/^#{1,6}\s*/, '').replace(/\*\*/g, '').trim()
  const bullet = clean.match(/^(?:[-•]|\d+[.)])\s*(.+)$/)
  return { type: heading ? 'heading' : bullet ? 'bullet' : 'paragraph', text: bullet?.[1] ?? clean }
}).filter((block) => block.text))

const parkContext = JSON.stringify({
  parkName: parkConfig.meta.parkName,
  region: parkConfig.meta.region,
  industry: parkConfig.meta.industry,
  baselineDate: parkConfig.meta.baselineDate,
  metrics: parkConfig.overview.metrics.map(({ label, display, unit, note }) => ({ label, value: `${display}${unit}`, note })),
  projects: parkConfig.projects.items.map(({ name, category, investment, progress, status }) => ({ name, category, investment, progress, status })),
})

function submitQuestion() {
  const question = freeQuestion.value.trim()
  if (!question || answering.value) return
  answering.value = true
  aiAnswer.value = null
  answerError.value = ''
  return Promise.resolve()
    .then(() => askPolicy(question, parkContext))
    .then((result) => { aiAnswer.value = result })
    .catch((error: { code?: string }) => {
      answerError.value = error.code === 'MINIMAX_NOT_CONFIGURED'
        ? '智能问数尚未完成本机配置，预置问题与政策资料仍可正常查看。'
        : error.code === 'AUTH_REQUIRED'
          ? '登录后可使用实时智能问数；预置问题与政策资料仍可自由浏览。'
        : error.code === 'EVIDENCE_NOT_FOUND'
          ? '当前资料中暂未找到足够依据，请补充更具体的政策、项目或指标关键词。'
          : '暂时无法完成回答，请稍后重试。'
    })
    .finally(() => { answering.value = false })
}
</script>

<template>
  <div class="page qa-page" data-page="qa">
    <PageHeading index="07" title="园区智能问数" subtitle="PARK INTELLIGENCE & POLICY Q&A">
      <div class="qa-mode"><span class="status-dot tone-green" /> 政策与园区数据问答</div>
    </PageHeading>
    <div class="qa-metrics">
      <article><span>常用问题</span><strong class="tone-cyan">{{ parkConfig.qa.length }}</strong><small>个园区高频问题</small></article>
      <article><span>政策资料</span><strong class="tone-green">19</strong><small>国家、山西与技术资料</small></article>
      <article><span>回答范围</span><strong class="tone-orange">园区 + 政策</strong><small>项目、能源、资金与申报</small></article>
      <article><span>数据基准</span><strong class="tone-pink">{{ parkConfig.meta.baselineDate }}</strong><small>当前园区数据口径</small></article>
    </div>
    <TechPanel title="自由提问" eyebrow="ASK THE PARK">
      <form class="ask-form" data-testid="ask-policy" @submit.prevent="submitQuestion">
        <input v-model="freeQuestion" aria-label="输入园区或政策问题" placeholder="例如：山西相关政策对园区储能和绿电建设有哪些影响？" maxlength="1000" />
        <button type="submit" :disabled="answering || !freeQuestion.trim()">{{ answering ? '正在检索与分析…' : '开始问数' }}</button>
      </form>
      <div v-if="aiAnswer || answerError" class="ai-result" data-testid="ai-answer">
        <p v-if="answerError" class="answer-error">{{ answerError }}</p>
        <template v-else-if="aiAnswer">
          <div class="answer-copy">
            <template v-for="(block, index) in answerBlocks" :key="`${index}-${block.text}`">
              <h3 v-if="block.type === 'heading'">{{ block.text }}</h3>
              <p v-else :class="{ bullet: block.type === 'bullet' }"><span v-if="block.type === 'bullet'">◇</span>{{ block.text }}</p>
            </template>
          </div>
          <div v-if="aiAnswer.citations.length" class="citation-grid">
            <a v-for="citation in aiAnswer.citations" :key="citation.evidenceId" :href="citation.sourceUrl" target="_blank" rel="noreferrer">
              <span>{{ citation.evidenceId }}</span><div><strong>{{ citation.title }}</strong><p>{{ citation.excerpt }}</p></div>
            </a>
          </div>
        </template>
      </div>
    </TechPanel>
    <div class="qa-layout">
      <TechPanel title="常用问题" eyebrow="QUESTION LIBRARY">
        <label class="question-search"><span>⌕</span><input v-model="query" type="search" placeholder="筛选预置问题" aria-label="筛选预置问题" /></label>
        <div class="question-list">
          <button v-for="(item, index) in filteredQuestions" :key="item.id" class="question-button data-button" :class="{ 'is-active': item.id === selectedQuestionId }" :data-question-id="item.id" @click="selectedQuestionId = item.id"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ item.question }}</strong><i>→</i></button>
        </div>
      </TechPanel>
      <div class="answer-column" data-testid="evidence-answer">
        <TechPanel title="决策结论" eyebrow="ANSWER WITH TRACEABLE EVIDENCE">
          <div class="answer-card">
            <div class="asked-question"><span>问题</span><h2>{{ current.question }}</h2></div>
            <p class="answer-conclusion">{{ current.conclusion }}</p>
            <div class="answer-highlights"><article v-for="item in current.highlights" :key="item.label" :class="`tone-${item.tone}`"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></article></div>
          </div>
        </TechPanel>
        <div class="answer-bottom">
          <TechPanel title="判断依据" eyebrow="WHY"><div class="reason-items"><p v-for="(reason, index) in current.reasons" :key="reason"><span>0{{ index + 1 }}</span>{{ reason }}</p></div></TechPanel>
          <TechPanel title="建议动作" eyebrow="NEXT ACTION"><div class="action-box"><span>→</span><p>{{ current.action }}</p></div></TechPanel>
        </div>
        <TechPanel title="回答依据可复核" eyebrow="EVIDENCE CHAIN">
          <div class="evidence-chain"><span v-for="item in current.evidence" :key="item">✓ {{ item }}</span><b>基准日 {{ parkConfig.meta.baselineDate }}</b></div>
        </TechPanel>
      </div>
    </div>
  </div>
</template>

<style scoped>
.qa-mode { color: #89b2c9; display: flex; align-items: center; gap: 7px; }.qa-metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }.qa-metrics article { min-height: 91px; padding: 14px 17px; border: 1px solid rgba(0,229,255,.16); background: linear-gradient(145deg, rgba(18,47,91,.65), rgba(7,25,52,.8)); }.qa-metrics span, .qa-metrics strong, .qa-metrics small { display: block; }.qa-metrics span { color: #83a9bd; }.qa-metrics strong { font: 800 25px var(--font-data); margin: 7px 0 3px; }.qa-metrics small { color: #648aa2; }.ask-form { display: grid; grid-template-columns: 1fr 155px; min-height: 48px; border: 1px solid rgba(0,229,255,.3); background: rgba(3,18,41,.58); }.ask-form input { min-width: 0; padding: 0 15px; color: white; border: 0; outline: 0; background: transparent; font-size: 14px; }.ask-form input::placeholder { color: #5f859c; }.ask-form button { border: 0; color: #052435; background: linear-gradient(90deg, var(--energy-cyan), #6bf1ff); cursor: pointer; font-weight: 800; }.ask-form button:disabled { cursor: not-allowed; opacity: .45; }.ai-result { margin-top: 13px; padding: 16px; border: 1px solid rgba(123,216,119,.24); background: linear-gradient(110deg, rgba(123,216,119,.06), rgba(3,18,41,.28)); }.answer-copy { color: #d2e6ee; font-size: 15px; line-height: 1.72; }.answer-copy h3 { margin: 16px 0 7px; color: var(--energy-cyan); font-size: 15px; letter-spacing: .3px; }.answer-copy h3:first-child { margin-top: 0; }.answer-copy p { margin: 5px 0; }.answer-copy .bullet { display: grid; grid-template-columns: 18px 1fr; gap: 5px; }.answer-copy .bullet span { color: var(--success-green); }.answer-error { margin: 0; color: var(--opportunity-orange); font-size: 14px; }.citation-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 9px; margin-top: 14px; }.citation-grid a { display: grid; grid-template-columns: 38px 1fr; gap: 9px; padding: 10px; color: inherit; border: 1px solid rgba(0,229,255,.14); background: rgba(3,18,41,.4); text-decoration: none; }.citation-grid a > span { color: var(--success-green); font: 12px var(--font-data); }.citation-grid strong { color: white; font-size: 13px; }.citation-grid p { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 6; overflow: hidden; margin: 6px 0 0; color: #759caf; font-size: 12px; line-height: 1.55; }.qa-layout { display: grid; grid-template-columns: 390px 1fr; gap: 14px; align-items: start; }.question-search { height: 42px; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(0,229,255,.2); background: rgba(3,18,41,.5); padding: 0 11px; color: var(--energy-cyan); }.question-search input { width: 100%; border: 0; outline: 0; color: white; background: transparent; }.question-search input::placeholder { color: #5d829a; }.question-list { max-height: 520px; overflow: auto; display: grid; gap: 7px; margin-top: 10px; padding-right: 4px; }.question-button { width: 100%; min-height: 45px; display: grid; grid-template-columns: 29px 1fr 16px; gap: 7px; align-items: center; padding: 9px; text-align: left; }.question-button span { color: #507991; font: 10px var(--font-data); }.question-button strong { color: #aac7d6; font-size: 13px; }.question-button i { color: var(--energy-cyan); font-style: normal; }.question-button.is-active strong { color: white; }.answer-column { display: grid; gap: 14px; }.answer-card { min-height: 213px; padding: 8px 8px 4px; position: relative; background: radial-gradient(circle at 85% 20%, rgba(0,229,255,.08), transparent 35%); }.asked-question { display: flex; align-items: center; gap: 12px; }.asked-question span { padding: 5px 7px; color: var(--energy-cyan); border: 1px solid rgba(0,229,255,.35); font-size: 11px; }.asked-question h2 { margin: 0; color: white; font-size: 20px; }.answer-conclusion { margin: 18px 0; color: #c6deea; font-size: 18px; line-height: 1.75; max-width: 950px; }.answer-highlights { display: flex; gap: 12px; }.answer-highlights article { min-width: 175px; padding: 11px 14px; border-left: 2px solid currentColor; background: color-mix(in srgb, currentColor 7%, transparent); }.answer-highlights span, .answer-highlights strong { display: block; }.answer-highlights span { color: #8fafc0; }.answer-highlights strong { color: currentColor; font: 800 25px var(--font-data); margin-top: 5px; text-shadow: 0 0 10px color-mix(in srgb, currentColor 35%, transparent); }.answer-bottom { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }.reason-items { display: grid; gap: 9px; }.reason-items p { margin: 0; color: #a4c1d0; }.reason-items span { color: var(--energy-cyan); font: 11px var(--font-data); margin-right: 9px; }.action-box { display: flex; gap: 11px; align-items: flex-start; }.action-box span { color: var(--opportunity-orange); font-size: 23px; }.action-box p { color: #b6cfda; line-height: 1.65; margin: 0; }.evidence-chain { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }.evidence-chain span { padding: 7px 10px; color: var(--success-green); border: 1px solid rgba(123,216,119,.24); background: rgba(123,216,119,.06); }.evidence-chain b { margin-left: auto; color: var(--opportunity-orange); font: 12px var(--font-data); }
@media (max-width: 1150px) { .qa-layout { grid-template-columns: 320px 1fr; }.answer-bottom { grid-template-columns: 1fr; } }
</style>
