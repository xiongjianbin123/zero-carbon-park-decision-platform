# Park Project Workbench P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a persistent, signed-in park project workbench that completes the create park → import data → diagnose gaps → manage tasks → attach evidence → export results workflow while preserving the anonymous demonstration cockpit.

**Architecture:** Keep the current Vue 3 hash-router application and Cloudflare Worker. Add focused workspace modules behind Sites identity, store structured records in D1 and original/evidence/export files in R2, and keep all calculations deterministic. Cloudflare Vite dev provides local D1/R2 with an explicit loopback-only development identity; the public deployment never trusts client identity and never falls back to demo data.

**Tech Stack:** Vue 3.5, TypeScript 5.9, Vite 8, Cloudflare Worker/D1/R2, Sites identity, SheetJS `xlsx`, Vitest 4, Node test runner, Playwright.

**Spec:** `docs/superpowers/specs/2026-08-26-park-project-workbench-p0-design.md`

## Global Constraints

- Product scope is one organization with multiple park projects, not self-service multi-tenant SaaS.
- Anonymous visitors retain the seven-page demonstration cockpit and public policy search; every real workspace read and write requires trusted Sites identity and allowlist membership.
- The public demonstration park must never be copied into a real park or used as fallback data.
- P0 imports exactly four fixed XLSX/CSV contracts; one file is at most 10 MB and one load-curve import is at most 35,040 points.
- Original files and generated XLSX files live in R2; authoritative normalized records and snapshots live in D1.
- Indicators, task constraints, permissions, and export values are deterministic; MiniMax cannot mutate them.
- Task status is exactly `draft`, `open`, `in_progress`, `blocked`, or `done`; `done` requires an evidence file or review note.
- Color semantics remain cyan=energy, green=achieved/done, yellow=opportunity/pending, red=risk/gap, purple=investment/market value.
- Keep the existing deep-blue visual system and compact professional density; do not add oversized hero metric cards.
- MiniMax secrets remain Sites-hosted environment variables and must not enter source, Git, build output, logs, tests, screenshots, or chat.
- All API errors expose only `code`, `message`, and optional `fieldErrors`; they never expose SQL, R2 keys, secrets, stacks, or original file contents.
- No unrelated refactors. Every production change must be covered by a focused failing test first, and every task ends with a focused verification and commit.

## File Structure

- `db/schema.ts`: versioned table and role/status contracts used by application code.
- `drizzle/0001_project_workbench.sql`: complete idempotent P0 D1 migration and query indexes.
- `server/workspace/contracts.mjs`: shared API validation, IDs, filenames, hashing, and error contract.
- `server/workspace/db.mjs`: prepared-statement D1 access and migration bootstrap for local/hosted runtimes.
- `server/workspace/auth.mjs`: trusted identity parsing, organization allowlist, park-role authorization.
- `server/workspace/parks.mjs`: park and member application service.
- `server/workspace/imports.mjs`: four data-contract validators and atomic R2/D1 import service.
- `server/workspace/diagnosis.mjs`: deterministic indicator engine and versioned result persistence.
- `server/workspace/tasks.mjs`: task state rules, evidence metadata, and audit records.
- `server/workspace/exports.mjs`: stable report snapshots and XLSX generation/download service.
- `server/workspace/router.mjs`: `/api/auth/me` and `/api/workspace/*` route dispatch.
- `src/services/workspaceApi.ts`: typed browser client and normalized API errors.
- `src/services/importWorkbook.ts`: XLSX/CSV parsing, fixed column mapping, preview validation.
- `src/config/indicatorDefinitions.ts`: version-controlled indicator formulas and display metadata.
- `src/stores/workspace.ts`: selected park, auth state, and draft-reset boundary without adding a store dependency.
- `src/pages/workspace/*.vue`: overview, onboarding, imports, diagnosis, tasks, and deliverables route pages.
- `src/components/workspace/*.vue`: compact workspace shell, tables, dialogs, status chips, and empty/error states.
- `public/templates/*`: four downloadable import workbooks.
- `tests/unit/workspace/*`: browser contracts, indicator, state, and page tests.
- `tests/server/workspace/*`: auth, isolation, import rollback, diagnosis, tasks, files, exports tests.
- `tests/e2e/workspace.spec.ts`: complete browser workflow and responsive acceptance.

