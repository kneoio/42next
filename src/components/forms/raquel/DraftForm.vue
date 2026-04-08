<template>
  <FormWrapper
    :title="isEditing ? 'Edit Draft' : 'Create Draft'"
    :subtitle="isEditing ? 'Update existing draft' : 'Create a new draft'"
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
              @update:model-value="(val: string | unknown) => (formData.content = typeof val === 'string' ? val : '')"
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
        <NFormItem v-for="variable in extractedVariables" :key="variable.name" :label="variable.name">
          <NInput v-model:value="userVariables[variable.name]" style="width: 100%" />
        </NFormItem>
      </NForm>

      <NSpace>
        <NButton type="primary" :loading="testLoading" @click="runDraftTest">
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
  NModal, NText, NCheckbox, useMessage
} from 'naive-ui'
import { EditorView } from '@codemirror/view'
import { StreamLanguage } from '@codemirror/language'
import { groovy } from '@codemirror/legacy-modes/mode/groovy'
import CodeMirror from 'vue-codemirror6'
import FormWrapper from '@/components/FormWrapper.vue'
import { useRaquelDraftsStore } from '@/stores/raquelDrafts'
import { useRoute, useRouter } from 'vue-router'
import raquelApiService from '@/services/raquelApi'

const route = useRoute()
const router = useRouter()
const draftsStore = useRaquelDraftsStore()
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

const showTestDialog = ref(false)
const testResult = ref('')
const testLoading = ref(false)
const extractedVariables = ref<Array<{ name: string; description: string | null; type: string }>>([])
const userVariables = ref<Record<string, string>>({})

async function openTestDialog() {
  testResult.value = ''
  extractedVariables.value = []
  userVariables.value = {}
  showTestDialog.value = true

  if (formData.value.content) {
    try {
      const vars = await raquelApiService.post<Array<{ name: string; description: string | null; type: string }>>(
        '/drafts/extract-variables',
        { code: formData.value.content }
      )
      extractedVariables.value = vars || []
      extractedVariables.value.forEach(v => { userVariables.value[v.name] = '' })
    } catch {}
  }
}

async function runDraftTest() {
  try {
    testLoading.value = true
    const raw = await raquelApiService.getText('/drafts/test', {
      languageTag: formData.value.languageTag,
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
    router.push('/dashboard/raquel/drafts')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save draft')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/dashboard/raquel/drafts')
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
      router.push('/dashboard/raquel/drafts')
    } finally {
      loading.value = false
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>
