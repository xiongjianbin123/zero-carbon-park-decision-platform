# Policy Knowledge and MiniMax Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an official zero-carbon policy library, application benchmark, Shanxi energy topic, policy radar, local hybrid search, and evidence-grounded MiniMax Token Plan Q&A to the existing platform.

**Architecture:** Keep the existing Vue 3 six-route shell and turn the policy page into four internal views. Store official documents and a rebuildable lexical index under `public/policies`, serve them and `/api` from one small Node.js process, and call MiniMax only from the server. The static `dist/` remains browseable; AI answers require the local server and a server-side `.env.local` key.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, Playwright, Node.js built-in HTTP/test APIs, `@anthropic-ai/sdk`, Poppler `pdftotext` for import-time PDF extraction.

**Spec:** `docs/superpowers/specs/2026-08-25-policy-knowledge-minimax-design.md`

## Global Constraints

- Keep all six existing top-level routes and the approved deep-blue visual system.
- Do not expose MiniMax provider, plan, key state, or local-index implementation language in the UI.
- Store the Token Plan Key only in `.env.local` or process environment; never include it in source, `dist`, logs, fixtures, screenshots, or chat.
- Keep policy facts and official links separate from fictional park demonstration data.
- Treat drafting standards as drafting, not effective requirements.
- Unknown park indicators display `待核算` or `待录入`; do not invent values.
- No unrelated refactors. Existing dashboard, roadmap, projects, investment, and guided-tour business behavior must remain intact.
- This directory is not a Git repository, so each task ends with a test checkpoint instead of a commit.

---

### Task 1: Policy data contract and curated catalog

**Files:**
- Create: `src/types/policy.ts`
- Create: `public/policies/catalog.json`
- Create: `tests/unit/policyCatalog.spec.ts`

**Interfaces:**
- Produces: `PolicyDocument`, `PolicyStatus`, `PolicyLevel`, `PolicyCategory`, `PolicyChunk`, and `PolicySearchResult` types.
- Produces: a JSON array of at least 12 official national/Shanxi documents with unique IDs and valid official URLs.

- [ ] **Step 1: Write the failing catalog validation test**

```ts
import { describe, expect, it } from 'vitest'
import catalog from '../../public/policies/catalog.json'

describe('policy catalog', () => {
  it('contains at least 12 unique official documents with explicit status', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(12)
    expect(new Set(catalog.map((item) => item.id)).size).toBe(catalog.length)
    for (const item of catalog) {
      expect(item.sourceUrl).toMatch(/^https:\/\//)
      expect(['effective', 'trial', 'drafting', 'repealed']).toContain(item.status)
      expect(item.issuers.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run the test and verify the catalog import fails**

Run: `npm run test -- --run tests/unit/policyCatalog.spec.ts`

Expected: FAIL because `public/policies/catalog.json` does not exist.

- [ ] **Step 3: Add the policy types and catalog**

```ts
export type PolicyStatus = 'effective' | 'trial' | 'drafting' | 'repealed'
export type PolicyLevel = 'national' | 'shanxi' | 'technical'
export type PolicyCategory = 'policy' | 'indicator' | 'accounting' | 'standard' | 'energy' | 'case'

export interface PolicyDocument {
  id: string
  title: string
  documentNumber?: string
  level: PolicyLevel
  category: PolicyCategory
  status: PolicyStatus
  issuers: string[]
  publishedAt: string
  sourceUrl: string
  localFile?: string
  localText?: string
  tags: string[]
  summary: string
  relatedProjectIds: string[]
}
```

Catalog entries must use the official URLs recorded in the approved spec research and include the four NDRC attachments, the first national list, MIIT technical direction, Shanxi zero-carbon deployment, Shanxi energy transition, and Shanxi storage material.

- [ ] **Step 4: Run the focused catalog test**

Run: `npm run test -- --run tests/unit/policyCatalog.spec.ts`

Expected: PASS.

---

### Task 2: Core document import and rebuildable local index

**Files:**
- Create: `scripts/import-policy-documents.mjs`
- Create: `scripts/build-policy-index.mjs`
- Create: `public/policies/files/.gitkeep`
- Create: `public/policies/text/.gitkeep`
- Create: `public/policies/index.json`
- Create: `tests/server/policy-index.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `chunkText(text, options)` and `buildIndex(catalog, readText)` from `scripts/build-policy-index.mjs`.
- Produces: `public/policies/index.json` with `{ version, generatedAt, chunks }`.
- Consumes: catalog `localFile`/`localText` paths.

