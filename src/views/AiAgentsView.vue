<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NDataTable, NButton, NSpace, NPopconfirm, type DataTableColumns } from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useAiAgentsStore, type AiAgent } from '@/stores/aiAgents'
import { useRouter } from 'vue-router'

const store = useAiAgentsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: store.pageNum,
  pageSize: store.pageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: store.totalCount,
}))

const columns: DataTableColumns<AiAgent> = [
  { type: 'selection', multiple: true },
  { title: 'Name', key: 'name', minWidth: 150 },
  { title: 'LLM Type', key: 'llmType', width: 120, render: (row) => row.llmType || 'Default' },
  { title: 'Talkativity', key: 'talkativity', width: 100, render: (row) => String(row.talkativity ?? '-') },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) await store.deleteAgent(id)
  selectedIds.value = []
  store.loadAgents()
}

onMounted(() => store.loadAgents())
</script>

<template>
  <div>
    <PageHeader title="AI Agents" subtitle="Manage AI agents" :count="store.totalCount" />
    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/ai-agents/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger>
            <NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton>
          </template>
          Delete {{ selectedIds.length }} agent(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>
    <NDataTable
      :columns="columns" :data="store.agents" :loading="store.loading"
      :row-key="(row: AiAgent) => row.id" v-model:checked-row-keys="selectedIds"
      :pagination="pagination" remote
      @update:page="(p) => { store.pageNum = p; store.loadAgents() }"
      @update:page-size="(s) => { store.pageSize = s; store.loadAgents() }"
      :row-props="(row: AiAgent) => ({ style: 'cursor:pointer', onClick: (e: MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.n-data-table-td--selection') || t.closest('.n-checkbox')) return
        router.push(`/dashboard/ai-agents/${row.id}`)
      }})"
    />
  </div>
</template>
