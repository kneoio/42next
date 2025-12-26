import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Label {
  id: string
  identifier: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  localizedName: {
    [languageCode: string]: string
  }
  color: string
  fontColor?: string
  hidden: boolean
  category: string
  parent?: string | null
}

export const useLabelsStore = defineStore('labels', () => {
  const labels = ref<Label[]>([])
  const loading = ref(false)
  const selectedLabelIds = ref<string[]>([])
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)
  const filterCategory = ref<string | null>(null)
  const filterIdentifier = ref<string>('')

  const selectedLabels = computed(() => 
    labels.value.filter(label => selectedLabelIds.value.includes(label.identifier))
  )

  async function loadLabels(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await apiService.getPagedDictionary<Label>('/labels', page, size, {
        category: filterCategory.value || undefined,
        search: filterIdentifier.value || undefined
      })
      labels.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } catch (error) {
      console.error('Failed to load labels:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchLabel(id: string) {
    try {
      return await apiService.getDocument<Label>('/labels', id)
    } catch (error) {
      console.error('Failed to fetch label:', error)
      throw error
    }
  }

  async function createLabel(labelData: Partial<Label>) {
    try {
      // Backend generates identifier and manages audit fields; do not send them from the client
      const {
        id: _id,
        identifier: _identifier,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = labelData as Partial<Label>

      const newLabel = await apiService.createDictionaryItem<Label>('/labels', payload)
      labels.value.push(newLabel)
      return newLabel
    } catch (error) {
      console.error('Failed to create label:', error)
      throw error
    }
  }

  async function updateLabel(id: string, labelData: Partial<Label>) {
    try {
      // Do not send audit fields; backend owns them
      const {
        id: _id,
        identifier: _identifier,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = labelData as Partial<Label>

      const updatedLabel = await apiService.updateDictionaryItem<Label>('/labels', id, payload)
      const index = labels.value.findIndex(label => label.id === id)
      if (index !== -1) {
        labels.value[index] = updatedLabel
      }
      return updatedLabel
    } catch (error) {
      console.error('Failed to update label:', error)
      throw error
    }
  }

  async function deleteLabel(identifier: string) {
    try {
      const label = labels.value.find(label => label.identifier === identifier)
      const idToDelete = label ? label.id : identifier

      await apiService.deleteDictionaryItem('/labels', idToDelete)
      labels.value = labels.value.filter(label => label.identifier !== identifier)
    } catch (error) {
      console.error('Failed to delete label:', error)
      throw error
    }
  }

  async function archiveLabels(identifiers: string[]) {
    try {
      const idsToArchive = identifiers.map(identifier => {
        const label = labels.value.find(label => label.identifier === identifier)
        return label ? label.id : identifier
      })

      await apiService.archiveDictionaryItems('/labels', idsToArchive)
      // Remove archived labels from the list (by identifier, UI-facing key)
      labels.value = labels.value.filter(label => !identifiers.includes(label.identifier))
    } catch (error) {
      console.error('Failed to archive labels:', error)
      throw error
    }
  }

  function selectLabel(identifier: string) {
    if (!selectedLabelIds.value.includes(identifier)) {
      selectedLabelIds.value.push(identifier)
    }
  }

  function deselectLabel(identifier: string) {
    selectedLabelIds.value = selectedLabelIds.value.filter(id => id !== identifier)
  }

  function toggleLabelSelection(identifier: string) {
    if (selectedLabelIds.value.includes(identifier)) {
      deselectLabel(identifier)
    } else {
      selectLabel(identifier)
    }
  }

  function clearSelection() {
    selectedLabelIds.value = []
  }

  function selectAll() {
    selectedLabelIds.value = labels.value.map(label => label.identifier)
  }

  function getLabelByIdentifier(identifier: string) {
    return labels.value.find(label => label.identifier === identifier)
  }

  function resetFilters() {
    filterCategory.value = null
    filterIdentifier.value = ''
  }

  return {
    // State
    labels,
    loading,
    selectedLabelIds,
    totalCount,
    pageNum,
    pageSize,
    maxPage,
    filterCategory,
    filterIdentifier,
    selectedLabels,
    
    // Actions
    loadLabels,
    fetchLabel,
    createLabel,
    updateLabel,
    deleteLabel,
    archiveLabels,
    selectLabel,
    deselectLabel,
    toggleLabelSelection,
    clearSelection,
    selectAll,
    getLabelByIdentifier,
    resetFilters
  }
})
