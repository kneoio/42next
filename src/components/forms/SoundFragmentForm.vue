<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect,
  NTabs, NTabPane, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useSoundFragmentsStore, FRAGMENT_TYPES } from '@/stores/soundFragments'
import { useRoute, useRouter } from 'vue-router'
import officeframeApiService from '@/services/officeframeApi'
import mixplaApiService from '@/services/mixplaApi'

const route = useRoute()
const router = useRouter()
const store = useSoundFragmentsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')

const formData = ref({
  type: 'SONG' as string,
  title: '',
  artist: '',
  album: '',
  description: '',
  genres: [] as string[],
  labels: [] as string[],
  representedInBrands: [] as string[],
})

const genreOptions = ref<{ label: string; value: string }[]>([])
const labelOptions = ref<{ label: string; value: string }[]>([])
const brandOptions = ref<{ label: string; value: string }[]>([])

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveFragment(id, formData.value as any)
    message.success('Sound fragment saved successfully')
    router.push('/dashboard/sound-fragments')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [genres, labels, brands] = await Promise.allSettled([
      officeframeApiService.getPagedDictionary<any>('/genres', 1, 200),
      officeframeApiService.getPagedDictionary<any>('/labels/only/category/SOUND_FRAGMENT', 1, 200),
      mixplaApiService.getPagedDictionary<any>('/brands', 1, 200),
    ])
    if (genres.status === 'fulfilled') {
      genreOptions.value = genres.value.entries.map((g: any) => ({
        label: g.title || g.name || g.id, value: g.id
      }))
    }
    if (labels.status === 'fulfilled') {
      labelOptions.value = labels.value.entries.map((l: any) => ({
        label: l.identifier || l.title || l.id, value: l.identifier || l.id
      }))
    }
    if (brands.status === 'fulfilled') {
      brandOptions.value = brands.value.entries.map((b: any) => ({
        label: b.localizedName?.en || b.title || b.slugName || b.id, value: b.id
      }))
    }
    if (isEditing.value) {
      const frag = await store.fetchFragment(route.params.id as string)
      formData.value = {
        type: frag.type || 'SONG',
        title: frag.title || '',
        artist: frag.artist || '',
        album: frag.album || '',
        description: frag.description || '',
        genres: frag.genres || [],
        labels: frag.labels || [],
        representedInBrands: frag.representedInBrands || [],
      }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/sound-fragments')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Sound Fragment' : 'Create Sound Fragment'"
    :subtitle="isEditing ? 'Update sound fragment' : 'Create a new sound fragment'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/sound-fragments')">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NTabs v-model:value="activeTab">
      <NTabPane name="properties" tab="Main properties">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem label="Type">
            <NSelect v-model:value="formData.type" :options="FRAGMENT_TYPES" style="width: 200px" />
          </NFormItem>

          <NFormItem label="Title">
            <NInput v-model:value="formData.title" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Artist">
            <NInput v-model:value="formData.artist" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Album">
            <NInput v-model:value="formData.album" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Genres">
            <NSelect v-model:value="formData.genres" :options="genreOptions"
              multiple filterable style="width: 100%" />
          </NFormItem>

          <NFormItem label="Labels">
            <NSelect v-model:value="formData.labels" :options="labelOptions"
              multiple filterable style="width: 100%" />
          </NFormItem>

          <NFormItem label="Assign To">
            <NSelect v-model:value="formData.representedInBrands" :options="brandOptions"
              multiple filterable style="width: 100%" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="description" tab="Description">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem label="Description">
            <NInput v-model:value="formData.description" type="textarea"
              :autosize="{ minRows: 8, maxRows: 20 }" style="width: 100%" />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </FormWrapper>
</template>