---

### Task 1: Runtime bindings, schema, and deploy packaging

**Files:**
- Create: `db/schema.ts`
- Create: `drizzle/0001_project_workbench.sql`
- Create: `server/workspace/db.mjs`
- Create: `tests/server/workspace/schema.test.mjs`
- Modify: `.openai/hosting.json`
- Modify: `wrangler.jsonc`
- Modify: `vite.config.ts`
- Modify: `scripts/sanitize-sites-build.mjs`
- Modify: `scripts/serve-static.command`
- Modify: `tests/server/sites-build-layout.test.mjs`

**Interfaces:**
- Produces: `WORKSPACE_SCHEMA_VERSION = 1`, role/status literal types, and `ensureSchema(db): Promise<void>`.
- Produces bindings `env.DB: D1Database` and `env.FILES: R2Bucket` in both local Cloudflare Vite and Sites deployment.
- Produces build artifact `dist/.openai/drizzle/0001_project_workbench.sql`.

- [ ] **Step 1: Write failing schema and packaging tests**

```js
test('migration defines every P0 table and park-scoped indexes', async () => {
  const sql = await readFile(new URL('../../../drizzle/0001_project_workbench.sql', import.meta.url), 'utf8')
  for (const table of ['workspace_users','parks','park_members','imports','energy_monthly','load_curve_points','enterprises','park_projects','indicator_results','tasks','files','exports','audit_logs']) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`))
  }
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS idx_park_members_park_user/)
})
```

Extend `sites-build-layout.test.mjs` to require `dist/.openai/drizzle/0001_project_workbench.sql` and reject both `.env.local` and `.dev.vars` anywhere in `dist`.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/server/workspace/schema.test.mjs tests/server/sites-build-layout.test.mjs`

Expected: FAIL because the migration and packaged migration do not exist.

- [ ] **Step 3: Add the minimal complete migration and schema bootstrap**

Define all thirteen tables from the spec. Use text UUIDs, ISO timestamps, integer booleans, integer cents/Wh where exact aggregation matters, `CHECK` constraints for roles/statuses, foreign keys, and only the indexes required by park/period/status queries. `ensureSchema(db)` reads an exported array of one-statement SQL strings and executes them with `db.batch(statements.map(sql => db.prepare(sql)))`.

Configure logical Sites bindings:

```json
{
  "project_id": "appgprj_6a8dcada0bc08191a91f9bac56519481",
  "d1": "DB",
  "r2": "FILES"
}
```

Enable the Cloudflare Vite plugin for serve and build, remove the separate Vite `/api` proxy, and copy `drizzle/*.sql` to `dist/.openai/drizzle/` after sanitization.

- [ ] **Step 4: Verify schema and build layout**

Run: `npm run build && node --test tests/server/workspace/schema.test.mjs tests/server/sites-build-layout.test.mjs`

Expected: PASS; build contains client, Worker, and migration, with no local secret snapshots.

- [ ] **Step 5: Commit**

```bash
git add db drizzle server/workspace/db.mjs tests/server/workspace/schema.test.mjs .openai/hosting.json wrangler.jsonc vite.config.ts scripts/sanitize-sites-build.mjs scripts/serve-static.command tests/server/sites-build-layout.test.mjs
git commit -m "feat: add workspace persistence bindings"
```

---

### Task 2: Trusted identity, organization admission, parks, and members

**Files:**
- Create: `server/workspace/contracts.mjs`
- Create: `server/workspace/auth.mjs`
- Create: `server/workspace/parks.mjs`
- Create: `server/workspace/router.mjs`
- Create: `tests/server/workspace/fakes.mjs`
- Create: `tests/server/workspace/auth-parks.test.mjs`
- Modify: `server/worker.mjs`

**Interfaces:**
- Produces: `getTrustedIdentity(request, env): { userId: string, email: string }` or `WorkspaceError('AUTH_REQUIRED', 401)`.
- Produces: `requireOrgUser(db, identity, roles?)`, `requireParkRole(db, parkId, identity, allowedRoles)`.
- Produces: `createWorkspaceRouter({ db, files, now, id, ownerUserId, ownerEmail })` with `handle(request): Promise<Response | null>`.
- Produces JSON park shape `{ id, name, region, parkType, leadingIndustries, baselineYear, targetYear, applicationDirection, status, role, dataBaselineDate }`.

