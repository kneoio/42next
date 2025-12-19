<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { 
  NDataTable, 
  NButton, 
  NSpace, 
  NPopconfirm,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { useLanguagesStore, type Language } from '@/stores/languages'

const languagesStore = useLanguagesStore()
const message = useMessage()

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingItem = ref<Language | null>(null)

// Form data
interface LanguageFormData {
  code: string
  position: number
  localizedName: { [key: string]: string }
}

const formData = ref<LanguageFormData>({
  code: '',
  position: 0,
  localizedName: { en: '', pt: '', kk: '' }
})

const selectedCount = computed(() => languagesStore.selectedLanguageIds.length)

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

// Language management functions
function handleCreate() {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    code: '',
    position: 0,
    localizedName: { en: '', pt: '', kk: '' }
  }
  showForm.value = true
}

function handleEdit(item: Language) {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    code: item.code,
    position: item.position,
    localizedName: { ...item.localizedName }
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingItem.value) {
      await languagesStore.updateLanguage(editingItem.value.id, formData.value)
      message.success('Language updated successfully')
    } else {
      await languagesStore.createLanguage(formData.value)
      message.success('Language created successfully')
    }
    showForm.value = false
    formData.value = {
      code: '',
      position: 0,
      localizedName: { en: '', pt: '', kk: '' }
    }
  } catch (error) {
    console.error('Failed to save language:', error)
    message.error('Failed to save language')
  }
}

async function handleBulkArchive() {
  if (languagesStore.selectedLanguageIds.length === 0) {
    message.warning('Please select languages to archive')
    return
  }
  
  try {
    await languagesStore.archiveLanguages(languagesStore.selectedLanguageIds)
    message.success('Languages archived successfully')
  } catch (error) {
    console.error('Failed to archive languages:', error)
    message.error('Failed to archive languages')
  }
}

async function handleBulkDelete() {
  if (languagesStore.selectedLanguageIds.length === 0) {
    message.warning('Please select languages to delete')
    return
  }
  
  try {
    for (const id of languagesStore.selectedLanguageIds) {
      await languagesStore.deleteLanguage(id)
    }
    message.success('Languages deleted successfully')
  } catch (error) {
    console.error('Failed to delete languages:', error)
    message.error('Failed to delete languages')
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    code: '',
    position: 0,
    localizedName: { en: '', pt: '', kk: '' }
  }
}

onMounted(() => {
  languagesStore.loadLanguages()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  languagesStore.clearSelection()
})
</script>

<template>
  <div class="languages-view">
    <!-- List View -->
    <div v-if="!showForm">
      <div class="mb-4">
        <NSpace>
          <NButton type="primary" @click="handleCreate">
            Create Language
          </NButton>
          <NPopconfirm @positive-click="handleBulkArchive">
            <template #trigger>
              <NButton 
                type="warning" 
                :disabled="languagesStore.selectedLanguageIds.length === 0"
              >
                Archive Selected ({{ languagesStore.selectedLanguageIds.length }})
              </NButton>
            </template>
            Are you sure you want to archive the selected languages?
          </NPopconfirm>
          <NPopconfirm @positive-click="handleBulkDelete">
            <template #trigger>
              <NButton 
                type="error" 
                :disabled="languagesStore.selectedLanguageIds.length === 0"
              >
                Delete Selected ({{ languagesStore.selectedLanguageIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected languages?
          </NPopconfirm>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="languagesStore.languages"
        :loading="languagesStore.loading"
        :row-key="(row: Language) => row.id"
        v-model:checked-row-keys="languagesStore.selectedLanguageIds"
        :pagination="{
          pageSize: 20,
          showSizePicker: true,
          pageSizes: [10, 20, 50, 100]
        }"
        :row-props="(row: Language) => ({ 
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
      <div class="form-header">
        <h2 class="form-title">{{ isEditing ? 'Edit Language' : 'Create Language' }}</h2>
        <NSpace class="form-actions">
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </div>
      
      <div class="form-content">
        <NForm :model="formData" label-placement="left" label-width="140px">
          <NFormItem label="Code" required>
            <NInput v-model:value="formData.code" placeholder="e.g., en, pt, kk" />
          </NFormItem>
          
          <NFormItem label="Position" required>
            <NInputNumber v-model:value="formData.position" placeholder="Enter position" :min="0" />
          </NFormItem>
          
          <NFormItem label="Name (English)" required>
            <NInput 
              v-model:value="formData.localizedName.en" 
              placeholder="Enter language name in English" 
            />
          </NFormItem>
          
          <NFormItem label="Name (Portuguese)">
            <NInput 
              v-model:value="formData.localizedName.pt" 
              placeholder="Enter language name in Portuguese" 
            />
          </NFormItem>
          
          <NFormItem label="Name (Kazakh)">
            <NInput 
              v-model:value="formData.localizedName.kk" 
              placeholder="Enter language name in Kazakh" 
            />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.languages-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}

.form-view {
  width: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.form-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
}

.form-actions {
  display: flex;
  gap: 8px;
}

.form-content {
  max-width: 600px;
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
