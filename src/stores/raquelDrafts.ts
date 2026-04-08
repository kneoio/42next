import { defineStore } from 'pinia'
import { ref } from 'vue'
import raquelApiService from '@/services/raquelApi'

export interface RaquelDraft {
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

export const useRaquelDraftsStore = defineStore('raquelDrafts', () => {
  const drafts = ref<RaquelDraft[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadDrafts(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await raquelApiService.getPagedDictionary<RaquelDraft>('/drafts', page, size)
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
    return raquelApiService.getDocument<RaquelDraft>('/drafts', id)
  }

  async function saveDraft(id: string | null, data: Partial<RaquelDraft>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as RaquelDraft
    if (id) {
      return raquelApiService.updateDictionaryItem<RaquelDraft>('/drafts', id, payload)
    } else {
      return raquelApiService.createDictionaryItem<RaquelDraft>('/drafts', payload)
    }
  }

  async function deleteDraft(id: string) {
    return raquelApiService.deleteDictionaryItem('/drafts', id)
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
