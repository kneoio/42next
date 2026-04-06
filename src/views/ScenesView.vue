<script setup lang="ts">
import { onMounted, computed, h } from 'vue'
import {
  NDataTable,
  NTag,
  NSpace,
  type DataTableColumns
} from 'naive-ui'
import PageHeader from '@/components/PageHeader.vue'
import { useScriptsStore, type ScriptScene } from '@/stores/scripts'
import { useRouter } from 'vue-router'

const scriptsStore = useScriptsStore()
const router = useRouter()

const pagination = computed(() => ({
  page: scriptsStore.scenesPageNum,
  pageSize: scriptsStore.scenesPageSize,
  pageSizes: [10, 20, 50],
  showSizePicker: true,
  itemCount: scriptsStore.scenesTotalCount,
}))

const columns: DataTableColumns<ScriptScene> = [
  { title: 'Title', key: 'title', minWidth: 150, ellipsis: { tooltip: true },
    render: (row) => row.title || '-'
  },
  {
    title: 'Mode',
    key: 'timingMode',
    width: 180,
    render: (row) => {
      const mode = row.timingMode
      if (!mode) return '-'
      return h(NTag, { size: 'small', type: mode === 'ABSOLUTE_TIME' ? 'info' : 'success' }, {
        default: () => mode === 'ABSOLUTE_TIME' ? 'Radio' : 'One Time Stream'
      })
    }
  },
  {
    title: 'Start / Duration',
    key: 'startTime',
    width: 140,
    render: (row) => {
      if (row.startTime) return row.startTime
      if (row.durationSeconds) return `${row.durationSeconds / 60} min`
      return '-'
    }
  },
  {
    title: 'Prompts',
    key: 'prompts',
    width: 80,
    render: (row) => String(row.prompts?.length || 0)
  },
  { title: 'Script', key: 'scriptId', minWidth: 120,
    render: (row) => row.scriptId || '-'
  },
]

onMounted(() => scriptsStore.loadScenes())
</script>

<template>
  <div>
    <PageHeader title="Scenes" subtitle="All scenes across scripts" :count="scriptsStore.scenesTotalCount" />

    <NDataTable
      :columns="columns"
      :data="scriptsStore.scenes"
      :loading="scriptsStore.loading"
      :row-key="(row: ScriptScene) => row.id || String(Math.random())"
      :pagination="pagination"
      remote
      @update:page="(page) => { scriptsStore.scenesPageNum = page; scriptsStore.loadScenes() }"
      @update:page-size="(size) => { scriptsStore.scenesPageSize = size; scriptsStore.loadScenes() }"
      :row-props="(row: ScriptScene) => ({
        style: row.scriptId ? 'cursor: pointer;' : '',
        onClick: () => {
          if (row.scriptId) router.push(`/dashboard/scripts/${row.scriptId}`)
        }
      })"
    />
  </div>
</template>
