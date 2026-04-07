<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect, NCheckbox,
  NTabs, NTabPane, NRadioGroup, NRadioButton, NModal, NText,
  NCollapseTransition, NNumberAnimation, NTag, useMessage
} from 'naive-ui'
import { EditorView } from '@codemirror/view'
import { handlebarsLanguage } from '@xiechao/codemirror-lang-handlebars'
import CodeMirror from 'vue-codemirror6'
import FormWrapper from '@/components/FormWrapper.vue'
import { usePromptsStore, PROMPT_TYPES, type Prompt } from '@/stores/prompts'
import { useRoute, useRouter } from 'vue-router'
import mixplaApiService from '@/services/mixplaApi'
import coreApiService from '@/services/coreApi'

const route = useRoute()
const router = useRouter()
const promptsStore = usePromptsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')
const editorExtensions = computed(() => [handlebarsLanguage, EditorView.lineWrapping])

const formData = ref<Partial<Prompt>>({
  title: '',
  description: '',
  prompt: '',
  promptType: 'SONG',
  languageTag: '',
  enabled: false,
  master: false,
  locked: false,
  podcast: false,
  draftId: null,
  masterId: null,
})

// Options
const langOptions = ref<{ label: string; value: string }[]>([])
const draftOptions = ref<{ label: string; value: string }[]>([])
const masterPromptOptions = ref<{ label: string; value: string }[]>([])

const promptTypeOptions = PROMPT_TYPES.map(t => ({ label: t, value: t }))

const llmTypeOptions = [
  { label: 'Default', value: null },
  { label: 'OpenAI', value: 'OPENAI' },
  { label: 'Anthropic', value: 'ANTHROPIC' },
]

// Test dialog
const showTestDialog = ref(false)
const testSongId = ref<string | null>(null)
const testAgentId = ref<string | null>(null)
const testStationId = ref<string | null>(null)
const testLlmType = ref<string | null>(null)
const testLoading = ref(false)
const testDraftResult = ref('')
const testPromptResult = ref('')
const testPromptReasoning = ref('')
const showReasoning = ref(localStorage.getItem('promptForm.showReasoning') === 'true')
const extractedVariables = ref<Array<{ name: string; description: string | null; type: string }>>([])
const userVariables = ref<Record<string, string>>({})
const songOptions = ref<{ label: string; value: string }[]>([])
const agentOptions = ref<{ label: string; value: string }[]>([])
const stationOptions = ref<{ label: string; value: string }[]>([])
const promptCharCount = computed(() => testPromptResult.value.length)

watch(showReasoning, (val) => localStorage.setItem('promptForm.showReasoning', String(val)))
watch(() => formData.value.master, (isMaster) => {
  if (isMaster) formData.value.masterId = null
})

async function loadDraftOptions() {
  try {
    const result = await mixplaApiService.getPagedDictionary<any>('/drafts', 1, 100)
    const lang = formData.value.languageTag?.trim().toLowerCase() || ''
    const items = result.entries.map((d: any) => {
      const entryLang = String(d.languageTag || '').trim().toLowerCase()
      return { label: d.title || d.id, value: d.id, match: !!lang && entryLang === lang }
    })
    items.sort((a: any, b: any) => {
      if (a.match !== b.match) return a.match ? -1 : 1
      return a.label.localeCompare(b.label)
    })
    draftOptions.value = items
  } catch {}
}

watch(() => formData.value.languageTag, loadDraftOptions)

async function handleSave() {
  try {
    loading.value = true
    const lang = formData.value.languageTag || ''
    const isMaster = formData.value.master
    const title = formData.value.title?.trim() || ''
    const suffix = isMaster ? '' : lang
    const titleToSave = suffix && !title.includes(suffix) ? `${title} (${suffix})` : title

    const id = isEditing.value ? (route.params.id as string) : null
    await promptsStore.savePrompt(id, {
      ...formData.value,
      title: titleToSave,
      version: (formData.value.version || 0) + 0.1,
    })
    message.success('Prompt saved successfully')
    router.push('/dashboard/prompts')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save prompt')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/dashboard/prompts')
}

