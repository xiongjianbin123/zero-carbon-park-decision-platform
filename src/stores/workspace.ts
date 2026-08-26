import { computed, inject, ref, type InjectionKey, type Ref } from 'vue'
import { workspaceApi, type WorkspaceApi, type WorkspaceUser } from '@/services/workspaceApi'
import type { ParkProject } from '@/types/workspace'

type Draft = Record<string, unknown> | null

export interface WorkspaceState {
  auth: Ref<WorkspaceUser | null>
  parks: Ref<ParkProject[]>
  selectedParkId: Ref<string | null>
  selectedPark: Readonly<Ref<ParkProject | null>>
  importDraft: Ref<Draft>
  pageDraft: Ref<Draft>
  loading: Ref<boolean>
  error: Ref<{ status?: number; code?: string; message: string } | null>
  initialized: Ref<boolean>
  bootstrap: () => Promise<void>
  selectPark: (id: string) => Promise<void>
  addPark: (input: Parameters<WorkspaceApi['createPark']>[0]) => Promise<ParkProject>
}

export function createWorkspaceState(api: Pick<WorkspaceApi, 'me' | 'listParks'> & Partial<WorkspaceApi>): WorkspaceState {
  const auth = ref<WorkspaceUser | null>(null)
  const parks = ref<ParkProject[]>([])
  const selectedParkId = ref<string | null>(null)
  const importDraft = ref<Draft>(null)
  const pageDraft = ref<Draft>(null)
  const loading = ref(false)
  const error = ref<{ status?: number; code?: string; message: string } | null>(null)
  const initialized = ref(false)
  const selectedPark = computed(() => parks.value.find((park) => park.id === selectedParkId.value) ?? null)

  async function bootstrap() {
    loading.value = true
    error.value = null
    try {
      auth.value = await api.me()
      parks.value = await api.listParks()
      if (!selectedParkId.value || !parks.value.some((park) => park.id === selectedParkId.value)) {
        selectedParkId.value = parks.value[0]?.id ?? null
      }
    } catch (caught) {
      const value = caught as { status?: number; code?: string; message?: string }
      auth.value = null
      parks.value = []
      selectedParkId.value = null
      error.value = { status: value.status, code: value.code, message: value.message || '项目工作台暂时不可用。' }
    } finally {
      initialized.value = true
      loading.value = false
    }
  }

  async function selectPark(id: string) {
    if (id === selectedParkId.value) return
    selectedParkId.value = parks.value.some((park) => park.id === id) ? id : null
    importDraft.value = null
    pageDraft.value = null
  }

  async function addPark(input: Parameters<WorkspaceApi['createPark']>[0]) {
    if (!api.createPark) throw new Error('当前客户端未配置园区建档能力。')
    const park = await api.createPark(input)
    parks.value.push(park)
    await selectPark(park.id)
    return park
  }

  return { auth, parks, selectedParkId, selectedPark, importDraft, pageDraft, loading, error, initialized, bootstrap, selectPark, addPark }
}

export const workspaceState = createWorkspaceState(workspaceApi)
export const WorkspaceStateKey: InjectionKey<WorkspaceState> = Symbol('WorkspaceState')
export function useWorkspaceState() { return inject(WorkspaceStateKey, workspaceState) }

