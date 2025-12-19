<script setup lang="ts">
import { ref, onMounted, watch, computed, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NForm,
  NFormItem,
  NInputNumber,
  NInput,
  NSwitch,
  NDatePicker,
  NPagination,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import apiService, { type UserSubscriptionDTO } from '@/services/api'

const route = useRoute()
const router = useRouter()
const message = useMessage()

const subscriptions = ref<UserSubscriptionDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const maxPage = ref(1)
const totalCount = ref(0)

const formSubscription = ref<UserSubscriptionDTO | null>(null)
const formLoading = ref(false)
const metaText = ref('')
const trialEndValue = ref<number | null>(null)

const currentId = computed(() => route.params.id as string | undefined)
const isFormRoute = computed(() => !!currentId.value)
const isNew = computed(() => currentId.value === 'new')

const columns: DataTableColumns<UserSubscriptionDTO> = [
  {
    title: 'User ID',
    key: 'userId',
    width: 100
  },
  {
    title: 'Subscription Type',
    key: 'subscriptionType',
    width: 180,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Status',
    key: 'subscriptionStatus',
    width: 140
  },
  {
    title: 'Active',
    key: 'active',
    width: 80,
    render: (row) => (row.active ? 'Yes' : 'No')
  },
  {
    title: 'Actions',
    key: 'actions',
    width: 200,
    render(row) {
      return h(
        NSpace,
        null,
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => handleEdit(row),
              },
              { default: () => 'Edit' }
            ),
            h(
              NPopconfirm,
              {
                onPositiveClick: () => handleDelete(row.id),
              },
              {
                trigger: () =>
                  h(
                    NButton,
                    {
                      size: 'small',
                      type: 'error',
                    },
                    { default: () => 'Delete' }
                  ),
                default: () => 'Are you sure you want to delete this subscription?',
              }
            ),
          ],
        }
      )
    }
  }
]

async function loadSubscriptions() {
  loading.value = true
  try {
    const result = await apiService.getSubscriptions(page.value, size.value)
    subscriptions.value = result.entries
    totalCount.value = result.count
    maxPage.value = result.maxPage
  } catch (error) {
    console.error('Failed to load subscriptions:', error)
    message.error((error as Error).message || 'Failed to load subscriptions')
  } finally {
    loading.value = false
  }
}

async function loadSubscriptionDocument(id: string) {
  formLoading.value = true
  try {
    const dto = await apiService.getSubscriptionDocument(id)
    formSubscription.value = dto
    metaText.value = dto.meta ? JSON.stringify(dto.meta, null, 2) : ''
    trialEndValue.value = dto.trialEnd ? Date.parse(dto.trialEnd) : null
  } catch (error) {
    console.error('Failed to load subscription document:', error)
    message.error((error as Error).message || 'Failed to load subscription')
    router.push('/dashboard/subscriptions')
  } finally {
    formLoading.value = false
  }
}

function handleCreate() {
  router.push('/dashboard/subscriptions/new')
}

function handleEdit(row: UserSubscriptionDTO) {
  router.push(`/dashboard/subscriptions/${row.id}`)
}

async function handleDelete(id: string) {
  try {
    await apiService.deleteSubscription(id)
    message.success('Subscription deleted')
    await loadSubscriptions()
  } catch (error) {
    console.error('Failed to delete subscription:', error)
    const msg = (error as Error).message
    if (msg.includes('Not found') || msg.includes('404')) {
      message.error('Not found')
    } else {
      message.error(msg || 'Failed to delete subscription')
    }
  }
}

async function handleSave() {
  if (!formSubscription.value) return

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
    ...formSubscription.value,
    meta: parsedMeta,
    trialEnd: trialEndValue.value ? new Date(trialEndValue.value).toISOString() : null
  }

  try {
    if (isNew.value) {
      await apiService.createSubscription(payload)
    } else {
      await apiService.updateSubscription(formSubscription.value.id, payload)
    }
    message.success('Subscription saved')
    await loadSubscriptions()
    router.push('/dashboard/subscriptions')
  } catch (error) {
    console.error('Failed to save subscription:', error)
    message.error((error as Error).message || 'Failed to save subscription')
  }
}

function handleCancel() {
  router.push('/dashboard/subscriptions')
}

function handlePageChange(newPage: number) {
  page.value = newPage
  loadSubscriptions()
}

onMounted(() => {
  if (isFormRoute.value && currentId.value) {
    loadSubscriptionDocument(currentId.value)
  } else {
    loadSubscriptions()
  }
})

watch(
  () => route.params.id,
  (newId) => {
    if (typeof newId === 'string') {
      loadSubscriptionDocument(newId)
    } else {
      formSubscription.value = null
      metaText.value = ''
      trialEndValue.value = null
      loadSubscriptions()
    }
  }
)
</script>

<template>
  <div class="subscriptions-view">
    <div v-if="!isFormRoute">
      <div class="mb-4">
        <NSpace>
          <NButton type="primary" @click="handleCreate">
            Create Subscription
          </NButton>
        </NSpace>
      </div>

      <NDataTable
        :columns="columns"
        :data="subscriptions"
        :loading="loading"
        :row-key="(row: UserSubscriptionDTO) => row.id"
      />

      <div class="mt-4 flex justify-end">
        <NPagination
          :page="page"
          :page-count="maxPage"
          :page-size="size"
          :item-count="totalCount"
          @update:page="handlePageChange"
        />
      </div>
    </div>

    <div v-else class="form-view">
      <div class="form-header mb-4 flex justify-between items-center">
        <h2 class="text-xl font-semibold">
          {{ isNew ? 'Create Subscription' : 'Edit Subscription' }}
        </h2>
        <NSpace>
          <NButton @click="handleCancel">Cancel</NButton>
          <NButton type="primary" :loading="formLoading" @click="handleSave">Save</NButton>
        </NSpace>
      </div>

      <div v-if="formSubscription" class="form-content max-w-xl">
        <NForm :model="formSubscription" label-placement="left" label-width="180">
          <NFormItem label="User ID" required>
            <NInputNumber v-model:value="formSubscription.userId" :min="1" />
          </NFormItem>

          <NFormItem label="Stripe Subscription ID" required>
            <NInput v-model:value="formSubscription.stripeSubscriptionId" />
          </NFormItem>

          <NFormItem label="Subscription Type" required>
            <NInput v-model:value="formSubscription.subscriptionType" />
          </NFormItem>

          <NFormItem label="Subscription Status" required>
            <NInput v-model:value="formSubscription.subscriptionStatus" />
          </NFormItem>

          <NFormItem label="Trial End">
            <NDatePicker
              v-model:value="trialEndValue"
              type="datetime"
              clearable
            />
          </NFormItem>

          <NFormItem label="Active">
            <NSwitch v-model:value="formSubscription.active" />
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
      </div>
    </div>
  </div>
</template>
