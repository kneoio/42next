<script setup lang="ts">
import { onMounted, onBeforeUnmount, h, ref, computed } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NForm,
  NFormItem,
  NInput,
  NSwitch,
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import FormPageHeader from '@/components/FormPageHeader.vue'
import ListPageHeader from '@/components/ListPageHeader.vue'
import { useConsentsStore, type UserConsent } from '@/stores/consents'

const consentsStore = useConsentsStore()
const message = useMessage()

// Pagination state derived from store
const pagination = computed(() => ({
  page: consentsStore.pageNum,
  pageSize: consentsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: consentsStore.totalCount
}))

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingConsent = ref<UserConsent | null>(null)

interface ConsentFormData {
  userId: string
  essential: boolean
  analytics: boolean
  marketing: boolean
  timestamp?: string | null
  ipAddress?: string
  userAgent?: string
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string | null
}

const formData = ref<ConsentFormData>({
  userId: '',
  essential: true,
  analytics: false,
  marketing: false
})

// Table columns
const columns: DataTableColumns<UserConsent> = [
  {
    type: 'selection',
    multiple: true,
    width: 60
  },
  {
    title: 'User ID',
    key: 'userId',
    width: 180
  },
  {
    title: 'Essential',
    key: 'essential',
    width: 100,
    render(row) {
      return row.essential ? 'Yes' : 'No'
    }
  },
  {
    title: 'Analytics',
    key: 'analytics',
    width: 100,
    render(row) {
      return row.analytics ? 'Yes' : 'No'
    }
  },
  {
    title: 'Marketing',
    key: 'marketing',
    width: 100,
    render(row) {
      return row.marketing ? 'Yes' : 'No'
    }
  },
  {
    title: 'Timestamp',
    key: 'timestamp',
    width: 180,
    render(row) {
      return row.timestamp || '-'
    }
  },
  {
    title: 'IP Address',
    key: 'ipAddress',
    width: 140
  },
  {
    title: 'User Agent',
    key: 'userAgent',
    width: 220,
    ellipsis: {
      tooltip: true
    }
  }
]

// Consent management
function handleCreate() {
  isEditing.value = false
  editingConsent.value = null
  formData.value = {
    userId: '',
    essential: true,
    analytics: false,
    marketing: false
  }
  showForm.value = true
}

async function handleEdit(consent: UserConsent) {
  isEditing.value = true
  editingConsent.value = consent
  try {
    const fullDoc = await consentsStore.fetchConsent(consent.id)
    formData.value = {
      userId: fullDoc.userId,
      essential: fullDoc.essential,
      analytics: fullDoc.analytics,
      marketing: fullDoc.marketing,
      timestamp: fullDoc.timestamp,
      ipAddress: fullDoc.ipAddress,
      userAgent: fullDoc.userAgent,
      author: fullDoc.author,
      regDate: fullDoc.regDate,
      lastModifier: fullDoc.lastModifier,
      lastModifiedDate: fullDoc.lastModifiedDate
    }
  } catch (e) {
    formData.value = {
      userId: consent.userId,
      essential: consent.essential,
      analytics: consent.analytics,
      marketing: consent.marketing,
      timestamp: consent.timestamp,
      ipAddress: consent.ipAddress,
      userAgent: consent.userAgent,
      author: consent.author,
      regDate: consent.regDate,
      lastModifier: consent.lastModifier,
      lastModifiedDate: consent.lastModifiedDate
    }
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingConsent.value) {
      await consentsStore.updateConsent(editingConsent.value.id, formData.value)
      message.success('Consent updated successfully')
    } else {
      await consentsStore.createConsent(formData.value)
      message.success('Consent created successfully')
    }
    await consentsStore.loadConsents(consentsStore.pageNum, consentsStore.pageSize)
    showForm.value = false
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update consent'
        : 'Failed to create consent'
    message.error(errorMessage)
  }
}

async function handleBulkDelete() {
  if (consentsStore.selectedConsentIds.length === 0) {
    message.warning('Please select consents to delete')
    return
  }

  try {
    const toDelete = [...consentsStore.selectedConsentIds]
    const deletedCount = toDelete.length
    await consentsStore.deleteConsents(toDelete)
    message.success(`${deletedCount} consents deleted successfully`)

    const currentTotal = consentsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = consentsStore.pageSize
    const currentPage = consentsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await consentsStore.loadConsents(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete consents'
    message.error(errorMessage)
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    userId: '',
    essential: true,
    analytics: false,
    marketing: false
  }
}

onMounted(() => {
  consentsStore.loadConsents(consentsStore.pageNum, consentsStore.pageSize)
})

onBeforeUnmount(() => {
  consentsStore.clearSelection()
})

async function handlePageChange(page: number) {
  await consentsStore.loadConsents(page, consentsStore.pageSize)
}

async function handlePageSizeChange(pageSize: number) {
  await consentsStore.loadConsents(1, pageSize)
}
</script>

<template>
  <div class="consents-view">
    <!-- List View -->
    <div v-if="!showForm">
      <ListPageHeader
        title="User Consents"
        subtitle="Manage user consent flags"
        :count="consentsStore.totalCount"
      >
        <template #actions>
          <NSpace>
            <NButton type="primary" @click="handleCreate">
              Add Consent
            </NButton>
            <NPopconfirm
              v-if="consentsStore.selectedConsentIds.length > 0"
              @positive-click="handleBulkDelete"
            >
              <template #trigger>
                <NButton type="error">
                  Delete Selected ({{ consentsStore.selectedConsentIds.length }})
                </NButton>
              </template>
              Are you sure you want to delete the selected consents?
            </NPopconfirm>
          </NSpace>
        </template>
      </ListPageHeader>

      <NDataTable
        :columns="columns"
        :data="consentsStore.consents"
        :loading="consentsStore.loading"
        :row-key="(row: UserConsent) => row.id"
        v-model:checked-row-keys="consentsStore.selectedConsentIds"
        :pagination="pagination"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        :row-props="(row: UserConsent) => ({
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

    <!-- Form View -->
    <div v-else class="form-view">
      <FormPageHeader
        :title="isEditing ? 'Edit Consent' : 'Create Consent'"
        :subtitle="isEditing ? 'Update existing consent' : 'Create a new consent'"
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
          label-width="160px"
        >
          <NFormItem label="User ID" required>
            <NInput
              v-model:value="formData.userId"
              placeholder="Enter user ID"
            />
          </NFormItem>

          <NFormItem label="Essential" required>
            <NSwitch v-model:value="formData.essential" />
          </NFormItem>

          <NFormItem label="Analytics" required>
            <NSwitch v-model:value="formData.analytics" />
          </NFormItem>

          <NFormItem label="Marketing" required>
            <NSwitch v-model:value="formData.marketing" />
          </NFormItem>

          <NFormItem label="IP Address" v-if="isEditing && formData.ipAddress">
            <NInput v-model:value="formData.ipAddress" disabled />
          </NFormItem>

          <NFormItem label="User Agent" v-if="isEditing && formData.userAgent">
            <NInput v-model:value="formData.userAgent" type="textarea" :rows="2" disabled />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.consents-view {
  padding: 24px;
}

.form-content {
  max-width: 800px;
  background: var(--card-color);
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color);
}
</style>
