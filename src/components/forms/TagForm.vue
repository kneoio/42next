<template>
  <FormWrapper
    :title="isEditing ? 'Edit Tag' : 'Create Tag'"
    :subtitle="isEditing ? 'Update existing tag' : 'Create a new tag'"
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
      <NFormItem label="Identifier" required>
        <NInput 
          v-model:value="formData.identifier" 
          placeholder="Enter identifier"
          :disabled="isEditing"
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

      <NFormItem label="Description (EN)">
        <NInput 
          v-model:value="formData.localizedDescription.en" 
          type="textarea"
          placeholder="Enter English description"
        />
      </NFormItem>

      <NFormItem label="Description (PT)">
        <NInput 
          v-model:value="formData.localizedDescription.pt" 
          type="textarea"
          placeholder="Enter Portuguese description"
        />
      </NFormItem>

      <NFormItem label="Description (KK)">
        <NInput 
          v-model:value="formData.localizedDescription.kk" 
          type="textarea"
          placeholder="Enter Kazakh description"
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
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useTagsStore, type Tag } from '@/stores/tags'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const tagsStore = useTagsStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const tagId = computed(() => route.params.id as string)

interface TagFormData {
  identifier: string
  localizedName: { [key: string]: string }
  localizedDescription: { [key: string]: string }
  author?: string
  regDate?: string
  lastModifier?: string
  lastModifiedDate?: string
}

const formData = ref<TagFormData>({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  localizedDescription: { en: '', pt: '', kk: '' }
})

const loading = ref(false)

async function loadTag() {
  if (isEditing.value && tagId.value) {
    try {
      loading.value = true
      const tag = tagsStore.getTagByIdentifier(tagId.value)
      if (tag) {
        formData.value = {
          identifier: tag.identifier,
          localizedName: { ...tag.localizedName },
          localizedDescription: { ...tag.localizedDescription },
          author: tag.author,
          regDate: tag.regDate,
          lastModifier: tag.lastModifier,
          lastModifiedDate: tag.lastModifiedDate
        }
      } else {
        message.error('Tag not found')
        router.push('/dashboard/tags')
      }
    } catch (error) {
      message.error('Failed to load tag data')
      console.error('Error loading tag:', error)
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && tagId.value) {
      await tagsStore.updateTag(tagId.value, formData.value)
      message.success('Tag updated successfully')
    } else {
      await tagsStore.createTag(formData.value)
      message.success('Tag created successfully')
    }
    router.push('/dashboard/tags')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update tag'
        : 'Failed to create tag'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/tags')
}

onMounted(() => {
  if (isEditing.value) {
    loadTag()
  }
})
</script>
