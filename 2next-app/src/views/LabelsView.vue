<script setup lang="ts">
import { onMounted, onBeforeUnmount, h, ref, computed } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NColorPicker,
  NSelect,
  NCheckbox,
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import { useLabelsStore, type Label } from '@/stores/labels'

const labelsStore = useLabelsStore()
const message = useMessage()

// Default language for display
const currentLanguage = 'en'

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
  hidden: boolean
  category: string
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
}

const formData = ref<LabelFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  color: '#FF8C00',
  hidden: false,
  category: 'platform'
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
    hidden: false,
    category: 'platform'
  }
  showForm.value = true
}

function handleEdit(label: Label) {
  isEditing.value = true
  editingLabel.value = label
  formData.value = {
    identifier: label.identifier,
    localizedName: { ...label.localizedName },
    color: label.color,
    hidden: label.hidden,
    category: label.category,
    author: label.author,
    regDate: label.regDate,
    lastModifier: label.lastModifier,
    lastModifiedDate: label.lastModifiedDate
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingLabel.value) {
      await labelsStore.updateLabel(editingLabel.value.identifier, formData.value)
      message.success('Label updated successfully')
    } else {
      await labelsStore.createLabel(formData.value)
      message.success('Label created successfully')
    }
    showForm.value = false
  } catch (error) {
    message.error(isEditing.value ? 'Failed to update label' : 'Failed to create label')
  }
}

async function handleDelete(identifier: string) {
  try {
    await labelsStore.deleteLabel(identifier)
    message.success('Label deleted successfully')
  } catch (error) {
    message.error('Failed to delete label')
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
    message.error('Failed to archive labels')
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
    labelsStore.clearSelection()
  } catch (error) {
    message.error('Failed to delete labels')
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
  labelsStore.loadLabels()
})

onBeforeUnmount(() => {
  labelsStore.clearSelection()
})
</script>

<template>
  <div class="labels-view">
    <div class="header">
      <h2>Labels Management</h2>
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
    </div>

    <NDataTable
      :columns="columns"
      :data="labelsStore.labels"
      :loading="labelsStore.loading"
      :row-key="(row: Label) => row.identifier"
      v-model:checked-row-keys="labelsStore.selectedLabelIds"
      :pagination="{
        pageSize: 20,
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100]
      }"
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

    <!-- Form Modal -->
    <NModal
      v-model:show="showForm"
      preset="dialog"
      :title="isEditing ? 'Edit Label' : 'Create Label'"
      :style="{ width: '600px' }"
    >
      <NForm
        :model="formData"
        label-placement="left"
        label-width="120px"
      >
        <NFormItem label="Identifier" required>
          <NInput 
            v-model:value="formData.identifier" 
            placeholder="Enter identifier"
            :disabled="isEditing"
          />
        </NFormItem>

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
      </NForm>

      <template #action>
        <div class="form-actions">
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">
            {{ isEditing ? 'Update' : 'Create' }}
          </NButton>
        </div>
      </template>
    </NModal>
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

:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
