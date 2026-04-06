import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export type SceneTimingMode = 'ABSOLUTE_TIME' | 'RELATIVE_TO_STREAM_START'

export interface ScenePromptDTO {
  promptId?: string
  active?: boolean
  rank?: number
  weight?: number
}

export interface ScriptScene {
  id?: string
  scriptId?: string
  title?: string
  prompts?: ScenePromptDTO[]
  startTime?: string
  timingMode?: SceneTimingMode
  durationSeconds?: number
  seqNum?: number
  oneTimeRun?: boolean
  weekdays?: number[]
  talkativity?: number
}

export interface Script {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  name: string
  description: string
  defaultProfileId?: string
  labels: string[]
  accessLevel?: number
  timingMode?: SceneTimingMode
  scenes?: ScriptScene[]
  requiredVariables?: Array<{ name: string; type: string; description: string; required?: boolean }>
}

export const useScriptsStore = defineStore('scripts', () => {
  const scripts = ref<Script[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  // Scenes flat list
  const scenes = ref<ScriptScene[]>([])
  const scenesTotalCount = ref(0)
  const scenesPageNum = ref(1)
  const scenesPageSize = ref(10)

  async function loadScripts(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<Script>('/scripts', page, size)
      scripts.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function loadScenes(page = scenesPageNum.value, size = scenesPageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<ScriptScene>('/scenes', page, size)
      scenes.value = result.entries
      scenesTotalCount.value = result.count
      scenesPageNum.value = result.pageNum
      scenesPageSize.value = result.pageSize
    } catch (error) {
      console.error('Failed to load scenes:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchScript(id: string) {
    return mixplaApiService.getDocument<Script>('/scripts', id)
  }

  async function saveScript(id: string | null, data: Partial<Script>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as Script
    if (id) {
      return mixplaApiService.updateDictionaryItem<Script>('/scripts', id, payload)
    } else {
      return mixplaApiService.createDictionaryItem<Script>('/scripts', payload)
    }
  }

  async function deleteScript(id: string) {
    return mixplaApiService.deleteDictionaryItem('/scripts', id)
  }

  async function fetchScenesForScript(scriptId: string): Promise<ScriptScene[]> {
    const result = await mixplaApiService.getPagedDictionary<ScriptScene>(`/scripts/${scriptId}/scenes`, 1, 200)
    return result.entries
  }

  async function saveScene(scriptId: string, scene: Partial<ScriptScene>): Promise<ScriptScene> {
    return mixplaApiService.post<ScriptScene>(`/scripts/${scriptId}/scenes`, scene)
  }

  async function deleteScene(sceneId: string): Promise<void> {
    return mixplaApiService.deleteDictionaryItem('/scenes', sceneId)
  }

  async function exportScript(id: string): Promise<Blob> {
    return mixplaApiService.fetchBlob(`/scripts/${id}/export`)
  }

  async function importScript(file: File): Promise<void> {
    const text = await file.text()
    const data = JSON.parse(text)
    await mixplaApiService.post('/scripts/import', data)
  }

  return {
    scripts,
    loading,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    loadScripts,
    scenes,
    scenesTotalCount,
    scenesPageNum,
    scenesPageSize,
    loadScenes,
    fetchScript,
    saveScript,
    deleteScript,
    fetchScenesForScript,
    saveScene,
    deleteScene,
    exportScript,
    importScript,
  }
})
