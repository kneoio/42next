import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export const PROMPT_TYPES = ['SONG', 'ADVERTISEMENT', 'REMINDER', 'GENERATOR'] as const
export type PromptType = typeof PROMPT_TYPES[number]

export interface Prompt {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  title: string
  description: string
  prompt: string
  promptType: PromptType
  languageTag: string
  enabled: boolean
  master: boolean
  locked: boolean
  podcast: boolean
  draftId?: string | null
  masterId?: string | null
  version?: number
}

export const usePromptsStore = defineStore('prompts', () => {
  const prompts = ref<Prompt[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadPrompts(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<Prompt>('/prompts', page, size)
      prompts.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load prompts:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchPrompt(id: string) {
    return mixplaApiService.getDocument<Prompt>('/prompts', id)
  }

  async function savePrompt(id: string | null, data: Partial<Prompt>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as Prompt
    if (id) {
      return mixplaApiService.updateDictionaryItem<Prompt>('/prompts', id, payload)
    } else {
      return mixplaApiService.createDictionaryItem<Prompt>('/prompts', payload)
    }
  }

  async function deletePrompt(id: string) {
    return mixplaApiService.deleteDictionaryItem('/prompts', id)
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
