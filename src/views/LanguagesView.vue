<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useLanguagesStore, type Language } from '@/stores/languages'
import { useRouter } from 'vue-router'

const languagesStore = useLanguagesStore()
const router = useRouter()

const pagination = computed(() => ({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: languagesStore.languages.length
}))

// Helper function to get localized text
const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj['en'] || localizedObj['pt'] || localizedObj['kk'] || Object.values(localizedObj)[0] || fallback
}

const columns: DataTableColumns<Language> = [
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
    title: 'Code',
    key: 'code',
    width: 120
  },
  {
    title: 'Position',
    key: 'position',
    width: 120
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
  router.push('/dashboard/languages/new')
}

async function handleEdit(item: Language) {
  router.push(`/dashboard/languages/${item.code}`)
}

async function handleDelete(code: string) {
  try {
    await languagesStore.deleteLanguage(code)
  } catch (error) {
    console.error('Failed to delete language:', error)
  }
}

async function handleBulkArchive() {
  if (languagesStore.selectedLanguageIds.length === 0) {
    return
  }
  
  try {
    await languagesStore.archiveLanguages(languagesStore.selectedLanguageIds)
    languagesStore.clearSelection()
  } catch (error) {
    console.error('Failed to archive languages:', error)
  }
}

async function handleBulkDelete() {
  if (languagesStore.selectedLanguageIds.length === 0) {
    return
  }
  
  try {
    for (const id of languagesStore.selectedLanguageIds) {
      await languagesStore.deleteLanguage(id)
    }
    languagesStore.clearSelection()
  } catch (error) {
    console.error('Failed to delete languages:', error)
  }
}

onMounted(() => {
  languagesStore.loadLanguages()
})

onBeforeUnmount(() => {
  languagesStore.clearSelection()
})
</script>

<template>
  <div class="languages-view">
    <PageHeader
      title="Languages"
      subtitle="Manage languages"
      :count="languagesStore.languages.length"
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
          :disabled="languagesStore.selectedLanguageIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="languagesStore.selectedLanguageIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ languagesStore.selectedLanguageIds.length }} selected language(s)?
        </NPopconfirm>
        <NButton 
          type="warning"
          :disabled="languagesStore.selectedLanguageIds.length === 0"
          @click="handleBulkArchive"
        >
          Archive
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="languagesStore.languages"
      :loading="languagesStore.loading"
      :row-key="(row: Language) => row.id"
      v-model:checked-row-keys="languagesStore.selectedLanguageIds"
      :pagination="pagination"
      :row-props="(row: Language) => ({ 
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
