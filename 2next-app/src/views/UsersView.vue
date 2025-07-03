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
  userName: string
  timeZone: string
  active: boolean
  supervisor: boolean
  pageSize: string
  defaultLang: string
}

const userStore = useUserStore()
const showModal = ref(false)
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
    title: 'User Name',
    key: 'userName',
    width: 250,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Registration Date',
    key: 'regDate',
    width: 220
  },
  {
    title: 'Time Zone',
    key: 'timeZone',
    width: 200
  },
  {
    title: 'Status',
    key: 'active',
    width: 120,
    render: (row) => row.active ? 'Active' : 'Inactive'
  },
  {
    title: 'Supervisor',
    key: 'supervisor',
    width: 120,
    render: (row) => row.supervisor ? 'Yes' : 'No'
  }
]

const formData = ref<UserForm>({
  login: '',
  userName: '',
  timeZone: 'Europe/Lisbon',
  active: true,
  supervisor: false,
  pageSize: '20',
  defaultLang: '4'
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
    userName: '',
    timeZone: 'Europe/Lisbon',
    active: true,
    supervisor: false,
    pageSize: '20',
    defaultLang: '4'
  }
  showModal.value = true
}

const handleEdit = (user: User) => {
  isEditing.value = true
  editingUser.value = user
  formData.value = {
    login: user.login,
    userName: user.userName,
    timeZone: user.timeZone,
    active: user.active,
    supervisor: user.supervisor,
    pageSize: user.pageSize.toString(),
    defaultLang: user.defaultLang.toString()
  }
  showModal.value = true
}

const handleSave = async () => {
  try {
    const userData: Partial<User> = {
      login: formData.value.login,
      userName: formData.value.userName,
      timeZone: formData.value.timeZone,
      active: formData.value.active,
      supervisor: formData.value.supervisor,
      pageSize: parseInt(formData.value.pageSize),
      defaultLang: parseInt(formData.value.defaultLang)
    }
    
    if (isEditing.value && editingUser.value) {
      await userStore.updateUser(editingUser.value.id, userData)
      message.success('User updated successfully')
    } else {
      await userStore.createUser(userData)
      message.success('User created successfully')
    }
    showModal.value = false
  } catch (error) {
    console.error('Failed to save user:', error)
    message.error('Failed to save user')
  }
}

const handleDelete = async (id: number) => {
  try {
    await userStore.deleteUser(id)
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
  showModal.value = false
  formData.value = {
    login: '',
    userName: '',
    timeZone: 'Europe/Lisbon',
    active: true,
    supervisor: false,
    pageSize: '20',
    defaultLang: '4'
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
      :row-key="(row: User) => row.id"
      v-model:checked-row-keys="userStore.selectedUserIds"
      :pagination="{
        pageSize: 20,
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100]
      }"
      :row-props="(row: User) => ({ style: 'cursor: pointer;', onClick: () => handleEdit(row) })"
    />

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="isEditing ? 'Edit User' : 'Create User'"
      :style="{ width: '600px' }"
    >
      <NForm :model="formData" label-placement="left" label-width="120px">
        <NFormItem label="Login" required>
          <NInput v-model:value="formData.login" placeholder="Enter login" />
        </NFormItem>
        
        <NFormItem label="User Name" required>
          <NInput v-model:value="formData.userName" placeholder="Enter user name" />
        </NFormItem>
        
        <NFormItem label="Time Zone">
          <NInput v-model:value="formData.timeZone" placeholder="Enter time zone" />
        </NFormItem>
        
        <NFormItem label="Page Size">
          <NInput 
            v-model:value="formData.pageSize" 
            placeholder="Enter page size" 
          />
        </NFormItem>
        
        <NFormItem label="Default Language">
          <NInput 
            v-model:value="formData.defaultLang" 
            placeholder="Enter default language ID" 
          />
        </NFormItem>
        
        <NFormItem label="Active">
          <NSwitch v-model:value="formData.active" />
        </NFormItem>
        
        <NFormItem label="Supervisor">
          <NSwitch v-model:value="formData.supervisor" />
        </NFormItem>
      </NForm>
      
      <template #action>
        <NSpace>
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </template>
    </NModal>
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
</style>
