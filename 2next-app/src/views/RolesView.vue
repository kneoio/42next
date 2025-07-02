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
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import { useRolesStore, type Role } from '@/stores/roles'

const rolesStore = useRolesStore()
const message = useMessage()

// Default language for display (you might want to get this from a language store)
const currentLanguage = 'en'

// Helper function to get localized text
const getLocalizedText = (localizedObj: { [key: string]: string } | undefined, fallback = '') => {
  if (!localizedObj) return fallback
  return localizedObj[currentLanguage] || localizedObj['en'] || Object.values(localizedObj)[0] || fallback
}

// Modal state
const showModal = ref(false)
const isEditing = ref(false)
const editingRole = ref<Role | null>(null)

// Form data - matching Role structure for compatibility
interface RoleFormData {
  identifier: string
  localizedName: { [key: string]: string }
  localizedDescription: { [key: string]: string }
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
}

const formData = ref<RoleFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  localizedDescription: { en: '', pt: '', kk: '' }
})

const columns: DataTableColumns<Role> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Identifier',
    key: 'identifier',
    width: 120,
    ellipsis: {
      tooltip: true
    }
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
    title: 'Description',
    key: 'localizedDescription',
    width: 250,
    ellipsis: {
      tooltip: true
    },
    render: (row) => getLocalizedText(row.localizedDescription)
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
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 150,
    render: (row) => new Date(row.lastModifiedDate).toLocaleDateString()
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
        onPositiveClick: () => handleDelete(row.identifier)
      }, {
        default: () => 'Are you sure you want to delete this role?',
        trigger: () => h(NButton, {
          size: 'small',
          type: 'error',
          style: 'margin-left: 8px;'
        }, { default: () => 'Delete' })
      })
    ]
  }
]

// Role management functions
function handleCreate() {
  isEditing.value = false
  editingRole.value = null
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    localizedDescription: { en: '', pt: '', kk: '' }
  }
  showModal.value = true
}

function handleEdit(role: Role) {
  isEditing.value = true
  editingRole.value = role
  formData.value = {
    identifier: role.identifier,
    localizedName: { ...role.localizedName },
    localizedDescription: { ...role.localizedDescription },
    author: role.author,
    regDate: role.regDate,
    lastModifier: role.lastModifier,
    lastModifiedDate: role.lastModifiedDate
  }
  showModal.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingRole.value) {
      await rolesStore.updateRole(editingRole.value.identifier, formData.value)
      message.success('Role updated successfully')
    } else {
      await rolesStore.createRole(formData.value)
      message.success('Role created successfully')
    }
    showModal.value = false
    formData.value = {
      identifier: '',
      localizedName: { en: '', pt: '', kk: '' },
      localizedDescription: { en: '', pt: '', kk: '' }
    }
  } catch (error) {
    console.error('Failed to save role:', error)
    message.error('Failed to save role')
  }
}

async function handleDelete(identifier: string) {
  try {
    await rolesStore.deleteRole(identifier)
    message.success('Role deleted successfully')
  } catch (error) {
    console.error('Failed to delete role:', error)
    message.error('Failed to delete role')
  }
}

async function handleBulkArchive() {
  if (rolesStore.selectedRoleIds.length === 0) {
    message.warning('Please select roles to archive')
    return
  }
  
  try {
    await rolesStore.archiveRoles(rolesStore.selectedRoleIds)
    message.success('Roles archived successfully')
  } catch (error) {
    console.error('Failed to archive roles:', error)
    message.error('Failed to archive roles')
  }
}

function handleCancel() {
  showModal.value = false
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    localizedDescription: { en: '', pt: '', kk: '' }
  }
}

onMounted(() => {
  rolesStore.loadRoles()
})

onBeforeUnmount(() => {
  // Clear selection to prevent DOM access errors during navigation
  rolesStore.clearSelection()
})
</script>

<template>
  <div class="roles-view">
    <div class="mb-4">
      <NSpace>
        <NButton type="primary" @click="handleCreate">
          Create Role
        </NButton>
        <NPopconfirm @positive-click="handleBulkArchive">
          <template #trigger>
            <NButton 
              type="warning" 
              :disabled="rolesStore.selectedRoleIds.length === 0"
            >
              Archive Selected ({{ rolesStore.selectedRoleIds.length }})
            </NButton>
          </template>
          Are you sure you want to archive the selected roles?
        </NPopconfirm>
      </NSpace>
    </div>

    <NDataTable
      :columns="columns"
      :data="rolesStore.roles"
      :loading="rolesStore.loading"
      :row-key="(row: Role) => row.identifier"
      v-model:checked-row-keys="rolesStore.selectedRoleIds"
      :pagination="{
        pageSize: 20,
        showSizePicker: true,
        pageSizes: [10, 20, 50, 100]
      }"
    />

    <NModal
      v-model:show="showModal"
      preset="dialog"
      :title="isEditing ? 'Edit Role' : 'Create Role'"
      :style="{ width: '600px' }"
    >
      <NForm :model="formData" label-placement="left" label-width="120px">
        <NFormItem label="Identifier" required>
          <NInput v-model:value="formData.identifier" placeholder="Enter role identifier" />
        </NFormItem>
        
        <NFormItem label="Name (English)" required>
          <NInput 
            v-model:value="formData.localizedName.en" 
            placeholder="Enter role name in English" 
          />
        </NFormItem>
        
        <NFormItem label="Name (Portuguese)">
          <NInput 
            v-model:value="formData.localizedName.pt" 
            placeholder="Enter role name in Portuguese" 
          />
        </NFormItem>
        
        <NFormItem label="Name (Kazakh)">
          <NInput 
            v-model:value="formData.localizedName.kk" 
            placeholder="Enter role name in Kazakh" 
          />
        </NFormItem>
        
        <NFormItem label="Description (English)">
          <NInput 
            v-model:value="formData.localizedDescription.en" 
            placeholder="Enter role description in English"
            type="textarea"
            :rows="2"
          />
        </NFormItem>
        
        <NFormItem label="Description (Portuguese)">
          <NInput 
            v-model:value="formData.localizedDescription.pt" 
            placeholder="Enter role description in Portuguese"
            type="textarea"
            :rows="2"
          />
        </NFormItem>
        
        <NFormItem label="Description (Kazakh)">
          <NInput 
            v-model:value="formData.localizedDescription.kk" 
            placeholder="Enter role description in Kazakh"
            type="textarea"
            :rows="2"
          />
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
.roles-view {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.mb-4 {
  margin-bottom: 16px;
}
</style>
