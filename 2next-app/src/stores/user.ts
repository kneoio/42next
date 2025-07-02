import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiService, { type User } from '@/services/api'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const selectedUserIds = ref<number[]>([])

  const selectedUsers = computed(() => 
    users.value.filter(user => selectedUserIds.value.includes(user.id))
  )

  const activeUsers = computed(() => 
    users.value.filter(user => user.active)
  )

  const supervisors = computed(() => 
    users.value.filter(user => user.supervisor)
  )

  async function loadUsers() {
    loading.value = true
    try {
      const response = await apiService.request<{ payload: { viewData: User[] } }>('/users')
      users.value = response.payload.viewData
    } catch (error) {
      console.error('Failed to load users:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function createUser(userData: Partial<User>) {
    try {
      const newUser = await apiService.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
      users.value.push(newUser)
      return newUser
    } catch (error) {
      console.error('Failed to create user:', error)
      throw error
    }
  }

  async function updateUser(id: number, userData: Partial<User>) {
    try {
      const updatedUser = await apiService.request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      })
      
      const index = users.value.findIndex(user => user.id === id)
      if (index !== -1) {
        users.value[index] = updatedUser
      }
      return updatedUser
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  async function deleteUser(id: number) {
    try {
      await apiService.request<void>(`/users/${id}`, {
        method: 'DELETE',
      })
      
      users.value = users.value.filter(user => user.id !== id)
      selectedUserIds.value = selectedUserIds.value.filter(userId => userId !== id)
    } catch (error) {
      console.error('Failed to delete user:', error)
      throw error
    }
  }

  async function archiveUsers(ids: number[]) {
    try {
      await apiService.request<void>('/users/archive', {
        method: 'POST',
        body: JSON.stringify({ ids }),
      })
      
      // Refresh users after archiving
      await loadUsers()
      selectedUserIds.value = []
    } catch (error) {
      console.error('Failed to archive users:', error)
      throw error
    }
  }

  function selectUser(id: number) {
    if (!selectedUserIds.value.includes(id)) {
      selectedUserIds.value.push(id)
    }
  }

  function deselectUser(id: number) {
    selectedUserIds.value = selectedUserIds.value.filter(userId => userId !== id)
  }

  function toggleUserSelection(id: number) {
    if (selectedUserIds.value.includes(id)) {
      deselectUser(id)
    } else {
      selectUser(id)
    }
  }

  function clearSelection() {
    selectedUserIds.value = []
  }

  function selectAll() {
    selectedUserIds.value = users.value.map(user => user.id)
  }

  function getUserById(id: number) {
    return users.value.find(user => user.id === id)
  }

  return {
    // State
    users,
    loading,
    selectedUserIds,
    
    // Computed
    selectedUsers,
    activeUsers,
    supervisors,
    
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
    getUserById
  }
})