- [ ] **Step 1: Write a failing Node test for stable chunk IDs and page markers**

```js
import assert from 'node:assert/strict'
import test from 'node:test'
import { chunkText } from '../../scripts/build-policy-index.mjs'

test('chunkText keeps document and page identity', () => {
  const chunks = chunkText('第一页内容\f第二页清洁能源消费占比不低于90%', {
    documentId: 'indicator-system',
    maxChars: 30,
  })
  assert.equal(chunks[1].documentId, 'indicator-system')
  assert.equal(chunks[1].page, 'P.2')
  assert.match(chunks[1].text, /清洁能源/)
  assert.match(chunks[1].chunkId, /^indicator-system-p2-/)
})
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/policy-index.test.mjs`

Expected: FAIL because the index builder does not exist.

- [ ] **Step 3: Implement deterministic text chunking and catalog-driven import**

`import-policy-documents.mjs` must:

```js
for (const document of catalog) {
  if (!document.localFile && !document.localText) continue
  // Download only the explicit source URL in catalog.
  // PDF: save to localFile and call pdftotext -layout.
  // HTML: save stripped readable text to localText.
}
```

`build-policy-index.mjs` must split on form-feed pages first, then paragraph boundaries, emit stable IDs, and write JSON with two-space indentation.

- [ ] **Step 4: Run the focused test and build a first index**

Run: `node --test tests/server/policy-index.test.mjs`

Expected: PASS.

Run: `node scripts/build-policy-index.mjs`

Expected: prints document/chunk counts and creates `public/policies/index.json`.

- [ ] **Step 5: Add scripts**

```json
{
  "scripts": {
    "policies:import": "node scripts/import-policy-documents.mjs",
    "policies:index": "node scripts/build-policy-index.mjs",
    "test:server": "node --test tests/server/*.test.mjs"
  }
}
```

- [ ] **Step 6: Import the approved core official files and rebuild the index**

Run: `npm run policies:import`

Expected: at least the four NDRC attachments and first national list are saved locally; official HTML policy pages have extracted text.

Run: `npm run policies:index`

Expected: every local-text catalog entry contributes at least one chunk.

---

### Task 3: Local hybrid search repository

**Files:**
- Create: `server/policyRepository.mjs`
- Create: `tests/server/policyRepository.test.mjs`

**Interfaces:**
- Consumes: `public/policies/catalog.json` and `public/policies/index.json`.
- Produces: `createPolicyRepository({ catalogPath, indexPath })`.
- Produces methods: `listDocuments(filters?)` and `search(query, filters?, limit = 6)`.

- [ ] **Step 1: Write failing ranking and filtering tests**

```js
test('search ranks title and exact policy phrase above incidental body matches', () => {
  const repository = createFixtureRepository()
  const results = repository.search('绿电直连', {}, 3)
  assert.equal(results[0].documentId, 'shanxi-green-power')
  assert.match(results[0].excerpt, /绿电直连/)
})

test('search excludes drafting standards when effective status is selected', () => {
  const results = createFixtureRepository().search('零碳园区', { status: ['effective'] }, 10)
  assert.ok(results.every((item) => item.status === 'effective'))
})
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/policyRepository.test.mjs`

Expected: FAIL because `createPolicyRepository` does not exist.

- [ ] **Step 3: Implement the minimum hybrid scorer**

The scorer must combine:

```js
score += exactTitlePhrase ? 30 : 0
score += exactDocumentNumber ? 30 : 0
score += matchingTagCount * 8
score += matchingIssuerCount * 5
score += chineseBigramTfIdfScore
score += alphanumericTfIdfScore
```

