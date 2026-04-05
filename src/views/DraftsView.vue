<script setup lang="ts">
import { onMounted, computed, h, ref } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useDraftsStore, type Draft } from '@/stores/drafts'
import { useRouter } from 'vue-router'

const draftsStore = useDraftsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: draftsStore.pageNum,
  pageSize: draftsStore.pageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: draftsStore.totalCount,
}))

const columns: DataTableColumns<Draft> = [
  { type: 'selection', multiple: true },
  { title: 'Title', key: 'title' },
  { title: 'Language', key: 'languageTag', width: 120 },
  { title: 'Enabled', key: 'enabled', width: 100, render: (row) => row.enabled ? 'Yes' : 'No' },
  { title: 'Locked', key: 'locked', width: 100, render: (row) => row.locked ? 'Yes' : 'No' },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) {
    await draftsStore.deleteDraft(id)
  }
  selectedIds.value = []
  draftsStore.loadDrafts()
}

onMounted(() => draftsStore.loadDrafts())
</script>

<template>
  <div>
    <PageHeader title="Drafts" subtitle="Manage drafts" :count="draftsStore.totalCount" />

    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/drafts/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger>
            <NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton>
          </template>
          Are you sure you want to delete {{ selectedIds.length }} draft(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="draftsStore.drafts"
      :loading="draftsStore.loading"
      :row-key="(row: Draft) => row.id"
      v-model:checked-row-keys="selectedIds"
      :pagination="pagination"
      remote
      @update:page="(page) => { draftsStore.pageNum = page; draftsStore.loadDrafts() }"
      @update:page-size="(size) => { draftsStore.pageSize = size; draftsStore.loadDrafts() }"
      :row-props="(row: Draft) => ({
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) return
          router.push(`/dashboard/drafts/${row.id}`)
        }
      })"
    />
  </div>
</template>
