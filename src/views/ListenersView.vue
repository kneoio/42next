<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NDataTable, NButton, NSpace, NPopconfirm, type DataTableColumns } from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useListenersStore, type ListenerEntry } from '@/stores/listeners'
import { useRouter } from 'vue-router'

const store = useListenersStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: store.pageNum, pageSize: store.pageSize,
  pageSizes: [10, 20, 50], showSizePicker: true, itemCount: store.totalCount,
}))

const columns: DataTableColumns<ListenerEntry> = [
  { type: 'selection', multiple: true },
  { title: 'Name', key: 'localizedName', minWidth: 150,
    render: (row) => {
      const ln = row.localizedName || {}
      return ln['en'] || Object.values(ln)[0] || row.slugName || row.id
    }
  },
  { title: 'Email', key: 'email', minWidth: 150, render: (row) => row.email || '-' },
  { title: 'Slug', key: 'slugName', minWidth: 120, render: (row) => row.slugName || '-' },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) await store.deleteListener(id)
  selectedIds.value = []
  store.loadListeners()
}

onMounted(() => store.loadListeners())
</script>

<template>
  <div>
    <PageHeader title="Listeners" subtitle="Manage listeners" :count="store.totalCount" />
    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/listeners/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger><NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton></template>
          Delete {{ selectedIds.length }} listener(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>
    <NDataTable
      :columns="columns" :data="store.listeners" :loading="store.loading"
      :row-key="(row: ListenerEntry) => row.id" v-model:checked-row-keys="selectedIds"
      :pagination="pagination" remote
      @update:page="(p) => { store.pageNum = p; store.loadListeners() }"
      @update:page-size="(s) => { store.pageSize = s; store.loadListeners() }"
      :row-props="(row: ListenerEntry) => ({ style: 'cursor:pointer', onClick: (e: MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.n-data-table-td--selection') || t.closest('.n-checkbox')) return
        router.push(`/dashboard/listeners/${row.id}`)
      }})"
    />
  </div>
</template>
