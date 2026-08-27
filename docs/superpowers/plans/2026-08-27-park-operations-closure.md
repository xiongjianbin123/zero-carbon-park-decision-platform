# Park Operations Closure P1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing real-project workspace into a persistent collaboration and application-readiness workflow.

**Architecture:** Keep the existing D1/R2 schema and add narrow read APIs over files, audit logs, and exports. Derive readiness in a pure frontend model from diagnosis and tasks, then expose it through focused Vue pages and existing workspace navigation.

**Tech Stack:** Vue 3, TypeScript, Vite, Cloudflare Worker/D1/R2, Node test runner, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-08-27-park-operations-closure-design.md`

## Global Constraints

- Preserve the existing deep-blue source-grid-load-storage visual language.
- Do not add a database table or change deterministic indicator calculations.
- Every new workspace API must enforce trusted identity and park membership.
- Write a failing behavior test before production code for every feature.
- Do not add real-time EMS/VPP control or let MiniMax mutate project data.

---

### Task 1: Read APIs for evidence, activity, and export history

**Files:**
- Modify: `tests/server/workspace/tasks-files.test.mjs`
- Modify: `tests/server/workspace/exports.test.mjs`
- Modify: `server/workspace/tasks.mjs`
- Modify: `server/workspace/exports.mjs`
- Modify: `server/workspace/router.mjs`

**Interfaces:**
- Produces: `GET /api/workspace/parks/:parkId/files?ownerType=task&ownerId=:taskId`
- Produces: `GET /api/workspace/parks/:parkId/tasks/:taskId/activity`
- Produces: `GET /api/workspace/parks/:parkId/exports`

- [ ] Write service tests proving list contents and cross-park isolation.
- [ ] Run the focused tests and confirm the missing routes fail.
- [ ] Add the three minimal read operations and response shapes.
- [ ] Run focused and complete server tests.

### Task 2: Project member management

**Files:**
- Create: `src/pages/workspace/WorkspaceMembersPage.vue`
- Create: `tests/unit/workspace/WorkspaceMembersPage.spec.ts`
- Modify: `src/services/workspaceApi.ts`
- Modify: `src/types/workspace.ts`
- Modify: `src/router/index.ts`
- Modify: `src/components/workspace/WorkspaceShell.vue`

**Interfaces:**
- Produces: `listMembers`, `inviteMember`, and `updateMember` API client methods.

- [ ] Write a failing page test for administrator and viewer behavior.
- [ ] Run the test and confirm the page/API behavior is absent.
- [ ] Implement the smallest member page and wire its route/navigation.
- [ ] Run the focused unit tests.

### Task 3: Task evidence and activity drawer

**Files:**
- Create: `src/components/workspace/TaskDetailDrawer.vue`
- Modify: `src/pages/workspace/WorkspaceTasksPage.vue`
- Modify: `src/components/workspace/TaskBoard.vue`
- Modify: `src/services/workspaceApi.ts`
- Modify: `src/types/workspace.ts`
- Modify: `tests/unit/workspace/WorkspaceFlowPages.spec.ts`

**Interfaces:**
- Consumes: Task 1 evidence/activity endpoints.
- Produces: drawer events `openTask` and `saveReviewNote`.

- [ ] Write a failing page test that opens a task and observes files, activity, and review-note saving.
- [ ] Run the test and confirm the detail flow is absent.
- [ ] Implement API methods, drawer, downloads, and review-note persistence.
- [ ] Run the focused unit tests.

### Task 4: Deterministic application readiness

**Files:**
- Create: `src/services/readinessModel.ts`
- Create: `src/pages/workspace/WorkspaceReadinessPage.vue`
- Create: `tests/unit/workspace/readinessModel.spec.ts`
- Create: `tests/unit/workspace/WorkspaceReadinessPage.spec.ts`
- Modify: `src/router/index.ts`
- Modify: `src/components/workspace/WorkspaceShell.vue`

**Interfaces:**
- Produces: `buildReadinessRows(diagnosis, tasks)` with `ready`, `in_progress`, `action_required`, and `not_applicable` states.

- [ ] Write pure-model failing tests with hand-derived readiness counts.
- [ ] Run tests and confirm the model does not exist.
- [ ] Implement the pure model and compact matrix page.
- [ ] Run focused model and page tests.

### Task 5: Export history and operational overview

**Files:**
- Modify: `src/pages/workspace/WorkspaceDeliverablesPage.vue`
- Modify: `src/pages/workspace/WorkspaceOverviewPage.vue`
- Modify: `src/services/workspaceApi.ts`
- Modify: `tests/unit/workspace/WorkspaceFlowPages.spec.ts`

**Interfaces:**
- Consumes: Task 1 export-history endpoint and Task 4 readiness model.

- [ ] Write failing tests for persisted export history and compact operational indicators.
- [ ] Run tests and confirm the new information is absent.
- [ ] Add history downloads, evidence coverage, task-state rails, and readiness summary.
- [ ] Run focused unit tests.

### Task 6: Browser acceptance and release verification

**Files:**
- Modify: `tests/e2e/workspace.spec.ts`
- Modify: `docs/PRODUCT-ACCEPTANCE.md`

**Interfaces:**
- Validates the complete P1.1 workflow in desktop and 390×844 viewports.

- [ ] Add browser assertions for navigation, task detail, readiness, members, and export history.
- [ ] Run TypeScript, unit, server, and browser tests.
- [ ] Run the production build and inspect `git diff --check` plus `git status --short`.
- [ ] Update acceptance documentation with fresh counts and remaining deployment-only checks.