- [ ] **Step 1: Write failing authorization and isolation tests**

```js
test('anonymous and uninvited identities cannot list parks', async () => {
  assert.equal((await call('/api/workspace/parks')).status, 401)
  assert.equal((await call('/api/workspace/parks', { user: outsider })).status, 403)
})

test('owner is provisioned explicitly and can create isolated parks', async () => {
  const first = await createPark(owner, { name: '甲园区', baselineYear: 2025, targetYear: 2030 })
  const second = await createPark(owner, { name: '乙园区', baselineYear: 2024, targetYear: 2032 })
  assert.deepEqual((await listParks(owner)).map(item => item.id), [first.id, second.id])
  assert.equal((await getPark(memberOfFirst, second.id)).status, 403)
})
```

Cover `org_admin`, `org_member`, `admin`, `manager`, `specialist`, `viewer`, invited-email binding, and spoofed client headers/body fields.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/server/workspace/auth-parks.test.mjs`

Expected: FAIL because workspace auth and park routes do not exist.

- [ ] **Step 3: Implement strict server-side authorization and park CRUD**

Trust only `oai-authenticated-user-id` and `oai-authenticated-user-email`. Permit loopback-only test identity headers only when `env.DEV_AUTH_ENABLED === 'true'` and `new URL(request.url).hostname` is `127.0.0.1` or `localhost`. Provision only `WORKSPACE_OWNER_USER_ID`/`WORKSPACE_OWNER_EMAIL`; never promote first login.

Implement `/api/auth/me`, park list/create/get/patch, member list/invite/role patch. Every query includes `park_id`; all writes append an audit row. Route workspace requests before public API fallthrough in `server/worker.mjs`.

- [ ] **Step 4: Run focused and public API regression tests**

Run: `node --test tests/server/workspace/auth-parks.test.mjs tests/server/worker-api.test.mjs`

Expected: PASS; public health/policy endpoints remain unchanged.

- [ ] **Step 5: Commit**

```bash
git add server/workspace server/worker.mjs tests/server/workspace
git commit -m "feat: add workspace identity and park access"
```

---

### Task 3: Fixed workbook contracts, templates, and browser preview

**Files:**
- Create: `src/types/workspace.ts`
- Create: `src/services/importWorkbook.ts`
- Create: `tests/unit/workspace/importWorkbook.spec.ts`
- Create: `scripts/build-workspace-templates.mjs`
- Create: `public/templates/monthly-energy.xlsx`
- Create: `public/templates/load-curve.xlsx`
- Create: `public/templates/enterprises.xlsx`
- Create: `public/templates/projects.xlsx`
- Modify: `package.json`

**Interfaces:**
- Produces `ImportKind = 'energy_monthly' | 'load_curve' | 'enterprises' | 'projects'`.
- Produces `parseImportFile(file, kind): Promise<ImportPreview>` where `ImportPreview` includes headers, normalized rows, `rowErrors`, period, intervalMinutes, and SHA-256 digest.
- Produces `IMPORT_COLUMNS` as the single bilingual column contract shared by template builder and browser validation.

- [ ] **Step 1: Add `xlsx` and write failing contract tests**

```ts
it('rejects a load curve with duplicate timestamps or unsupported interval', async () => {
  const preview = await parseRows('load_curve', [
    { 时间: '2026-01-01 00:00', '负荷kW': 100 },
    { 时间: '2026-01-01 00:20', '负荷kW': 120 },
    { 时间: '2026-01-01 00:20', '负荷kW': 130 },
  ])
  expect(preview.rowErrors.map(item => item.code)).toEqual(expect.arrayContaining(['UNSUPPORTED_INTERVAL', 'DUPLICATE_TIMESTAMP']))
})
```

Test valid, missing column, wrong unit, negative values, and 35,041-point rejection for all four kinds.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test -- --run tests/unit/workspace/importWorkbook.spec.ts`

