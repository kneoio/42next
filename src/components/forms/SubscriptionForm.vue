<template>
  <FormWrapper
    :title="isEditing ? 'Edit Subscription' : 'Create Subscription'"
    :subtitle="isEditing ? 'Update existing subscription' : 'Create a new subscription'"
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

      <NFormItem label="Stripe Sub ID" required>
        <NInput 
          v-model:value="formData.stripeSubscriptionId" 
          placeholder="Enter Stripe subscription ID"
        />
      </NFormItem>

      <NFormItem label="Type" required>
        <NInput 
          v-model:value="formData.subscriptionType" 
          placeholder="Enter subscription type"
        />
      </NFormItem>

      <NFormItem label="Status" required>
        <NInput 
          v-model:value="formData.subscriptionStatus" 
          placeholder="Enter subscription status"
        />
      </NFormItem>

      <NFormItem label="Trial End">
        <NDatePicker
          v-model:value="trialEndValue"
          type="datetime"
          clearable
        />
      </NFormItem>

      <NFormItem label="Active">
        <NSwitch v-model:value="formData.active" />
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
  NSwitch,
  NDatePicker,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import apiService, { type UserSubscriptionDTO } from '@/services/api'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const subscriptionId = computed(() => route.params.id as string)

const formData = ref<Partial<UserSubscriptionDTO>>({
  userId: 0,
  stripeSubscriptionId: '',
  subscriptionType: '',
  subscriptionStatus: '',
  active: true,
  meta: null
})

const metaText = ref('')
const trialEndValue = ref<number | null>(null)
const loading = ref(false)

async function loadSubscription() {
  if (isEditing.value && subscriptionId.value) {
    try {
      loading.value = true
      const dto = await apiService.getSubscriptionDocument(subscriptionId.value)
      formData.value = {
        userId: dto.userId,
        stripeSubscriptionId: dto.stripeSubscriptionId,
        subscriptionType: dto.subscriptionType,
        subscriptionStatus: dto.subscriptionStatus,
        active: dto.active,
        meta: dto.meta
      }
      metaText.value = dto.meta ? JSON.stringify(dto.meta, null, 2) : ''
      trialEndValue.value = dto.trialEnd ? Date.parse(dto.trialEnd) : null
    } catch (error) {
      message.error('Failed to load subscription data')
      console.error('Error loading subscription:', error)
      router.push('/dashboard/subscriptions')
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

    const payload: Partial<UserSubscriptionDTO> = {
      ...formData.value,
      meta: parsedMeta,
      trialEnd: trialEndValue.value ? new Date(trialEndValue.value).toISOString() : null
    }

    if (isEditing.value && subscriptionId.value) {
      await apiService.updateSubscription(subscriptionId.value, payload)
      message.success('Subscription updated successfully')
    } else {
      await apiService.createSubscription(payload)
      message.success('Subscription created successfully')
    }
    router.push('/dashboard/subscriptions')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update subscription'
        : 'Failed to create subscription'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/subscriptions')
}

onMounted(() => {
  if (isEditing.value) {
    loadSubscription()
  }
})
</script>
