<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
import apiService, { type SubscriptionProductDTO } from '@/services/api'

const router = useRouter()
const products = ref<SubscriptionProductDTO[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const totalCount = ref(0)
const selectedProductIds = ref<string[]>([])

const pagination = computed(() => ({
  page: page.value,
  pageSize: size.value,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: totalCount.value
}))

function getLocalizedName(row: SubscriptionProductDTO): string {
  const localized = row.localizedName || {}
  return localized['en'] || Object.values(localized)[0] || row.identifier
}

const columns: DataTableColumns<SubscriptionProductDTO> = [
  {
    type: 'selection',
    width: 60
  },
  {
    title: 'Identifier',
    key: 'identifier',
    width: 200,
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: 'Name (en)',
    key: 'localizedName',
    width: 220,
    ellipsis: {
      tooltip: true
    },
    render: (row) => getLocalizedName(row)
  },
  {
    title: 'Active',
    key: 'active',
    width: 80,
    render: (row) => (row.active ? 'Yes' : 'No')
  }
]

async function loadProducts(pageNum: number, pageSize: number) {
  loading.value = true
  try {
    const result = await apiService.getSubscriptionProducts(pageNum, pageSize)
    products.value = result.entries
    totalCount.value = result.count
    page.value = pageNum
    size.value = pageSize
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

function handleCreate() {
  router.push('/dashboard/subscription-products/new')
}

async function handleEdit(row: SubscriptionProductDTO) {
  router.push(`/dashboard/subscription-products/${row.id}`)
}

async function handleDelete(id: string) {
  try {
    await apiService.deleteSubscriptionProduct(id)
    await loadProducts(page.value, size.value)
  } catch (error) {
    console.error('Failed to delete product:', error)
  }
}

async function handleBulkDelete() {
  if (selectedProductIds.value.length === 0) {
    return
  }
  
  try {
    for (const id of selectedProductIds.value) {
      await apiService.deleteSubscriptionProduct(id)
    }
    selectedProductIds.value = []
    await loadProducts(page.value, size.value)
  } catch (error) {
    console.error('Failed to delete products:', error)
  }
}

async function handlePageChange(pageNum: number) {
  await loadProducts(pageNum, size.value)
}

async function handlePageSizeChange(pageSize: number) {
  await loadProducts(1, pageSize)
}

onMounted(() => {
  loadProducts(page.value, size.value)
})
</script>

<template>
  <div class="subscription-products-view">
    <PageHeader
      title="Subscription Products"
      subtitle="Manage subscription products"
      :count="totalCount"
    >
      <template #actions>
        <NSpace>
          <NPopconfirm
            v-if="selectedProductIds.length > 0"
            @positive-click="handleBulkDelete"
          >
            <template #trigger>
              <NButton type="error">
                Delete Selected ({{ selectedProductIds.length }})
              </NButton>
            </template>
            Are you sure you want to delete the selected products?
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
          Add Product
        </NButton>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="products"
      :loading="loading"
      :row-key="(row: SubscriptionProductDTO) => row.id"
      v-model:checked-row-keys="selectedProductIds"
      :pagination="pagination"
      remote
      @update:page="handlePageChange"
      @update:page-size="handlePageSizeChange"
      :row-props="(row: SubscriptionProductDTO) => ({
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
