import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'
import RoadmapPage from '@/pages/roadmap/RoadmapPage.vue'
import ProjectsPage from '@/pages/projects/ProjectsPage.vue'
import PoliciesPage from '@/pages/policies/PoliciesPage.vue'
import InvestmentPage from '@/pages/investment/InvestmentPage.vue'
import OperationsPage from '@/pages/operations/OperationsPage.vue'
import QaPage from '@/pages/qa/QaPage.vue'
import WorkspaceShell from '@/components/workspace/WorkspaceShell.vue'
import WorkspaceOverviewPage from '@/pages/workspace/WorkspaceOverviewPage.vue'
import WorkspaceOnboardingPage from '@/pages/workspace/WorkspaceOnboardingPage.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
    { path: '/roadmap', name: 'roadmap', component: RoadmapPage },
    { path: '/projects', name: 'projects', component: ProjectsPage },
    { path: '/policies', name: 'policies', component: PoliciesPage },
    { path: '/investment', name: 'investment', component: InvestmentPage },
    { path: '/operations/vpp', name: 'operations-vpp', component: OperationsPage, props: { initialView: 'vpp' } },
    { path: '/operations', name: 'operations', component: OperationsPage },
    { path: '/qa', name: 'qa', component: QaPage },
    {
      path: '/workspace',
      component: WorkspaceShell,
      children: [
        { path: '', name: 'workspace-overview', component: WorkspaceOverviewPage },
        { path: 'onboarding', name: 'workspace-onboarding', component: WorkspaceOnboardingPage },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