Return only results with a positive score, include the source URL and page, and use stable `evidenceId` values such as `E01` after final ranking.

- [ ] **Step 4: Run search tests and inspect three real queries**

Run: `node --test tests/server/policyRepository.test.mjs`

Expected: PASS.

Run: `node -e "import('./server/policyRepository.mjs').then(({createPolicyRepository}) => console.log(createPolicyRepository().search('清洁能源占比', {}, 3)))"`

Expected: the trial indicator document ranks first and includes a page/section.

---

### Task 4: MiniMax client and evidence-only Q&A service

**Files:**
- Create: `server/minimaxClient.mjs`
- Create: `tests/server/minimaxClient.test.mjs`
- Create: `.env.example`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`.
- Produces: `createMinimaxClient({ apiKey, baseURL, model, client? })`.
- Produces: `answerQuestion({ question, evidence, parkContext })` returning `{ answer, citations }`.

- [ ] **Step 1: Write failing tests for no-key, citation preservation, and empty evidence**

```js
test('refuses to answer without evidence', async () => {
  const client = createMinimaxClient({ apiKey: 'test', client: fakeSdk })
  await assert.rejects(() => client.answerQuestion({ question: '怎么申报', evidence: [], parkContext: '' }), /EVIDENCE_NOT_FOUND/)
})

test('returns only citations present in retrieved evidence', async () => {
  const answer = await createMinimaxClient({ apiKey: 'test', client: fakeSdk }).answerQuestion({
    question: '门槛是多少',
    evidence: [{ evidenceId: 'E01', documentId: 'indicator', title: '指标体系', excerpt: '不低于90%', sourceUrl: 'https://example.gov.cn/a' }],
    parkContext: '当前43%',
  })
  assert.deepEqual(answer.citations.map((item) => item.evidenceId), ['E01'])
})
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/minimaxClient.test.mjs`

Expected: FAIL because the client does not exist.

- [ ] **Step 3: Install the official SDK and implement the adapter**

Run: `npm install @anthropic-ai/sdk`

Implementation must call:

```js
sdk.messages.create({
  model,
  max_tokens: 1200,
  temperature: 0.2,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: renderedEvidencePrompt }],
})
```

Parse only `content` blocks of type `text`. Extract cited evidence IDs from the returned text and intersect them with the supplied evidence array.

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/server/minimaxClient.test.mjs`

Expected: PASS without making a network request.

- [ ] **Step 5: Add safe environment templates**

`.env.example`:

```dotenv
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://api.minimaxi.com/anthropic
MINIMAX_MODEL=MiniMax-M3
```

Add `.env.local` to `.gitignore`.

---

### Task 5: Unified local HTTP/API server

**Files:**
- Create: `server/index.mjs`
- Create: `tests/server/http-api.test.mjs`
- Modify: `vite.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: policy repository and MiniMax client.
- Produces: `createAppServer({ repository, qaClient, distDir })`.
- Routes: `/api/health`, `/api/policies`, `/api/policies/search`, `/api/qa`, and static `dist` fallback.

- [ ] **Step 1: Write failing HTTP tests against an ephemeral port**

```js
test('POST /api/policies/search returns traceable evidence', async () => {
  const server = await startFixtureServer()
  const response = await fetch(`${server.url}/api/policies/search`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: '绿电直连' }),
  })
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.results[0].evidenceId, 'E01')
})

