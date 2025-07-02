import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService from '@/services/api'

export interface Role {
  identifier: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  localizedName: {
    [languageCode: string]: string
  }
  localizedDescription: {
    [languageCode: string]: string
  }
}

export const useRolesStore = defineStore('roles', () => {
  const roles = ref<Role[]>([])
  const loading = ref(false)
  const selectedRoleIds = ref<string[]>([])

  const selectedRoles = computed(() => 
    roles.value.filter(role => selectedRoleIds.value.includes(role.identifier))
  )

  async function loadRoles() {
    loading.value = true
    try {
      roles.value = await apiService.getDictionary<Role>('/roles')
    } catch (error) {
      console.error('Failed to load roles:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createRole(roleData: Partial<Role>) {
    try {
      const newRole = await apiService.createDictionaryItem<Role>('/roles', roleData)
      roles.value.push(newRole)
      return newRole
    } catch (error) {
      console.error('Failed to create role:', error)
      throw error
    }
  }

  async function updateRole(identifier: string, roleData: Partial<Role>) {
    try {
      const updatedRole = await apiService.updateDictionaryItem<Role>('/roles', identifier, roleData)
      
      const index = roles.value.findIndex(role => role.identifier === identifier)
      if (index !== -1) {
        roles.value[index] = updatedRole
      }
      return updatedRole
    } catch (error) {
      console.error('Failed to update role:', error)
      throw error
    }
  }

  async function deleteRole(identifier: string) {
    try {
      await apiService.deleteDictionaryItem('/roles', identifier)
      
      roles.value = roles.value.filter(role => role.identifier !== identifier)
      selectedRoleIds.value = selectedRoleIds.value.filter(roleId => roleId !== identifier)
    } catch (error) {
      console.error('Failed to delete role:', error)
      throw error
    }
  }

  async function archiveRoles(identifiers: string[]) {
    try {
      await apiService.archiveDictionaryItems('/roles', identifiers)
      
      // Refresh roles after archiving
      await loadRoles()
      selectedRoleIds.value = []
    } catch (error) {
      console.error('Failed to archive roles:', error)
      throw error
    }
  }

  function selectRole(identifier: string) {
    if (!selectedRoleIds.value.includes(identifier)) {
      selectedRoleIds.value.push(identifier)
    }
  }

  function deselectRole(identifier: string) {
    selectedRoleIds.value = selectedRoleIds.value.filter(roleId => roleId !== identifier)
  }

  function toggleRoleSelection(identifier: string) {
    if (selectedRoleIds.value.includes(identifier)) {
      deselectRole(identifier)
    } else {
      selectRole(identifier)
    }
  }

  function clearSelection() {
    selectedRoleIds.value = []
  }

  function selectAll() {
    selectedRoleIds.value = roles.value.map(role => role.identifier)
  }

  function getRoleByIdentifier(identifier: string) {
    return roles.value.find(role => role.identifier === identifier)
  }

  return {
    // State
    roles,
    loading,
    selectedRoleIds,
    
    // Computed
    selectedRoles,
    
    // Actions
    loadRoles,
    createRole,
    updateRole,
    deleteRole,
    archiveRoles,
    selectRole,
    deselectRole,
    toggleRoleSelection,
    clearSelection,
    selectAll,
    getRoleByIdentifier
  }
})
