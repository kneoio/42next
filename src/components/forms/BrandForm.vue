<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  NButton, NSpace, NForm, NFormItem, NInput, NSelect, NSwitch,
  NTabs, NTabPane, NDynamicInput, NSlider, NRadioGroup, NRadioButton,
  NColorPicker, NInputNumber, useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import {
  useBrandsStore,
  MANAGED_BY_OPTIONS, AI_AGENT_MODE_OPTIONS, SUBMISSION_POLICY_OPTIONS,
  type ManagedBy, type AiAgentMode, type SubmissionPolicy
} from '@/stores/brands'
import { useScriptsStore } from '@/stores/scripts'
import { useRoute, useRouter } from 'vue-router'
import mixplaApiService from '@/services/mixplaApi'

const route = useRoute()
const router = useRouter()
const store = useBrandsStore()
const scriptsStore = useScriptsStore()
const message = useMessage()

const isEditing = computed(() => !!route.params.id && route.params.id !== 'new')
const loading = ref(false)
const activeTab = ref('properties')

const localizedNames = ref<{ lang: string; name: string }[]>([{ lang: 'en', name: '' }])

const formData = ref({
  country: null as string | null,
  description: '',
  slugName: '',
  timeZone: null as string | null,
  publicBrand: 0,
  bitRate: 128,
  aiAgentId: null as string | null,
  profileId: null as string | null,
  managedBy: 'ITSELF' as ManagedBy,
  aiAgentMode: 'BASIC' as AiAgentMode,
  oneTimeStreamPolicy: 'NOT_ALLOWED' as SubmissionPolicy,
  submissionPolicy: 'NOT_ALLOWED' as SubmissionPolicy,
  messagingPolicy: 'NOT_ALLOWED' as SubmissionPolicy,
  aiOverriding: { prompt: '', talkativity: 0.5 },
  scriptId: null as string | null,
  profileOverriding: { name: '', description: '' },
  color: '#000000',
  titleFont: null as string | null,
  owner: { name: '', email: '' },
})

const userVariables = ref<Record<string, any>>({})

const agentOptions = ref<{ label: string; value: string }[]>([])
const profileOptions = ref<{ label: string; value: string }[]>([])
const scriptOptions = ref<{ label: string; value: string }[]>([])

const selectedScript = computed(() =>
  formData.value.scriptId
    ? scriptsStore.scripts.find(s => s.id === formData.value.scriptId)
    : null
)

const selectedProfile = computed(() =>
  profileOptions.value.find(p => p.value === formData.value.profileId) ?? null
)

const stationFonts = [
  'Goldman', 'Digital Play Italic St', 'Airborne', 'AncientGod', 'Apollo',
  'Cubic', 'DigitalPlay', 'Drexs', 'Elias', 'FutureSallow', 'Goodtime',
  'GameOfSquids', 'Glypic', 'Icklips', 'Moto', 'MontereyPopsicle',
  'PolenticalNeon', 'Venta', 'Conthrax', 'Kaylon', 'Nsecthin', 'Yonder',
]
const stationFontOptions = [
  { label: '— Default —', value: null },
  ...stationFonts.map(f => ({ label: f, value: f })),
]

const BIT_RATE_OPTIONS = [64, 96, 128, 160, 192, 256, 320].map(v => ({ label: `${v} kbps`, value: v }))

const COUNTRIES = [
  { label: 'United States', value: 'US' }, { label: 'United Kingdom', value: 'GB' },
  { label: 'Germany', value: 'DE' }, { label: 'France', value: 'FR' },
  { label: 'Spain', value: 'ES' }, { label: 'Italy', value: 'IT' },
  { label: 'Portugal', value: 'PT' }, { label: 'Brazil', value: 'BR' },
  { label: 'Russia', value: 'RU' }, { label: 'Ukraine', value: 'UA' },
  { label: 'Latvia', value: 'LV' }, { label: 'Georgia', value: 'GE' },
  { label: 'Kazakhstan', value: 'KZ' }, { label: 'Japan', value: 'JP' },
]