Expected: FAIL because parser/contracts are absent.

- [ ] **Step 3: Implement fixed parsing and generate four workbooks**

Run: `npm install xlsx@^0.18.5`

CSV/XLSX parsing must accept only documented header aliases, preserve source row numbers, reject formulas as values, normalize dates to ISO, enforce nonnegative numeric ranges, and return errors without uploading. The template builder creates one `数据模板` sheet plus a `填写说明` sheet and freezes the header row.

- [ ] **Step 4: Verify parser and generated templates**

Run: `node scripts/build-workspace-templates.mjs && npm run test -- --run tests/unit/workspace/importWorkbook.spec.ts`

Expected: PASS and all four workbooks can be reopened by `xlsx.readFile` with the exact required columns.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/types/workspace.ts src/services/importWorkbook.ts tests/unit/workspace/importWorkbook.spec.ts scripts/build-workspace-templates.mjs public/templates
git commit -m "feat: add workspace import templates"
```

---

### Task 4: Atomic import API with R2 rollback and duplicate protection

**Files:**
- Create: `server/workspace/imports.mjs`
- Create: `tests/server/workspace/imports.test.mjs`
- Modify: `server/workspace/router.mjs`

**Interfaces:**
- Produces: `validateImportPayload(kind, rows): { rows, periodStart, periodEnd, intervalMinutes }`.
- Produces: `createImportService({ db, files, now, id, digest }).list(parkId)` and `.commit({ parkId, identity, kind, filename, contentType, bytes, rows, replaceImportId? })`.
- `POST .../imports` consumes multipart fields `kind`, `metadata` JSON, and `file`; returns `{ importBatch }`.

- [ ] **Step 1: Write failing import consistency tests**

```js
test('D1 batch failure deletes normalized rows and the R2 original', async () => {
  db.failBatchAt = 2
  const response = await importFile(manager, park.id, validMonthlyFile)
  assert.equal(response.status, 500)
  assert.equal(db.rows('imports').length, 0)
  assert.equal(files.keys().length, 0)
})

test('same park kind and digest requires explicit replacement', async () => {
  assert.equal((await importFile(manager, park.id, validMonthlyFile)).status, 201)
  assert.equal((await importFile(manager, park.id, validMonthlyFile)).status, 409)
})
```

Also test file size/type, 35,040 limit, server revalidation, viewer rejection, safe R2 key, missing R2, and cross-park isolation.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/workspace/imports.test.mjs`

Expected: FAIL because import service/routes are absent.

- [ ] **Step 3: Implement chunked import with compensation**

Write pending import metadata, upload `parks/{parkId}/imports/{importId}/{safeFilename}`, insert normalized rows in batches of 400, then mark success. On any error delete rows by `import_id`, delete the metadata row and R2 object, and write a sanitized failed audit entry. Replacement deletes only the explicitly named prior import after the new import commits successfully.

- [ ] **Step 4: Run focused import and auth regression tests**

Run: `node --test tests/server/workspace/imports.test.mjs tests/server/workspace/auth-parks.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/workspace/imports.mjs server/workspace/router.mjs tests/server/workspace/imports.test.mjs
git commit -m "feat: persist validated park imports"
```

---

### Task 5: Deterministic, versioned indicator diagnosis

**Files:**
- Create: `src/config/indicatorDefinitions.ts`
- Create: `server/workspace/diagnosis.mjs`
- Create: `tests/unit/workspace/indicatorDefinitions.spec.ts`
- Create: `tests/server/workspace/diagnosis.test.mjs`
- Modify: `server/workspace/router.mjs`

**Interfaces:**
- Produces `INDICATOR_VERSION = 'p0.1'` and display definitions for data completeness, green electricity share, peak-valley ratio, renewable capacity, enterprise coverage, and project investment readiness.
- Produces `calculateIndicators({ imports, energy, load, enterprises, projects }): IndicatorResult[]` with exact statuses `achieved | gap | missing_data | not_applicable`.
- Produces diagnosis POST and latest GET response `{ version, calculatedAt, dataBaselineDate, inputImportIds, results, missingData }`.

- [ ] **Step 1: Write failing four-branch diagnosis tests**

