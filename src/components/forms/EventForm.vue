<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect,
  NDynamicInput, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useEventsStore, EVENT_TYPES, EVENT_PRIORITIES, type EventAction } from '@/stores/events'
import { useRoute, useRouter } from 'vue-router'
import mixplaApiService from '@/services/mixplaApi'

const route = useRoute()
const router = useRouter()
const store = useEventsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)

const formData = ref({
  type: '',
  description: '',
  priority: 'MEDIUM',
  brandId: null as string | null,
  timeZone: null as string | null,
  actions: [] as EventAction[],
})

const brandOptions = ref<{ label: string; value: string }[]>([])
const promptOptions = ref<{ label: string; value: string }[]>([])

const TIMEZONES = [
  { label: 'UTC (+0)', value: 'UTC' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Europe/Paris (+1/+2)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (+1/+2)', value: 'Europe/Berlin' },
  { label: 'Europe/Kiev (+2/+3)', value: 'Europe/Kiev' },
  { label: 'Europe/Helsinki (+2/+3)', value: 'Europe/Helsinki' },
  { label: 'Europe/Riga (+2/+3)', value: 'Europe/Riga' },
  { label: 'Europe/Istanbul (+3)', value: 'Europe/Istanbul' },
  { label: 'Asia/Dubai (+4)', value: 'Asia/Dubai' },
  { label: 'Asia/Tbilisi (+4)', value: 'Asia/Tbilisi' },
  { label: 'Asia/Tashkent (+5)', value: 'Asia/Tashkent' },
  { label: 'Asia/Almaty (+6)', value: 'Asia/Almaty' },
  { label: 'Asia/Tokyo (+9)', value: 'Asia/Tokyo' },
  { label: 'America/New_York (-5/-4)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (-8/-7)', value: 'America/Los_Angeles' },
  { label: 'America/Sao_Paulo (-3)', value: 'America/Sao_Paulo' },
]

function createAction(): EventAction {
  return { promptId: undefined, active: true, rank: 0, weight: 1 }
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveEvent(id, {
      ...formData.value,
      brandId: formData.value.brandId || '',
      actions: formData.value.actions.filter(a => a.promptId),
    })
    message.success('Event saved successfully')
    router.push('/dashboard/events')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [brands, prompts] = await Promise.allSettled([
      mixplaApiService.getPagedDictionary<any>('/brands', 1, 200),
      mixplaApiService.getPagedDictionary<any>('/prompts', 1, 200),
    ])
    if (brands.status === 'fulfilled') {
      brandOptions.value = brands.value.entries.map((b: any) => ({
        label: b.localizedName?.en || b.title || b.slugName || b.id,
        value: b.id,
      }))
    }
    if (prompts.status === 'fulfilled') {
      promptOptions.value = prompts.value.entries.map((p: any) => ({
        label: p.title || p.id,
        value: p.id,
      }))
    }
    if (isEditing.value) {
      const event = await store.fetchEvent(route.params.id as string)
      formData.value = {
        type: event.type || '',
        description: event.description || '',
        priority: event.priority || 'MEDIUM',
        brandId: event.brandId || null,
        timeZone: event.timeZone || null,
        actions: event.actions || [],
      }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/events')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Event' : 'Create Event'"
    :subtitle="isEditing ? 'Update event' : 'Create a new broadcast event'"
    :loading="loading"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/events')">Close</NButton>
        <NButton type="primary" @click="handleSave">Save</NButton>
      </NSpace>
    </template>

    <NForm label-placement="left" label-width="120" :disabled="loading">
      <NFormItem label="Type">
        <NSelect v-model:value="formData.type" :options="EVENT_TYPES" style="width: 200px" />
      </NFormItem>

      <NFormItem label="Priority">
        <NSelect v-model:value="formData.priority" :options="EVENT_PRIORITIES" style="width: 150px" />
      </NFormItem>

      <NFormItem label="Description">
        <NInput v-model:value="formData.description" type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }" style="width: 100%" />
      </NFormItem>

      <NFormItem label="Brand">
        <NSelect v-model:value="formData.brandId" :options="brandOptions"
          filterable clearable style="width: 100%" />
      </NFormItem>

      <NFormItem label="Time Zone">
        <NSelect v-model:value="formData.timeZone" :options="TIMEZONES"
          filterable clearable style="width: 280px" />
      </NFormItem>

      <NFormItem label="Actions">
        <NDynamicInput v-model:value="formData.actions" :on-create="createAction" style="width:100%">
          <template #default="{ index }">
            <NSelect
              v-model:value="formData.actions[index].promptId"
              :options="promptOptions" filterable style="width:100%"
            />
          </template>
        </NDynamicInput>
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>
