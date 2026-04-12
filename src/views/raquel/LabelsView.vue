<template>
  <div class="labels-view">
    <PageHeader
      title="Labels"
      subtitle="Manage Raquel labels"
      :count="labelsStore.totalCount"
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
          :disabled="labelsStore.selectedLabelIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="labelsStore.selectedLabelIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ labelsStore.selectedLabelIds.length }} selected label(s)?
        </NPopconfirm>
        <NButton 
          type="warning"
          :disabled="labelsStore.selectedLabelIds.length === 0"
          @click="handleBulkArchive"
        >
          Archive
        </NButton>
        <NInput
          v-model:value="labelsStore.filterIdentifier"
          clearable
          placeholder="Filter by identifier"
        />
        <CopyJsonButton :data="labelsStore.labels" />
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="labelsStore.labels"
      :loading="labelsStore.loading"
      :row-key="(row: Label) => row.identifier"
      v-model:checked-row-keys="labelsStore.selectedLabelIds"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      :row-props="(row: Label) => ({ 
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

<script setup lang="ts">
import { onMounted, onBeforeUnmount, h, computed, watch } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NPopconfirm,
  NInput,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useLabelsStore, type Label } from '@/stores/labels'
import { useRouter } from 'vue-router'
import CopyJsonButton from '@/components/CopyJsonButton.vue'

const labelsStore = useLabelsStore()
const router = useRouter()

const currentLanguage = 'en'

const pagination = computed(() => ({
  page: labelsStore.pageNum,
  pageSize: labelsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: labelsStore.totalCount
}))

const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj[currentLanguage] || localizedObj['en'] || Object.values(localizedObj)[0] || fallback
}

const columns: DataTableColumns<Label> = [
  {
    type: 'selection',
    multiple: true
  },
  {
    title: 'Name',
    key: 'localizedName',
    width: 200,
    ellipsis: {
      tooltip: true
    },
    render(row) {
      return getLocalizedText(row.localizedName)
    }
  },
  {
    title: 'Category',
    key: 'category',
    width: 120,
    render(row) {
      return row.category || '-'
    }
  },
  {
    title: 'Color',
    key: 'color',
    width: 100,
    render(row) {
      return h('div', { 
        style: { 
          width: '20px', 
          height: '20px', 
          backgroundColor: row.color, 
          borderRadius: '4px',
          border: '1px solid #ccc'
        } 
      })
    }
  },
  {
    title: 'Hidden',
    key: 'hidden',
    width: 80,
    render(row) {
      return row.hidden ? 'Yes' : 'No'
    }
  },
  {
    title: 'Author',
    key: 'author',
    width: 120,
    render(row) {
      return row.author === 'undefined' ? '-' : row.author
    }
  },
  {
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 140,
    render(row) {
      return row.lastModifiedDate || '-'
    }
  }
]

function handleCreate() {
  router.push('/dashboard/raquel/labels/new')
}

async function handleEdit(label: Label) {
  router.push(`/dashboard/raquel/labels/${label.id}`)
}

async function applyFilters() {
  await labelsStore.loadLabels(1, labelsStore.pageSize)
}

watch(() => labelsStore.filterIdentifier, (newValue) => {
  if (newValue && newValue.length >= 2) {
    applyFilters()
  } else if (newValue === '' || newValue === null) {
    applyFilters()
  }
})

async function handleDelete(identifier: string) {
  try {
    await labelsStore.deleteLabel(identifier)
    const currentTotal = labelsStore.totalCount
    const newTotal = Math.max(0, currentTotal - 1)
    const pageSize = labelsStore.pageSize
    const currentPage = labelsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await labelsStore.loadLabels(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete label:', error)
  }
}

async function handleBulkArchive() {
  if (labelsStore.selectedLabelIds.length === 0) {
    return
  }
  
  try {
    await labelsStore.archiveLabels(labelsStore.selectedLabelIds)
    labelsStore.clearSelection()
    await labelsStore.loadLabels(labelsStore.pageNum, labelsStore.pageSize)
  } catch (error) {
    console.error('Failed to archive labels:', error)
  }
}

async function handleBulkDelete() {
  if (labelsStore.selectedLabelIds.length === 0) {
    return
  }
  
  try {
    for (const identifier of labelsStore.selectedLabelIds) {
      await labelsStore.deleteLabel(identifier)
    }
    labelsStore.clearSelection()
    const deletedCount = labelsStore.selectedLabelIds.length
    const currentTotal = labelsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = labelsStore.pageSize
    const currentPage = labelsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await labelsStore.loadLabels(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete labels:', error)
  }
}

onMounted(() => {
  labelsStore.loadLabels(labelsStore.pageNum, labelsStore.pageSize)
})

onBeforeUnmount(() => {
  labelsStore.clearSelection()
})

async function handlePageChange(page: number) {
  await labelsStore.loadLabels(page, labelsStore.pageSize)
}

async function handlePageSizeChange(pageSize: number) {
  await labelsStore.loadLabels(1, pageSize)
}
</script>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
