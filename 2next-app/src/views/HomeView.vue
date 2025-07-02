<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { NButton, NCard, NH1, NP, NSpace, NLayout, NLayoutContent, NAvatar, NDivider } from 'naive-ui'

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  await authStore.login()
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const isAuthenticated = computed(() => authStore.isAuthenticated)
const userName = computed(() => authStore.userName)
const userProfile = computed(() => authStore.userProfile)
</script>

<template>
  <NLayout class="min-h-screen">
    <NLayoutContent class="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <NCard class="w-full max-w-md shadow-lg">
        <template #header>
          <div class="text-center">
            <NH1 class="text-3xl font-bold text-gray-800 mb-2">Welcome to 2next Platform</NH1>
          </div>
        </template>
        
        <!-- Not Authenticated State -->
        <div v-if="!isAuthenticated" class="text-center space-y-6">
          <NP class="text-lg text-gray-600">
            Your comprehensive dictionary management platform. 
            Manage users, roles, modules, languages, and more with ease.
          </NP>
          
          <NP class="text-gray-500">
            Please log in to access the secured area and start managing your dictionaries.
          </NP>
          
          <NSpace justify="center">
            <NButton 
              type="primary" 
              size="large"
              @click="handleLogin"
              :loading="authStore.isLoading"
              class="px-8 py-2"
            >
              {{ authStore.isLoading ? 'Initializing...' : 'Login' }}
            </NButton>
          </NSpace>
        </div>
        
        <!-- Authenticated State -->
        <div v-else class="text-center space-y-6">
          <div class="flex flex-col items-center space-y-4">
            <NAvatar size="large" :src="userProfile?.picture">
              {{ userName.charAt(0).toUpperCase() }}
            </NAvatar>
            
            <div>
              <NH1 class="text-xl font-semibold text-gray-800">Hello, {{ userName }}!</NH1>
              <NP class="text-gray-600">Welcome back to the platform</NP>
            </div>
          </div>
          
          <NDivider />
          
          <div class="space-y-4">
            <NP class="text-gray-600">
              You are successfully authenticated and can now access the secured dashboard area.
            </NP>
            
            <NSpace justify="center" vertical>
              <NButton 
                type="primary" 
                size="large"
                @click="goToDashboard"
                class="px-8 py-2"
              >
                Enter Dashboard
              </NButton>
              
              <NButton 
                text 
                type="error"
                @click="authStore.logout"
                class="text-sm"
              >
                Logout
              </NButton>
            </NSpace>
          </div>
        </div>
      </NCard>
    </NLayoutContent>
  </NLayout>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