async function openTestDialog() {
  testDraftResult.value = ''
  testPromptResult.value = ''
  testPromptReasoning.value = ''
  extractedVariables.value = []
  userVariables.value = {}
  showTestDialog.value = true

  try {
    const [songs, agents, stations] = await Promise.allSettled([
      mixplaApiService.getPagedDictionary<any>('/soundfragments', 1, 50),
      mixplaApiService.getPagedDictionary<any>('/aiagents', 1, 50),
      mixplaApiService.getPagedDictionary<any>('/brands', 1, 100),
    ])
    if (songs.status === 'fulfilled')
      songOptions.value = songs.value.entries.map((s: any) => ({ label: s.title || s.id, value: s.id }))
    if (agents.status === 'fulfilled')
      agentOptions.value = agents.value.entries.map((a: any) => ({ label: a.name || a.id, value: a.id }))
    if (stations.status === 'fulfilled')
      stationOptions.value = stations.value.entries.map((s: any) => ({ label: s.localizedName?.en || s.slugName || s.id, value: s.id }))

    if (formData.value.draftId) {
      const draft = draftOptions.value.find(d => d.value === formData.value.draftId)
      if (draft) {
        try {
          const fullDraft = await mixplaApiService.getDocument<any>('/drafts', formData.value.draftId)
          if (fullDraft?.content) {
            const vars = await mixplaApiService.post<any[]>('/drafts/extract-variables', { code: fullDraft.content })
            extractedVariables.value = vars || []
            extractedVariables.value.forEach(v => { userVariables.value[v.name] = '' })
          }
        } catch {}
      }
    }
  } catch {}
}

async function runPromptTest() {
  try {
    testLoading.value = true
    testDraftResult.value = ''
    testPromptResult.value = ''
    testPromptReasoning.value = ''

    let executedDraft: string | null = null

    if (formData.value.draftId) {
      try {
        const fullDraft = await mixplaApiService.getDocument<any>('/drafts', formData.value.draftId)
        if (fullDraft?.content) {
          executedDraft = await mixplaApiService.getText('/drafts/test', {
            languageTag: formData.value.languageTag,
            songId: testSongId.value,
            agentId: testAgentId.value,
            stationId: testStationId.value,
            code: fullDraft.content,
            userVariables: Object.keys(userVariables.value).length ? userVariables.value : undefined,
          })
          testDraftResult.value = executedDraft || ''
        }
      } catch (e: any) {
        message.warning(`Draft test failed: ${e?.message || 'Unknown error'}`, { duration: 5000 })
      }
    }

    const raw = await mixplaApiService.getText('/prompts/test', {
      prompt: formData.value.prompt,
      draft: executedDraft,
      llmType: testLlmType.value || null,
    })

    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        testPromptResult.value = String(parsed.result ?? '')
        testPromptReasoning.value = parsed.reasoning ? String(parsed.reasoning) : ''
      } else {
        testPromptResult.value = raw
      }
    } catch {
      testPromptResult.value = raw
    }
  } catch (error: any) {
    message.error(error?.message || 'Test failed', { duration: 0, closable: true })
  } finally {
    testLoading.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter' && showTestDialog.value) runPromptTest()
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  try {
    loading.value = true
    const [langs, masterPrompts] = await Promise.allSettled([
      coreApiService.getDictionary<any>('/languages'),
      mixplaApiService.getPagedDictionary<any>('/prompts', 1, 100),
    ])
    if (langs.status === 'fulfilled') {
      langOptions.value = langs.value.map((l: any) => ({
        label: l.localizedName?.en || l.code,
        value: l.code,
      }))
    }
    if (masterPrompts.status === 'fulfilled') {
      masterPromptOptions.value = masterPrompts.value.entries
        .filter((p: any) => p.master)
        .map((p: any) => ({ label: p.title || p.id, value: p.id }))
    }

    if (isEditing.value) {
      const prompt = await promptsStore.fetchPrompt(route.params.id as string)
      formData.value = { ...prompt }
      await loadDraftOptions()
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load prompt')
    if (isEditing.value) router.push('/dashboard/prompts')
  } finally {
    loading.value = false
  }
})

onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Prompt' : 'Create Prompt'"
    :subtitle="isEditing ? 'Update existing prompt' : 'Create a new prompt'"
    full-width
    :loading="loading"
  >
    <template #actions>
      <NSpace>
        <NButton @click="handleCancel">Close</NButton>
        <NButton @click="openTestDialog">Test</NButton>
        <NButton type="primary" @click="handleSave">Save</NButton>
      </NSpace>
    </template>

    <NTabs v-model:value="activeTab">
      <NTabPane name="properties" tab="Main properties">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem label="Title">
            <NInput v-model:value="formData.title" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Description">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Language">
            <NSelect
              v-model:value="formData.languageTag"
              :options="langOptions"
              filterable
              style="width: 200px"
            />
          </NFormItem>

          <NFormItem v-if="!formData.master" label="Master prompt">
            <NSpace align="center">
              <NSelect
                v-model:value="formData.masterId"
                :options="masterPromptOptions"
                filterable
                clearable
                style="width: 300px"
              />
            </NSpace>
          </NFormItem>

          <NFormItem label="Draft">
            <NSelect
              v-model:value="formData.draftId"
              :options="draftOptions"
              filterable
              clearable
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Options">
            <NSpace align="center" wrap>
              <NCheckbox v-model:checked="formData.enabled">Enabled</NCheckbox>
              <NCheckbox v-model:checked="formData.master">Master</NCheckbox>
              <NCheckbox :checked="formData.locked" disabled>Locked</NCheckbox>
              <NCheckbox v-model:checked="formData.podcast">Podcast</NCheckbox>
              <NRadioGroup v-model:value="formData.promptType" name="prompt-type">
                <NRadioButton v-for="t in promptTypeOptions" :key="t.value" :value="t.value" :label="t.label" />
              </NRadioGroup>
            </NSpace>
          </NFormItem>

          <NFormItem>
            <template #label>
              Prompt<br />
              <NText depth="3" style="font-size: 12px;">Handlebars</NText>
            </template>
            <CodeMirror
              :model-value="formData.prompt"
              @update:model-value="(val) => (formData.prompt = typeof val === 'string' ? val : '')"
              basic
              :disabled="formData.locked"
              :style="{ width: '100%', height: '600px', border: '1px solid #d9d9d9', borderRadius: '3px', overflow: 'auto' }"
              :extensions="editorExtensions"
            />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </FormWrapper>

  <NModal
    v-model:show="showTestDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="true"
    style="width: min(1000px, 90vw)"
  >
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span>Test Prompt</span>
        <NButton text @click="showTestDialog = false">×</NButton>
      </div>
    </template>

    <NSpace vertical>
      <NForm label-placement="left" label-width="100">
        <NFormItem label="Song">
          <NSelect v-model:value="testSongId" :options="songOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem label="Agent">
          <NSelect v-model:value="testAgentId" :options="agentOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem label="Station">
          <NSelect v-model:value="testStationId" :options="stationOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem label="LLM Type">
          <NRadioGroup v-model:value="testLlmType" name="llm-type">
            <NRadioButton v-for="opt in llmTypeOptions" :key="String(opt.value)" :value="opt.value" :label="opt.label" />
          </NRadioGroup>
        </NFormItem>
        <NFormItem v-for="variable in extractedVariables" :key="variable.name" :label="variable.name">
          <NInput v-model:value="userVariables[variable.name]" style="width: 100%" />
        </NFormItem>
      </NForm>

      <NSpace>
        <NButton type="primary" :loading="testLoading" @click="runPromptTest">Run (Ctrl+Enter)</NButton>
        <NButton @click="showTestDialog = false">Close</NButton>
      </NSpace>

      <NText depth="3">Draft Result</NText>
      <NInput type="textarea" :value="testDraftResult" :autosize="{ minRows: 4, maxRows: 10 }" readonly />

      <NText depth="3">Prompt Result</NText>
      <NInput type="textarea" :value="testPromptResult" :autosize="{ minRows: 4, maxRows: 10 }" readonly />

      <NSpace align="center">
        <NCheckbox v-model:checked="showReasoning">Show Reasoning</NCheckbox>
        <NText depth="3">Characters:</NText>
        <NNumberAnimation :from="0" :to="promptCharCount" :show-separator="true" />
      </NSpace>

      <NCollapseTransition :show="showReasoning">
        <NInput
          type="textarea"
          :value="testPromptReasoning"
          :autosize="{ minRows: 3, maxRows: 10 }"
          readonly
          style="width: 100%"
        />
      </NCollapseTransition>
    </NSpace>
  </NModal>
</template>

<style scoped>
:deep(.n-data-table-th) {
  background-color: var(--n-th-color);
}
</style>
