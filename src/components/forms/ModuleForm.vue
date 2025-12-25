<template>
  <FormWrapper
    :title="isEditing ? 'Edit Module' : 'Create Module'"
    :subtitle="isEditing ? 'Update existing module' : 'Create a new module'"
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
          :rows="3"
          placeholder="Enter English description"
        />
      </NFormItem>

      <NFormItem label="Description (PT)">
        <NInput 
          v-model:value="formData.localizedDescription.pt" 
          type="textarea"
          :rows="3"
          placeholder="Enter Portuguese description"
        />
      </NFormItem>

      <NFormItem label="Description (KK)">
        <NInput 
          v-model:value="formData.localizedDescription.kk" 
          type="textarea"
          :rows="3"
          placeholder="Enter Kazakh description"
        />
      </NFormItem>

      <NFormItem label="Status">
        <NSwitch v-model:value="formData.on" />
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
  NSwitch,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useModulesStore, type Module } from '@/stores/modules'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const moduleStore = useModulesStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const moduleId = computed(() => route.params.id as string)

const formData = ref({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  localizedDescription: { en: '', pt: '', kk: '' },
  on: true
})

const loading = ref(false)

async function loadModule() {
  if (isEditing.value && moduleId.value) {
    try {
      loading.value = true
      const module = moduleStore.getModuleById(moduleId.value)
      if (module) {
        formData.value = {
          identifier: module.identifier,
          localizedName: { ...module.localizedName },
          localizedDescription: { ...module.localizedDescription },
          on: module.on
        }
      } else {
        message.error('Module not found')
        router.push('/dashboard/modules')
      }
    } catch (error) {
      message.error('Failed to load module data')
      console.error('Error loading module:', error)
      router.push('/dashboard/modules')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && moduleId.value) {
      await moduleStore.updateModule(moduleId.value, formData.value)
      message.success('Module updated successfully')
    } else {
      await moduleStore.createModule(formData.value)
      message.success('Module created successfully')
    }
    router.push('/dashboard/modules')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update module'
        : 'Failed to create module'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/modules')
}

onMounted(() => {
  if (isEditing.value) {
    loadModule()
  }
})
</script>
