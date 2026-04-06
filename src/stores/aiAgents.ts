import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export interface LanguagePreference {
  languageTag: string
  weight: number
}

export interface AiAgent {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  name: string
  preferredLang: LanguagePreference[]
  llmType?: string
  searchEngineType?: string
  talkativity: number
  podcastMode: number
}

export const useAiAgentsStore = defineStore('aiAgents', () => {
  const agents = ref<AiAgent[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadAgents(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<AiAgent>('/aiagents', page, size)
      agents.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchAgent(id: string) {
    return mixplaApiService.getDocument<AiAgent>('/aiagents', id)
  }

  async function saveAgent(id: string | null, data: Partial<AiAgent>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as AiAgent
    if (id) return mixplaApiService.updateDictionaryItem<AiAgent>('/aiagents', id, payload)
    return mixplaApiService.createDictionaryItem<AiAgent>('/aiagents', payload)
  }

  async function deleteAgent(id: string) {
    return mixplaApiService.deleteDictionaryItem('/aiagents', id)
  }

  return { agents, loading, totalCount, pageNum, pageSize, maxPage, loadAgents, fetchAgent, saveAgent, deleteAgent }
})