test('POST /api/qa returns MINIMAX_NOT_CONFIGURED without a key', async () => {
  const response = await postQa(startServerWithoutKey(), '怎么申报')
  assert.equal(response.status, 503)
  assert.equal((await response.json()).code, 'MINIMAX_NOT_CONFIGURED')
})
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/http-api.test.mjs`

Expected: FAIL because the server does not exist.

- [ ] **Step 3: Implement JSON limits, error mapping, CORS-free same-origin API, and static serving**

Accept only `application/json`, limit bodies to 64 KiB, trim questions to 1–1000 characters, and return JSON errors with stable `code` values. Bind production to `127.0.0.1`, never `0.0.0.0` by default.

- [ ] **Step 4: Run API and complete server suites**

Run: `npm run test:server`

Expected: PASS with no external network call.

- [ ] **Step 5: Add development proxy and scripts**

```ts
server: {
  proxy: { '/api': 'http://127.0.0.1:4175' },
}
```

Add `"api": "node server/index.mjs"` and `"api:dev": "PORT=4175 node server/index.mjs"`.

---

### Task 6: Four-view policy page

**Files:**
- Create: `src/config/policyViews.ts`
- Create: `src/services/policyApi.ts`
- Create: `src/components/policies/PolicyLibraryView.vue`
- Create: `src/components/policies/ApplicationBenchmarkView.vue`
- Create: `src/components/policies/ShanxiEnergyView.vue`
- Create: `src/components/policies/PolicyRadarView.vue`
- Modify: `src/pages/policies/PoliciesPage.vue`
- Modify: `tests/unit/PoliciesPage.spec.ts`

**Interfaces:**
- `policyApi.listDocuments(): Promise<PolicyDocument[]>`
- `policyApi.search(query, filters): Promise<PolicySearchResult[]>`
- `PoliciesPage` owns active tab; child views own only their local selection.

- [ ] **Step 1: Replace the existing unit test with failing approved-view tests**

```ts
it('switches between all four approved policy views', async () => {
  const wrapper = mount(PoliciesPage)
  for (const label of ['政策知识库', '申报对标', '山西能源专题', '政策更新雷达']) {
    await wrapper.get(`[data-policy-view="${label}"]`).trigger('click')
    expect(wrapper.get('[data-testid="policy-view"]').text()).toContain(label === '政策知识库' ? '权威资料目录' : label)
  }
})

