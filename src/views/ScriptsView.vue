<script setup lang="ts">
import { onMounted, computed, ref, h } from 'vue'
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
import { useScriptsStore, type Script } from '@/stores/scripts'
import { useRouter } from 'vue-router'
import CopyJsonButton from '@/components/CopyJsonButton.vue'

const scriptsStore = useScriptsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])
const importInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)

const pagination = computed(() => ({
  page: scriptsStore.pageNum,
  pageSize: scriptsStore.pageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: scriptsStore.totalCount,
}))

const columns: DataTableColumns<Script> = [
  { type: 'selection', multiple: true },
  { title: 'Name', key: 'name', minWidth: 150, ellipsis: { tooltip: true } },
  { title: 'Mode', key: 'timingMode', width: 180,
    render: (row) => row.timingMode === 'ABSOLUTE_TIME' ? 'Radio' : 'One Time Stream'
  },
  {
    title: 'Labels',
    key: 'labels',
    minWidth: 120,
    render: (row) => {
      if (!row.labels?.length) return '-'
      return h(NSpace, { size: 4 }, {
        default: () => row.labels.map(l => h(NTag, { size: 'small' }, { default: () => l }))
      })
    }
  },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160,
    render: (row) => row.lastModifiedDate || '-'
  },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) {
    await scriptsStore.deleteScript(id)
  }
  selectedIds.value = []
  scriptsStore.loadScripts()
}

async function handleExport() {
  for (const id of selectedIds.value) {
    try {
      const blob = await scriptsStore.exportScript(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `script-${id}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }
}

function triggerImport() {
  importInput.value?.click()
}

async function handleImportFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  try {
    importing.value = true
    await scriptsStore.importScript(file)
    scriptsStore.loadScripts()
  } catch (e: any) {
    console.error('Import failed', e)
  } finally {
    importing.value = false
    if (importInput.value) importInput.value.value = ''
  }
}

onMounted(() => scriptsStore.loadScripts())
</script>

<template>
  <div>
    <PageHeader title="Scripts" subtitle="Manage scripts" :count="scriptsStore.totalCount" />

    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/scripts/new')">Add</NButton>
        <NButton @click="triggerImport" :loading="importing">Import</NButton>
        <NButton :disabled="selectedIds.length === 0" @click="handleExport">
          Export ({{ selectedIds.length }})
        </NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger>
            <NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton>
          </template>
          Are you sure you want to delete {{ selectedIds.length }} script(s)?
        </NPopconfirm>
        <CopyJsonButton :data="scriptsStore.scripts" />
      </NSpace>
    </ActionBar>

    <input
      ref="importInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFile"
    />

    <NDataTable
      :columns="columns"
      :data="scriptsStore.scripts"
      :loading="scriptsStore.loading"
      :row-key="(row: Script) => row.id"
      v-model:checked-row-keys="selectedIds"
      :pagination="pagination"
      remote
      @update:page="(page) => { scriptsStore.pageNum = page; scriptsStore.loadScripts() }"
      @update:page-size="(size) => { scriptsStore.pageSize = size; scriptsStore.loadScripts() }"
      :row-props="(row: Script) => ({
        style: 'cursor: pointer;',
        onClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (target.closest('.n-data-table-td--selection') || target.closest('.n-checkbox')) return
          router.push(`/dashboard/scripts/${row.id}`)
        }
      })"
    />
  </div>
</template>
