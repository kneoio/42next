<template>
  <FormWrapper
    :title="isEditing ? 'Edit Language' : 'Create Language'"
    :subtitle="isEditing ? 'Update existing language' : 'Create a new language'"
  >
    <template #actions>
      <NSpace>
        <NButton @click="handleCancel">Close</NButton>
        <NButton type="primary" @click="handleSave" :loading="loading">
          Save
        </NButton>
      </NSpace>
    </template>
    
    <NForm
      :model="formData"
      label-placement="left"
      label-width="120"
      :disabled="loading"
    >
      <NFormItem label="Code" required>
        <NInput 
          v-model:value="formData.code" 
          placeholder="e.g., en, pt, kk"
          :disabled="isEditing"
        />
      </NFormItem>

      <NFormItem label="Position" required>
        <NInputNumber 
          v-model:value="formData.position" 
          placeholder="Enter position"
          :min="0"
        />
      </NFormItem>

      <NFormItem label="Name (EN)" required>
        <NInput 
          v-model:value="formData.localizedName.en" 
          placeholder="Enter English name"
        />
      </NFormItem>

      <NFormItem label="Name (PT)">
        <NInput 
          v-model:value="formData.localizedName.pt" 
          placeholder="Enter Portuguese name"
        />
      </NFormItem>

      <NFormItem label="Name (KK)">
        <NInput 
          v-model:value="formData.localizedName.kk" 
          placeholder="Enter Kazakh name"
        />
      </NFormItem>
    </NForm>
  </FormWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { 
  NButton, 
  NSpace, 
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useLanguagesStore, type Language } from '@/stores/languages'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const languagesStore = useLanguagesStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const languageCode = computed(() => route.params.id as string)

const formData = ref({
  code: '',
  position: 0,
  localizedName: { en: '', pt: '', kk: '' }
})

const loading = ref(false)

async function loadLanguage() {
  if (isEditing.value && languageCode.value) {
    try {
      loading.value = true
      const language = languagesStore.languages.find(l => l.code === languageCode.value)
      if (language) {
        formData.value = {
          code: language.code,
          position: language.position,
          localizedName: { 
            en: language.localizedName.en || '', 
            pt: language.localizedName.pt || '', 
            kk: language.localizedName.kk || '' 
          }
        }
      } else {
        message.error('Language not found')
        router.push('/dashboard/languages')
      }
    } catch (error) {
      message.error('Failed to load language data')
      console.error('Error loading language:', error)
      router.push('/dashboard/languages')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && languageCode.value) {
      const language = languagesStore.languages.find(l => l.code === languageCode.value)
      if (language) {
        await languagesStore.updateLanguage(language.id, formData.value)
        message.success('Language updated successfully')
      }
    } else {
      await languagesStore.createLanguage(formData.value)
      message.success('Language created successfully')
    }
    router.push('/dashboard/languages')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update language'
        : 'Failed to create language'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/languages')
}

onMounted(() => {
  if (isEditing.value) {
    loadLanguage()
  }
})
</script>
