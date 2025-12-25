<template>
  <FormWrapper
    :title="isEditing ? 'Edit Role' : 'Create Role'"
    :subtitle="isEditing ? 'Update existing role' : 'Create a new role'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="handleCancel">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">
          Save
        </NButton>
      </NSpace>
    </template>
    
    <NForm
      :model="formData"
      label-placement="left"
      label-width="120"
      :disabled="loading"
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

      <NFormItem label="Description (EN)">
        <NInput 
          v-model:value="formData.localizedDescription.en" 
          type="textarea"
          placeholder="Enter English description"
        />
      </NFormItem>

      <NFormItem label="Description (PT)">
        <NInput 
          v-model:value="formData.localizedDescription.pt" 
          type="textarea"
          placeholder="Enter Portuguese description"
        />
      </NFormItem>

      <NFormItem label="Description (KK)">
        <NInput 
          v-model:value="formData.localizedDescription.kk" 
          type="textarea"
          placeholder="Enter Kazakh description"
        />
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { 
  NButton, 
  NSpace, 
  NForm,
  NFormItem,
  NInput,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useRolesStore, type Role } from '@/stores/roles'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const rolesStore = useRolesStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const roleId = computed(() => route.params.id as string)

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

const loading = ref(false)

async function loadRole() {
  if (isEditing.value && roleId.value) {
    try {
      loading.value = true
      const role = rolesStore.getRoleByIdentifier(roleId.value)
      if (role) {
        formData.value = {
          identifier: role.identifier,
          localizedName: { ...role.localizedName },
          localizedDescription: { ...role.localizedDescription },
          author: role.author,
          regDate: role.regDate,
          lastModifier: role.lastModifier,
          lastModifiedDate: role.lastModifiedDate
        }
      } else {
        message.error('Role not found')
        router.push('/dashboard/roles')
      }
    } catch (error) {
      message.error('Failed to load role data')
      console.error('Error loading role:', error)
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && roleId.value) {
      await rolesStore.updateRole(roleId.value, formData.value)
      message.success('Role updated successfully')
    } else {
      await rolesStore.createRole(formData.value)
      message.success('Role created successfully')
    }
    router.push('/dashboard/roles')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update role'
        : 'Failed to create role'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/roles')
}

onMounted(() => {
  if (isEditing.value) {
    loadRole()
  }
})
</script>
