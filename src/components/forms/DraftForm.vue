<template>
  <FormWrapper
    :title="isEditing ? 'Edit Draft' : 'Create Draft'"
    :subtitle="isEditing ? 'Update existing draft' : 'Create a new draft'"
    full-width
  >
    <template #actions>
      <NSpace>
        <NButton @click="handleCancel">Close</NButton>
        <NButton @click="openTestDialog">Test</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
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

          <NFormItem label="Options">
            <NSpace>
              <NCheckbox v-model:checked="formData.enabled">Enabled</NCheckbox>
              <NCheckbox v-model:checked="formData.master">Master</NCheckbox>
              <NCheckbox v-model:checked="formData.locked">Locked</NCheckbox>
            </NSpace>
          </NFormItem>

          <NFormItem>
            <template #label>
              Code<br />
              <NText depth="3" style="font-size: 12px;">Groovy</NText>
            </template>
            <CodeMirror
              :model-value="formData.content"
              @update:model-value="(val) => (formData.content = typeof val === 'string' ? val : '')"
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
    style="width: min(900px, 90vw)"
  >
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span>Test Draft</span>
        <NButton text @click="showTestDialog = false">×</NButton>
      </div>
    </template>

    <NSpace vertical>
      <NForm label-placement="left" label-width="80">
        <NFormItem label="Song">
          <NSelect v-model:value="testSongId" :options="songOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem label="Agent">
          <NSelect v-model:value="testAgentId" :options="agentOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem label="Station">
          <NSelect v-model:value="testStationId" :options="stationOptions" filterable style="width: 100%" />
        </NFormItem>
        <NFormItem v-for="variable in extractedVariables" :key="variable.name" :label="variable.name">
          <NInput v-model:value="userVariables[variable.name]" style="width: 100%" />
        </NFormItem>
      </NForm>

      <NSpace>
        <NButton type="primary" :loading="testLoading" :disabled="!canRunTest" @click="runDraftTest">
          Run (Ctrl+Enter)
        </NButton>
        <NButton @click="showTestDialog = false">Close</NButton>
      </NSpace>

      <NText depth="3">Result</NText>
      <CodeMirror
        :model-value="testResult"
        basic
        :disabled="true"
        :style="{ width: '100%', height: '360px', border: '1px solid #d9d9d9', borderRadius: '3px', overflow: 'auto' }"
        :extensions="editorExtensions"
      />
    </NSpace>
  </NModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NTabs, NTabPane,
  NSelect, NModal, NText, NCheckbox, useMessage
} from 'naive-ui'
import { EditorView } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import CodeMirror from 'vue-codemirror6'
import FormWrapper from '@/components/FormWrapper.vue'
import { useDraftsStore } from '@/stores/drafts'
import { useRoute, useRouter } from 'vue-router'
import mixplaApiService from '@/services/mixplaApi'

const route = useRoute()
const router = useRouter()
const draftsStore = useDraftsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')
const editorExtensions = computed(() => [StreamLanguage.define(groovy), EditorView.lineWrapping])

const formData = ref({
  id: '',
  title: '',
  description: '',
  content: '',
  languageTag: '',
  enabled: false,
  master: false,
  locked: false,
  archived: 0,
  version: undefined as number | undefined,
  author: '',
  regDate: '',
  lastModifier: '',
  lastModifiedDate: '',
})

// Test dialog state
const showTestDialog = ref(false)
const testSongId = ref<string | null>(null)
const testAgentId = ref<string | null>(null)
const testStationId = ref<string | null>(null)
const testResult = ref('')
const testLoading = ref(false)
const extractedVariables = ref<Array<{ name: string; description: string | null; type: string }>>([])
const userVariables = ref<Record<string, string>>({})
const songOptions = ref<{ label: string; value: string }[]>([])
const agentOptions = ref<{ label: string; value: string }[]>([])
const stationOptions = ref<{ label: string; value: string }[]>([])
const canRunTest = computed(() => !!(testSongId.value && testAgentId.value && testStationId.value) && !testLoading.value)

async function openTestDialog() {
  testResult.value = ''
  extractedVariables.value = []
  userVariables.value = {}
  showTestDialog.value = true

  try {
    const [songs, agents, stations] = await Promise.allSettled([
      mixplaApiService.getPagedDictionary<any>('/sound-fragments', 1, 100),
      mixplaApiService.getPagedDictionary<any>('/ai-agents', 1, 100),
      mixplaApiService.getPagedDictionary<any>('/radio-stations', 1, 100),
    ])

    if (songs.status === 'fulfilled') {
      songOptions.value = songs.value.entries.map((s: any) => ({ label: s.title || s.id, value: s.id }))
      if (songOptions.value.length) testSongId.value = songOptions.value[Math.floor(Math.random() * songOptions.value.length)].value
    }
    if (agents.status === 'fulfilled') {
      agentOptions.value = agents.value.entries.map((a: any) => ({ label: a.name || a.id, value: a.id }))
      if (agentOptions.value.length) testAgentId.value = agentOptions.value[Math.floor(Math.random() * agentOptions.value.length)].value
    }
    if (stations.status === 'fulfilled') {
      stationOptions.value = stations.value.entries.map((s: any) => ({ label: s.localizedName?.en || s.slugName || s.id, value: s.id }))
      if (stationOptions.value.length) testStationId.value = stationOptions.value[Math.floor(Math.random() * stationOptions.value.length)].value
    }

    if (formData.value.content) {
      try {
        const vars = await mixplaApiService.post<Array<{ name: string; description: string | null; type: string }>>(
          '/drafts/extract-variables',
          { code: formData.value.content }
        )
        extractedVariables.value = vars || []
        extractedVariables.value.forEach(v => { userVariables.value[v.name] = '' })
      } catch {}
    }
  } catch {}
}

async function runDraftTest() {
  try {
    testLoading.value = true
    const raw = await mixplaApiService.getText('/drafts/test', {
      languageTag: formData.value.languageTag,
      songId: testSongId.value,
      agentId: testAgentId.value,
      stationId: testStationId.value,
      code: formData.value.content,
      userVariables: Object.keys(userVariables.value).length ? userVariables.value : undefined,
    })
    try {
      testResult.value = JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      testResult.value = raw
    }
  } catch (error: any) {
    message.error(error?.message || 'Test failed', { duration: 0, closable: true })
  } finally {
    testLoading.value = false
  }
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await draftsStore.saveDraft(id, {
      ...formData.value,
      version: (formData.value.version || 0) + 0.1,
    })
    message.success('Draft saved successfully')
    router.push('/dashboard/drafts')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save draft')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/dashboard/drafts')
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.ctrlKey && e.key === 'Enter' && showTestDialog.value) {
    runDraftTest()
  }
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeyDown)
  if (isEditing.value) {
    try {
      loading.value = true
      const draft = await draftsStore.fetchDraft(route.params.id as string)
      Object.assign(formData.value, draft)
    } catch (error: any) {
      message.error(error?.message || 'Failed to load draft')
      router.push('/dashboard/drafts')
    } finally {
      loading.value = false
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
