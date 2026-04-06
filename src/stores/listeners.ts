import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export interface Listener {
  id: string
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
  localizedName: Record<string, string>
  userId?: number
  telegramName?: string
  country?: string
  nickName?: Record<string, string[]>
  slugName?: string
  archived?: number
  listenerType?: string
  listenerOf?: string[]
  userData?: Record<string, string>
}

// The API returns entries as { id, listener: {...} } or flat — handle both
export interface ListenerEntry {
  id: string
  listener?: Listener
  // flat fields for when API returns without nesting
  localizedName?: Record<string, string>
  telegramName?: string
  country?: string
  slugName?: string
}

export const useListenersStore = defineStore('listeners', () => {
  const listeners = ref<ListenerEntry[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadListeners(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<ListenerEntry>('/listeners', page, size)
      listeners.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchListener(id: string) {
    return mixplaApiService.getDocument<ListenerEntry>('/listeners', id)
  }

  async function saveListener(id: string | null, data: Partial<Listener>) {
    if (id) return mixplaApiService.updateDictionaryItem<ListenerEntry>('/listeners', id, data)
    return mixplaApiService.createDictionaryItem<ListenerEntry>('/listeners', data)
  }

  async function deleteListener(id: string) {
    return mixplaApiService.deleteDictionaryItem('/listeners', id)
  }

  return { listeners, loading, totalCount, pageNum, pageSize, maxPage, loadListeners, fetchListener, saveListener, deleteListener }
})
