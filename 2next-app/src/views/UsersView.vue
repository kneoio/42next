<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
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
import apiService from '@/services/api'

interface UserForm {
  login: string
  userName: string
  timeZone: string
  active: boolean
  supervisor: boolean
  pageSize: string
  defaultLang: string
}

const users = ref<User[]>([])
const loading = ref(false)
const selectedRowKeys = ref<DataTableRowKey[]>([])
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
    title: 'ID',
    key: 'id',
    width: 100
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
    title: 'Active',
    key: 'active',
    width: 120,
    render: (row) => row.active ? 'Yes' : 'No'
  },
  {
    title: 'Supervisor',
    key: 'supervisor',
    width: 120,
    render: (row) => row.supervisor ? 'Yes' : 'No'
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 180,
    render: (row) => [
      h(NButton, {
        size: 'small',
        onClick: () => handleEdit(row)
      }, { default: () => 'Edit' }),
      h(NPopconfirm, {
        onPositiveClick: () => handleDelete(row.id)
      }, {
        default: () => 'Are you sure you want to delete this user?',
        trigger: () => h(NButton, {
          size: 'small',
          type: 'error',
          style: 'margin-left: 8px;'
        }, { default: () => 'Delete' })
      })
    ]
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
  loading.value = true
  try {
    users.value = await apiService.getUsers()
  } catch (error) {
    console.error('Failed to load users:', error)
    message.error('Failed to load users')
  } finally {
    loading.value = false
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
      await apiService.updateUser(editingUser.value.id, userData)
      message.success('User updated successfully')
    } else {
      await apiService.createUser(userData)
      message.success('User created successfully')
    }
    showModal.value = false
    await loadUsers()
  } catch (error) {
    console.error('Failed to save user:', error)
    message.error('Failed to save user')
  }
}

const handleDelete = async (id: number) => {
  try {
    await apiService.deleteUser(id)
    message.success('User deleted successfully')
    await loadUsers()
  } catch (error) {
    console.error('Failed to delete user:', error)
    message.error('Failed to delete user')
  }
}

const handleBulkArchive = async () => {
  if (selectedRowKeys.value.length === 0) {
    message.warning('Please select users to archive')
    return
  }
  
  try {
    await apiService.archiveUsers(selectedRowKeys.value as number[])
    message.success('Users archived successfully')
    selectedRowKeys.value = []
    await loadUsers()
  } catch (error) {
    console.error('Failed to archive users:', error)
    message.error('Failed to archive users')
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
              :disabled="selectedRowKeys.length === 0"
            >
              Archive Selected ({{ selectedRowKeys.length }})
            </NButton>
          </template>
          Are you sure you want to archive the selected users?
        </NPopconfirm>
      </NSpace>
    </div>

    <NDataTable
      :columns="columns"
      :data="users"
      :loading="loading"
      :row-key="(row: User) => row.id"
      v-model:checked-row-keys="selectedRowKeys"
      :pagination="{
        pageSize: 20,
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100]
      }"
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
