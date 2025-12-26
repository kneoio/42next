<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { NButton, NDataTable, NSpace, NPopconfirm, type DataTableColumns } from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useModulesStore, type Module } from '@/stores/modules'
import { useRouter } from 'vue-router'

const moduleStore = useModulesStore()
const router = useRouter()

const pagination = computed(() => ({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: moduleStore.modules.length
}))

const columns: DataTableColumns<Module> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Identifier',
    key: 'identifier',
    width: 150,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Description',
    key: 'localizedDescription',
    width: 250,
    ellipsis: {
      tooltip: true
    },
    render: (row) => row.localizedDescription?.en || 'N/A'
  },
  {
    title: 'Author',
    key: 'author',
    width: 120
  },
  {
    title: 'Registration Date',
    key: 'regDate',
    width: 180
  },
  {
    title: 'Status',
    key: 'on',
    width: 100,
    render: (row) => row.on ? 'On' : 'Off'
  }
]

function handleCreate() {
  router.push('/dashboard/modules/new')
}

async function handleEdit(item: Module) {
  router.push(`/dashboard/modules/${item.identifier}`)
}

async function handleDelete(identifier: string) {
  try {
    await moduleStore.deleteModule(identifier)
  } catch (error) {
    console.error('Failed to delete module:', error)
  }
}

async function handleBulkArchive() {
  if (moduleStore.selectedModuleIds.length === 0) {
    return
  }
  
  try {
    await moduleStore.archiveModules(moduleStore.selectedModuleIds)
    moduleStore.clearSelection()
  } catch (error) {
    console.error('Failed to archive modules:', error)
  }
}

async function handleBulkDelete() {
  if (moduleStore.selectedModuleIds.length === 0) {
    return
  }
  
  try {
    for (const id of moduleStore.selectedModuleIds) {
      await moduleStore.deleteModule(id)
    }
    moduleStore.clearSelection()
  } catch (error) {
    console.error('Failed to delete modules:', error)
  }
}

onMounted(() => {
  moduleStore.loadModules()
})

onBeforeUnmount(() => {
  moduleStore.clearSelection()
})
</script>

<template>
  <div class="modules-view">
    <PageHeader
      title="Modules"
      subtitle="Manage modules"
      :count="moduleStore.modules.length"
    />

    <ActionBar>
      <NSpace>
        <NButton 
          type="primary" 
          @click="handleCreate"
        >
          Add
        </NButton>
        <NPopconfirm
          @positive-click="handleBulkDelete"
          :disabled="moduleStore.selectedModuleIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="moduleStore.selectedModuleIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ moduleStore.selectedModuleIds.length }} selected module(s)?
        </NPopconfirm>
        <NButton 
          type="warning"
          :disabled="moduleStore.selectedModuleIds.length === 0"
          @click="handleBulkArchive"
        >
          Archive
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="moduleStore.modules"
      :loading="moduleStore.loading"
      :row-key="(row: Module) => row.id"
      v-model:checked-row-keys="moduleStore.selectedModuleIds"
      :pagination="pagination"
      :row-props="(row: Module) => ({ 
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
