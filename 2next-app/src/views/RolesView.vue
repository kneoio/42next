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
import FormPageHeader from '@/components/FormPageHeader.vue'
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

// Form state
const showForm = ref(false)
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
    title: 'Name',
    key: 'localizedName',
    width: 200,
    ellipsis: {
      tooltip: true
    },
    render: (row) => getLocalizedText(row.localizedName)
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

// Role management functions
function handleCreate() {
  isEditing.value = false
  editingRole.value = null
  formData.value = {
    identifier: '',
    localizedName: { en: '', pt: '', kk: '' },
    localizedDescription: { en: '', pt: '', kk: '' }
  }
  showForm.value = true
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
  showForm.value = true
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
    showForm.value = false
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

async function handleBulkDelete() {
  if (rolesStore.selectedRoleIds.length === 0) {
    message.warning('Please select roles to delete')
    return
  }
  
  try {
    // Delete each selected role
    for (const id of rolesStore.selectedRoleIds) {
      await rolesStore.deleteRole(id)
    }
    message.success('Roles deleted successfully')
  } catch (error) {
    console.error('Failed to delete roles:', error)
    message.error('Failed to delete roles')
  }
}

function handleCancel() {
  showForm.value = false
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
    <!-- List View -->
    <div v-if="!showForm">
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
          <NPopconfirm @positive-click="handleBulkDelete">
            <template #trigger>
              <NButton 
                type="error" 
                :disabled="rolesStore.selectedRoleIds.length === 0"
              >
                Delete Selected ({{ rolesStore.selectedRoleIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected roles?
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
        :row-props="(row: Role) => ({ 
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
        :title="isEditing ? 'Edit Role' : 'Create Role'"
        :subtitle="isEditing ? 'Update existing role' : 'Create a new role'"
        @back="handleCancel"
      >
        <template #actions>
          <NButton @click="handleCancel">Close</NButton>
          <NButton type="primary" @click="handleSave">Save</NButton>
        </template>
      </FormPageHeader>
      
      <div class="form-content">
        <NForm :model="formData" label-placement="left" label-width="140px">
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
      </div>
    </div>
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
  max-width: 700px;
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
