<template>
  <FormWrapper
    :title="isEditing ? 'Edit Genre' : 'Create Genre'"
    :subtitle="isEditing ? 'Update existing genre' : 'Create a new genre'"
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

      <NFormItem label="Rank" required>
        <NInputNumber 
          v-model:value="formData.rank" 
          placeholder="Enter rank"
          :min="0"
        />
      </NFormItem>

      <NFormItem label="Color">
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

      <NFormItem label="Parent">
        <NInput 
          v-model:value="formData.parent" 
          placeholder="Enter parent genre identifier (optional)"
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
  NColorPicker,
  useMessage
} from 'naive-ui'
import FormWrapper from '@/components/FormWrapper.vue'
import { useGenresStore, type Genre } from '@/stores/genres'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const genresStore = useGenresStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const genreId = computed(() => route.params.id as string)

const formData = ref({
  identifier: '',
  localizedName: { en: '', pt: '', kk: '' },
  rank: 999,
  color: '#FF8C00',
  fontColor: '#000000',
  parent: null as string | null
})

const loading = ref(false)

async function loadGenre() {
  if (isEditing.value && genreId.value) {
    try {
      loading.value = true
      const genre = genresStore.genres.find(g => g.identifier === genreId.value)
      if (genre) {
        const fullDoc = await genresStore.fetchGenre(genre.id)
        formData.value = {
          identifier: fullDoc.identifier,
          localizedName: { 
            en: fullDoc.localizedName.en || '', 
            pt: fullDoc.localizedName.pt || '', 
            kk: fullDoc.localizedName.kk || '' 
          },
          rank: fullDoc.rank,
          color: fullDoc.color || '#FF8C00',
          fontColor: fullDoc.fontColor || '#000000',
          parent: fullDoc.parent || null
        }
      } else {
        message.error('Genre not found')
        router.push('/dashboard/genres')
      }
    } catch (error) {
      message.error('Failed to load genre data')
      console.error('Error loading genre:', error)
      router.push('/dashboard/genres')
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    if (isEditing.value && genreId.value) {
      const genre = genresStore.genres.find(g => g.identifier === genreId.value)
      if (genre) {
        await genresStore.updateGenre(genre.id, formData.value)
        message.success('Genre updated successfully')
      }
    } else {
      await genresStore.createGenre(formData.value)
      message.success('Genre created successfully')
    }
    router.push('/dashboard/genres')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update genre'
        : 'Failed to create genre'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/genres')
}

onMounted(() => {
  if (isEditing.value) {
    loadGenre()
  }
})
</script>
