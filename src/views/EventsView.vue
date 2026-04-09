<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NDataTable, NButton, NSpace, NPopconfirm, NTag, type DataTableColumns } from 'naive-ui'
import { h } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useEventsStore, type BroadcastEvent } from '@/stores/events'
import { useRouter } from 'vue-router'
import CopyJsonButton from '@/components/CopyJsonButton.vue'

const store = useEventsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: store.pageNum, pageSize: store.pageSize,
  pageSizes: [10, 20, 50], showSizePicker: true, itemCount: store.totalCount,
}))

const priorityType: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  LOW: 'default', MEDIUM: 'info', HIGH: 'warning', CRITICAL: 'error'
}

const columns: DataTableColumns<BroadcastEvent> = [
  { type: 'selection', multiple: true },
  { title: 'Type', key: 'type', width: 130 },
  { title: 'Description', key: 'description', minWidth: 150, ellipsis: { tooltip: true } },
  { title: 'Priority', key: 'priority', width: 100,
    render: (row) => h(NTag, { size: 'small', type: priorityType[row.priority] || 'default' }, { default: () => row.priority || '-' })
  },
  { title: 'Brand', key: 'brandId', minWidth: 120, render: (row) => row.brandId || '-' },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) await store.deleteEvent(id)
  selectedIds.value = []
  store.loadEvents()
}

onMounted(() => store.loadEvents())
</script>

<template>
  <div>
    <PageHeader title="Events" subtitle="Manage broadcast events" :count="store.totalCount" />
    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/events/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger><NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton></template>
          Delete {{ selectedIds.length }} event(s)?
        </NPopconfirm>
        <CopyJsonButton :data="store.events" />
      </NSpace>
    </ActionBar>
    <NDataTable
      :columns="columns" :data="store.events" :loading="store.loading"
      :row-key="(row: BroadcastEvent) => row.id" v-model:checked-row-keys="selectedIds"
      :pagination="pagination" remote
      @update:page="(p) => { store.pageNum = p; store.loadEvents() }"
      @update:page-size="(s) => { store.pageSize = s; store.loadEvents() }"
      :row-props="(row: BroadcastEvent) => ({ style: 'cursor:pointer', onClick: (e: MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.n-data-table-td--selection') || t.closest('.n-checkbox')) return
        router.push(`/dashboard/events/${row.id}`)
      }})"
    />
  </div>
</template>
