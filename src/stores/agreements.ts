import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Agreement {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string | null
  country: string
  userAgent: string
  agreementVersion: string
  termsText: string
}

export const useAgreementsStore = defineStore('agreements', () => {
  const agreements = ref<Agreement[]>([])
  const loading = ref(false)
  const selectedAgreementIds = ref<string[]>([])
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  const selectedAgreements = computed(() =>
    agreements.value.filter(agreement => selectedAgreementIds.value.includes(agreement.id))
  )

  async function loadAgreements(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await apiService.getPagedDictionary<Agreement>('/agreements', page, size)
      agreements.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load agreements:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchAgreement(id: string) {
    try {
      return await apiService.getDocument<Agreement>('/agreements', id)
    } catch (error) {
      console.error('Failed to fetch agreement:', error)
      throw error
    }
  }

  async function createAgreement(data: Partial<Agreement>) {
    try {
      // Backend manages id and audit fields; do not send them from the client
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = data as Partial<Agreement>

      const newAgreement = await apiService.createDictionaryItem<Agreement>('/agreements', payload)
      agreements.value.push(newAgreement)
      return newAgreement
    } catch (error) {
      console.error('Failed to create agreement:', error)
      throw error
    }
  }

  async function updateAgreement(id: string, data: Partial<Agreement>) {
    try {
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = data as Partial<Agreement>

      const updatedAgreement = await apiService.updateDictionaryItem<Agreement>('/agreements', id, payload)
      const index = agreements.value.findIndex(agreement => agreement.id === id)
      if (index !== -1) {
        agreements.value[index] = updatedAgreement
      }
      return updatedAgreement
    } catch (error) {
      console.error('Failed to update agreement:', error)
      throw error
    }
  }

  async function deleteAgreement(id: string) {
    try {
      await apiService.deleteDictionaryItem('/agreements', id)
      agreements.value = agreements.value.filter(agreement => agreement.id !== id)
      selectedAgreementIds.value = selectedAgreementIds.value.filter(selId => selId !== id)
    } catch (error) {
      console.error('Failed to delete agreement:', error)
      throw error
    }
  }

  async function deleteAgreements(ids: string[]) {
    try {
      for (const id of ids) {
        await deleteAgreement(id)
      }
    } catch (error) {
      console.error('Failed to delete agreements:', error)
      throw error
    }
  }

  function clearSelection() {
    selectedAgreementIds.value = []
  }

  return {
    agreements,
    loading,
    selectedAgreementIds,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    selectedAgreements,
    loadAgreements,
    fetchAgreement,
    createAgreement,
    updateAgreement,
    deleteAgreement,
    deleteAgreements,
    clearSelection,
  }
})
