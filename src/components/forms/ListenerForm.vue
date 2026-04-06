<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect,
  NDynamicInput, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useListenersStore } from '@/stores/listeners'
import { useRoute, useRouter } from 'vue-router'
import coreApiService from '@/services/coreApi'

const route = useRoute()
const router = useRouter()
const store = useListenersStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)

// localizedName as array of {lang, name} for NDynamicInput
const localizedNames = ref<{ lang: string; name: string }[]>([])
const telegramName = ref('')
const country = ref<string | null>(null)
const slugName = ref('')

const langOptions = ref<{ label: string; value: string }[]>([])

const COUNTRIES = [
  { label: 'United States', value: 'US' }, { label: 'United Kingdom', value: 'GB' },
  { label: 'Germany', value: 'DE' }, { label: 'France', value: 'FR' },
  { label: 'Spain', value: 'ES' }, { label: 'Italy', value: 'IT' },
  { label: 'Portugal', value: 'PT' }, { label: 'Brazil', value: 'BR' },
  { label: 'Russia', value: 'RU' }, { label: 'Ukraine', value: 'UA' },
  { label: 'Latvia', value: 'LV' }, { label: 'Georgia', value: 'GE' },
  { label: 'Kazakhstan', value: 'KZ' }, { label: 'Japan', value: 'JP' },
]

function createLocalizedName() {
  return { lang: 'en', name: '' }
}

function buildLocalizedName(): Record<string, string> {
  const result: Record<string, string> = {}
  for (const item of localizedNames.value) {
    if (item.lang && item.name) result[item.lang] = item.name
  }
  return result
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveListener(id, {
      localizedName: buildLocalizedName(),
      telegramName: telegramName.value || undefined,
      country: country.value || undefined,
      slugName: slugName.value || undefined,
    } as any)
    message.success('Listener saved successfully')
    router.push('/dashboard/listeners')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const langs = await coreApiService.getDictionary<any>('/languages').catch(() => [])
    langOptions.value = langs.map((l: any) => ({
      label: l.localizedName?.en || l.code, value: l.code
    }))

    if (isEditing.value) {
      const entry = await store.fetchListener(route.params.id as string)
      const data = entry.listener ?? (entry as any)
      const ln: Record<string, string> = data.localizedName || {}
      localizedNames.value = Object.entries(ln).map(([lang, name]) => ({ lang, name }))
      telegramName.value = data.telegramName || ''
      country.value = data.country || null
      slugName.value = data.slugName || ''
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/listeners')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Listener' : 'Create Listener'"
    :subtitle="isEditing ? 'Update listener' : 'Create a new listener'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/listeners')">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NForm label-placement="left" label-width="140" :disabled="loading">
      <NFormItem label="Localized Names">
        <NDynamicInput v-model:value="localizedNames" :on-create="createLocalizedName" style="width:100%">
          <template #default="{ index }">
            <NSpace align="center" style="width:100%">
              <NSelect v-model:value="localizedNames[index].lang" :options="langOptions"
                filterable style="width:120px" />
              <NInput v-model:value="localizedNames[index].name" style="flex:1" />
            </NSpace>
          </template>
        </NDynamicInput>
      </NFormItem>

      <NFormItem label="Telegram Name">
        <NInput v-model:value="telegramName" style="width: 100%" />
      </NFormItem>

      <NFormItem label="Country">
        <NSelect v-model:value="country" :options="COUNTRIES" filterable clearable style="width: 250px" />
      </NFormItem>

      <NFormItem label="Slug Name">
        <NInput v-model:value="slugName" style="width: 100%" />
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>
