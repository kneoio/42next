<template>
  <FormWrapper
    :title="isEditing ? 'Edit Subscription Product' : 'Create Subscription Product'"
    :subtitle="isEditing ? 'Update existing product' : 'Create a new product'"
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

      <NFormItem label="Stripe Price ID" required>
        <NInput 
          v-model:value="formData.stripePriceId" 
          placeholder="Enter Stripe price ID"
        />
      </NFormItem>

      <NFormItem label="Stripe Product ID" required>
        <NInput 
          v-model:value="formData.stripeProductId" 
          placeholder="Enter Stripe product ID"
        />
      </NFormItem>

      <NFormItem label="Active">
        <NSwitch v-model:value="formData.active" />
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
  NSwitch,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import apiService, { type SubscriptionProductDTO } from '@/services/api'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const productId = computed(() => route.params.id as string)

const formData = ref<Partial<SubscriptionProductDTO>>({
  identifier: '',
  stripePriceId: '',
  stripeProductId: '',
  active: true,
  localizedName: { en: '', pt: '', kk: '' },
  localizedDescription: { en: '', pt: '', kk: '' },
  meta: null
})

const metaText = ref('')
const loading = ref(false)

async function loadProduct() {
  if (isEditing.value && productId.value) {
    try {
      loading.value = true
      const dto = await apiService.getSubscriptionProductDocument(productId.value)
      formData.value = {
        identifier: dto.identifier,
        stripePriceId: dto.stripePriceId,
        stripeProductId: dto.stripeProductId,
        active: dto.active,
        localizedName: { ...dto.localizedName },
        localizedDescription: { ...dto.localizedDescription },
        meta: dto.meta
      }
      metaText.value = dto.meta ? JSON.stringify(dto.meta, null, 2) : ''
    } catch (error) {
      message.error('Failed to load product data')
      console.error('Error loading product:', error)
      router.push('/dashboard/subscription-products')
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

    const payload: Partial<SubscriptionProductDTO> = {
      ...formData.value,
      meta: parsedMeta
    }

    if (isEditing.value && productId.value) {
      await apiService.updateSubscriptionProduct(productId.value, payload)
      message.success('Product updated successfully')
    } else {
      await apiService.createSubscriptionProduct(payload)
      message.success('Product created successfully')
    }
    router.push('/dashboard/subscription-products')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update product'
        : 'Failed to create product'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/subscription-products')
}

onMounted(() => {
  if (isEditing.value) {
    loadProduct()
  }
})
</script>
