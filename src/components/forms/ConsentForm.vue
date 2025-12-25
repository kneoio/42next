<template>
  <FormWrapper
    :title="isEditing ? 'Edit Consent' : 'Create Consent'"
    :subtitle="isEditing ? 'Update existing consent' : 'Create a new consent'"
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
      <NFormItem label="User ID" required>
        <NInput 
          v-model:value="formData.userId" 
          placeholder="Enter user ID"
        />
      </NFormItem>

      <NFormItem label="Essential">
        <NSwitch v-model:value="formData.essential" />
      </NFormItem>

      <NFormItem label="Analytics">
        <NSwitch v-model:value="formData.analytics" />
      </NFormItem>

      <NFormItem label="Marketing">
        <NSwitch v-model:value="formData.marketing" />
      </NFormItem>

      <NFormItem label="IP Address" v-if="isEditing && formData.ipAddress">
        <NInput v-model:value="formData.ipAddress" disabled />
      </NFormItem>

      <NFormItem label="User Agent" v-if="isEditing && formData.userAgent">
        <NInput 
          v-model:value="formData.userAgent" 
          type="textarea"
          :rows="2"
          disabled
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
  NSwitch,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useConsentsStore, type UserConsent } from '@/stores/consents'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const consentsStore = useConsentsStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const consentId = computed(() => route.params.id as string)

const formData = ref({
  userId: '',
  essential: true,
  analytics: false,
  marketing: false,
  ipAddress: '',
  userAgent: ''
})

const loading = ref(false)

async function loadConsent() {
  if (isEditing.value && consentId.value) {
    try {
      loading.value = true
      const consent = await consentsStore.fetchConsent(consentId.value)
      formData.value = {
        userId: consent.userId,
        essential: consent.essential,
        analytics: consent.analytics,
        marketing: consent.marketing,
        ipAddress: consent.ipAddress || '',
        userAgent: consent.userAgent || ''
      }
    } catch (error) {
      message.error('Failed to load consent data')
      console.error('Error loading consent:', error)
      router.push('/dashboard/consents')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    const payload = {
      userId: formData.value.userId,
      essential: formData.value.essential,
      analytics: formData.value.analytics,
      marketing: formData.value.marketing
    }

    if (isEditing.value && consentId.value) {
      await consentsStore.updateConsent(consentId.value, payload)
      message.success('Consent updated successfully')
    } else {
      await consentsStore.createConsent(payload)
      message.success('Consent created successfully')
    }
    router.push('/dashboard/consents')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update consent'
        : 'Failed to create consent'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/consents')
}

onMounted(() => {
  if (isEditing.value) {
    loadConsent()
  }
})
</script>
