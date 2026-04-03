<template>
  <div>
    <ListPageHeader title="Drafts" @create="router.push('/dashboard/drafts/new')" />

    <NDataTable
      :columns="columns"
      :data="draftsStore.drafts"
      :loading="draftsStore.loading"
      :pagination="pagination"
      remote
      @update:page="(page) => { draftsStore.pageNum = page; draftsStore.loadDrafts() }"
      @update:page-size="(size) => { draftsStore.pageSize = size; draftsStore.loadDrafts() }"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, h } from 'vue'
import { NDataTable, NButton } from 'naive-ui'
import ListPageHeader from '@/components/ListPageHeader.vue'
import { useDraftsStore, type Draft } from '@/stores/drafts'
import { useRouter } from 'vue-router'

const draftsStore = useDraftsStore()
const router = useRouter()

const pagination = computed(() => ({
  page: draftsStore.pageNum,
  pageSize: draftsStore.pageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: draftsStore.totalCount,
}))

const columns = [
  {
    title: 'Title',
    key: 'title',
    render: (row: Draft) => h(NButton, { text: true, onClick: () => router.push(`/dashboard/drafts/${row.id}`) }, { default: () => row.title || row.id }),
  },
  { title: 'Language', key: 'languageTag', width: 120 },
  {
    title: 'Enabled',
    key: 'enabled',
    width: 100,
    render: (row: Draft) => row.enabled ? 'Yes' : 'No',
  },
  {
    title: 'Locked',
    key: 'locked',
    width: 100,
    render: (row: Draft) => row.locked ? 'Yes' : 'No',
  },
]

onMounted(() => draftsStore.loadDrafts())
</script>