```js
test('never fills absent inputs from demo or industry averages', () => {
  const results = calculateIndicators({ imports: [], energy: [], load: [], enterprises: [], projects: [] })
  assert.ok(results.every(item => item.status === 'missing_data' || item.status === 'not_applicable'))
  assert.ok(results.every(item => item.currentValue === null))
})
```

Add fixtures proving achieved, gap, missing-data, not-applicable, exact units, input import IDs, and immutable diagnosis history.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test -- --run tests/unit/workspace/indicatorDefinitions.spec.ts && node --test tests/server/workspace/diagnosis.test.mjs`

Expected: FAIL because definitions and engine are absent.

- [ ] **Step 3: Implement definitions and snapshot persistence**

Calculate only from normalized park rows. Store one result row per definition with a shared diagnosis run ID, formula explanation, target/current value, unit, input import IDs, version, and timestamp. A new run appends history; it never overwrites previous rows.

- [ ] **Step 4: Verify diagnosis tests**

Run: `npm run test -- --run tests/unit/workspace/indicatorDefinitions.spec.ts && node --test tests/server/workspace/diagnosis.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/config/indicatorDefinitions.ts server/workspace/diagnosis.mjs server/workspace/router.mjs tests/unit/workspace/indicatorDefinitions.spec.ts tests/server/workspace/diagnosis.test.mjs
git commit -m "feat: add deterministic park diagnosis"
```

---

### Task 6: Task state machine, evidence files, and protected downloads

**Files:**
- Create: `server/workspace/tasks.mjs`
- Create: `tests/server/workspace/tasks-files.test.mjs`
- Modify: `server/workspace/router.mjs`

**Interfaces:**
- Produces `canTransitionTask(current, next)` and `validateTaskCompletion({ evidenceCount, reviewNote })`.
- Produces task list/create/patch and file upload/download handlers.
- Evidence upload consumes multipart `file`, `ownerType='task'`, `ownerId`; stores only key metadata in D1 and bytes under `parks/{parkId}/evidence/{fileId}/{safeFilename}`.

- [ ] **Step 1: Write failing task/evidence tests**

```js
test('done requires evidence or a nonblank review note', async () => {
  const task = await createTask(manager, park.id, validTask)
  const denied = await patchTask(manager, park.id, task.id, { status: 'done' })
  assert.equal(denied.status, 422)
  const accepted = await patchTask(manager, park.id, task.id, { status: 'done', reviewNote: '已由专业负责人复核。' })
  assert.equal(accepted.status, 200)
})
```

Cover task creation from gap/missing indicator, allowed states, audit before/after, PDF/PNG/JPEG/XLSX/CSV allowlist, 10 MB limit, viewer rejection, path sanitization, cross-park and unauthenticated download denial.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/workspace/tasks-files.test.mjs`

Expected: FAIL because task/file services are absent.

- [ ] **Step 3: Implement task and protected file services**

Validate server-side ownership and park role for every object. Download bytes only after a D1 membership check and return `content-disposition: attachment` using sanitized original display name. When R2 write succeeds but D1 insert fails, delete the object. Record sanitized audit rows for success and failure.

- [ ] **Step 4: Verify focused tests**

Run: `node --test tests/server/workspace/tasks-files.test.mjs tests/server/workspace/auth-parks.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/workspace/tasks.mjs server/workspace/router.mjs tests/server/workspace/tasks-files.test.mjs
git commit -m "feat: add evidence-backed park tasks"
```

---

### Task 7: Versioned deliverables and XLSX downloads

**Files:**
- Create: `server/workspace/exports.mjs`
- Create: `tests/server/workspace/exports.test.mjs`
- Create: `tests/unit/workspace/deliverableModel.spec.ts`
- Modify: `server/workspace/router.mjs`

**Interfaces:**
- Produces `ExportType = 'diagnosis_report' | 'task_register' | 'project_investment' | 'evidence_catalog'`.
- Produces `buildExportSnapshot({ park, diagnosis, tasks, projects, files, generatedAt })` containing park, baseline date, indicator version, missing data, and generation time.
- POST exports returns preview JSON when `confirmed=false`; when confirmed, XLSX exports are stored in R2 and report exports store a print snapshot. GET returns metadata or the protected XLSX bytes using `?download=1`.

