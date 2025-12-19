import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Language {
  id: string
  code: string
  position: number
  localizedName: { [key: string]: string }
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
}

export const useLanguagesStore = defineStore('languages', () => {
  const languages = ref<Language[]>([])
  const loading = ref(false)
  const selectedLanguageIds = ref<string[]>([])

  const selectedLanguages = computed(() => 
    languages.value.filter(language => selectedLanguageIds.value.includes(language.id))
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
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = languageData as Partial<Language>

      const newLanguage = await apiService.createDictionaryItem<Language>('/languages', payload)
      languages.value.push(newLanguage)
      return newLanguage
    } catch (error) {
      console.error('Failed to create language:', error)
      throw error
    }
  }

  async function updateLanguage(id: string, languageData: Partial<Language>) {
    try {
      const {
        id: _id,
        author: _author,
        regDate: _regDate,
        lastModifier: _lastModifier,
        lastModifiedDate: _lastModifiedDate,
        ...payload
      } = languageData as Partial<Language>

      const updatedLanguage = await apiService.updateDictionaryItem<Language>('/languages', id, payload)
      
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

  async function deleteLanguage(id: string) {
    try {
      await apiService.deleteDictionaryItem('/languages', id)
      
      languages.value = languages.value.filter(language => language.id !== id)
      selectedLanguageIds.value = selectedLanguageIds.value.filter(languageId => languageId !== id)
    } catch (error) {
      console.error('Failed to delete language:', error)
      throw error
    }
  }

  async function archiveLanguages(ids: string[]) {
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

  function selectLanguage(id: string) {
    if (!selectedLanguageIds.value.includes(id)) {
      selectedLanguageIds.value.push(id)
    }
  }

  function deselectLanguage(id: string) {
    selectedLanguageIds.value = selectedLanguageIds.value.filter(languageId => languageId !== id)
  }

  function toggleLanguageSelection(id: string) {
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

  function getLanguageById(id: string) {
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
