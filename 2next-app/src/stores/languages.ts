import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Language {
  id: number
  name: string
  code: string
  locale?: string
  active: boolean
  isDefault?: boolean
}

export const useLanguagesStore = defineStore('languages', () => {
  const languages = ref<Language[]>([])
  const loading = ref(false)
  const selectedLanguageIds = ref<number[]>([])

  const selectedLanguages = computed(() => 
    languages.value.filter(language => selectedLanguageIds.value.includes(language.id))
  )

  const activeLanguages = computed(() => 
    languages.value.filter(language => language.active)
  )

  const defaultLanguage = computed(() => 
    languages.value.find(language => language.isDefault)
  )

  async function loadLanguages() {
    loading.value = true
    try {
      languages.value = await apiService.getDictionary<Language>('/languages')
    } catch (error) {
      console.error('Failed to load languages:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createLanguage(languageData: Partial<Language>) {
    try {
      const newLanguage = await apiService.createDictionaryItem<Language>('/languages', languageData)
      languages.value.push(newLanguage)
      return newLanguage
    } catch (error) {
      console.error('Failed to create language:', error)
      throw error
    }
  }

  async function updateLanguage(id: number, languageData: Partial<Language>) {
    try {
      const updatedLanguage = await apiService.updateDictionaryItem<Language>('/languages', id, languageData)
      
      const index = languages.value.findIndex(language => language.id === id)
      if (index !== -1) {
        languages.value[index] = updatedLanguage
      }
      return updatedLanguage
    } catch (error) {
      console.error('Failed to update language:', error)
      throw error
    }
  }

  async function deleteLanguage(id: number) {
    try {
      await apiService.deleteDictionaryItem('/languages', id)
      
      languages.value = languages.value.filter(language => language.id !== id)
      selectedLanguageIds.value = selectedLanguageIds.value.filter(languageId => languageId !== id)
    } catch (error) {
      console.error('Failed to delete language:', error)
      throw error
    }
  }

  async function archiveLanguages(ids: number[]) {
    try {
      await apiService.archiveDictionaryItems('/languages', ids)
      
      // Refresh languages after archiving
      await loadLanguages()
      selectedLanguageIds.value = []
    } catch (error) {
      console.error('Failed to archive languages:', error)
      throw error
    }
  }

  function selectLanguage(id: number) {
    if (!selectedLanguageIds.value.includes(id)) {
      selectedLanguageIds.value.push(id)
    }
  }

  function deselectLanguage(id: number) {
    selectedLanguageIds.value = selectedLanguageIds.value.filter(languageId => languageId !== id)
  }

  function toggleLanguageSelection(id: number) {
    if (selectedLanguageIds.value.includes(id)) {
      deselectLanguage(id)
    } else {
      selectLanguage(id)
    }
  }

  function clearSelection() {
    selectedLanguageIds.value = []
  }

  function selectAll() {
    selectedLanguageIds.value = languages.value.map(language => language.id)
  }

  function getLanguageById(id: number) {
    return languages.value.find(language => language.id === id)
  }

  function getLanguageByCode(code: string) {
    return languages.value.find(language => language.code === code)
  }

  return {
    // State
    languages,
    loading,
    selectedLanguageIds,
    
    // Computed
    selectedLanguages,
    activeLanguages,
    defaultLanguage,
    
    // Actions
    loadLanguages,
    createLanguage,
    updateLanguage,
    deleteLanguage,
    archiveLanguages,
    selectLanguage,
    deselectLanguage,
    toggleLanguageSelection,
    clearSelection,
    selectAll,
    getLanguageById,
    getLanguageByCode
  }
})