- [ ] **Step 1: Write failing export completeness tests**

```js
test('all export snapshots carry park baseline version and gaps', () => {
  const snapshot = buildExportSnapshot(fixture)
  assert.equal(snapshot.park.id, fixture.park.id)
  assert.equal(snapshot.dataBaselineDate, '2026-07-31')
  assert.equal(snapshot.indicatorVersion, 'p0.1')
  assert.deepEqual(snapshot.missingData, ['load_curve'])
})
```

Test the four export types, preview-before-confirmation, R2 key prefix, workbook headers, viewer download permission, and cross-park denial.

- [ ] **Step 2: Run and verify RED**

Run: `npm run test -- --run tests/unit/workspace/deliverableModel.spec.ts && node --test tests/server/workspace/exports.test.mjs`

Expected: FAIL because export models do not exist.

- [ ] **Step 3: Implement stable snapshots and workbooks**

Generate workbooks with a metadata sheet and a type-specific data sheet. Save only after `confirmed=true` under `parks/{parkId}/exports/{exportId}/{safeFilename}`. Report snapshots return print-safe structured JSON; browser printing is the PDF mechanism. If R2 fails, do not leave a successful export row.

- [ ] **Step 4: Verify export tests**

Run: `npm run test -- --run tests/unit/workspace/deliverableModel.spec.ts && node --test tests/server/workspace/exports.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server/workspace/exports.mjs server/workspace/router.mjs tests/server/workspace/exports.test.mjs tests/unit/workspace/deliverableModel.spec.ts
git commit -m "feat: export park project deliverables"
```

---

### Task 8: Workspace shell, login boundary, onboarding, and park switching

**Files:**
- Create: `src/services/workspaceApi.ts`
- Create: `src/stores/workspace.ts`
- Create: `src/components/workspace/WorkspaceShell.vue`
- Create: `src/components/workspace/WorkspaceTopbar.vue`
- Create: `src/components/workspace/WorkspaceStatusChip.vue`
- Create: `src/pages/workspace/WorkspaceOverviewPage.vue`
- Create: `src/pages/workspace/WorkspaceOnboardingPage.vue`
- Create: `tests/unit/workspace/WorkspaceShell.spec.ts`
- Create: `tests/unit/workspace/WorkspaceOnboardingPage.spec.ts`
- Modify: `src/router/index.ts`
- Modify: `src/app/AppHeader.vue`
- Modify: `src/app/AppShell.vue`
- Modify: `src/styles/global.css`
- Modify: `src/styles/tokens.css`

**Interfaces:**
- Produces `workspaceApi` methods matching Task 2–7 routes and `WorkspaceApiError` with `status`, `code`, `message`, `fieldErrors`.
- Produces shared workspace state `{ auth, parks, selectedPark, loading, error }`; `selectPark(id)` clears import preview and unsaved page draft before navigation.
- Produces routes `/workspace`, `/workspace/onboarding`, `/workspace/imports`, `/workspace/diagnosis`, `/workspace/tasks`, `/workspace/deliverables`.

- [ ] **Step 1: Write failing shell and switching tests**

```ts
it('clears park-scoped drafts when the selected park changes', async () => {
  const state = createWorkspaceState(fakeApi)
  state.importDraft.value = fixturePreview
  await state.selectPark('park-b')
  expect(state.importDraft.value).toBeNull()
})
```

Test anonymous login call-to-action, uninvited access state, four overview metrics only, long park name, role visibility, and admin-only create/invite controls.

- [ ] **Step 2: Run and verify RED**

Run: `npm run test -- --run tests/unit/workspace/WorkspaceShell.spec.ts tests/unit/workspace/WorkspaceOnboardingPage.spec.ts`

Expected: FAIL because workspace UI is absent.

- [ ] **Step 3: Implement compact workspace shell and onboarding**

Add a clear top-level mode switch, preserving all demonstration routes. Anonymous workbench access displays the Sites login action and returns to `/#/workspace`. The workspace top bar always shows selected park, baseline date, completeness, and role. Overview shows exactly data completeness, achieved rate, open tasks, and nearest due date in compact cards. Onboarding creates a truly empty park.

