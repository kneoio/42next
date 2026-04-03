import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiService from '@/services/api'

export interface Draft {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  title: string
  content: string
  description: string
  languageTag: string
  archived: number
  enabled: boolean
  master: boolean
  locked: boolean
  version?: number
}

export const useDraftsStore = defineStore('drafts', () => {
  const drafts = ref<Draft[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadDrafts(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await apiService.getPagedDictionary<Draft>('/drafts', page, size)
      drafts.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchDraft(id: string) {
    return apiService.getDocument<Draft>('/drafts', id)
  }

  async function saveDraft(id: string | null, data: Partial<Draft>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as Draft
    if (id) {
      return apiService.updateDictionaryItem<Draft>('/drafts', id, payload)
    } else {
      return apiService.createDictionaryItem<Draft>('/drafts', payload)
    }
  }

  async function deleteDraft(id: string) {
    return apiService.deleteDictionaryItem('/drafts', id)
  }

  return {
    drafts,
    loading,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    loadDrafts,
    fetchDraft,
    saveDraft,
    deleteDraft,
  }
})
