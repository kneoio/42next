<template>
  <FormWrapper
    :title="isEditing ? 'Edit User' : 'Create User'"
    :subtitle="isEditing ? 'Update existing user' : 'Create a new user'"
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
      <NFormItem label="Login" required>
        <NInput 
          v-model:value="formData.login" 
          placeholder="Enter login"
          :disabled="isEditing"
        />
      </NFormItem>

      <NFormItem label="Name" required>
        <NInput 
          v-model:value="formData.name" 
          placeholder="Enter user name"
        />
      </NFormItem>

      <NFormItem label="Email" required>
        <NInput 
          v-model:value="formData.email" 
          placeholder="Enter email address"
        />
      </NFormItem>

      <NFormItem label="Language">
        <NInput 
          v-model:value="formData.language" 
          placeholder="Enter language preference"
        />
      </NFormItem>

      <NFormItem label="Theme">
        <NInput 
          v-model:value="formData.theme" 
          placeholder="Enter theme preference"
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
import type { User } from '@/services/api'
import { useUserStore } from '@/stores/user'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const message = useMessage()

const isEditing = computed(() => route.params.id !== 'new')
const userId = computed(() => route.params.id as string)

interface UserFormData {
  login: string
  name: string
  email: string
  language: string
  theme: string
}

const formData = ref<UserFormData>({
  login: '',
  name: '',
  email: '',
  language: '',
  theme: ''
})

const loading = ref(false)

async function loadUser() {
  if (isEditing.value && userId.value) {
    try {
      loading.value = true
      const user = userStore.users.find(u => u.login === userId.value)
      if (user) {
        formData.value = {
          login: user.login,
          name: user.name || '',
          email: user.email || '',
          language: user.language || '',
          theme: user.theme || ''
        }
      } else {
        message.error('User not found')
        router.push('/dashboard/users')
      }
    } catch (error) {
      message.error('Failed to load user data')
      console.error('Error loading user:', error)
    } finally {
      loading.value = false
    }
  }
}

async function handleSave() {
  try {
    const userData: Partial<User> = {
      login: formData.value.login,
      name: formData.value.name,
      email: formData.value.email,
      language: formData.value.language || null,
      theme: formData.value.theme || null
    }
    
    if (isEditing.value && userId.value) {
      await userStore.updateUser(userId.value, userData)
      message.success('User updated successfully')
    } else {
      await userStore.createUser(userData)
      message.success('User created successfully')
    }
    router.push('/dashboard/users')
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : isEditing.value
        ? 'Failed to update user'
        : 'Failed to create user'
    message.error(errorMessage)
  }
}

function handleCancel() {
  router.push('/dashboard/users')
}

onMounted(() => {
  if (isEditing.value) {
    loadUser()
  }
})
</script>
