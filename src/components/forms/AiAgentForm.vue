<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect, NInputNumber,
  NSlider, NDynamicInput, NTabs, NTabPane, NTag, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useAiAgentsStore, type LanguagePreference } from '@/stores/aiAgents'
import { useRoute, useRouter } from 'vue-router'
import coreApiService from '@/services/coreApi'
import mixplaApiService from '@/services/mixplaApi'
import officeframeApiService from '@/services/officeframeApi'

const route = useRoute()
const router = useRouter()
const store = useAiAgentsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')

type TtsRole = 'dj' | 'newsReporter' | 'weatherReporter'

const formData = ref({
  name: '',
  llmType: null as string | null,
  talkativity: 0.5,
  podcastMode: 0,
  preferredLang: [] as LanguagePreference[],
  labels: [] as string[],
  ttsSetting: {} as Record<TtsRole, { id?: string; name?: string; engineType?: string | null; gain?: number }>,
  copilotId: null as string | null,
})

// Options
const langOptions = ref<{ label: string; value: string }[]>([])
const labelOptions = ref<{ label: string; value: string }[]>([])
const agentOptions = ref<{ label: string; value: string }[]>([])
const voicesByEngine = ref<Record<string, any[]>>({})

// Language filters per TTS role
const langFilters = ref<Record<TtsRole, string[]>>({ dj: [], newsReporter: [], weatherReporter: [] })

const llmTypeOptions = [
  { label: 'Default', value: '', type: 'ignored' as const },
  { label: 'OpenAI', value: 'OPENAI' },
  { label: 'Anthropic', value: 'ANTHROPIC' },
]

const voiceGainOptions = [
  { label: '-12 dB', value: 0.25 },
  { label: '-6 dB', value: 0.5 },
  { label: '-2.5 dB', value: 0.75 },
  { label: '0 dB (default)', value: 1.0 },
  { label: '+2 dB', value: 1.25 },
  { label: '+3.5 dB', value: 1.5 },
  { label: '+6 dB', value: 2.0 },
]

const engineOptions = [
  { label: '—', value: '', type: 'ignored' as const },
  { label: 'ElevenLabs', value: 'ELEVENLABS' },
  { label: 'ModelsLab', value: 'MODELSLAB' },
  { label: 'Google', value: 'GOOGLE' },
]

const TTS_ROLES: { key: TtsRole; label: string }[] = [
  { key: 'dj', label: 'DJ' },
  { key: 'newsReporter', label: 'News Reporter' },
  { key: 'weatherReporter', label: 'Weather Reporter' },
]

function voiceOptionsFor(role: TtsRole) {
  const engine = formData.value.ttsSetting[role]?.engineType?.toLowerCase()
  if (!engine) return []
  const all = voicesByEngine.value[engine] || []
  const filters = langFilters.value[role]
  if (!filters.length) return all
  return all.filter(v => filters.some(f => v.language?.startsWith(f.split('-')[0])))
}

function renderVoiceLabel(option: any) {
  return h('span', { style: 'display:flex;align-items:center;gap:6px' }, [
    option.language
      ? h(NTag, { type: 'info', size: 'small' }, { default: () => option.language })
      : null,
    h('span', option.name),
  ].filter(Boolean))
}

async function loadVoicesForEngine(engine: string, role: TtsRole) {
  if (!engine) return
  const key = engine.toLowerCase()
  try {
    voicesByEngine.value[key] = await mixplaApiService.fetchVoices(key, langFilters.value[role])
  } catch {}
}

async function onEngineChange(role: TtsRole, engine: string | null) {
  const ts = { ...formData.value.ttsSetting }
  ts[role] = { engineType: engine, gain: ts[role]?.gain ?? 1.0 }
  formData.value.ttsSetting = ts
  if (engine) await loadVoicesForEngine(engine, role)
}

async function onLangFilterChange(role: TtsRole) {
  const engine = formData.value.ttsSetting[role]?.engineType?.toLowerCase()
  if (engine) {
    voicesByEngine.value[engine] = await mixplaApiService.fetchVoices(engine, langFilters.value[role])
  }
}

function onVoiceChange(role: TtsRole, voiceId: string | null) {
  const ts = { ...formData.value.ttsSetting }
  if (!voiceId) {
    delete ts[role]
  } else {
    const engine = ts[role]?.engineType?.toLowerCase()
    const opt = (voicesByEngine.value[engine || ''] || []).find(v => v.id === voiceId)
    ts[role] = { id: voiceId, name: opt?.name || '', engineType: ts[role]?.engineType, gain: ts[role]?.gain ?? 1.0 }
  }
  formData.value.ttsSetting = ts
}

function onGainChange(role: TtsRole, gain: number) {
  const ts = { ...formData.value.ttsSetting }
  if (!ts[role]) {
    ts[role] = { gain }
  } else {
    ts[role] = { ...ts[role], gain }
  }
  formData.value.ttsSetting = ts
}