- [ ] **Step 4: Run focused component and existing shell tests**

Run: `npm run test -- --run tests/unit/workspace/WorkspaceShell.spec.ts tests/unit/workspace/WorkspaceOnboardingPage.spec.ts tests/unit/AppShell.spec.ts`

Expected: PASS.

- [ ] **Step 5: Start the local app and inspect the first meaningful visual gate**

Run: `DEV_AUTH_ENABLED=true WORKSPACE_OWNER_USER_ID=local-owner WORKSPACE_OWNER_EMAIL=owner@example.test npm run dev -- --host 127.0.0.1 --port 4173`

Open `http://127.0.0.1:4173/#/workspace` at 1440×900, 1280×900, and 390×844. Verify no header overlap, no oversized blocks, stable long-name wrapping, visible focus states, and the approved deep-blue visual match. Fix only observed workspace CSS defects.

- [ ] **Step 6: Commit**

```bash
git add src/services/workspaceApi.ts src/stores/workspace.ts src/components/workspace src/pages/workspace/WorkspaceOverviewPage.vue src/pages/workspace/WorkspaceOnboardingPage.vue src/router/index.ts src/app/AppHeader.vue src/app/AppShell.vue src/styles tests/unit/workspace
git commit -m "feat: add park workspace shell"
```

---

### Task 9: Import, diagnosis, task, evidence, and deliverable pages

**Files:**
- Create: `src/pages/workspace/WorkspaceImportsPage.vue`
- Create: `src/pages/workspace/WorkspaceDiagnosisPage.vue`
- Create: `src/pages/workspace/WorkspaceTasksPage.vue`
- Create: `src/pages/workspace/WorkspaceDeliverablesPage.vue`
- Create: `src/components/workspace/ImportPreviewTable.vue`
- Create: `src/components/workspace/DiagnosisMatrix.vue`
- Create: `src/components/workspace/TaskBoard.vue`
- Create: `src/components/workspace/DeliverablePreview.vue`
- Create: `tests/unit/workspace/WorkspaceFlowPages.spec.ts`
- Create: `tests/e2e/workspace.spec.ts`
- Modify: `src/router/index.ts`
- Modify: `playwright.config.ts`
- Modify: `scripts/start.command`

**Interfaces:**
- Imports page consumes `parseImportFile` then uploads only after explicit preview confirmation.
- Diagnosis page consumes latest diagnosis and can generate task drafts only from `gap`/`missing_data` rows.
- Tasks page exposes only role-permitted actions and links evidence to a selected task.
- Deliverables page previews all four result types before save/download and opens diagnosis print layout.

- [ ] **Step 1: Write failing page and browser workflow tests**

```ts
test('admin completes the P0 workflow and data survives reload', async ({ page }) => {
  await page.goto('/#/workspace/onboarding')
  await createPark(page, '测试零碳园区')
  await importTemplate(page, '月度能源账单', 'tests/fixtures/workspace/monthly-energy.xlsx')
  await page.getByRole('button', { name: '生成指标诊断' }).click()
  await page.getByRole('button', { name: '转为任务' }).first().click()
  await attachEvidence(page, 'tests/fixtures/workspace/evidence.pdf')
  await page.getByRole('button', { name: '预览任务表' }).click()
  await page.reload()
  await expect(page.getByText('测试零碳园区')).toBeVisible()
})
```

Add tests for invalid-row focus, two-park isolation, viewer API/UI denial, long filename, 1440×900, 1280×900, and 390×844 header/table/modal overflow.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm run test -- --run tests/unit/workspace/WorkspaceFlowPages.spec.ts && npm run test:e2e -- --grep "P0 workflow"`

Expected: FAIL because flow pages are absent.

- [ ] **Step 3: Implement the four workflow pages**

Use native HTML tables with sticky headers, horizontal overflow, explicit action labels, keyboard-focusable error rows, loading/empty/error states, and desktop guidance for complex mapping. Do not introduce a UI framework or generic form abstraction. Maintain the color semantics in Global Constraints.

- [ ] **Step 4: Run focused unit and E2E tests**

Run: `npm run test -- --run tests/unit/workspace && npm run test:e2e -- tests/e2e/workspace.spec.ts`

Expected: PASS.

- [ ] **Step 5: Perform browser visual inspection and repair only verified defects**

Inspect screenshots for all required viewports and each workspace route. Confirm headers and titles do not overlap, tables remain usable, modals fit, long text wraps, semantic colors remain readable, and existing dashboard styling is unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/pages/workspace src/components/workspace src/router/index.ts tests/unit/workspace tests/e2e/workspace.spec.ts playwright.config.ts scripts/start.command
git commit -m "feat: complete park workspace workflow"
```

