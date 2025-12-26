<script setup lang="ts">
import { onMounted, onBeforeUnmount, computed } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useConsentsStore, type UserConsent } from '@/stores/consents'
import { useRouter } from 'vue-router'

const consentsStore = useConsentsStore()
const router = useRouter()

const pagination = computed(() => ({
  page: consentsStore.pageNum,
  pageSize: consentsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: consentsStore.totalCount
}))

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

function handleCreate() {
  router.push('/dashboard/consents/new')
}

async function handleEdit(consent: UserConsent) {
  router.push(`/dashboard/consents/${consent.id}`)
}

async function handleDelete(id: string) {
  try {
    await consentsStore.deleteConsent(id)
  } catch (error) {
    console.error('Failed to delete consent:', error)
  }
}

async function handleBulkDelete() {
  if (consentsStore.selectedConsentIds.length === 0) {
    return
  }

  try {
    const toDelete = [...consentsStore.selectedConsentIds]
    const deletedCount = toDelete.length
    await consentsStore.deleteConsents(toDelete)
    consentsStore.clearSelection()

    const currentTotal = consentsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = consentsStore.pageSize
    const currentPage = consentsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await consentsStore.loadConsents(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete consents:', error)
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
    <PageHeader
      title="User Consents"
      subtitle="Manage user consents"
      :count="consentsStore.totalCount"
    />

    <ActionBar>
      <NSpace>
        <NButton 
          type="primary" 
          @click="handleCreate"
        >
          Add
        </NButton>
        <NPopconfirm
          @positive-click="handleBulkDelete"
          :disabled="consentsStore.selectedConsentIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="consentsStore.selectedConsentIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ consentsStore.selectedConsentIds.length }} selected consent(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>

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
</template>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
