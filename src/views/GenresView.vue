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
import { useGenresStore, type Genre } from '@/stores/genres'
import { useRouter } from 'vue-router'

const genresStore = useGenresStore()
const router = useRouter()
const currentLanguage = 'en'

const pagination = computed(() => ({
  page: genresStore.pageNum,
  pageSize: genresStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: genresStore.totalCount
}))

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
</script>

<template>
  <div class="genres-view">
    <PageHeader
      title="Genres"
      subtitle="Manage genres"
      :count="genresStore.totalCount"
    >
      <template #actions>
        <NSpace>
          <NButton 
            v-if="genresStore.selectedGenreIds.length > 0"
            type="warning"
            @click="handleBulkArchive"
          >
            Archive Selected ({{ genresStore.selectedGenreIds.length }})
          </NButton>
          <NPopconfirm
            v-if="genresStore.selectedGenreIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ genresStore.selectedGenreIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected genres?
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
          Add Genre
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="genresStore.genres"
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
