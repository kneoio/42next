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
  NSwitch,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { useLanguagesStore, type Language } from '@/stores/languages'

const languagesStore = useLanguagesStore()
const message = useMessage()

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingItem = ref<Language | null>(null)

// Form data
interface LanguageFormData {
  name: string
  code: string
  locale?: string
  isDefault: boolean
  active: boolean
}

const formData = ref<LanguageFormData>({
  name: '',
  code: '',
  locale: '',
  isDefault: false,
  active: true
})

const selectedCount = computed(() => languagesStore.selectedLanguageIds.length)

const columns: DataTableColumns<Language> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Name',
    key: 'name',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Code',
    key: 'code',
    width: 120
  },
  {
    title: 'Locale',
    key: 'locale',
    width: 120
  },
  {
    title: 'Default',
    key: 'isDefault',
    width: 120,
    render: (row) => row.isDefault ? 'Yes' : 'No'
  },
  {
    title: 'Status',
    key: 'active',
    width: 120,
    render: (row) => row.active ? 'Active' : 'Inactive'
  }
]

// Language management functions
function handleCreate() {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    name: '',
    code: '',
    locale: '',
    isDefault: false,
    active: true
  }
  showModal.value = true
}

function handleEdit(item: Language) {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    name: item.name,
    code: item.code,
    locale: item.locale || '',
    isDefault: item.isDefault || false,
    active: item.active
  }
  showModal.value = true
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
    showModal.value = false
    formData.value = {
      name: '',
      code: '',
      locale: '',
      isDefault: false,
      active: true
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
  showModal.value = false
  formData.value = {
    name: '',
    code: '',
    locale: '',
    isDefault: false,
    active: true
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
      :row-props="(row: Language) => ({ style: 'cursor: pointer;', onClick: () => handleEdit(row) })"
    />

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="isEditing ? 'Edit Language' : 'Create Language'"
      :style="{ width: '600px' }"
    >
      <NForm :model="formData" label-placement="left" label-width="120px">
        <NFormItem label="Name" required>
          <NInput v-model:value="formData.name" placeholder="Enter language name" />
        </NFormItem>
        
        <NFormItem label="Code" required>
          <NInput v-model:value="formData.code" placeholder="e.g., en, pt, fr" />
        </NFormItem>
        
        <NFormItem label="Locale">
          <NInput v-model:value="formData.locale" placeholder="e.g., en-US, pt-PT" />
        </NFormItem>
        
        <NFormItem label="Default Language">
          <NSwitch v-model:value="formData.isDefault" />
        </NFormItem>
        
        <NFormItem label="Active">
          <NSwitch v-model:value="formData.active" />
        </NFormItem>
      </NForm>
      
      <template #action>
        <NSpace>
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </template>
    </NModal>
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
</style>