---

### Task 10: MiniMax auth gate, full regression, deployment, and production verification

**Files:**
- Create: `tests/server/workspace/qa-auth.test.mjs`
- Modify: `server/worker.mjs`
- Modify: `server/workspace/router.mjs`
- Modify: `README.md`
- Modify: `docs/PRODUCT-ACCEPTANCE.md`

**Interfaces:**
- Public policy list/search and deterministic preset answers remain anonymous.
- Live `POST /api/qa` requires trusted identity in production and sends at most six policy evidence items plus selected-park summary fields; it never sends files, members, full load curves, or unrelated rows.
- Production release uses the existing Sites project and its managed D1/R2 bindings; no new site is created.

- [ ] **Step 1: Write failing QA privacy/auth tests**

```js
test('production live QA rejects anonymous requests before provider fetch', async () => {
  const response = await worker(new Request('https://example.test/api/qa', requestOptions), productionEnv)
  assert.equal(response.status, 401)
  assert.equal(providerCalls.length, 0)
})
```

Test six-evidence limit, selected-park summary allowlist, no file/member/load-array leakage, no-key 503, and public policy search availability when D1/R2 are unavailable.

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/server/workspace/qa-auth.test.mjs`

Expected: FAIL because live QA remains anonymous.

- [ ] **Step 3: Implement the production QA identity boundary and update operator docs**

Require Sites identity for live provider calls, use the existing evidence-bound prompt, and serialize only approved aggregate park context. Document local one-command startup, four templates, owner provisioning, managed D1/R2 migration, hosted `MINIMAX_API_KEY` handoff, backup/export, and acceptance commands. Do not copy `.env.local` into hosted secrets.

- [ ] **Step 4: Run complete verification**

Run: `npm run typecheck`

Run: `npm run test -- --run`

Run: `npm run test:server`

Run: `npm run test:e2e`

Run: `npm run build`

Run: `git diff --check`

Expected: all existing 25 unit, 18 server, and 12 E2E tests remain green; every new P0 test passes; production build contains client, Worker, and migration, and contains no `.env.local`, `.dev.vars`, MiniMax key, or R2 object key leaked to client files.

- [ ] **Step 5: Review the final diff against all 13 P0 acceptance requirements**

Inspect `git status --short`, `git diff --stat`, and a secret-pattern scan over tracked and built files. Verify each changed line maps to the approved spec and record any unavailable hosted secret as an explicit operational limitation, not as a passed feature.

- [ ] **Step 6: Commit and push**

```bash
git add server tests README.md docs/PRODUCT-ACCEPTANCE.md
git commit -m "chore: verify park workbench release"
git push origin main
```

- [ ] **Step 7: Deploy the existing Sites project and run production smoke tests**

Deploy the verified `dist` to project `appgprj_6a8dcada0bc08191a91f9bac56519481`. Verify on `https://zero-carbon-park-decision.xiongjianbin.chatgpt.site`: root, `/#/dashboard`, `/#/workspace`, `/api/health`, policy search, anonymous workspace denial, signed-in park list, two-park isolation, one valid import, protected file download, diagnosis generation, task completion constraint, and confirmed export download.

Expected: public demo stays anonymous and healthy; signed-in real workspace persists through reload; unauthorized/cross-park reads fail; no secret is exposed. If `MINIMAX_API_KEY` is not configured in Sites, live QA must return its safe unavailable state and no provider call is claimed.

- [ ] **Step 8: Final release handoff**

Report the public URL, Git commit, exact verification counts, production smoke results, data/identity boundary, and any remaining operator-only secret configuration. Include no key values, internal source credential, raw R2 keys, or user identifiers.
