import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export interface EventAction {
  promptId?: string
  active?: boolean
  rank?: number
  weight?: number
}

export interface BroadcastEvent {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  brandId: string
  timeZone?: string
  type: string
  description: string
  priority: string
  actions?: EventAction[]
}

export const EVENT_TYPES = [
  { label: 'Advertisement', value: 'ADVERTISEMENT' },
  { label: 'Song', value: 'SONG' },
]

export const EVENT_PRIORITIES = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
]

export const useEventsStore = defineStore('events', () => {
  const events = ref<BroadcastEvent[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadEvents(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<BroadcastEvent>('/events', page, size)
      events.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchEvent(id: string) {
    return mixplaApiService.getDocument<BroadcastEvent>('/events', id)
  }

  async function saveEvent(id: string | null, data: Partial<BroadcastEvent>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as BroadcastEvent
    if (id) return mixplaApiService.updateDictionaryItem<BroadcastEvent>('/events', id, payload)
    return mixplaApiService.createDictionaryItem<BroadcastEvent>('/events', payload)
  }

  async function deleteEvent(id: string) {
    return mixplaApiService.deleteDictionaryItem('/events', id)
  }

  return { events, loading, totalCount, pageNum, pageSize, maxPage, loadEvents, fetchEvent, saveEvent, deleteEvent }
})
