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
import { useRolesStore, type Role } from '@/stores/roles'
import { useRouter } from 'vue-router'

const rolesStore = useRolesStore()
const router = useRouter()

const currentLanguage = 'en'

const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj[currentLanguage] || localizedObj['en'] || Object.values(localizedObj)[0] || fallback
}

const pagination = computed(() => ({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: rolesStore.roles.length
}))

const columns: DataTableColumns<Role> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Name',
    key: 'localizedName',
    width: 200,
    ellipsis: {
      tooltip: true
    },
    render: (row) => getLocalizedText(row.localizedName)
  },
  {
    title: 'Author',
    key: 'author',
    width: 120,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Created',
    key: 'regDate',
    width: 140,
    render: (row) => new Date(row.regDate).toLocaleDateString()
  },
  {
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 140,
    render: (row) => new Date(row.lastModifiedDate).toLocaleDateString()
  }
]

function handleCreate() {
  router.push('/dashboard/roles/new')
}

async function handleEdit(role: Role) {
  router.push(`/dashboard/roles/${role.identifier}`)
}

async function handleDelete(identifier: string) {
  try {
    await rolesStore.deleteRole(identifier)
  } catch (error) {
    console.error('Failed to delete role:', error)
  }
}

async function handleBulkArchive() {
  if (rolesStore.selectedRoleIds.length === 0) {
    return
  }
  
  try {
    await rolesStore.archiveRoles(rolesStore.selectedRoleIds)
    rolesStore.clearSelection()
  } catch (error) {
    console.error('Failed to archive roles:', error)
  }
}

async function handleBulkDelete() {
  if (rolesStore.selectedRoleIds.length === 0) {
    return
  }
  
  try {
    for (const id of rolesStore.selectedRoleIds) {
      await rolesStore.deleteRole(id)
    }
    rolesStore.clearSelection()
  } catch (error) {
    console.error('Failed to delete roles:', error)
  }
}

onMounted(() => {
  rolesStore.loadRoles()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  rolesStore.clearSelection()
})
</script>

<template>
  <div class="roles-view">
    <PageHeader
      title="Roles"
      subtitle="Manage roles"
      :count="rolesStore.roles.length"
    >
      <template #actions>
        <NSpace>
          <NButton 
            v-if="rolesStore.selectedRoleIds.length > 0"
            type="warning"
            @click="handleBulkArchive"
          >
            Archive Selected ({{ rolesStore.selectedRoleIds.length }})
          </NButton>
          <NPopconfirm
            v-if="rolesStore.selectedRoleIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ rolesStore.selectedRoleIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected roles?
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
          Add Role
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="rolesStore.roles"
      :loading="rolesStore.loading"
      :row-key="(row: Role) => row.identifier"
      v-model:checked-row-keys="rolesStore.selectedRoleIds"
      :pagination="pagination"
      :row-props="(row: Role) => ({ 
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
