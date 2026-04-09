<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import {
  NDataTable,
  NButton,
  NSpace,
  NPopconfirm,
  NTag,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { usePromptsStore, type Prompt } from '@/stores/prompts'
import { useRouter } from 'vue-router'
import CopyJsonButton from '@/components/CopyJsonButton.vue'

const promptsStore = usePromptsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: promptsStore.pageNum,
  pageSize: promptsStore.pageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: promptsStore.totalCount,
}))

const columns: DataTableColumns<Prompt> = [
  { type: 'selection', multiple: true },
  { title: 'Title', key: 'title', minWidth: 150, ellipsis: { tooltip: true } },
  { title: 'Type', key: 'promptType', width: 120 },
  { title: 'Language', key: 'languageTag', width: 100 },
  {
    title: 'Master',
    key: 'master',
    width: 80,
    render: (row) => row.master ? 'Yes' : 'No'
  },
  {
    title: 'Enabled',
    key: 'enabled',
    width: 80,
    render: (row) => row.enabled
      ? h(NTag, { type: 'success', size: 'small' }, { default: () => 'Yes' })
      : h(NTag, { type: 'default', size: 'small' }, { default: () => 'No' })
  },
  { title: 'Author', key: 'author', minWidth: 100 },
  {
    title: 'Last Modified',
    key: 'lastModifiedDate',
    width: 160,
    render: (row) => row.lastModifiedDate || '-'
  },
]

import { h } from 'vue'

async function handleBulkDelete() {
  for (const id of selectedIds.value) {
    await promptsStore.deletePrompt(id)
  }
  selectedIds.value = []
  promptsStore.loadPrompts()
}

onMounted(() => promptsStore.loadPrompts())
</script>

<template>
  <div>
    <PageHeader title="Prompts" subtitle="Manage prompts" :count="promptsStore.totalCount" />

    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/prompts/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger>
            <NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton>
          </template>
          Are you sure you want to delete {{ selectedIds.length }} prompt(s)?
        </NPopconfirm>
        <CopyJsonButton :data="promptsStore.prompts" />
      </NSpace>
    </ActionBar>

    <NDataTable
      :columns="columns"
      :data="promptsStore.prompts"
      :loading="promptsStore.loading"
      :row-key="(row: Prompt) => row.id"
      v-model:checked-row-keys="selectedIds"
      :pagination="pagination"
      remote
      @update:page="(page) => { promptsStore.pageNum = page; promptsStore.loadPrompts() }"
      @update:page-size="(size) => { promptsStore.pageSize = size; promptsStore.loadPrompts() }"
      :row-props="(row: Prompt) => ({
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) return
          router.push(`/dashboard/prompts/${row.id}`)
        }
      })"
    />
  </div>
</template>
