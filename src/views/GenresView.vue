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
import { useGenresStore, type Genre } from '@/stores/genres'
import { useRouter } from 'vue-router'

const genresStore = useGenresStore()
const router = useRouter()
const currentLanguage = 'en'

const pagination = computed(() => {
  return {
    page: genresStore.pageNum,
    pageSize: genresStore.pageSize,
    pageSizes: [10, 20, 50, 100],
    showSizePicker: true,
    itemCount: genresStore.totalCount // Use total count from backend
  }
})

// Helper function to get localized text
const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj[currentLanguage] || localizedObj['en'] || Object.values(localizedObj)[0] || fallback
}

// Table columns
const columns: DataTableColumns<Genre> = [
  {
    type: 'selection',
    multiple: true
  },
  {
    title: 'Identifier',
    key: 'identifier',
    width: 150,
    render(row) {
      return h('span', { style: { fontWeight: 'bold' } }, row.identifier)
    }
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
    title: 'Rank',
    key: 'rank',
    width: 80
  },
  {
    title: 'Color',
    key: 'color',
    width: 100,
    render(row) {
      if (!row.color) return '-'
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
    title: 'Author',
    key: 'author',
    width: 120
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

// Transform flat data to tree structure
const treeData = computed(() => {
  const processedData: any[] = []
  
  // Process each genre from the server
  genresStore.genres.forEach(genre => {
    const processedGenre = {
      ...genre,
      key: genre.identifier, // Use identifier as key for selection
      children: genre.children || [] // Use children from server if available
    }
    processedData.push(processedGenre)
    
    // Debug: Check if genre has children
    if (processedGenre.children && processedGenre.children.length > 0) {
      console.log(`Genre ${genre.identifier} has children:`, processedGenre.children)
    }
  })
  
  // Sort by rank
  const sortByRank = (a: any, b: any) => (a.rank || 999) - (b.rank || 999)
  processedData.sort(sortByRank)
  
  // Sort children by rank
  processedData.forEach(genre => {
    if (genre.children && genre.children.length > 0) {
      genre.children.sort(sortByRank)
    }
  })
  
  return processedData
})

// Paginated tree data for display
const paginatedTreeData = computed(() => {
  const startIndex = (genresStore.pageNum - 1) * genresStore.pageSize
  const endIndex = startIndex + genresStore.pageSize
  return treeData.value.slice(startIndex, endIndex)
})

function handleCreate() {
  router.push('/dashboard/genres/new')
}

async function handleEdit(genre: Genre) {
  router.push(`/dashboard/genres/${genre.identifier}`)
}

async function handleDelete(identifier: string) {
  try {
    await genresStore.deleteGenre(identifier)
  } catch (error) {
    console.error('Failed to delete genre:', error)
  }
}

async function handleBulkArchive() {
  if (genresStore.selectedGenreIds.length === 0) {
    return
  }

  try {
    await genresStore.archiveGenres(genresStore.selectedGenreIds)
    genresStore.clearSelection()
  } catch (error) {
    console.error('Failed to archive genres:', error)
  }
}

async function handleBulkDelete() {
  if (genresStore.selectedGenreIds.length === 0) {
    return
  }

  try {
    const deletedCount = genresStore.selectedGenreIds.length
    for (const identifier of genresStore.selectedGenreIds) {
      await genresStore.deleteGenre(identifier)
    }
    genresStore.clearSelection()
    const currentTotal = genresStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = genresStore.pageSize
    const currentPage = genresStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await genresStore.loadGenres(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete genres:', error)
  }
}

onMounted(() => {
  // Load genres with normal pagination
  genresStore.loadGenres(genresStore.pageNum, genresStore.pageSize)
})

onBeforeUnmount(() => {
  genresStore.clearSelection()
})

async function handlePageChange(page: number) {
  await genresStore.loadGenres(page, genresStore.pageSize)
}

async function handlePageSizeChange(pageSize: number) {
  await genresStore.loadGenres(1, pageSize)
}

// Auto-search when user types 2+ characters
watch(() => genresStore.filterIdentifier, (newValue) => {
  if (newValue && newValue.length >= 2) {
    genresStore.loadGenres(1, genresStore.pageSize)
  } else if (newValue === '' || newValue === null) {
    genresStore.loadGenres(1, genresStore.pageSize)
  }
})
</script>

<template>
  <div class="genres-view">
    <PageHeader
      title="Genres"
      subtitle="Manage genres"
      :count="genresStore.totalCount"
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
          :disabled="genresStore.selectedGenreIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="genresStore.selectedGenreIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ genresStore.selectedGenreIds.length }} selected genre(s)?
        </NPopconfirm>
        <NButton 
          type="warning"
          :disabled="genresStore.selectedGenreIds.length === 0"
          @click="handleBulkArchive"
        >
          Archive
        </NButton>
        <NInput
          v-model:value="genresStore.filterIdentifier"
          clearable
          placeholder="Filter by identifier"
        />
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="treeData"
      :loading="genresStore.loading"
      :row-key="(row: Genre) => row.identifier"
      v-model:checked-row-keys="genresStore.selectedGenreIds"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      :row-props="(row: Genre) => ({ 
        style: 'cursor: pointer;', 
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          // Don't trigger edit when clicking checkbox, expand button, or their parent elements
          if (target.closest('.n-data-table-td--selection') || 
              target.closest('.n-checkbox') ||
              target.closest('.n-data-table-expand') ||
              target.closest('.n-base-icon')) {
            return
          }
          handleEdit(row)
        }
      })"
      :default-expanded-row-keys="[]"
      children-key="children"
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
