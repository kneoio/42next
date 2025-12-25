<script setup lang="ts">
import { onMounted, onBeforeUnmount, h, computed } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import type { User } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const pagination = computed(() => ({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: userStore.users.length
}))

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

function handleCreate() {
  router.push('/dashboard/users/new')
}

async function handleEdit(user: User) {
  router.push(`/dashboard/users/${user.login}`)
}

async function handleDelete(login: string) {
  try {
    await userStore.deleteUser(login)
  } catch (error) {
    console.error('Failed to delete user:', error)
  }
}

async function handleBulkArchive() {
  if (userStore.selectedUserIds.length === 0) {
    return
  }
  
  try {
    await userStore.archiveUsers(userStore.selectedUserIds)
    userStore.clearSelection()
  } catch (error) {
    console.error('Failed to archive users:', error)
  }
}

async function handleBulkDelete() {
  if (userStore.selectedUserIds.length === 0) {
    return
  }
  
  try {
    for (const id of userStore.selectedUserIds) {
      await userStore.deleteUser(id)
    }
    userStore.clearSelection()
  } catch (error) {
    console.error('Failed to delete users:', error)
  }
}

onMounted(() => {
  userStore.loadUsers()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  userStore.clearSelection()
})
</script>

<template>
  <div class="users-view">
    <PageHeader
      title="Users"
      subtitle="Manage users"
      :count="userStore.users.length"
    >
      <template #actions>
        <NSpace>
          <NButton 
            v-if="userStore.selectedUserIds.length > 0"
            type="warning"
            @click="handleBulkArchive"
          >
            Archive Selected ({{ userStore.selectedUserIds.length }})
          </NButton>
          <NPopconfirm
            v-if="userStore.selectedUserIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ userStore.selectedUserIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected users?
          </NPopconfirm>
        </NSpace>
      </template>
    </PageHeader>

    <ActionBar>
      <NSpace>
        <NButton 
          type="primary" 
          @click="handleCreate"
        >
          Add User
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="userStore.users"
      :loading="userStore.loading"
      :row-key="(row: User) => row.login"
      v-model:checked-row-keys="userStore.selectedUserIds"
      :pagination="pagination"
      :row-props="(row: User) => ({ 
        style: 'cursor: pointer;', 
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) {
            return
          }
          handleEdit(row)
        }
      })"
    />
  </div>
</template>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
