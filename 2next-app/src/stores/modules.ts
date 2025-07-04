import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Module {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string | null
  identifier: string
  localizedName: {
    en: string
    pt: string
    kk: string
  }
  realm: string | null
  localizedDescription: {
    en: string
    pt: string
    kk: string
  }
  on: boolean
}

export const useModulesStore = defineStore('modules', () => {
  const modules = ref<Module[]>([])
  const loading = ref(false)
  const selectedModuleIds = ref<string[]>([])

  const selectedModules = computed(() => 
    modules.value.filter(module => selectedModuleIds.value.includes(module.id))
  )

  const activeModules = computed(() => 
    modules.value.filter(module => module.on)
  )

  async function loadModules() {
    loading.value = true
    try {
      modules.value = await apiService.getDictionary<Module>('/modules')
    } catch (error) {
      console.error('Failed to load modules:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createModule(moduleData: Partial<Module>) {
    try {
      const newModule = await apiService.createDictionaryItem<Module>('/modules', moduleData)
      modules.value.push(newModule)
      return newModule
    } catch (error) {
      console.error('Failed to create module:', error)
      throw error
    }
  }

  async function updateModule(id: string, moduleData: Partial<Module>) {
    try {
      const updatedModule = await apiService.updateDictionaryItem<Module>('/modules', id, moduleData)
      
      const index = modules.value.findIndex(module => module.id === id)
      if (index !== -1) {
        modules.value[index] = updatedModule
      }
      return updatedModule
    } catch (error) {
      console.error('Failed to update module:', error)
      throw error
    }
  }

  async function deleteModule(id: string) {
    try {
      await apiService.deleteDictionaryItem('/modules', id)
      
      modules.value = modules.value.filter(module => module.id !== id)
      selectedModuleIds.value = selectedModuleIds.value.filter(moduleId => moduleId !== id)
    } catch (error) {
      console.error('Failed to delete module:', error)
      throw error
    }
  }

  async function archiveModules(ids: string[]) {
    try {
      await apiService.archiveDictionaryItems('/modules', ids)
      
      // Refresh modules after archiving
      await loadModules()
      selectedModuleIds.value = []
    } catch (error) {
      console.error('Failed to archive modules:', error)
      throw error
    }
  }

  function selectModule(id: string) {
    if (!selectedModuleIds.value.includes(id)) {
      selectedModuleIds.value.push(id)
    }
  }

  function deselectModule(id: string) {
    selectedModuleIds.value = selectedModuleIds.value.filter(moduleId => moduleId !== id)
  }

  function toggleModuleSelection(id: string) {
    if (selectedModuleIds.value.includes(id)) {
      deselectModule(id)
    } else {
      selectModule(id)
    }
  }

  function clearSelection() {
    selectedModuleIds.value = []
  }

  function selectAll() {
    selectedModuleIds.value = modules.value.map(module => module.id)
  }

  function getModuleById(id: string) {
    return modules.value.find(module => module.id === id)
  }

  return {
    // State
    modules,
    loading,
    selectedModuleIds,
    
    // Computed
    selectedModules,
    activeModules,
    
    // Actions
    loadModules,
    createModule,
    updateModule,
    deleteModule,
    archiveModules,
    selectModule,
    deselectModule,
    toggleModuleSelection,
    clearSelection,
    selectAll,
    getModuleById
  }
})
