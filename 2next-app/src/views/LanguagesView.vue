<script setup lang="ts">
import { onMounted, h } from 'vue'
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
  type DataTableColumns
} from 'naive-ui'
import { useLanguagesStore, type Language } from '@/stores/languages'
import { useDictionaryManagement } from '@/composables/useDictionaryManagement'

const languagesStore = useLanguagesStore()

const columns: DataTableColumns<Language> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'ID',
    key: 'id',
    width: 100
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
    title: 'Active',
    key: 'active',
    width: 120,
    render: (row) => row.active ? 'Yes' : 'No'
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 180,
    render: (row) => [
      h(NButton, {
        size: 'small',
        onClick: () => handleEdit(row)
      }, { default: () => 'Edit' }),
      h(NPopconfirm, {
        onPositiveClick: () => handleDelete(row.id)
      }, {
        default: () => 'Are you sure you want to delete this language?',
        trigger: () => h(NButton, {
          size: 'small',
          type: 'error',
          style: 'margin-left: 8px;'
        }, { default: () => 'Delete' })
      })
    ]
  }
]

const {
  showModal,
  isEditing,
  formData,
  selectedCount,
  handleCreate,
  handleEdit,
  handleSave,
  handleDelete,
  handleBulkArchive,
  handleCancel
} = useDictionaryManagement(languagesStore, 'Language', columns)

onMounted(() => {
  languagesStore.loadLanguages()
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
