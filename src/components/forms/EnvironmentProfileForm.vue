<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NButton, NSpace, NForm, NFormItem, NInput, NSelect, NCheckbox, useMessage } from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useEnvironmentProfilesStore } from '@/stores/environmentProfiles'
import { useRoute, useRouter } from 'vue-router'
import officeframeApiService from '@/services/officeframeApi'

const route = useRoute()
const router = useRouter()
const store = useEnvironmentProfilesStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)

const formData = ref({
  name: '',
  description: '',
  explicitContent: false,
  allowedGenres: [] as string[],
})

const genreOptions = ref<{ label: string; value: string }[]>([])

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveProfile(id, formData.value)
    message.success('Profile saved successfully')
    router.push('/dashboard/environment-profiles')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [genres] = await Promise.allSettled([
      officeframeApiService.getPagedDictionary<any>('/genres', 1, 200)
    ])
    if (genres.status === 'fulfilled') {
      genreOptions.value = genres.value.entries.map((g: any) => ({
        label: g.title || g.name || g.id,
        value: g.id
      }))
    }
    if (isEditing.value) {
      const profile = await store.fetchProfile(route.params.id as string)
      formData.value = {
        name: profile.name || '',
        description: profile.description || '',
        explicitContent: profile.explicitContent ?? false,
        allowedGenres: (profile.allowedGenres as any[])?.map((g: any) => (typeof g === 'string' ? g : g.id)) || [],
      }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/environment-profiles')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Environment Profile' : 'Create Environment Profile'"
    :subtitle="isEditing ? 'Update profile' : 'Create a new profile'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/environment-profiles')">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NForm label-placement="left" label-width="140" :disabled="loading">
      <NFormItem label="Name">
        <NInput v-model:value="formData.name" style="width: 100%" />
      </NFormItem>
      <NFormItem label="Description">
        <NInput v-model:value="formData.description" type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }" style="width: 100%" />
      </NFormItem>
      <NFormItem label="Explicit Content">
        <NCheckbox v-model:checked="formData.explicitContent">Allow explicit content</NCheckbox>
      </NFormItem>
      <NFormItem label="Allowed Genres">
        <NSelect v-model:value="formData.allowedGenres" :options="genreOptions"
          multiple filterable style="width: 100%" />
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>
