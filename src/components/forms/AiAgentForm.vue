<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect,
  NSlider, NDynamicInput, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useAiAgentsStore, type LanguagePreference } from '@/stores/aiAgents'
import { useRoute, useRouter } from 'vue-router'
import coreApiService from '@/services/coreApi'

const route = useRoute()
const router = useRouter()
const store = useAiAgentsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)

const formData = ref({
  name: '',
  llmType: null as string | null,
  talkativity: 0.5,
  podcastMode: 0,
  preferredLang: [] as LanguagePreference[],
})

const langOptions = ref<{ label: string; value: string }[]>([])

const llmTypeOptions = [
  { label: 'Default', value: null },
  { label: 'OpenAI', value: 'OPENAI' },
  { label: 'Anthropic', value: 'ANTHROPIC' },
]

function createLangPref(): LanguagePreference {
  return { languageTag: '', weight: 0.5 }
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveAgent(id, {
      ...formData.value,
      llmType: formData.value.llmType || undefined,
      primaryVoice: [],
    } as any)
    message.success('AI Agent saved successfully')
    router.push('/dashboard/ai-agents')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const langs = await coreApiService.getDictionary<any>('/languages')
    langOptions.value = langs.map((l: any) => ({
      label: l.localizedName?.en || l.code,
      value: l.code,
    }))
    if (isEditing.value) {
      const agent = await store.fetchAgent(route.params.id as string)
      formData.value = {
        name: agent.name || '',
        llmType: agent.llmType || null,
        talkativity: agent.talkativity ?? 0.5,
        podcastMode: agent.podcastMode ?? 0,
        preferredLang: agent.preferredLang || [],
      }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/ai-agents')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit AI Agent' : 'Create AI Agent'"
    :subtitle="isEditing ? 'Update AI agent' : 'Create a new AI agent'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/ai-agents')">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NForm label-placement="left" label-width="140" :disabled="loading">
      <NFormItem label="Name">
        <NInput v-model:value="formData.name" style="width: 100%" />
      </NFormItem>

      <NFormItem label="LLM Type">
        <NSelect v-model:value="formData.llmType" :options="llmTypeOptions" style="width: 200px" />
      </NFormItem>

      <NFormItem label="Talkativity">
        <NSlider v-model:value="formData.talkativity" :min="0" :max="1" :step="0.05"
          :tooltip="false" style="flex:1; max-width:300px" />
        <span style="margin-left:12px; min-width:40px">{{ formData.talkativity }}</span>
      </NFormItem>

      <NFormItem label="Podcast Mode">
        <NSlider v-model:value="formData.podcastMode" :min="0" :max="1" :step="1"
          :tooltip="false" style="flex:1; max-width:300px" />
        <span style="margin-left:12px">{{ formData.podcastMode ? 'On' : 'Off' }}</span>
      </NFormItem>

      <NFormItem label="Preferred Languages">
        <NDynamicInput v-model:value="formData.preferredLang" :on-create="createLangPref" style="width:100%">
          <template #default="{ index }">
            <NSpace align="center" style="width:100%">
              <NSelect
                v-model:value="formData.preferredLang[index].languageTag"
                :options="langOptions" filterable style="width:180px"
              />
              <NSlider
                v-model:value="formData.preferredLang[index].weight"
                :min="0" :max="1" :step="0.1" :tooltip="false" style="width:150px"
              />
              <span style="min-width:30px">{{ formData.preferredLang[index].weight }}</span>
            </NSpace>
          </template>
        </NDynamicInput>
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>
