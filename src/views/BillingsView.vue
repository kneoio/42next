<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import apiService, { type UserBillingDTO } from '@/services/api'
import { useRouter } from 'vue-router'

const router = useRouter()
const billings = ref<UserBillingDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const totalCount = ref(0)
const selectedBillingIds = ref<string[]>([])

const pagination = computed(() => ({
  page: page.value,
  pageSize: size.value,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: totalCount.value
}))

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
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  router.push('/dashboard/billings/new')
}

async function handleEdit(billing: UserBillingDTO) {
  router.push(`/dashboard/billings/${billing.id}`)
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
    return
  }

  try {
    const toDelete = [...selectedBillingIds.value]
    const deletedCount = toDelete.length
    for (const id of toDelete) {
      await apiService.deleteBilling(id)
    }

    const currentTotal = totalCount.value
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = size.value
    const currentPage = page.value
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    selectedBillingIds.value = []
    await loadBillings(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete billings:', error)
  }
}
</script>

<template>
  <div class="billings-view">
    <PageHeader
      title="Billings"
      subtitle="Manage user billing records"
      :count="totalCount"
    >
      <template #actions>
        <NSpace>
          <NPopconfirm
            v-if="selectedBillingIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ selectedBillingIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected billings?
          </NPopconfirm>
        </NSpace>
      </template>
    </PageHeader>

    <ActionBar>
      <NSpace>
        <NButton 
          type="primary" 
          @click="handleCreate"
        >
          Add Billing
        </NButton>
      </NSpace>
    </ActionBar>

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
</template>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
