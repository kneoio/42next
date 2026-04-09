<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NDataTable, NButton, NSpace, NPopconfirm, NTag, type DataTableColumns } from 'naive-ui'
import { h } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useSoundFragmentsStore, type SoundFragment } from '@/stores/soundFragments'
import { useRouter } from 'vue-router'
import CopyJsonButton from '@/components/CopyJsonButton.vue'

const store = useSoundFragmentsStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: store.pageNum, pageSize: store.pageSize,
  pageSizes: [10, 20, 50], showSizePicker: true, itemCount: store.totalCount,
}))

const columns: DataTableColumns<SoundFragment> = [
  { type: 'selection', multiple: true },
  { title: 'Title', key: 'title', minWidth: 150, render: (row) => row.title || row.slugName || '-' },
  { title: 'Artist', key: 'artist', minWidth: 120, render: (row) => row.artist || '-' },
  { title: 'Type', key: 'type', width: 140,
    render: (row) => h(NTag, { size: 'small' }, { default: () => row.type || '-' })
  },
  { title: 'Genres', key: 'genres', width: 80, render: (row) => String(row.genres?.length || 0) },
  { title: 'Source', key: 'source', width: 130, render: (row) => row.source || '-' },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) await store.deleteFragment(id)
  selectedIds.value = []
  store.loadFragments()
}

onMounted(() => store.loadFragments())
</script>

<template>
  <div>
    <PageHeader title="Sound Fragments" subtitle="Manage sound fragments" :count="store.totalCount" />
    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/sound-fragments/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger><NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton></template>
          Delete {{ selectedIds.length }} fragment(s)?
        </NPopconfirm>
        <CopyJsonButton :data="store.fragments" />
      </NSpace>
    </ActionBar>
    <NDataTable
      :columns="columns" :data="store.fragments" :loading="store.loading"
      :row-key="(row: SoundFragment) => row.id" v-model:checked-row-keys="selectedIds"
      :pagination="pagination" remote
      @update:page="(p) => { store.pageNum = p; store.loadFragments() }"
      @update:page-size="(s) => { store.pageSize = s; store.loadFragments() }"
      :row-props="(row: SoundFragment) => ({ style: 'cursor:pointer', onClick: (e: MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.n-data-table-td--selection') || t.closest('.n-checkbox')) return
        router.push(`/dashboard/sound-fragments/${row.id}`)
      }})"
    />
  </div>
</template>
