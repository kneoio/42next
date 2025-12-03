<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NForm,
  NFormItem,
  NInputNumber,
  NInput,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import FormPageHeader from '@/components/FormPageHeader.vue'
import ListPageHeader from '@/components/ListPageHeader.vue'
import apiService, { type UserBillingDTO } from '@/services/api'

const message = useMessage()

const billings = ref<UserBillingDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const totalCount = ref(0)

const showForm = ref(false)
const isEditing = ref(false)
const editingBilling = ref<UserBillingDTO | null>(null)
const metaText = ref('')
const selectedBillingIds = ref<string[]>([])

const pagination = computed(() => ({
  page: page.value,
  pageSize: size.value,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: totalCount.value
}))

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

const columns: DataTableColumns<UserBillingDTO> = [
  {
    type: 'selection',
    multiple: true,
    width: 60
  },
  {
    title: 'User ID',
    key: 'userId',
    width: 100
  },
  {
    title: 'Stripe Customer ID',
    key: 'stripeCustomerId',
    width: 220,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Registered At',
    key: 'regDate',
    width: 180
  },
  {
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 180,
    render(row) {
      return row.lastModifiedDate || '-'
    }
  }
]

async function loadBillings(pageNum: number, pageSize: number) {
  loading.value = true
  try {
    const result = await apiService.getBillings(pageNum, pageSize)
    billings.value = result.entries
    totalCount.value = result.count
    page.value = result.page
    size.value = result.size
  } catch (error) {
    console.error('Failed to load billings:', error)
    message.error((error as Error).message || 'Failed to load billings')
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  isEditing.value = false
  editingBilling.value = null
  formData.value = {
    userId: 0,
    stripeCustomerId: '',
    meta: null
  }
  metaText.value = ''
  showForm.value = true
}

async function handleEdit(billing: UserBillingDTO) {
  isEditing.value = true
  editingBilling.value = billing
  try {
    const fullDoc = await apiService.getBillingDocument(billing.id)
    formData.value = {
      userId: fullDoc.userId,
      stripeCustomerId: fullDoc.stripeCustomerId,
      meta: fullDoc.meta
    }
    metaText.value = fullDoc.meta ? JSON.stringify(fullDoc.meta, null, 2) : ''
  } catch (e) {
    formData.value = {
      userId: billing.userId,
      stripeCustomerId: billing.stripeCustomerId,
      meta: billing.meta
    }
    metaText.value = billing.meta ? JSON.stringify(billing.meta, null, 2) : ''
  }
  showForm.value = true
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

    if (isEditing.value && editingBilling.value) {
      await apiService.updateBilling(editingBilling.value.id, payload)
      message.success('Billing updated successfully')
    } else {
      await apiService.createBilling(payload)
      message.success('Billing created successfully')
    }
    await loadBillings(page.value, size.value)
    showForm.value = false
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
  showForm.value = false
  formData.value = {
    userId: 0,
    stripeCustomerId: '',
    meta: null
  }
  metaText.value = ''
}

onMounted(() => {
  loadBillings(page.value, size.value)
})

onBeforeUnmount(() => {
  selectedBillingIds.value = []
})

async function handlePageChange(pageNum: number) {
  await loadBillings(pageNum, size.value)
}

async function handlePageSizeChange(pageSize: number) {
  await loadBillings(1, pageSize)
}

async function handleBulkDelete() {
  if (selectedBillingIds.value.length === 0) {
    message.warning('Please select billings to delete')
    return
  }

  try {
    const toDelete = [...selectedBillingIds.value]
    const deletedCount = toDelete.length
    for (const id of toDelete) {
      await apiService.deleteBilling(id)
    }
    message.success(`${deletedCount} billing(s) deleted successfully`)

    const currentTotal = totalCount.value
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = size.value
    const currentPage = page.value
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    selectedBillingIds.value = []
    await loadBillings(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete billings'
    message.error(errorMessage)
  }
}
</script>

<template>
  <div class="billings-view">
    <div v-if="!showForm">
      <ListPageHeader
        title="Billings"
        subtitle="Manage user billing records"
        :count="totalCount"
      >
        <template #actions>
          <NSpace>
            <NButton type="primary" @click="handleCreate">
              Add Billing
            </NButton>
            <NPopconfirm
              @positive-click="handleBulkDelete"
            >
              <template #trigger>
                <NButton 
                  type="error"
                  :disabled="selectedBillingIds.length === 0"
                >
                  Delete Selected ({{ selectedBillingIds.length }})
                </NButton>
              </template>
              Are you sure you want to delete the selected billings?
            </NPopconfirm>
          </NSpace>
        </template>
      </ListPageHeader>

      <NDataTable
        :columns="columns"
        :data="billings"
        :loading="loading"
        :row-key="(row: UserBillingDTO) => row.id"
        v-model:checked-row-keys="selectedBillingIds"
        :pagination="pagination"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        :row-props="(row: UserBillingDTO) => ({
          style: 'cursor: pointer;',
          onClick: (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) {
              return
            }
            handleEdit(row)
          }
        })"
      />
    </div>

    <div v-else class="form-view">
      <FormPageHeader
        :title="isEditing ? 'Edit Billing' : 'Create Billing'"
        :subtitle="isEditing ? 'Update existing billing record' : 'Create a new billing record'"
        @back="handleCancel"
      >
        <template #actions>
          <NButton @click="handleCancel">Close</NButton>
          <NButton type="primary" @click="handleSave">
            Save
          </NButton>
        </template>
      </FormPageHeader>

      <div class="form-content">
        <NForm
          :model="formData"
          label-placement="left"
          label-width="auto"
        >
          <NFormItem label="User ID" required>
            <NInputNumber v-model:value="formData.userId" :min="1" />
          </NFormItem>

          <NFormItem label="Stripe Customer ID" required>
            <NInput v-model:value="formData.stripeCustomerId" placeholder="Enter Stripe customer ID" />
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

<style scoped>
.billings-view {
  padding: 24px;
}

.form-view {
  width: 100%;
}

.form-content {
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
