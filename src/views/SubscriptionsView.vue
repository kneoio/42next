<script setup lang="ts">
import { ref, onMounted, computed, h } from 'vue'
import { useRouter } from 'vue-router'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import apiService, { type UserSubscriptionDTO } from '@/services/api'

const router = useRouter()
const subscriptions = ref<UserSubscriptionDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const totalCount = ref(0)
const selectedSubscriptionIds = ref<string[]>([])

const pagination = computed(() => ({
  page: page.value,
  pageSize: size.value,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: totalCount.value
}))

const columns: DataTableColumns<UserSubscriptionDTO> = [
  {
    type: 'selection',
    width: 60
  },
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
  }
]

async function loadSubscriptions(pageNum: number, pageSize: number) {
  loading.value = true
  try {
    const result = await apiService.getSubscriptions(pageNum, pageSize)
    subscriptions.value = result.entries
    totalCount.value = result.count
    page.value = pageNum
    size.value = pageSize
  } catch (error) {
    console.error('Failed to load subscriptions:', error)
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  router.push('/dashboard/subscriptions/new')
}

async function handleEdit(row: UserSubscriptionDTO) {
  router.push(`/dashboard/subscriptions/${row.id}`)
}

async function handleDelete(id: string) {
  try {
    await apiService.deleteSubscription(id)
    await loadSubscriptions(page.value, size.value)
  } catch (error) {
    console.error('Failed to delete subscription:', error)
  }
}

async function handleBulkDelete() {
  if (selectedSubscriptionIds.value.length === 0) {
    return
  }
  
  try {
    for (const id of selectedSubscriptionIds.value) {
      await apiService.deleteSubscription(id)
    }
    selectedSubscriptionIds.value = []
    await loadSubscriptions(page.value, size.value)
  } catch (error) {
    console.error('Failed to delete subscriptions:', error)
  }
}

async function handlePageChange(pageNum: number) {
  await loadSubscriptions(pageNum, size.value)
}

async function handlePageSizeChange(pageSize: number) {
  await loadSubscriptions(1, pageSize)
}

onMounted(() => {
  loadSubscriptions(page.value, size.value)
})

</script>

<template>
  <div class="subscriptions-view">
    <PageHeader
      title="Subscriptions"
      subtitle="Manage user subscriptions"
      :count="totalCount"
    >
      <template #actions>
        <NSpace>
          <NPopconfirm
            v-if="selectedSubscriptionIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ selectedSubscriptionIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected subscriptions?
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
          Add Subscription
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="subscriptions"
      :loading="loading"
      :row-key="(row: UserSubscriptionDTO) => row.id"
      v-model:checked-row-keys="selectedSubscriptionIds"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      :row-props="(row: UserSubscriptionDTO) => ({
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
