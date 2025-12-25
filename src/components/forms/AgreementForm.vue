<template>
  <FormWrapper
    :title="isEditing ? 'Edit Agreement' : 'Create Agreement'"
    :subtitle="isEditing ? 'Update existing agreement' : 'Create a new agreement'"
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
      <NFormItem label="Country" required>
        <NInput 
          v-model:value="formData.country" 
          placeholder="Enter country code (e.g., US)"
        />
      </NFormItem>

      <NFormItem label="Version" required>
        <NInput 
          v-model:value="formData.agreementVersion" 
          placeholder="Enter agreement version"
        />
      </NFormItem>

      <NFormItem label="User Agent">
        <NInput 
          v-model:value="formData.userAgent" 
          placeholder="Enter user agent"
        />
      </NFormItem>

      <NFormItem label="Terms Text" required>
        <NInput 
          v-model:value="formData.termsText" 
          type="textarea"
          :rows="8"
          placeholder="Enter terms text"
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
import { useAgreementsStore, type Agreement } from '@/stores/agreements'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const agreementsStore = useAgreementsStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const agreementId = computed(() => route.params.id as string)

const formData = ref({
  country: '',
  userAgent: '',
  agreementVersion: '',
  termsText: ''
})

const loading = ref(false)

async function loadAgreement() {
  if (isEditing.value && agreementId.value) {
    try {
      loading.value = true
      const agreement = await agreementsStore.fetchAgreement(agreementId.value)
      formData.value = {
        country: agreement.country,
        userAgent: agreement.userAgent,
        agreementVersion: agreement.agreementVersion,
        termsText: agreement.termsText
      }
    } catch (error) {
      message.error('Failed to load agreement data')
      console.error('Error loading agreement:', error)
      router.push('/dashboard/agreements')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && agreementId.value) {
      await agreementsStore.updateAgreement(agreementId.value, formData.value)
      message.success('Agreement updated successfully')
    } else {
      await agreementsStore.createAgreement(formData.value)
      message.success('Agreement created successfully')
    }
    router.push('/dashboard/agreements')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update agreement'
        : 'Failed to create agreement'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/agreements')
}

onMounted(() => {
  if (isEditing.value) {
    loadAgreement()
  }
})
</script>
