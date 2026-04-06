<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { NDataTable, NButton, NSpace, NPopconfirm, NTag, type DataTableColumns } from 'naive-ui'
import { h } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import ActionBar from '@/components/ActionBar.vue'
import { useEnvironmentProfilesStore, type EnvironmentProfile } from '@/stores/environmentProfiles'
import { useRouter } from 'vue-router'

const store = useEnvironmentProfilesStore()
const router = useRouter()
const selectedIds = ref<string[]>([])

const pagination = computed(() => ({
  page: store.pageNum, pageSize: store.pageSize,
  pageSizes: [10, 20, 50], showSizePicker: true, itemCount: store.totalCount,
}))

const columns: DataTableColumns<EnvironmentProfile> = [
  { type: 'selection', multiple: true },
  { title: 'Name', key: 'name', minWidth: 150 },
  { title: 'Description', key: 'description', minWidth: 150, ellipsis: { tooltip: true } },
  { title: 'Explicit', key: 'explicitContent', width: 90,
    render: (row) => h(NTag, { size: 'small', type: row.explicitContent ? 'warning' : 'default' }, { default: () => row.explicitContent ? 'Yes' : 'No' })
  },
  { title: 'Genres', key: 'allowedGenres', width: 80, render: (row) => String(row.allowedGenres?.length || 0) },
  { title: 'Author', key: 'author', minWidth: 100 },
  { title: 'Last Modified', key: 'lastModifiedDate', width: 160, render: (row) => row.lastModifiedDate || '-' },
]

async function handleBulkDelete() {
  for (const id of selectedIds.value) await store.deleteProfile(id)
  selectedIds.value = []
  store.loadProfiles()
}

onMounted(() => store.loadProfiles())
</script>

<template>
  <div>
    <PageHeader title="Environment Profiles" subtitle="Manage environment profiles" :count="store.totalCount" />
    <ActionBar>
      <NSpace>
        <NButton type="primary" @click="router.push('/dashboard/environment-profiles/new')">Add</NButton>
        <NPopconfirm @positive-click="handleBulkDelete" :disabled="selectedIds.length === 0">
          <template #trigger><NButton type="error" :disabled="selectedIds.length === 0">Delete</NButton></template>
          Delete {{ selectedIds.length }} profile(s)?
        </NPopconfirm>
      </NSpace>
    </ActionBar>
    <NDataTable
      :columns="columns" :data="store.profiles" :loading="store.loading"
      :row-key="(row: EnvironmentProfile) => row.id" v-model:checked-row-keys="selectedIds"
      :pagination="pagination" remote
      @update:page="(p) => { store.pageNum = p; store.loadProfiles() }"
      @update:page-size="(s) => { store.pageSize = s; store.loadProfiles() }"
      :row-props="(row: EnvironmentProfile) => ({ style: 'cursor:pointer', onClick: (e: MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.n-data-table-td--selection') || t.closest('.n-checkbox')) return
        router.push(`/dashboard/environment-profiles/${row.id}`)
      }})"
    />
  </div>
</template>
