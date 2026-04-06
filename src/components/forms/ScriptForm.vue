<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect, NModal, NDataTable,
  NTabs, NTabPane, NRadioGroup, NRadioButton, NCheckboxGroup, NCheckbox,
  NSlider, NDynamicInput, NTimePicker, useMessage,
  type DataTableColumns
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useScriptsStore, type Script, type ScriptScene, type ScenePromptDTO } from '@/stores/scripts'
import { useRoute, useRouter } from 'vue-router'
import mixplaApiService from '@/services/mixplaApi'
import officeframeApiService from '@/services/officeframeApi'

const route = useRoute()
const router = useRouter()
const scriptsStore = useScriptsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')

const formData = ref<Partial<Script>>({
  name: '',
  description: '',
  timingMode: 'RELATIVE_TO_STREAM_START',
  labels: [],
  defaultProfileId: undefined,
  scenes: [],
})

// Options
const labelOptions = ref<{ label: string; value: string }[]>([])
const profileOptions = ref<{ label: string; value: string }[]>([])
const promptOptions = ref<{ label: string; value: string }[]>([])

// Scenes
const scenesLoading = ref(false)
const showSceneDialog = ref(false)
const editingScene = ref<Partial<ScriptScene>>({})
const editingSceneIndex = ref<number | null>(null)
const scenePrompts = ref<ScenePromptDTO[]>([])

// Computed scenes from formData
const scenes = computed(() => formData.value.scenes || [])

