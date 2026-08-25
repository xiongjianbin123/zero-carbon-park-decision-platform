# Energy Operations Fusion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a native energy-operations workspace that connects zero-carbon planning with source-grid-load-storage operation and VPP market value.

**Architecture:** Extend the existing single `ParkConfig` with typed operations scenarios, resources, market channels, and risks. Render one native Vue page with four switchable views and reuse existing visual primitives; connect the page to navigation, guided briefing, roadmap, projects, investment, and Q&A without importing either source application runtime.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Vitest, Playwright, CSS/SVG.

**Spec:** `docs/superpowers/specs/2026-08-25-energy-operations-fusion-design.md`

## Global Constraints

- Preserve the approved deep-blue energy visual system and existing six routes.
- Use only local demo data in this phase and label it as demo data.
- Do not expose implementation details in end-user copy.
- Do not add a runtime dependency on either source system.
- API keys and `.env.local` remain untouched.

---

### Task 1: Typed operations domain and regression tests

**Files:**
- Modify: `src/types/park.ts`
- Modify: `src/config/park.ts`
- Modify: `src/utils/parkValidation.ts`
- Modify: `tests/unit/parkValidation.spec.ts`
- Create: `tests/unit/OperationsPage.spec.ts`

**Interfaces:**
- Produces: `ParkConfig.operations`, `OperationScenario`, `OperationResource`, `MarketChannel`, `OperationRisk`.

- [ ] Write tests asserting three scenarios, scenario-specific energy data, resources, market channels, and risks.
- [ ] Run the focused tests and confirm they fail because `operations` and the page do not exist.
- [ ] Add the smallest typed configuration and validation needed by the tests.
- [ ] Re-run focused tests until the domain tests pass and the page test fails only on the missing component.

### Task 2: Native energy-operations page

**Files:**
- Create: `src/pages/operations/OperationsPage.vue`
- Modify: `src/router/index.ts`
- Modify: `src/app/AppHeader.vue`
- Modify: `src/styles/global.css`
- Test: `tests/unit/OperationsPage.spec.ts`
- Test: `tests/unit/AppShell.spec.ts`

**Interfaces:**
- Consumes: `parkConfig.operations`.
- Produces: route `/operations`, scenario buttons with `data-scenario-id`, view buttons with `data-operation-view`, and page root `data-page="operations"`.

- [ ] Extend navigation and page tests to expect the seventh route and scene switching.
- [ ] Run focused tests and confirm they fail on missing navigation/page behavior.
- [ ] Implement the route, page, four views, 24-hour SVG chart, resource cards, market cards, and action list.
- [ ] Re-run focused tests until all pass.

### Task 3: Cross-page closed loop and guided briefing

**Files:**
- Modify: `src/pages/dashboard/DashboardPage.vue`
- Modify: `src/pages/roadmap/RoadmapPage.vue`
- Modify: `src/pages/projects/ProjectsPage.vue`
- Modify: `src/pages/investment/InvestmentPage.vue`
- Modify: `src/pages/qa/QaPage.vue`
- Modify: `src/config/park.ts`
- Modify: `src/app/GuidedTourBar.vue`
- Modify: `tests/unit/RoadmapPage.spec.ts`
- Modify: `tests/e2e/platform.spec.ts`

**Interfaces:**
- Produces: semantic links to `/operations`, seven-stop guided tour, and operations Q&A preset.

- [ ] Add tests for cross-page entries and seven-stop guided reporting.
- [ ] Run focused tests and confirm the new expectations fail.
- [ ] Add only the required links, tour content, and Q&A content.
- [ ] Re-run focused unit and browser tests until they pass.

### Task 4: Visual evidence, documentation, and complete verification

**Files:**
- Modify: `tests/e2e/visual.spec.ts`
- Modify: `README.md`
- Modify: `ACCEPTANCE.md`
- Modify: `WORK_STATE.md`
- Create: `artifacts/screenshots/operations-1440x900.png` via Playwright.

**Interfaces:**
- Produces: documented route, screenshot, verification evidence, and resumable state.

- [ ] Add the operations page to screenshot coverage.
- [ ] Update README route and configuration documentation.
- [ ] Run `npm run typecheck`, `npm run test -- --run`, `npm run test:server`, `npm run test:e2e`, and `npm run build`.
- [ ] Inspect the real operations screenshot, fix visible defects, and repeat affected checks.
- [ ] Mark each acceptance item with its verified evidence and finalize `WORK_STATE.md`.
