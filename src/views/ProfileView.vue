<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { NCard, NH3, NP, NForm, NFormItem, NInput, NButton, NSpace, NAvatar } from 'naive-ui'

const authStore = useAuthStore()

const profileData = ref({
  username: '',
  email: '',
  firstName: '',
  lastName: ''
})

onMounted(() => {
  if (authStore.userProfile) {
    profileData.value = {
      username: authStore.userProfile.username || '',
      email: authStore.userProfile.email || '',
      firstName: authStore.userProfile.firstName || '',
      lastName: authStore.userProfile.lastName || ''
    }
  }
})
</script>

<template>
  <div class="profile-view">
    <NCard>
      <template #header>
        <div class="flex items-center space-x-4">
          <NAvatar size="large" :src="authStore.userProfile?.picture">
            {{ authStore.userName.charAt(0).toUpperCase() }}
          </NAvatar>
          <div>
            <NH3>User Profile</NH3>
            <NP class="text-gray-600">Manage your account information</NP>
          </div>
        </div>
      </template>
      
      <div class="max-w-md">
        <NForm :model="profileData" label-placement="left" label-width="120px">
          <NFormItem label="Username">
            <NInput v-model:value="profileData.username" disabled />
          </NFormItem>
          
          <NFormItem label="Email">
            <NInput v-model:value="profileData.email" disabled />
          </NFormItem>
          
          <NFormItem label="First Name">
            <NInput v-model:value="profileData.firstName" disabled />
          </NFormItem>
          
          <NFormItem label="Last Name">
            <NInput v-model:value="profileData.lastName" disabled />
          </NFormItem>
        </NForm>
        
        <div class="mt-6 p-4 bg-blue-50 rounded">
          <NP class="text-sm text-blue-700 mb-2">
            <strong>Note:</strong> Profile information is managed through Keycloak.
          </NP>
          <NP class="text-sm text-blue-600">
            To update your profile information, please contact your system administrator 
            or visit the Keycloak user console if available.
          </NP>
        </div>
        
        <div class="mt-6">
          <NSpace>
            <NButton type="error" @click="authStore.logout">
              Logout
            </NButton>
          </NSpace>
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.profile-view {
  width: 100%;
}
</style>
