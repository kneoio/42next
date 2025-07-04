<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, h } from 'vue'
import { NButton, NDataTable, NModal, NForm, NFormItem, NInput, NSwitch, NSelect, NSpace, NPopconfirm, useMessage, type DataTableColumns } from 'naive-ui'
import { useModulesStore, type Module } from '@/stores/modules'

const moduleStore = useModulesStore()
const message = useMessage()

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingItem = ref<Module | null>(null)

// Form data with actual Module interface
interface ModuleFormData {
  identifier: string
  localizedName: {
    en: string
    pt: string
    kk: string
  }
  localizedDescription: {
    en: string
    pt: string
    kk: string
  }
  on: boolean
}

const formData = ref<ModuleFormData>({
  identifier: '',
  localizedName: {
    en: '',
    pt: '',
    kk: ''
  },
  localizedDescription: {
    en: '',
    pt: '',
    kk: ''
  },
  on: true
})

const selectedCount = computed(() => moduleStore.selectedModuleIds.length)

const columns: DataTableColumns<Module> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Identifier',
    key: 'identifier',
    width: 150,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Description',
    key: 'localizedDescription',
    width: 250,
    ellipsis: {
      tooltip: true
    },
    render: (row) => row.localizedDescription?.en || 'N/A'
  },
  {
    title: 'Author',
    key: 'author',
    width: 120
  },
  {
    title: 'Registration Date',
    key: 'regDate',
    width: 180
  },
  {
    title: 'Status',
    key: 'on',
    width: 100,
    render: (row) => row.on ? 'On' : 'Off'
  }
]

// Module management functions
function handleCreate() {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    identifier: '',
    localizedName: {
      en: '',
      pt: '',
      kk: ''
    },
    localizedDescription: {
      en: '',
      pt: '',
      kk: ''
    },
    on: true
  }
  showForm.value = true
}

function handleEdit(item: Module) {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    identifier: item.identifier,
    localizedName: {
      en: item.localizedName.en || '',
      pt: item.localizedName.pt || '',
      kk: item.localizedName.kk || ''
    },
    localizedDescription: {
      en: item.localizedDescription.en || '',
      pt: item.localizedDescription.pt || '',
      kk: item.localizedDescription.kk || ''
    },
    on: item.on
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingItem.value) {
      await moduleStore.updateModule(editingItem.value.id, formData.value)
      message.success('Module updated successfully')
    } else {
      await moduleStore.createModule(formData.value)
      message.success('Module created successfully')
    }
    showForm.value = false
    formData.value = {
      identifier: '',
      localizedName: {
        en: '',
        pt: '',
        kk: ''
      },
      localizedDescription: {
        en: '',
        pt: '',
        kk: ''
      },
      on: true
    }
  } catch (error) {
    console.error('Failed to save module:', error)
    message.error('Failed to save module')
  }
}

async function handleDelete(id: string) {
  try {
    await moduleStore.deleteModule(id)
    message.success('Module deleted successfully')
  } catch (error) {
    console.error('Failed to delete module:', error)
    message.error('Failed to delete module')
  }
}

async function handleBulkArchive() {
  if (moduleStore.selectedModuleIds.length === 0) {
    message.warning('Please select modules to archive')
    return
  }
  
  try {
    await moduleStore.archiveModules(moduleStore.selectedModuleIds)
    message.success('Modules archived successfully')
  } catch (error) {
    console.error('Failed to archive modules:', error)
    message.error('Failed to archive modules')
  }
}

async function handleBulkDelete() {
  if (moduleStore.selectedModuleIds.length === 0) {
    message.warning('Please select modules to delete')
    return
  }
  
  try {
    // Delete each selected module
    for (const id of moduleStore.selectedModuleIds) {
      await moduleStore.deleteModule(id)
    }
    message.success('Modules deleted successfully')
  } catch (error) {
    console.error('Failed to delete modules:', error)
    message.error('Failed to delete modules')
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    identifier: '',
    localizedName: {
      en: '',
      pt: '',
      kk: ''
    },
    localizedDescription: {
      en: '',
      pt: '',
      kk: ''
    },
    on: true
  }
}

const categoryOptions = [
  { label: 'Core', value: 'Core' },
  { label: 'Extension', value: 'Extension' },
  { label: 'Plugin', value: 'Plugin' },
  { label: 'Integration', value: 'Integration' },
  { label: 'Utility', value: 'Utility' }
]

onMounted(() => {
  moduleStore.loadModules()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  moduleStore.clearSelection()
})
</script>

<template>
  <div class="modules-view">
    <!-- List View -->
    <div v-if="!showForm">
      <div class="mb-4">
        <NSpace>
          <NButton type="primary" @click="handleCreate">
            Create Module
          </NButton>
          <NPopconfirm @positive-click="handleBulkArchive">
            <template #trigger>
              <NButton 
                type="warning" 
                :disabled="moduleStore.selectedModuleIds.length === 0"
              >
                Archive Selected ({{ moduleStore.selectedModuleIds.length }})
              </NButton>
            </template>
            Are you sure you want to archive the selected modules?
          </NPopconfirm>
          <NPopconfirm @positive-click="handleBulkDelete">
            <template #trigger>
              <NButton 
                type="error" 
                :disabled="moduleStore.selectedModuleIds.length === 0"
              >
                Delete Selected ({{ moduleStore.selectedModuleIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected modules?
          </NPopconfirm>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="moduleStore.modules"
        :loading="moduleStore.loading"
        :row-key="(row: Module) => row.id"
        v-model:checked-row-keys="moduleStore.selectedModuleIds"
        :pagination="{
          pageSize: 20,
          showSizePicker: true,
          pageSizes: [10, 20, 50, 100]
        }"
        :row-props="(row: Module) => ({ 
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
        <h2 class="form-title">{{ isEditing ? 'Edit Module' : 'Create Module' }}</h2>
        <NSpace class="form-actions">
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </NSpace>
      </div>
      
      <div class="form-content">
        <NForm :model="formData" label-placement="left" label-width="140px">
          <NFormItem label="Identifier" required>
            <NInput v-model:value="formData.identifier" placeholder="Enter module identifier" />
          </NFormItem>
          
          <NFormItem label="Name (English)" required>
            <NInput v-model:value="formData.localizedName.en" placeholder="Enter module name in English" />
          </NFormItem>
          
          <NFormItem label="Name (Portuguese)">
            <NInput v-model:value="formData.localizedName.pt" placeholder="Enter module name in Portuguese" />
          </NFormItem>
          
          <NFormItem label="Name (Kazakh)">
            <NInput v-model:value="formData.localizedName.kk" placeholder="Enter module name in Kazakh" />
          </NFormItem>
          
          <NFormItem label="Description (English)">
            <NInput 
              v-model:value="formData.localizedDescription.en" 
              placeholder="Enter module description in English"
              type="textarea"
              :rows="2"
            />
          </NFormItem>
          
          <NFormItem label="Description (Portuguese)">
            <NInput 
              v-model:value="formData.localizedDescription.pt" 
              placeholder="Enter module description in Portuguese"
              type="textarea"
              :rows="2"
            />
          </NFormItem>
          
          <NFormItem label="Description (Kazakh)">
            <NInput 
              v-model:value="formData.localizedDescription.kk" 
              placeholder="Enter module description in Kazakh"
              type="textarea"
              :rows="2"
            />
          </NFormItem>
          
          <NFormItem label="Status">
            <NSwitch v-model:value="formData.on" />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modules-view {
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
