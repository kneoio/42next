import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface UserConsent {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string | null
  userId: string
  essential: boolean
  analytics: boolean
  marketing: boolean
  timestamp: string | null
  ipAddress?: string
  userAgent?: string
}

export const useConsentsStore = defineStore('consents', () => {
  const consents = ref<UserConsent[]>([])
  const loading = ref(false)
  const selectedConsentIds = ref<string[]>([])
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  const selectedConsents = computed(() =>
    consents.value.filter(consent => selectedConsentIds.value.includes(consent.id))
  )

  async function loadConsents(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await apiService.getPagedDictionary<UserConsent>('/consents', page, size)
      consents.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load consents:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchConsent(id: string) {
    try {
      return await apiService.getDocument<UserConsent>('/consents', id)
    } catch (error) {
      console.error('Failed to fetch consent:', error)
      throw error
    }
  }

  async function createConsent(data: Partial<UserConsent>) {
    try {
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        timestamp: _timestamp,
        ...payload
      } = data as Partial<UserConsent>

      const newConsent = await apiService.createDictionaryItem<UserConsent>('/consents', payload)
      consents.value.push(newConsent)
      return newConsent
    } catch (error) {
      console.error('Failed to create consent:', error)
      throw error
    }
  }

  async function updateConsent(id: string, data: Partial<UserConsent>) {
    try {
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        timestamp: _timestamp,
        ...payload
      } = data as Partial<UserConsent>

      const updatedConsent = await apiService.updateDictionaryItem<UserConsent>('/consents', id, payload)
      const index = consents.value.findIndex(consent => consent.id === id)
      if (index !== -1) {
        consents.value[index] = updatedConsent
      }
      return updatedConsent
    } catch (error) {
      console.error('Failed to update consent:', error)
      throw error
    }
  }

  async function deleteConsent(id: string) {
    try {
      await apiService.deleteDictionaryItem('/consents', id)
      consents.value = consents.value.filter(consent => consent.id !== id)
      selectedConsentIds.value = selectedConsentIds.value.filter(selId => selId !== id)
    } catch (error) {
      console.error('Failed to delete consent:', error)
      throw error
    }
  }

  async function deleteConsents(ids: string[]) {
    try {
      for (const id of ids) {
        await deleteConsent(id)
      }
    } catch (error) {
      console.error('Failed to delete consents:', error)
      throw error
    }
  }

  function clearSelection() {
    selectedConsentIds.value = []
  }

  return {
    consents,
    loading,
    selectedConsentIds,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    selectedConsents,
    loadConsents,
    fetchConsent,
    createConsent,
    updateConsent,
    deleteConsent,
    deleteConsents,
    clearSelection,
  }
})
