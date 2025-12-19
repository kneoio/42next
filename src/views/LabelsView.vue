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
  NColorPicker,
  NSelect,
  NCheckbox,
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import FormPageHeader from '@/components/FormPageHeader.vue'
import ListPageHeader from '@/components/ListPageHeader.vue'
import { useLabelsStore, type Label } from '@/stores/labels'

const labelsStore = useLabelsStore()
const message = useMessage()

// Default language for display
const currentLanguage = 'en'

// Pagination state derived from store (single source of truth)
const pagination = computed(() => ({
  page: labelsStore.pageNum,
  pageSize: labelsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: labelsStore.totalCount
}))

// Helper function to get localized text
const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj[currentLanguage] || localizedObj['en'] || Object.values(localizedObj)[0] || fallback
}

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingLabel = ref<Label | null>(null)

// Form data - matching Label structure for compatibility
interface LabelFormData {
  identifier: string
  localizedName: { [key: string]: string }
  color: string
  fontColor?: string
  hidden: boolean
  category: string
  parent?: string | null
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
}

const formData = ref<LabelFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  color: '#FF8C00',
  fontColor: '#000000',
  hidden: false,
  category: 'platform',
  parent: null
})

// Category options
const categoryOptions = [
  { label: 'Platform', value: 'platform' },
  { label: 'Audio Type', value: 'audio_type' },
  { label: 'Content Status', value: 'content_status' }
]

// Table columns
const columns: DataTableColumns<Label> = [
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
    title: 'Category',
    key: 'category',
    width: 120
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

// Label management functions
function handleCreate() {
  isEditing.value = false
  editingLabel.value = null
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    color: '#FF8C00',
    fontColor: '#000000',
    hidden: false,
    category: 'platform',
    parent: null
  }
  showForm.value = true
}

async function handleEdit(label: Label) {
  isEditing.value = true
  editingLabel.value = label
  try {
    const fullDoc = await labelsStore.fetchLabel(label.id)
    formData.value = {
      identifier: fullDoc.identifier,
      localizedName: { ...fullDoc.localizedName },
      color: fullDoc.color,
      fontColor: fullDoc.fontColor,
      hidden: fullDoc.hidden,
      category: fullDoc.category,
      parent: fullDoc.parent ?? null,
      author: fullDoc.author,
      regDate: fullDoc.regDate,
      lastModifier: fullDoc.lastModifier,
      lastModifiedDate: fullDoc.lastModifiedDate
    }
  } catch (e) {
    // fallback to row data if fetch fails
    formData.value = {
      identifier: label.identifier,
      localizedName: { ...label.localizedName },
      color: label.color,
      fontColor: label.fontColor,
      hidden: label.hidden,
      category: label.category,
      parent: label.parent ?? null,
      author: label.author,
      regDate: label.regDate,
      lastModifier: label.lastModifier,
      lastModifiedDate: label.lastModifiedDate
    }
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingLabel.value) {
      await labelsStore.updateLabel(editingLabel.value.id, formData.value)
      message.success('Label updated successfully')
    } else {
      await labelsStore.createLabel(formData.value)
      message.success('Label created successfully')
    }
    await labelsStore.loadLabels(labelsStore.pageNum, labelsStore.pageSize)
    showForm.value = false
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update label'
        : 'Failed to create label'
    message.error(errorMessage)
  }
}

async function applyFilters() {
  await labelsStore.loadLabels(1, labelsStore.pageSize)
}

async function resetFilters() {
  labelsStore.resetFilters()
  await labelsStore.loadLabels(1, labelsStore.pageSize)
}

async function handleDelete(identifier: string) {
  try {
    await labelsStore.deleteLabel(identifier)
    message.success('Label deleted successfully')
    const currentTotal = labelsStore.totalCount
    const newTotal = Math.max(0, currentTotal - 1)
    const pageSize = labelsStore.pageSize
    const currentPage = labelsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await labelsStore.loadLabels(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete label'
    message.error(errorMessage)
  }
}

async function handleBulkArchive() {
  if (labelsStore.selectedLabelIds.length === 0) {
    message.warning('Please select labels to archive')
    return
  }
  
  try {
    await labelsStore.archiveLabels(labelsStore.selectedLabelIds)
    message.success(`${labelsStore.selectedLabelIds.length} labels archived successfully`)
    labelsStore.clearSelection()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to archive labels'
    message.error(errorMessage)
  }
}

async function handleBulkDelete() {
  if (labelsStore.selectedLabelIds.length === 0) {
    message.warning('Please select labels to delete')
    return
  }
  
  try {
    for (const identifier of labelsStore.selectedLabelIds) {
      await labelsStore.deleteLabel(identifier)
    }
    message.success(`${labelsStore.selectedLabelIds.length} labels deleted successfully`)
    const deletedCount = labelsStore.selectedLabelIds.length
    labelsStore.clearSelection()
    const currentTotal = labelsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = labelsStore.pageSize
    const currentPage = labelsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await labelsStore.loadLabels(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete labels'
    message.error(errorMessage)
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    color: '#FF8C00',
    hidden: false,
    category: 'platform'
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

<template>
  <div class="labels-view">
    <!-- List View -->
    <div v-if="!showForm">
      <ListPageHeader
        title="Labels"
        subtitle="Manage labels"
        :count="labelsStore.totalCount"
      >
        <template #actions>
          <NSpace>
            <NButton 
              type="primary" 
              @click="handleCreate"
            >
              Add Label
            </NButton>
            <NButton 
              v-if="labelsStore.selectedLabelIds.length > 0"
              type="warning"
              @click="handleBulkArchive"
            >
              Archive Selected ({{ labelsStore.selectedLabelIds.length }})
            </NButton>
            <NPopconfirm
              v-if="labelsStore.selectedLabelIds.length > 0"
              @positive-click="handleBulkDelete"
            >
              <template #trigger>
                <NButton type="error">
                  Delete Selected ({{ labelsStore.selectedLabelIds.length }})
                </NButton>
              </template>
              Are you sure you want to delete the selected labels?
            </NPopconfirm>
          </NSpace>
        </template>
      </ListPageHeader>

      <div class="filters">
        <NSpace>
          <NSelect
            v-model:value="labelsStore.filterCategory"
            :options="categoryOptions"
            clearable
            placeholder="Filter by category"
          />
          <NInput
            v-model:value="labelsStore.filterIdentifier"
            clearable
            placeholder="Filter by identifier"
          />
          <NButton @click="applyFilters" type="primary" ghost>
            Apply Filters
          </NButton>
          <NButton @click="resetFilters" quaternary>
            Reset
          </NButton>
        </NSpace>
      </div>

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
        :title="isEditing ? 'Edit Label' : 'Create Label'"
        :subtitle="isEditing ? 'Update existing label' : 'Create a new label'"
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

          <NFormItem label="Color" required>
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

          <NFormItem label="Category" required>
            <NSelect
              v-model:value="formData.category"
              :options="categoryOptions"
              placeholder="Select category"
            />
          </NFormItem>

          <NFormItem label="Hidden">
            <NCheckbox v-model:checked="formData.hidden">
              Hide this label
            </NCheckbox>
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
.labels-view {
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

.form-actions {
  display: flex;
  gap: 8px;
}

.filters {
  margin-bottom: 16px;
}

:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
