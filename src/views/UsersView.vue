<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, h } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NCheckbox,
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  useMessage,
  type DataTableColumns,
  type DataTableRowKey
} from 'naive-ui'
import type { User } from '@/services/api'
import { useUserStore } from '@/stores/user'

interface UserForm {
  login: string
  name: string
  email: string
  language: string
  theme: string
}

const userStore = useUserStore()
const showForm = ref(false)
const editingUser = ref<User | null>(null)
const isEditing = ref(false)
const message = useMessage()

const columns: DataTableColumns<User> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Login',
    key: 'login',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Name',
    key: 'name',
    width: 250,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Email',
    key: 'email',
    width: 250,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Language',
    key: 'language',
    width: 120,
    render: (row) => row.language || 'Not set'
  },
  {
    title: 'Theme',
    key: 'theme',
    width: 120,
    render: (row) => row.theme || 'Not set'
  },
  {
    title: 'Roles',
    key: 'roles',
    width: 120,
    render: (row) => row.roles.length.toString()
  },
  {
    title: 'Modules',
    key: 'modules',
    width: 120,
    render: (row) => row.modules.length.toString()
  }
]

const formData = ref<UserForm>({
  login: '',
  name: '',
  email: '',
  language: '',
  theme: ''
})

const loadUsers = async () => {
  try {
    await userStore.loadUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
    message.error('Failed to load users')
  }
}

const handleCreate = () => {
  isEditing.value = false
  editingUser.value = null
  formData.value = {
    login: '',
    name: '',
    email: '',
    language: '',
    theme: ''
  }
  showForm.value = true
}

const handleEdit = (user: User) => {
  isEditing.value = true
  editingUser.value = user
  formData.value = {
    login: user.login,
    name: user.name || '',
    email: user.email || '',
    language: user.language || '',
    theme: user.theme || ''
  }
  showForm.value = true
}

const handleSave = async () => {
  try {
    const userData: Partial<User> = {
      login: formData.value.login,
      name: formData.value.name,
      email: formData.value.email,
      language: formData.value.language || null,
      theme: formData.value.theme || null
    }
    
    if (isEditing.value && editingUser.value) {
      await userStore.updateUser(editingUser.value.login, userData)
      message.success('User updated successfully')
    } else {
      await userStore.createUser(userData)
      message.success('User created successfully')
    }
    showForm.value = false
  } catch (error) {
    console.error('Failed to save user:', error)
    message.error('Failed to save user')
  }
}

const handleDelete = async (login: string) => {
  try {
    await userStore.deleteUser(login)
    message.success('User deleted successfully')
  } catch (error) {
    console.error('Failed to delete user:', error)
    message.error('Failed to delete user')
  }
}

const handleBulkArchive = async () => {
  if (userStore.selectedUserIds.length === 0) {
    message.warning('Please select users to archive')
    return
  }
  
  try {
    await userStore.archiveUsers(userStore.selectedUserIds)
    message.success('Users archived successfully')
  } catch (error) {
    console.error('Failed to archive users:', error)
    message.error('Failed to archive users')
  }
}

const handleBulkDelete = async () => {
  if (userStore.selectedUserIds.length === 0) {
    message.warning('Please select users to delete')
    return
  }
  
  try {
    for (const id of userStore.selectedUserIds) {
      await userStore.deleteUser(id)
    }
    message.success('Users deleted successfully')
  } catch (error) {
    console.error('Failed to delete users:', error)
    message.error('Failed to delete users')
  }
}

const handleCancel = () => {
  showForm.value = false
  formData.value = {
    login: '',
    name: '',
    email: '',
    language: '',
    theme: ''
  }
}

onMounted(() => {
  loadUsers()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  userStore.clearSelection()
})
</script>

<template>
  <div class="users-view">
    <!-- List View -->
    <div v-if="!showForm">
      <div class="mb-4">
        <NSpace>
          <NButton type="primary" @click="handleCreate">
            Create User
          </NButton>
          <NPopconfirm @positive-click="handleBulkArchive">
            <template #trigger>
              <NButton 
                type="warning" 
                :disabled="userStore.selectedUserIds.length === 0"
              >
                Archive Selected ({{ userStore.selectedUserIds.length }})
              </NButton>
            </template>
            Are you sure you want to archive the selected users?
          </NPopconfirm>
          <NPopconfirm @positive-click="handleBulkDelete">
            <template #trigger>
              <NButton 
                type="error" 
                :disabled="userStore.selectedUserIds.length === 0"
              >
                Delete Selected ({{ userStore.selectedUserIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected users?
          </NPopconfirm>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="userStore.users"
        :loading="userStore.loading"
        :row-key="(row: User) => row.login"
        v-model:checked-row-keys="userStore.selectedUserIds"
        :pagination="{
          pageSize: 20,
          showSizePicker: true,
          pageSizes: [10, 20, 50, 100]
        }"
        :row-props="(row: User) => ({ 
          style: 'cursor: pointer;', 
          onClick: (e: MouseEvent) => {
            // Prevent opening form if clicking on checkbox area
            const target = e.target as HTMLElement
            if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) {
              return
            }
            handleEdit(row)
          }
        })"
      />
    </div>

    <!-- Form View -->
    <div v-else class="form-view">
      <div class="form-header">
        <h2 class="form-title">{{ isEditing ? 'Edit User' : 'Create User' }}</h2>
        <NSpace class="form-actions">
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </div>
      
      <div class="form-content">
        <NForm :model="formData" label-placement="left" label-width="140px">
          <NFormItem label="Login" required>
            <NInput v-model:value="formData.login" placeholder="Enter login" />
          </NFormItem>
          
          <NFormItem label="Name" required>
            <NInput v-model:value="formData.name" placeholder="Enter user name" />
          </NFormItem>
          
          <NFormItem label="Email" required>
            <NInput v-model:value="formData.email" placeholder="Enter email address" />
          </NFormItem>
          
          <NFormItem label="Language">
            <NInput v-model:value="formData.language" placeholder="Enter language preference" />
          </NFormItem>
          
          <NFormItem label="Theme">
            <NInput v-model:value="formData.theme" placeholder="Enter theme preference" />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.users-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.form-view {
  width: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.form-actions {
  display: flex;
  gap: 8px;
}

.form-content {
  max-width: 600px;
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
