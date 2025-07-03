<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, h } from 'vue'
import { NButton, NDataTable, NModal, NForm, NFormItem, NInput, NSwitch, NSelect, NSpace, NPopconfirm, useMessage, type DataTableColumns } from 'naive-ui'
import { useModulesStore, type Module } from '@/stores/modules'

const moduleStore = useModulesStore()
const message = useMessage()

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingItem = ref<Module | null>(null)

// Form data with proper Module interface
interface ModuleFormData {
  name: string
  description?: string
  version?: string
  active: boolean
  category?: string
  permissions?: string[]
  dependencies?: number[]
}

const formData = ref<ModuleFormData>({
  name: '',
  description: '',
  version: '',
  active: true,
  category: '',
  permissions: [],
  dependencies: []
})

const selectedCount = computed(() => moduleStore.selectedModuleIds.length)

const columns: DataTableColumns<Module> = [
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
    title: 'Description',
    key: 'description',
    width: 250,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Version',
    key: 'version',
    width: 120
  },
  {
    title: 'Category',
    key: 'category',
    width: 120
  },
  {
    title: 'Status',
    key: 'active',
    width: 100,
    render: (row) => row.active ? 'Active' : 'Inactive'
  }
]

// Module management functions
function handleCreate() {
  isEditing.value = false
  editingItem.value = null
  formData.value = {
    name: '',
    description: '',
    version: '',
    active: true,
    category: '',
    permissions: [],
    dependencies: []
  }
  showModal.value = true
}

function handleEdit(item: Module) {
  isEditing.value = true
  editingItem.value = item
  formData.value = {
    name: item.name,
    description: item.description || '',
    version: item.version || '',
    active: item.active,
    category: item.category || '',
    permissions: item.permissions || [],
    dependencies: item.dependencies || []
  }
  showModal.value = true
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
    showModal.value = false
    formData.value = {
      name: '',
      description: '',
      version: '',
      active: true,
      category: '',
      permissions: [],
      dependencies: []
    }
  } catch (error) {
    console.error('Failed to save module:', error)
    message.error('Failed to save module')
  }
}

async function handleDelete(id: number) {
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
  showModal.value = false
  formData.value = {
    name: '',
    description: '',
    version: '',
    active: true,
    category: '',
    permissions: [],
    dependencies: []
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
      :row-props="(row: Module) => ({ style: 'cursor: pointer;', onClick: () => handleEdit(row) })"
    />

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="isEditing ? 'Edit Module' : 'Create Module'"
      :style="{ width: '600px' }"
    >
      <NForm :model="formData" label-placement="left" label-width="120px">
        <NFormItem label="Name" required>
          <NInput v-model:value="formData.name" placeholder="Enter module name" />
        </NFormItem>
        
        <NFormItem label="Description">
          <NInput 
            v-model:value="formData.description" 
            placeholder="Enter module description"
            type="textarea"
            :rows="3"
          />
        </NFormItem>
        
        <NFormItem label="Version">
          <NInput v-model:value="formData.version" placeholder="e.g., 1.0.0" />
        </NFormItem>
        
        <NFormItem label="Category">
          <NSelect 
            v-model:value="formData.category" 
            :options="categoryOptions"
            placeholder="Select category"
          />
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
.modules-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
