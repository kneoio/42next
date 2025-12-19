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
  type DataTableColumns,
  useMessage
} from 'naive-ui'
import FormPageHeader from '@/components/FormPageHeader.vue'
import ListPageHeader from '@/components/ListPageHeader.vue'
import { useAgreementsStore, type Agreement } from '@/stores/agreements'

const agreementsStore = useAgreementsStore()
const message = useMessage()

// Pagination state derived from store
const pagination = computed(() => ({
  page: agreementsStore.pageNum,
  pageSize: agreementsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: agreementsStore.totalCount
}))

// Form state
const showForm = ref(false)
const isEditing = ref(false)
const editingAgreement = ref<Agreement | null>(null)

interface AgreementFormData {
  country: string
  userAgent: string
  agreementVersion: string
  termsText: string
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string | null
}

const formData = ref<AgreementFormData>({
  country: '',
  userAgent: '',
  agreementVersion: '',
  termsText: ''
})

// Table columns
const columns: DataTableColumns<Agreement> = [
  {
    type: 'selection',
    multiple: true,
    width: 60
  },
  {
    title: 'Country',
    key: 'country',
    width: 100
  },
  {
    title: 'Version',
    key: 'agreementVersion',
    width: 140
  },
  {
    title: 'User Agent',
    key: 'userAgent',
    width: 220,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Author',
    key: 'author',
    width: 140
  },
  {
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 160,
    render(row) {
      return row.lastModifiedDate || '-'
    }
  }
]

// Agreement management
function handleCreate() {
  isEditing.value = false
  editingAgreement.value = null
  formData.value = {
    country: '',
    userAgent: '',
    agreementVersion: '',
    termsText: ''
  }
  showForm.value = true
}

async function handleEdit(agreement: Agreement) {
  isEditing.value = true
  editingAgreement.value = agreement
  try {
    const fullDoc = await agreementsStore.fetchAgreement(agreement.id)
    formData.value = {
      country: fullDoc.country,
      userAgent: fullDoc.userAgent,
      agreementVersion: fullDoc.agreementVersion,
      termsText: fullDoc.termsText,
      author: fullDoc.author,
      regDate: fullDoc.regDate,
      lastModifier: fullDoc.lastModifier,
      lastModifiedDate: fullDoc.lastModifiedDate
    }
  } catch (e) {
    formData.value = {
      country: agreement.country,
      userAgent: agreement.userAgent,
      agreementVersion: agreement.agreementVersion,
      termsText: agreement.termsText,
      author: agreement.author,
      regDate: agreement.regDate,
      lastModifier: agreement.lastModifier,
      lastModifiedDate: agreement.lastModifiedDate
    }
  }
  showForm.value = true
}

async function handleSave() {
  try {
    if (isEditing.value && editingAgreement.value) {
      await agreementsStore.updateAgreement(editingAgreement.value.id, formData.value)
      message.success('Agreement updated successfully')
    } else {
      await agreementsStore.createAgreement(formData.value)
      message.success('Agreement created successfully')
    }
    await agreementsStore.loadAgreements(agreementsStore.pageNum, agreementsStore.pageSize)
    showForm.value = false
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update agreement'
        : 'Failed to create agreement'
    message.error(errorMessage)
  }
}

async function handleBulkDelete() {
  if (agreementsStore.selectedAgreementIds.length === 0) {
    message.warning('Please select agreements to delete')
    return
  }

  try {
    const toDelete = [...agreementsStore.selectedAgreementIds]
    const deletedCount = toDelete.length
    await agreementsStore.deleteAgreements(toDelete)
    message.success(`${deletedCount} agreements deleted successfully`)

    const currentTotal = agreementsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = agreementsStore.pageSize
    const currentPage = agreementsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await agreementsStore.loadAgreements(targetPage, pageSize)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete agreements'
    message.error(errorMessage)
  }
}

function handleCancel() {
  showForm.value = false
  formData.value = {
    country: '',
    userAgent: '',
    agreementVersion: '',
    termsText: ''
  }
}

onMounted(() => {
  agreementsStore.loadAgreements(agreementsStore.pageNum, agreementsStore.pageSize)
})

onBeforeUnmount(() => {
  agreementsStore.clearSelection()
})

async function handlePageChange(page: number) {
  await agreementsStore.loadAgreements(page, agreementsStore.pageSize)
}

async function handlePageSizeChange(pageSize: number) {
  await agreementsStore.loadAgreements(1, pageSize)
}
</script>

<template>
  <div class="agreements-view">
    <!-- List View -->
    <div v-if="!showForm">
      <ListPageHeader
        title="Agreements"
        subtitle="Manage agreements"
        :count="agreementsStore.totalCount"
      >
        <template #actions>
          <NSpace>
            <NButton type="primary" @click="handleCreate">
              Add Agreement
            </NButton>
            <NPopconfirm
              v-if="agreementsStore.selectedAgreementIds.length > 0"
              @positive-click="handleBulkDelete"
            >
              <template #trigger>
                <NButton type="error">
                  Delete Selected ({{ agreementsStore.selectedAgreementIds.length }})
                </NButton>
              </template>
              Are you sure you want to delete the selected agreements?
            </NPopconfirm>
          </NSpace>
        </template>
      </ListPageHeader>

      <NDataTable
        :columns="columns"
        :data="agreementsStore.agreements"
        :loading="agreementsStore.loading"
        :row-key="(row: Agreement) => row.id"
        v-model:checked-row-keys="agreementsStore.selectedAgreementIds"
        :pagination="pagination"
        remote
        @update:page="handlePageChange"
        @update:page-size="handlePageSizeChange"
        :row-props="(row: Agreement) => ({
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
        :title="isEditing ? 'Edit Agreement' : 'Create Agreement'"
        :subtitle="isEditing ? 'Update existing agreement' : 'Create a new agreement'"
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
          label-width="140px"
        >
          <NFormItem label="Country" required>
            <NInput
              v-model:value="formData.country"
              placeholder="Enter country code (e.g., US)"
            />
          </NFormItem>

          <NFormItem label="Agreement Version" required>
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
              :rows="6"
              placeholder="Enter terms text"
            />
          </NFormItem>
        </NForm>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agreements-view {
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
