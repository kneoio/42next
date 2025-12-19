import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService, { type User } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const selectedUserIds = ref<string[]>([])

  const selectedUsers = computed(() => 
    users.value.filter(user => selectedUserIds.value.includes(user.login))
  )

  async function loadUsers() {
    loading.value = true
    try {
      users.value = await apiService.getDictionary<User>('/users')
    } catch (error) {
      console.error('Failed to load users:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: Partial<User>) {
    try {
      const newUser = await apiService.createDictionaryItem<User>('/users', userData)
      users.value.push(newUser)
      return newUser
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  }

  async function updateUser(login: string, userData: Partial<User>) {
    try {
      const updatedUser = await apiService.updateDictionaryItem<User>('/users', login, userData)
      
      const index = users.value.findIndex(user => user.login === login)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  async function deleteUser(login: string) {
    try {
      await apiService.deleteDictionaryItem('/users', login)
      
      users.value = users.value.filter(user => user.login !== login)
      selectedUserIds.value = selectedUserIds.value.filter(userId => userId !== login)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  async function archiveUsers(logins: string[]) {
    try {
      await apiService.archiveDictionaryItems('/users', logins)
      
      // Refresh users after archiving
      await loadUsers()
      selectedUserIds.value = []
    } catch (error) {
      console.error('Failed to archive users:', error)
      throw error
    }
  }

  function selectUser(login: string) {
    if (!selectedUserIds.value.includes(login)) {
      selectedUserIds.value.push(login)
    }
  }

  function deselectUser(login: string) {
    selectedUserIds.value = selectedUserIds.value.filter(userId => userId !== login)
  }

  function toggleUserSelection(login: string) {
    if (selectedUserIds.value.includes(login)) {
      deselectUser(login)
    } else {
      selectUser(login)
    }
  }

  function clearSelection() {
    selectedUserIds.value = []
  }

  function selectAll() {
    selectedUserIds.value = users.value.map(user => user.login)
  }

  function getUserByLogin(login: string) {
    return users.value.find(user => user.login === login)
  }

  return {
    // State
    users,
    loading,
    selectedUserIds,
    
    // Computed
    selectedUsers,
    
    // Actions
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    archiveUsers,
    selectUser,
    deselectUser,
    toggleUserSelection,
    clearSelection,
    selectAll,
    getUserByLogin
  }
})
