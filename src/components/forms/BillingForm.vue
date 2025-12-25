<template>
  <FormWrapper
    :title="isEditing ? 'Edit Billing' : 'Create Billing'"
    :subtitle="isEditing ? 'Update existing billing record' : 'Create a new billing record'"
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
        <NInputNumber 
          v-model:value="formData.userId" 
          :min="1"
          placeholder="Enter user ID"
        />
      </NFormItem>

      <NFormItem label="Stripe Customer ID" required>
        <NInput 
          v-model:value="formData.stripeCustomerId" 
          placeholder="Enter Stripe customer ID"
        />
      </NFormItem>

      <NFormItem label="Meta (JSON)">
        <NInput
          v-model:value="metaText"
          type="textarea"
          :rows="6"
          placeholder="Enter JSON object or leave empty"
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
  NInputNumber,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import apiService, { type UserBillingDTO } from '@/services/api'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const billingId = computed(() => route.params.id as string)

interface BillingFormData {
  userId: number
  stripeCustomerId: string
  meta: Record<string, unknown> | null
}

const formData = ref<BillingFormData>({
  userId: 0,
  stripeCustomerId: '',
  meta: null
})

const metaText = ref('')
const loading = ref(false)

async function loadBilling() {
  if (isEditing.value && billingId.value) {
    try {
      loading.value = true
      const fullDoc = await apiService.getBillingDocument(billingId.value)
      formData.value = {
        userId: fullDoc.userId,
        stripeCustomerId: fullDoc.stripeCustomerId,
        meta: fullDoc.meta
      }
      metaText.value = fullDoc.meta ? JSON.stringify(fullDoc.meta, null, 2) : ''
    } catch (error) {
      message.error('Failed to load billing data')
      console.error('Error loading billing:', error)
      router.push('/dashboard/billings')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    let parsedMeta: Record<string, unknown> | null = null
    if (metaText.value.trim()) {
      try {
        parsedMeta = JSON.parse(metaText.value)
      } catch {
        message.error('Invalid JSON payload')
        return
      }
    }

    const payload = {
      userId: formData.value.userId,
      stripeCustomerId: formData.value.stripeCustomerId,
      meta: parsedMeta
    }

    if (isEditing.value && billingId.value) {
      await apiService.updateBilling(billingId.value, payload)
      message.success('Billing updated successfully')
    } else {
      await apiService.createBilling(payload)
      message.success('Billing created successfully')
    }
    router.push('/dashboard/billings')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update billing'
        : 'Failed to create billing'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/billings')
}

onMounted(() => {
  if (isEditing.value) {
    loadBilling()
  }
})
</script>
