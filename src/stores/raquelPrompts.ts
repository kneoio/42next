import { defineStore } from 'pinia'
import { ref } from 'vue'
import raquelApiService from '@/services/raquelApi'

export const RAQUEL_PROMPT_TYPES = ['SONG', 'ADVERTISEMENT', 'REMINDER', 'GENERATOR'] as const
export type RaquelPromptType = typeof RAQUEL_PROMPT_TYPES[number]

export interface RaquelPrompt {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  title: string
  description: string
  prompt: string
  promptType: RaquelPromptType
  languageTag: string
  enabled: boolean
  master: boolean
  locked: boolean
  podcast: boolean
  draftId?: string | null
  masterId?: string | null
  version?: number
}

export const useRaquelPromptsStore = defineStore('raquelPrompts', () => {
  const prompts = ref<RaquelPrompt[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadPrompts(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await raquelApiService.getPagedDictionary<RaquelPrompt>('/prompts', page, size)
      prompts.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load raquel prompts:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchPrompt(id: string) {
    return raquelApiService.getDocument<RaquelPrompt>('/prompts', id)
  }

  async function savePrompt(id: string | null, data: Partial<RaquelPrompt>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as RaquelPrompt
    if (id) {
      return raquelApiService.updateDictionaryItem<RaquelPrompt>('/prompts', id, payload)
    } else {
      return raquelApiService.createDictionaryItem<RaquelPrompt>('/prompts', payload)
    }
  }

  async function deletePrompt(id: string) {
    return raquelApiService.deleteDictionaryItem('/prompts', id)
  }

  return {
    prompts,
    loading,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    loadPrompts,
    fetchPrompt,
    savePrompt,
    deletePrompt,
  }
})
