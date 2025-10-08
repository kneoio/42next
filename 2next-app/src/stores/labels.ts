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

  const selectedLabels = computed(() => 
    labels.value.filter(label => selectedLabelIds.value.includes(label.identifier))
  )

  async function loadLabels() {
    loading.value = true
    try {
      labels.value = await apiService.getDictionary<Label>('/labels')
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
      const newLabel = await apiService.createDictionaryItem<Label>('/labels', labelData)
      labels.value.push(newLabel)
      return newLabel
    } catch (error) {
      console.error('Failed to create label:', error)
      throw error
    }
  }

  async function updateLabel(id: string, labelData: Partial<Label>) {
    try {
      const updatedLabel = await apiService.updateDictionaryItem<Label>('/labels', id, labelData)
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
      await apiService.deleteDictionaryItem('/labels', identifier)
      labels.value = labels.value.filter(label => label.identifier !== identifier)
    } catch (error) {
      console.error('Failed to delete label:', error)
      throw error
    }
  }

  async function archiveLabels(identifiers: string[]) {
    try {
      await apiService.archiveDictionaryItems('/labels', identifiers)
      // Remove archived labels from the list
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

  return {
    // State
    labels,
    loading,
    selectedLabelIds,
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
    getLabelByIdentifier
  }
})