// Start time as ms for NTimePicker
const sceneStartTimeMs = computed({
  get() {
    if (!editingScene.value.startTime) return null
    const parts = editingScene.value.startTime.split(':').map(Number)
    if (parts.length < 2) return null
    const [h, m, s = 0] = parts
    return (h * 3600 + m * 60 + s) * 1000
  },
  set(ms: number | null) {
    if (ms === null) {
      editingScene.value.startTime = undefined
      return
    }
    const totalSeconds = Math.floor(ms / 1000)
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    editingScene.value.startTime = [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
  }
})

const selectedWeekdays = computed({
  get() { return editingScene.value.weekdays || [] },
  set(val: number[]) { editingScene.value.weekdays = val }
})

// Duration options for RELATIVE mode (in seconds)
const durationOptions = [2, 5, 10, 15, 20, 30, 60, 90, 120].map(m => ({
  label: `${m} min`,
  value: m * 60
}))

// SeqNum options
const seqNumOptions = Array.from({ length: 10 }, (_, i) => ({
  label: String(i + 1),
  value: i + 1
}))

const sceneColumns: DataTableColumns<ScriptScene> = [
  {
    title: 'Title',
    key: 'title',
    minWidth: 150,
    render: (row) => row.title || '-'
  },
  {
    title: 'Start / Duration',
    key: 'startTime',
    minWidth: 120,
    render: (row) => {
      if (row.startTime) return row.startTime
      if (row.durationSeconds) return `${row.durationSeconds / 60} min`
      return '-'
    }
  },
  {
    title: 'Prompts',
    key: 'prompts',
    width: 80,
    render: (row) => String(row.prompts?.length || 0)
  },
  {
    title: '',
    key: 'actions',
    width: 80,
    render: (_row, index) => h(NButton, {
      size: 'small',
      onClick: (e: MouseEvent) => { e.stopPropagation(); openSceneDialog(index) }
    }, { default: () => 'Edit' })
  }
]

function openSceneDialog(index?: number) {
  if (index !== undefined) {
    editingScene.value = { ...(scenes.value[index] || {}) }
    editingSceneIndex.value = index
    scenePrompts.value = [...(editingScene.value.prompts || [])]
  } else {
    editingScene.value = {
      title: '',
      talkativity: 0.5,
      weekdays: [],
      prompts: [],
    }
    editingSceneIndex.value = null
    scenePrompts.value = []
  }
  showSceneDialog.value = true
}

function closeSceneDialog() {
  showSceneDialog.value = false
  editingScene.value = {}
  editingSceneIndex.value = null
  scenePrompts.value = []
}

function saveSceneDialog() {
  const scene: ScriptScene = {
    ...editingScene.value,
    prompts: scenePrompts.value.filter(p => p.promptId),
  }
  const list = [...(formData.value.scenes || [])]
  if (editingSceneIndex.value !== null) {
    list[editingSceneIndex.value] = scene
  } else {
    list.push(scene)
  }
  formData.value = { ...formData.value, scenes: list }
  closeSceneDialog()
}

function deleteSceneFromDialog() {
  if (editingSceneIndex.value === null) return
  const list = [...(formData.value.scenes || [])]
  list.splice(editingSceneIndex.value, 1)
  formData.value = { ...formData.value, scenes: list }
  closeSceneDialog()
}

function createScenePrompt(): ScenePromptDTO {
  return { promptId: undefined, active: true }
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await scriptsStore.saveScript(id, formData.value)
    message.success('Script saved successfully')
    router.push('/dashboard/scripts')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save script')
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  router.push('/dashboard/scripts')
}

onMounted(async () => {
  try {
    loading.value = true
    const [labels, prompts] = await Promise.allSettled([
      officeframeApiService.getPagedDictionary<any>('/labels/only/category/SCRIPT', 1, 200),
      mixplaApiService.getPagedDictionary<any>('/prompts', 1, 200),
    ])
    if (labels.status === 'fulfilled') {
      labelOptions.value = labels.value.entries.map((l: any) => ({
        label: l.identifier || l.title || l.name || l.id,
        value: l.identifier || l.id
      }))
    }
    if (prompts.status === 'fulfilled') {
      promptOptions.value = prompts.value.entries.map((p: any) => ({
        label: p.title || p.id,
        value: p.id
      }))
    }

    if (isEditing.value) {
      const script = await scriptsStore.fetchScript(route.params.id as string)
      formData.value = { ...script }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load script')
    if (isEditing.value) router.push('/dashboard/scripts')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Script' : 'Create Script'"
    :subtitle="isEditing ? 'Update existing script' : 'Create a new script'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="handleCancel">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NTabs v-model:value="activeTab">
      <NTabPane name="properties" tab="Main properties">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem label="Name">
            <NInput v-model:value="formData.name" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Description">
            <NInput
              v-model:value="formData.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Mode">
            <NRadioGroup v-model:value="formData.timingMode" name="timing-mode">
              <NRadioButton value="ABSOLUTE_TIME">Radio</NRadioButton>
              <NRadioButton value="RELATIVE_TO_STREAM_START">One Time Stream</NRadioButton>
            </NRadioGroup>
          </NFormItem>

          <NFormItem label="Labels">
            <NSelect
              v-model:value="formData.labels"
              :options="labelOptions"
              multiple
              filterable
              style="width: 100%"
            />
          </NFormItem>

          <NFormItem label="Default Profile" v-if="profileOptions.length">
            <NSelect
              v-model:value="formData.defaultProfileId"
              :options="profileOptions"
              filterable
              clearable
              style="width: 300px"
            />
          </NFormItem>

          <NFormItem
            v-if="formData.requiredVariables && formData.requiredVariables.length"
            label="Required Vars"
          >
            <div style="font-size: 12px; line-height: 1.8;">
              <div v-for="v in formData.requiredVariables" :key="v.name">
                <strong>{{ v.name }}</strong> ({{ v.type }}) — {{ v.description }}
                <span v-if="v.required" style="color: #e74c3c;">*</span>
              </div>
            </div>
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="scenes" tab="Scenes">
        <NSpace style="margin-bottom: 12px;">
          <NButton type="primary" size="small" @click="openSceneDialog()">New Scene</NButton>
        </NSpace>

        <NDataTable
          :columns="sceneColumns"
          :data="scenes"
          :row-key="(row: ScriptScene) => row.id || row.title || String(Math.random())"
          :pagination="false"
          :loading="scenesLoading"
          size="small"
          :row-props="(row: ScriptScene) => ({
            style: 'cursor: pointer;',
            onClick: () => {
              const idx = (formData.value.scenes || []).indexOf(row)
              openSceneDialog(idx >= 0 ? idx : undefined)
            }
          })"
        />
      </NTabPane>
    </NTabs>
  </FormWrapper>

  <!-- Scene Dialog -->
  <NModal
    v-model:show="showSceneDialog"
    preset="dialog"
    :closable="false"
    :mask-closable="false"
    :close-on-esc="true"
    style="width: min(800px, 90vw)"
  >
    <template #header>
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span>{{ editingScene.title || 'Scene' }}</span>
        <NButton text @click="closeSceneDialog">×</NButton>
      </div>
    </template>

    <NForm label-placement="left" label-width="130">
      <NFormItem label="Title">
        <NInput v-model:value="editingScene.title" style="width: 100%" />
      </NFormItem>

      <!-- ABSOLUTE_TIME (Radio) fields -->
      <template v-if="formData.timingMode === 'ABSOLUTE_TIME'">
        <NFormItem label="Start time">
          <NTimePicker
            v-model:value="sceneStartTimeMs"
            format="HH:mm:ss"
            style="width: 200px"
          />
        </NFormItem>

        <NFormItem label="Weekdays">
          <NCheckboxGroup v-model:value="selectedWeekdays">
            <NCheckbox :value="1" label="Mon" />
            <NCheckbox :value="2" label="Tue" />
            <NCheckbox :value="3" label="Wed" />
            <NCheckbox :value="4" label="Thu" />
            <NCheckbox :value="5" label="Fri" />
            <NCheckbox :value="6" label="Sat" />
            <NCheckbox :value="7" label="Sun" />
          </NCheckboxGroup>
        </NFormItem>
      </template>

      <!-- RELATIVE_TO_STREAM_START (One Time Stream) fields -->
      <template v-if="formData.timingMode === 'RELATIVE_TO_STREAM_START'">
        <NFormItem label="Duration">
          <NRadioGroup v-model:value="editingScene.durationSeconds" name="duration">
            <NRadioButton
              v-for="opt in durationOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </NRadioGroup>
        </NFormItem>

        <NFormItem label="Sequence">
          <NRadioGroup v-model:value="editingScene.seqNum" name="seqnum">
            <NRadioButton
              v-for="opt in seqNumOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </NRadioGroup>
        </NFormItem>
      </template>

      <NFormItem label="Talkativity">
        <NSlider
          v-model:value="editingScene.talkativity"
          :min="0"
          :max="1"
          :step="0.05"
          :tooltip="false"
          style="flex: 1; max-width: 300px;"
        />
        <span style="margin-left: 12px; min-width: 40px;">{{ editingScene.talkativity ?? 0 }}</span>
      </NFormItem>

      <NFormItem label="Actions (Prompts)">
        <div style="width: 100%; max-height: 260px; overflow-y: auto;">
          <NDynamicInput
            v-model:value="scenePrompts"
            :on-create="createScenePrompt"
          >
            <template #default="{ index }">
              <NSelect
                v-model:value="scenePrompts[index].promptId"
                :options="promptOptions"
                filterable
                style="width: 100%"
              />
            </template>
          </NDynamicInput>
        </div>
      </NFormItem>
    </NForm>

    <template #action>
      <NSpace justify="space-between" style="width: 100%;">
        <NButton
          v-if="editingSceneIndex !== null"
          type="error"
          @click="deleteSceneFromDialog"
        >Delete</NButton>
        <NSpace>
          <NButton @click="closeSceneDialog">Cancel</NButton>
          <NButton type="primary" @click="saveSceneDialog">OK</NButton>
        </NSpace>
      </NSpace>
    </template>
  </NModal>
</template>
