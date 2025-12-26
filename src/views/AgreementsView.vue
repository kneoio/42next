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
import { useAgreementsStore, type Agreement } from '@/stores/agreements'
import { useRouter } from 'vue-router'

const agreementsStore = useAgreementsStore()
const router = useRouter()

const pagination = computed(() => ({
  page: agreementsStore.pageNum,
  pageSize: agreementsStore.pageSize,
  pageSizes: [10, 20, 50, 100],
  showSizePicker: true,
  itemCount: agreementsStore.totalCount
}))

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

function handleCreate() {
  router.push('/dashboard/agreements/new')
}

async function handleEdit(agreement: Agreement) {
  router.push(`/dashboard/agreements/${agreement.id}`)
}

async function handleDelete(id: string) {
  try {
    await agreementsStore.deleteAgreement(id)
  } catch (error) {
    console.error('Failed to delete agreement:', error)
  }
}

async function handleBulkDelete() {
  if (agreementsStore.selectedAgreementIds.length === 0) {
    return
  }

  try {
    const toDelete = [...agreementsStore.selectedAgreementIds]
    const deletedCount = toDelete.length
    await agreementsStore.deleteAgreements(toDelete)
    agreementsStore.clearSelection()

    const currentTotal = agreementsStore.totalCount
    const newTotal = Math.max(0, currentTotal - deletedCount)
    const pageSize = agreementsStore.pageSize
    const currentPage = agreementsStore.pageNum
    const maxPageAfterDelete = newTotal === 0 ? 1 : Math.ceil(newTotal / pageSize)
    const targetPage = Math.min(currentPage, maxPageAfterDelete)
    await agreementsStore.loadAgreements(targetPage, pageSize)
  } catch (error) {
    console.error('Failed to delete agreements:', error)
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
    <PageHeader
      title="Agreements"
      subtitle="Manage agreements"
      :count="agreementsStore.totalCount"
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
          :disabled="agreementsStore.selectedAgreementIds.length === 0"
        >
          <template #trigger>
            <NButton 
              type="error"
              :disabled="agreementsStore.selectedAgreementIds.length === 0"
            >
              Delete
            </NButton>
          </template>
          Are you sure you want to delete {{ agreementsStore.selectedAgreementIds.length }} selected agreement(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>

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
</template>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}

:deep(.n-data-table-td) {
  border-bottom: 1px solid var(--n-divider-color);
}
</style>
