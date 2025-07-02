import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Module {
  id: number
  name: string
  description?: string
  version?: string
  active: boolean
  category?: string
  permissions?: string[]
  dependencies?: number[]
}

export const useModulesStore = defineStore('modules', () => {
  const modules = ref<Module[]>([])
  const loading = ref(false)
  const selectedModuleIds = ref<number[]>([])

  const selectedModules = computed(() => 
    modules.value.filter(module => selectedModuleIds.value.includes(module.id))
  )

  const activeModules = computed(() => 
    modules.value.filter(module => module.active)
  )

  const modulesByCategory = computed(() => {
    const grouped: Record<string, Module[]> = {}
    modules.value.forEach(module => {
      const category = module.category || 'Uncategorized'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(module)
    })
    return grouped
  })

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

  async function updateModule(id: number, moduleData: Partial<Module>) {
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

  async function deleteModule(id: number) {
    try {
      await apiService.deleteDictionaryItem('/modules', id)
      
      modules.value = modules.value.filter(module => module.id !== id)
      selectedModuleIds.value = selectedModuleIds.value.filter(moduleId => moduleId !== id)
    } catch (error) {
      console.error('Failed to delete module:', error)
      throw error
    }
  }

  async function archiveModules(ids: number[]) {
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

  function selectModule(id: number) {
    if (!selectedModuleIds.value.includes(id)) {
      selectedModuleIds.value.push(id)
    }
  }

  function deselectModule(id: number) {
    selectedModuleIds.value = selectedModuleIds.value.filter(moduleId => moduleId !== id)
  }

  function toggleModuleSelection(id: number) {
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

  function getModuleById(id: number) {
    return modules.value.find(module => module.id === id)
  }

  function getModulesByCategory(category: string) {
    return modules.value.filter(module => module.category === category)
  }

  function getModuleDependencies(id: number) {
    const module = getModuleById(id)
    if (!module?.dependencies) return []
    
    return module.dependencies.map(depId => getModuleById(depId)).filter(Boolean) as Module[]
  }

  return {
    // State
    modules,
    loading,
    selectedModuleIds,
    
    // Computed
    selectedModules,
    activeModules,
    modulesByCategory,
    
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
    getModuleById,
    getModulesByCategory,
    getModuleDependencies
  }
})