it('marks missing benchmark inputs without inventing values', async () => {
  const wrapper = mount(PoliciesPage)
  await wrapper.get('[data-policy-view="申报对标"]').trigger('click')
  expect(wrapper.text()).toContain('单位能耗碳排放')
  expect(wrapper.text()).toContain('待核算')
  expect(wrapper.text()).toContain('不低于 90%')
})
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run test -- --run tests/unit/PoliciesPage.spec.ts`

Expected: FAIL because the four view controls do not exist.

- [ ] **Step 3: Implement the page shell and child views from the approved mockup**

Keep the approved copy removals: no implementation-status sentence, no preview badge, no “official verified” statement, and no leader-only language. Use real buttons, keyboard focus, and a single active tab.

- [ ] **Step 4: Run policy component tests**

Run: `npm run test -- --run tests/unit/PoliciesPage.spec.ts`

Expected: PASS.

---

### Task 7: Free-form evidence Q&A while preserving deterministic questions

**Files:**
- Modify: `src/pages/qa/QaPage.vue`
- Modify: `tests/unit/QaPage.spec.ts`
- Modify: `src/app/AppHeader.vue`
- Modify: `src/config/park.ts`

**Interfaces:**
- Consumes: `policyApi.ask(question, filters?)`.
- Preserves: existing deterministic `parkConfig.qa` selection and evidence answers.
- Adds: free question text, loading, answer, citations, and actionable errors.

- [ ] **Step 1: Write failing tests for free Q&A success and no-key behavior**

```ts
it('renders returned answer and clickable citations', async () => {
  vi.spyOn(policyApi, 'ask').mockResolvedValue({
    answer: '清洁能源消费占比仍有差距。[E01]',
    citations: [{ evidenceId: 'E01', documentId: 'indicator', title: '指标体系', sourceUrl: 'https://example.gov.cn', excerpt: '不低于90%' }],
  })
  const wrapper = mount(QaPage)
  await wrapper.get('[aria-label="输入园区或政策问题"]').setValue('还差什么')
  await wrapper.get('[data-testid="ask-policy"]').trigger('submit')
  await flushPromises()
  expect(wrapper.get('[data-testid="ai-answer"]').text()).toContain('仍有差距')
  expect(wrapper.get('a[href="https://example.gov.cn"]').text()).toContain('指标体系')
})
```

- [ ] **Step 2: Run and verify RED**

Run: `npm run test -- --run tests/unit/QaPage.spec.ts`

Expected: FAIL because free-form Q&A does not exist.

- [ ] **Step 3: Implement the approved free-question interaction**

Rename the top navigation label from `领导问数` to `智能问数`; keep the route `/qa`. Preserve preset questions as “常用问题” and add free Q&A above the evidence answer. `MINIMAX_NOT_CONFIGURED` must render a local configuration instruction, not an API/provider advertisement.

- [ ] **Step 4: Run Q&A tests and full Vitest suite**

Run: `npm run test -- --run tests/unit/QaPage.spec.ts`

Expected: PASS.

Run: `npm run test -- --run`

Expected: all unit tests PASS.

---

### Task 8: Secure key configuration, one-click startup, build, and deployment

**Files:**
- Create: `scripts/configure-minimax.command`
- Modify: `scripts/start.command`
- Modify: `scripts/serve-static.command`
- Modify: `scripts/build-static.command`
- Modify: `deploy/com.xjb.zero-carbon-park.plist`
- Modify: `README.md`
- Modify: `tests/e2e/platform.spec.ts`

**Interfaces:**
- `configure-minimax.command` writes `.env.local` with mode `600` using hidden terminal input.
- `start.command` starts API on 4175 and Vite on 5274, with cleanup trap.
- `serve-static.command` runs the unified server on 4174 after a successful build.

- [ ] **Step 1: Add failing E2E expectations for policy tabs and renamed navigation**

```ts
await page.getByRole('link', { name: '政策与申报' }).click()
for (const tab of ['政策知识库', '申报对标', '山西能源专题', '政策更新雷达']) {
  await page.getByRole('button', { name: tab }).click()
  await expect(page.locator('[data-testid="policy-view"]')).toBeVisible()
}
await expect(page.getByRole('link', { name: '智能问数' })).toBeVisible()
```

- [ ] **Step 2: Run E2E and verify RED**

Run: `npm run test:e2e`

Expected: FAIL on missing four-view policy controls or old `领导问数` label.

- [ ] **Step 3: Implement secure configuration and startup scripts**

`configure-minimax.command` must use `read -s`, reject empty input, write only `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, and `MINIMAX_MODEL`, then `chmod 600 .env.local`. It must never echo the key.

`start.command` must trap `EXIT INT TERM` and stop only the API child process it started. `serve-static.command` must execute `node server/index.mjs` with `PORT=4174`.

- [ ] **Step 4: Update build verification**

`scripts/build-static.command` must run, in order:

```text
npm run typecheck
npm run test -- --run
npm run test:server
npm run build
```

- [ ] **Step 5: Update README with safe local configuration**

Document:

```text
1. Double-click scripts/configure-minimax.command and paste the Token Plan Key in the hidden prompt.
2. Double-click scripts/start.command for development.
3. The deployed app remains http://127.0.0.1:4174/#/dashboard.
4. Never copy .env.local into dist or share it.
```

- [ ] **Step 6: Run all automated verification**

Run: `npm run typecheck`

Run: `npm run test -- --run`

Run: `npm run test:server`

Run: `npm run test:e2e`

Run: `npm run build`

Expected: every command exits 0.

- [ ] **Step 7: Reinstall and verify LaunchAgent deployment**

Copy the updated plist if its contents changed, reload `com.xjb.zero-carbon-park`, then verify:

```text
GET http://127.0.0.1:4174/                 -> 200
GET http://127.0.0.1:4174/api/health       -> 200
GET http://127.0.0.1:4174/api/policies     -> at least 12 documents
```

Do not call `/api/qa` until the user has configured the Token Plan Key locally.

- [ ] **Step 8: Capture final visual evidence**

At 1440×900 capture dashboard, policy library, application benchmark, Shanxi energy, policy radar, and smart Q&A. Confirm no horizontal overflow, clipped text, or implementation-status copy.
