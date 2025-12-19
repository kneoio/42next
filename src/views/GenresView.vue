<script setup lang="ts">
import { onMounted, onBeforeUnmount, h, ref, computed } from 'vue'
import { 
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NColorPicker,
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import FormPageHeader from '@/components/FormPageHeader.vue'
import ListPageHeader from '@/components/ListPageHeader.vue'
import { useGenresStore, type Genre } from '@/stores/genres'

const genresStore = useGenresStore()
const message = useMessage()

// Default language for display
const currentLanguage = 'en'

// Pagination state derived from store (single source of truth)
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

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingGenre = ref<Genre | null>(null)

// Form data - matching Genre structure for compatibility
interface GenreFormData {
  identifier: string
  localizedName: { [key: string]: string }
  rank: number
  color?: string
  fontColor?: string
  parent?: string | null
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string | null
}

const formData = ref<GenreFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  rank: 999,
  color: '#FF8C00',
  fontColor: '#000000',
  parent: null
})

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

// Genre management functions
function handleCreate() {
  isEditing.value = false
  editingGenre.value = null
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    rank: 999,
    color: '#FF8C00',
    fontColor: '#000000',
    parent: null
  }
  showForm.value = true
}

async function handleEdit(genre: Genre) {
  isEditing.value = true
  editingGenre.value = genre
  try {
    const fullDoc = await genresStore.fetchGenre(genre.id)
    formData.value = {
      identifier: fullDoc.identifier,
      localizedName: { ...fullDoc.localizedName },
      rank: fullDoc.rank,
      color: fullDoc.color,
      fontColor: fullDoc.fontColor,
      parent: fullDoc.parent ?? null,
      author: fullDoc.author,
      regDate: fullDoc.regDate,
      lastModifier: fullDoc.lastModifier,
      lastModifiedDate: fullDoc.lastModifiedDate
    }
  } catch (e) {
    // fallback to row data if fetch fails
    formData.value = {
      identifier: genre.identifier,
      localizedName: { ...genre.localizedName },
      rank: genre.rank,
      color: genre.color,
      fontColor: genre.fontColor,
      parent: genre.parent ?? null,
      author: genre.author,
      regDate: genre.regDate,
      lastModifier: genre.lastModifier,
      lastModifiedDate: genre.lastModifiedDate
    }
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingGenre.value) {
      await genresStore.updateGenre(editingGenre.value.id, formData.value)
      message.success('Genre updated successfully')
    } else {
      await genresStore.createGenre(formData.value)
      message.success('Genre created successfully')
    }
    await genresStore.loadGenres(genresStore.pageNum, genresStore.pageSize)
    showForm.value = false
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update genre'
        : 'Failed to create genre'
    message.error(errorMessage)
  }
}

async function handleDelete(identifier: string) {
  try {
    await genresStore.deleteGenre(identifier)
    message.success('Genre deleted successfully')
    const currentTotal = genresStore.totalCount
    const newTotal = Math.max(0, currentTotal - 1)
    const pageSize = genresStore.pageSize
    const currentPage = genresStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await genresStore.loadGenres(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete genre'
    message.error(errorMessage)
  }
}

async function handleBulkArchive() {
  if (genresStore.selectedGenreIds.length === 0) {
    message.warning('Please select genres to archive')
    return
  }

  try {
    await genresStore.archiveGenres(genresStore.selectedGenreIds)
    message.success(`${genresStore.selectedGenreIds.length} genres archived successfully`)
    genresStore.clearSelection()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive genres'
    message.error(errorMessage)
  }
}

async function handleBulkDelete() {
  if (genresStore.selectedGenreIds.length === 0) {
    message.warning('Please select genres to delete')
    return
  }

  try {
    for (const identifier of genresStore.selectedGenreIds) {
      await genresStore.deleteGenre(identifier)
    }
    message.success(`${genresStore.selectedGenreIds.length} genres deleted successfully`)
    const deletedCount = genresStore.selectedGenreIds.length
    genresStore.clearSelection()
    const currentTotal = genresStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = genresStore.pageSize
    const currentPage = genresStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await genresStore.loadGenres(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete genres'
    message.error(errorMessage)
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    rank: 999,
    color: '#FF8C00',
    fontColor: '#000000',
    parent: null
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
    <!-- List View -->
    <div v-if="!showForm">
      <ListPageHeader
        title="Genres"
        subtitle="Manage genres"
        :count="genresStore.totalCount"
      >
        <template #actions>
          <NSpace>
            <NButton 
              type="primary" 
              @click="handleCreate"
            >
              Add Genre
            </NButton>
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
      </ListPageHeader>

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
      <FormPageHeader
        :title="isEditing ? 'Edit Genre' : 'Create Genre'"
        :subtitle="isEditing ? 'Update existing genre' : 'Create a new genre'"
        @back="handleCancel"
      >
        <template #actions>
          <NButton @click="handleCancel">Close</NButton>
          <NButton type="primary" @click="handleSave">
            Save
          </NButton>
        </template>
      </FormPageHeader>

      <div class="form-content">
        <NForm
          :model="formData"
          label-placement="left"
          label-width="120px"
        >
          <NFormItem label="Name (EN)" required>
            <NInput 
              v-model:value="formData.localizedName.en" 
              placeholder="Enter English name"
            />
          </NFormItem>

          <NFormItem label="Name (PT)">
            <NInput 
              v-model:value="formData.localizedName.pt" 
              placeholder="Enter Portuguese name"
            />
          </NFormItem>

          <NFormItem label="Name (KK)">
            <NInput 
              v-model:value="formData.localizedName.kk" 
              placeholder="Enter Kazakh name"
            />
          </NFormItem>

          <NFormItem label="Rank" required>
            <NInputNumber
              v-model:value="formData.rank"
              placeholder="Enter rank"
            />
          </NFormItem>

          <NFormItem label="Color">
            <NColorPicker 
              v-model:value="formData.color"
              :show-alpha="false"
            />
          </NFormItem>

          <NFormItem label="Font Color">
            <NColorPicker 
              v-model:value="formData.fontColor"
              :show-alpha="false"
            />
          </NFormItem>

          <NFormItem label="Identifier" v-if="isEditing">
            <span>{{ formData.identifier }}</span>
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.genres-view {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header h2 {
  margin: 0;
}

.form-content {
  max-width: 600px;
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
