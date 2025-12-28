<template>
  <FormWrapper
    :title="isEditing ? 'Edit Label' : 'Create Label'"
    :subtitle="isEditing ? 'Update existing label' : 'Create a new label'"
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

        <NFormItem label="Color" required>
          <NColorPicker 
            v-model:value="formData.color"
            :show-alpha="false"
          />
        </NFormItem>

        <NFormItem label="Font Color">
          <NColorPicker 
            v-model:value="formData.fontColor"
            :show-alpha="false"
          />
        </NFormItem>

        <NFormItem label="Category" required>
          <NSelect
            v-model:value="formData.category"
            :options="categoryOptions"
            placeholder="Select category"
          />
        </NFormItem>

        <NFormItem label="Hidden">
          <NCheckbox v-model:checked="formData.hidden">
            Hide this label
          </NCheckbox>
        </NFormItem>

        <NFormItem label="Identifier" v-if="isEditing">
          <span>{{ formData.identifier }}</span>
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
  NColorPicker,
  NSelect,
  NCheckbox,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useLabelsStore, type Label } from '@/stores/labels'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const labelsStore = useLabelsStore()
const message = useMessage()

// Determine if we're editing or creating based on route
const isEditing = computed(() => route.params.id !== 'new')
const labelId = computed(() => route.params.id as string)

// Form data interface
interface LabelFormData {
  identifier: string
  localizedName: { [key: string]: string }
  color: string
  fontColor?: string
  hidden: boolean
  category: string
  parent?: string | null
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
}

const formData = ref<LabelFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  color: '#FF8C00',
  fontColor: '#000000',
  hidden: false,
  category: 'sound_fragment',
  parent: null
})

const categoryOptions = [
  { label: 'Sound Fragment', value: 'sound_fragment' },
  { label: 'Script', value: 'script' }
]

const loading = ref(false)

// Load label data if editing
async function loadLabel() {
  if (isEditing.value && labelId.value) {
    try {
      loading.value = true
      const fullDoc = await labelsStore.fetchLabel(labelId.value)
      formData.value = {
        identifier: fullDoc.identifier,
        localizedName: { ...fullDoc.localizedName },
        color: fullDoc.color,
        fontColor: fullDoc.fontColor,
        hidden: fullDoc.hidden,
        category: fullDoc.category,
        parent: fullDoc.parent ?? null,
        author: fullDoc.author,
        regDate: fullDoc.regDate,
        lastModifier: fullDoc.lastModifier,
        lastModifiedDate: fullDoc.lastModifiedDate
      }
    } catch (error) {
      message.error('Failed to load label data')
      console.error('Error loading label:', error)
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && labelId.value) {
      await labelsStore.updateLabel(labelId.value, formData.value)
      message.success('Label updated successfully')
    } else {
      await labelsStore.createLabel(formData.value)
      message.success('Label created successfully')
    }
    router.push('/dashboard/labels')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update label'
        : 'Failed to create label'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/labels')
}

// Load data on mount if editing
onMounted(() => {
  if (isEditing.value) {
    loadLabel()
  }
})
</script>