function createLangPref(): LanguagePreference {
  return { languageTag: 'en-US', weight: 1 }
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveAgent(id, {
      ...formData.value,
      llmType: formData.value.llmType || undefined,
      copilot: formData.value.copilotId || undefined,
      ttsSetting: Object.keys(formData.value.ttsSetting).length ? formData.value.ttsSetting : undefined,
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
    const [langs, lbls, agents] = await Promise.allSettled([
      coreApiService.getDictionary<any>('/languages'),
      officeframeApiService.getPagedDictionary<any>('/labels/only/category/AI_AGENT', 1, 200),
      store.loadAgents(1, 200),
    ])
    if (langs.status === 'fulfilled') {
      langOptions.value = langs.value.map((l: any) => ({
        label: l.localizedName?.en || l.code, value: l.code
      }))
    }
    if (lbls.status === 'fulfilled') {
      labelOptions.value = lbls.value.entries.map((l: any) => ({
        label: l.identifier || l.title || l.id, value: l.id
      }))
    }
    agentOptions.value = store.agents.map(a => ({ label: a.name || a.id, value: a.id }))

    // Pre-load all engine voices
    await Promise.allSettled([
      mixplaApiService.fetchVoices('elevenlabs').then(v => voicesByEngine.value['elevenlabs'] = v),
      mixplaApiService.fetchVoices('google').then(v => voicesByEngine.value['google'] = v),
      mixplaApiService.fetchVoices('modelslab').then(v => voicesByEngine.value['modelslab'] = v),
    ])

    if (isEditing.value) {
      const agent = await store.fetchAgent(route.params.id as string)
      formData.value = {
        name: agent.name || '',
        llmType: agent.llmType || null,
        talkativity: agent.talkativity ?? 0.5,
        podcastMode: agent.podcastMode ?? 0,
        preferredLang: agent.preferredLang || [],
        labels: (agent as any).labels || [],
        ttsSetting: (agent as any).ttsSetting || {},
        copilotId: (agent as any).copilot || null,
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
    :loading="loading"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/ai-agents')">Close</NButton>
        <NButton type="primary" @click="handleSave">Save</NButton>
      </NSpace>
    </template>

    <NTabs v-model:value="activeTab">
      <NTabPane name="properties" tab="Main properties">
        <NForm label-placement="left" label-width="160" :disabled="loading">
          <NFormItem label="Name">
            <NInput v-model:value="formData.name" style="width: 100%" />
          </NFormItem>

          <NFormItem label="LLM Type">
            <NSelect v-model:value="formData.llmType" :options="llmTypeOptions" style="width: 200px" />
          </NFormItem>

          <NFormItem label="Talkativity">
            <NSlider v-model:value="formData.talkativity" :min="0" :max="1" :step="0.05"
              :tooltip="false" style="flex:1; max-width:300px" />
            <span style="margin-left:12px">{{ formData.talkativity }}</span>
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
                  <NSelect v-model:value="formData.preferredLang[index].languageTag"
                    :options="langOptions" filterable style="width:180px" />
                  <NInputNumber v-model:value="formData.preferredLang[index].weight"
                    :min="0" :max="1" :step="0.05" style="width:100px" />
                </NSpace>
              </template>
            </NDynamicInput>
          </NFormItem>

          <NFormItem label="Labels">
            <NSelect v-model:value="formData.labels" :options="labelOptions"
              multiple filterable style="width: 100%" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="tts" tab="Team">
        <NForm label-placement="left" label-width="160" :disabled="loading">
          <template v-for="role in TTS_ROLES" :key="role.key">
            <NFormItem :label="role.key === 'dj' ? `DJ ${formData.name || ''}`.trim() : role.label">
              <NSpace vertical style="width:100%">
                <NSelect
                  v-model:value="langFilters[role.key]"
                  :options="langOptions" multiple clearable
                  placeholder="Filter by language"
                  size="small" style="width:280px; margin-left:auto"
                  @update:value="onLangFilterChange(role.key)"
                />
                <NSpace>
                  <NSelect
                    :value="formData.ttsSetting[role.key]?.engineType || null"
                    :options="engineOptions" style="width:160px"
                    @update:value="(v) => onEngineChange(role.key, v)"
                  />
                  <NSelect
                    :value="formData.ttsSetting[role.key]?.id || null"
                    :options="voiceOptionsFor(role.key)"
                    :render-label="renderVoiceLabel"
                    filterable clearable style="width:320px"
                    @update:value="(v) => onVoiceChange(role.key, v)"
                  />
                  <NSelect
                    :value="formData.ttsSetting[role.key]?.gain ?? 1.0"
                    :options="voiceGainOptions"
                    style="width:140px"
                    @update:value="(v) => onGainChange(role.key, v as number)"
                  />
                </NSpace>
              </NSpace>
            </NFormItem>
          </template>

          <NFormItem label="Copilot">
            <NSelect v-model:value="formData.copilotId" :options="agentOptions"
              filterable clearable style="width:320px"
              placeholder="Select copilot AI agent" />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </FormWrapper>
</template>