const TIMEZONES = [
  { label: 'UTC (+0)', value: 'UTC' },
  { label: 'Europe/London', value: 'Europe/London' },
  { label: 'Europe/Paris (+1/+2)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (+1/+2)', value: 'Europe/Berlin' },
  { label: 'Europe/Kiev (+2/+3)', value: 'Europe/Kiev' },
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

function formatVariableName(name: string) {
  return name.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
}

async function handleSave() {
  try {
    loading.value = true
    const id = isEditing.value ? (route.params.id as string) : null
    await store.saveBrand(id, {
      ...formData.value,
      localizedName: buildLocalizedName(),
      country: formData.value.country || undefined,
      timeZone: formData.value.timeZone || undefined,
      aiAgentId: formData.value.aiAgentId || undefined,
      profileId: formData.value.profileId || undefined,
      aiOverriding: formData.value.aiOverriding.prompt ? formData.value.aiOverriding : undefined,
      scripts: formData.value.scriptId
        ? [{ scriptId: formData.value.scriptId, userVariables: userVariables.value }]
        : undefined,
      scriptId: formData.value.scriptId || undefined,
      titleFont: formData.value.titleFont || undefined,
      profileOverriding: (formData.value.profileOverriding.name || formData.value.profileOverriding.description)
        ? formData.value.profileOverriding
        : undefined,
      owner: (formData.value.owner.name || formData.value.owner.email) ? formData.value.owner : undefined,
    } as any)
    message.success('Brand saved successfully')
    router.push('/dashboard/brands')
  } catch (error: any) {
    message.error(error?.message || 'Failed to save')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    loading.value = true
    const [agents, profiles, scripts] = await Promise.allSettled([
      mixplaApiService.getPagedDictionary<any>('/aiagents', 1, 100),
      mixplaApiService.getPagedDictionary<any>('/profiles', 1, 100),
      scriptsStore.loadScripts(1, 200),
    ])
    if (agents.status === 'fulfilled') {
      agentOptions.value = agents.value.entries.map((a: any) => ({
        label: a.name || a.id, value: a.id
      }))
    }
    if (profiles.status === 'fulfilled') {
      profileOptions.value = profiles.value.entries.map((p: any) => ({
        label: p.name || p.id, value: p.id
      }))
    }
    scriptOptions.value = scriptsStore.scripts.map(s => ({ label: s.name || s.id, value: s.id }))

    if (isEditing.value) {
      const brand = await store.fetchBrand(route.params.id as string)
      const ln = brand.localizedName || {}
      localizedNames.value = Object.entries(ln).map(([lang, name]) => ({ lang, name }))
      if (!localizedNames.value.length) localizedNames.value = [{ lang: 'en', name: '' }]

      const firstScript = brand.scripts?.[0] ?? (brand.scriptId ? { scriptId: brand.scriptId } : null)
      formData.value = {
        country: brand.country || null,
        description: brand.description || '',
        slugName: brand.slugName || '',
        timeZone: brand.timeZone || null,
        publicBrand: brand.publicBrand ?? 0,
        bitRate: brand.bitRate ?? 128,
        aiAgentId: brand.aiAgentId || null,
        profileId: brand.profileId || null,
        managedBy: brand.managedBy || 'ITSELF',
        aiAgentMode: brand.aiAgentMode || 'BASIC',
        oneTimeStreamPolicy: brand.oneTimeStreamPolicy || 'NOT_ALLOWED',
        submissionPolicy: brand.submissionPolicy || 'NOT_ALLOWED',
        messagingPolicy: brand.messagingPolicy || 'NOT_ALLOWED',
        aiOverriding: {
          prompt: brand.aiOverriding?.prompt || '',
          talkativity: brand.aiOverriding?.talkativity ?? 0.5,
        },
        scriptId: firstScript?.scriptId || null,
        profileOverriding: { name: brand.profileOverriding?.name || '', description: brand.profileOverriding?.description || '' },
        color: brand.color || '#000000',
        titleFont: brand.titleFont || null,
        owner: { name: brand.owner?.name || '', email: brand.owner?.email || '' },
      }
      if (firstScript?.userVariables) userVariables.value = { ...firstScript.userVariables }
    }
  } catch (error: any) {
    message.error(error?.message || 'Failed to load')
    if (isEditing.value) router.push('/dashboard/brands')
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <FormWrapper
    :title="isEditing ? 'Edit Brand' : 'Create Brand'"
    :subtitle="isEditing ? 'Update brand / radio station' : 'Create a new brand'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="router.push('/dashboard/brands')">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">Save</NButton>
      </NSpace>
    </template>

    <NTabs v-model:value="activeTab">
      <NTabPane name="properties" tab="Properties">
        <NForm label-placement="left" label-width="140" :disabled="loading">
          <NFormItem label="Localized Names">
            <NDynamicInput v-model:value="localizedNames" :on-create="createLocalizedName" style="width:100%">
              <template #default="{ index }">
                <NSpace align="center" style="width:100%">
                  <NInput v-model:value="localizedNames[index].lang"
                    placeholder="en" style="width:80px" />
                  <NInput v-model:value="localizedNames[index].name" style="flex:1" />
                </NSpace>
              </template>
            </NDynamicInput>
          </NFormItem>

          <NFormItem label="Slug Name">
            <NInput v-model:value="formData.slugName" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Country">
            <NSelect v-model:value="formData.country" :options="COUNTRIES"
              filterable clearable style="width: 250px" />
          </NFormItem>

          <NFormItem label="Description">
            <NInput v-model:value="formData.description" type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }" style="width: 100%" />
          </NFormItem>

          <NFormItem label="Time Zone">
            <NSelect v-model:value="formData.timeZone" :options="TIMEZONES"
              filterable clearable style="width: 280px" />
          </NFormItem>

          <NFormItem label="Bit Rate">
            <NSelect v-model:value="formData.bitRate" :options="BIT_RATE_OPTIONS" style="width: 160px" />
          </NFormItem>

          <NFormItem label="Public">
            <NSwitch :value="formData.publicBrand === 1" @update:value="(v) => formData.publicBrand = v ? 1 : 0" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="dj" tab="DJ">
        <NForm label-placement="left" label-width="160" :disabled="loading">
          <NFormItem label="Managed By">
            <NRadioGroup v-model:value="formData.managedBy" name="managed-by">
              <NRadioButton v-for="opt in MANAGED_BY_OPTIONS" :key="opt.value"
                :value="opt.value" :label="opt.label" />
            </NRadioGroup>
          </NFormItem>

          <NFormItem label="AI Agent Mode">
            <NRadioGroup v-model:value="formData.aiAgentMode" name="agent-mode">
              <NRadioButton v-for="opt in AI_AGENT_MODE_OPTIONS" :key="opt.value"
                :value="opt.value" :label="opt.label" />
            </NRadioGroup>
          </NFormItem>

          <NFormItem label="AI Agent">
            <NSelect v-model:value="formData.aiAgentId" :options="agentOptions"
              filterable clearable style="width: 100%" />
          </NFormItem>

          <NFormItem label="AI Override Prompt">
            <NInput v-model:value="formData.aiOverriding.prompt" type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }" style="width: 100%" />
          </NFormItem>

          <NFormItem label="AI Talkativity">
            <NSlider v-model:value="formData.aiOverriding.talkativity"
              :min="0" :max="1" :step="0.05" :tooltip="false" style="flex:1; max-width:300px" />
            <span style="margin-left:12px">{{ formData.aiOverriding.talkativity }}</span>
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="script" tab="Script">
        <NForm label-placement="left" label-width="140" :disabled="loading">
          <NFormItem label="Script">
            <NSelect v-model:value="formData.scriptId" :options="scriptOptions"
              filterable clearable style="width: 100%; max-width: 500px" />
          </NFormItem>

          <NFormItem v-if="selectedScript?.description" label="Description">
            <span style="color: #888; font-size: 13px;">{{ selectedScript.description }}</span>
          </NFormItem>

          <template v-if="selectedScript?.requiredVariables?.length">
            <NFormItem label="Variables">
              <div style="width: 100%; max-width: 500px">
                <div v-for="variable in selectedScript.requiredVariables" :key="variable.name"
                  style="margin-bottom: 12px">
                  <div style="margin-bottom: 4px; font-size: 13px">
                    <strong>{{ formatVariableName(variable.name) }}</strong>
                    <span v-if="variable.required" style="color: #e74c3c">*</span>
                    <span style="color: #888; font-size: 12px; margin-left: 8px">{{ variable.description }}</span>
                  </div>
                  <NSwitch v-if="variable.type === 'boolean'" v-model:value="userVariables[variable.name]" />
                  <NInputNumber v-else-if="variable.type === 'number'"
                    v-model:value="userVariables[variable.name]" style="width: 100%" />
                  <NInput v-else v-model:value="userVariables[variable.name]" style="width: 100%" />
                </div>
              </div>
            </NFormItem>
          </template>
        </NForm>
      </NTabPane>

      <NTabPane name="audience" tab="Audience">
        <NForm label-placement="left" label-width="160" :disabled="loading">
          <NFormItem label="Audience Type">
            <NSelect v-model:value="formData.profileId" :options="profileOptions"
              filterable clearable style="width: 100%; max-width: 500px" />
          </NFormItem>

          <NFormItem v-if="formData.profileId" label="Local Name">
            <NInput v-model:value="formData.profileOverriding.name"
              placeholder="Optional override" style="width: 100%; max-width: 500px" />
          </NFormItem>

          <NFormItem v-if="formData.profileId" label="Additional Info">
            <NInput v-model:value="formData.profileOverriding.description"
              type="textarea" :autosize="{ minRows: 3, maxRows: 5 }"
              placeholder="Optional override" style="width: 100%; max-width: 500px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="contribution" tab="Contribution">
        <NForm label-placement="left" label-width="180" :disabled="loading">
          <NFormItem label="Messaging">
            <NSelect v-model:value="formData.messagingPolicy" :options="SUBMISSION_POLICY_OPTIONS" style="width: 220px" />
          </NFormItem>
          <NFormItem label="One-Time Stream">
            <NSelect v-model:value="formData.oneTimeStreamPolicy" :options="SUBMISSION_POLICY_OPTIONS" style="width: 220px" />
          </NFormItem>
          <NFormItem label="Song Submission">
            <NSelect v-model:value="formData.submissionPolicy" :options="SUBMISSION_POLICY_OPTIONS" style="width: 220px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="playerUi" tab="Player UI">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem v-if="localizedNames[0]?.name" label="Preview">
            <div :style="{
              fontFamily: formData.titleFont || undefined,
              fontSize: '34px',
              lineHeight: '1.1',
              color: formData.color,
              padding: '8px 0',
            }">
              {{ localizedNames[0].name }}
            </div>
          </NFormItem>

          <NFormItem label="Title Font">
            <NSelect v-model:value="formData.titleFont" :options="stationFontOptions"
              filterable clearable style="width: 280px" />
          </NFormItem>

          <NFormItem label="Color">
            <NColorPicker v-model:value="formData.color" style="width: 200px" />
          </NFormItem>
        </NForm>
      </NTabPane>

      <NTabPane name="owner" tab="Owner">
        <NForm label-placement="left" label-width="120" :disabled="loading">
          <NFormItem label="Owner Name">
            <NInput v-model:value="formData.owner.name"
              placeholder="Owner name" style="width: 100%; max-width: 400px" />
          </NFormItem>
          <NFormItem label="Owner Email">
            <NInput v-model:value="formData.owner.email"
              placeholder="owner@example.com" style="width: 100%; max-width: 400px" />
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </FormWrapper>
</template>
