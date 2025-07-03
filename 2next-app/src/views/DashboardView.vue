<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { 
  NLayout, 
  NLayoutSider, 
  NLayoutHeader, 
  NLayoutContent,
  NMenu,
  NButton,
  NDropdown,
  NAvatar,
  NSpace,
  NIcon,
  type MenuOption
} from 'naive-ui'
import {
  PersonOutline as UsersIcon,
  ShieldOutline as RolesIcon,
  ExtensionPuzzleOutline as ModulesIcon,
  LanguageOutline as LanguagesIcon,
  PersonCircleOutline as ProfileIcon,
  LogOutOutline as LogoutIcon,
  SunnyOutline as LightIcon,
  MoonOutline as DarkIcon
} from '@vicons/ionicons5'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()

const collapsed = ref(false)
const activeKey = ref('users')

// Check authentication on mount
onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
  }
})

const menuOptions: MenuOption[] = [
  {
    label: 'Users',
    key: 'users',
    icon: () => h(NIcon, null, { default: () => h(UsersIcon) })
  },
  {
    label: 'Roles',
    key: 'roles',
    icon: () => h(NIcon, null, { default: () => h(RolesIcon) })
  },
  {
    label: 'Modules',
    key: 'modules',
    icon: () => h(NIcon, null, { default: () => h(ModulesIcon) })
  },
  {
    label: 'Languages',
    key: 'languages',
    icon: () => h(NIcon, null, { default: () => h(LanguagesIcon) })
  }
]

const userMenuOptions = [
  {
    label: 'Profile',
    key: 'profile',
    icon: () => h(NIcon, null, { default: () => h(ProfileIcon) })
  },
  {
    label: 'Logout',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogoutIcon) })
  }
]

const handleMenuSelect = (key: string) => {
  activeKey.value = key
  router.push(`/dashboard/${key}`)
}

const handleUserMenuSelect = async (key: string) => {
  if (key === 'logout') {
    await authStore.logout()
  } else if (key === 'profile') {
    router.push('/dashboard/profile')
  }
}
</script>

<template>
  <NLayout has-sider class="min-h-screen">
    <NLayoutSider
      bordered
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      :collapsed="collapsed"
      show-trigger
      @collapse="collapsed = true"
      @expand="collapsed = false"
    >
      <div class="p-4">
        <div class="text-center mb-6">
          <h2 v-if="!collapsed" class="text-xl font-bold text-gray-800">2next Platform</h2>
          <h2 v-else class="text-lg font-bold text-gray-800">2n</h2>
        </div>
        
        <NMenu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuSelect"
        />
      </div>
    </NLayoutSider>

    <NLayout>
      <NLayoutHeader bordered class="p-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-4">
            <h1 class="text-2xl font-semibold text-gray-800 capitalize">
              {{ activeKey }} Management
            </h1>
          </div>
          
          <NSpace>
            <NButton 
              circle 
              quaternary
              @click="themeStore.toggleTheme"
              :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <template #icon>
                <NIcon>
                  <LightIcon v-if="themeStore.isDark" />
                  <DarkIcon v-else />
                </NIcon>
              </template>
            </NButton>
            
            <NDropdown
              :options="userMenuOptions"
              @select="handleUserMenuSelect"
            >
              <NButton text>
                <template #icon>
                  <NAvatar size="small" :src="authStore.userProfile?.picture">
                    {{ authStore.userName.charAt(0).toUpperCase() }}
                  </NAvatar>
                </template>
                <span v-if="!collapsed" class="ml-2">{{ authStore.userName }}</span>
              </NButton>
            </NDropdown>
          </NSpace>
        </div>
      </NLayoutHeader>

      <NLayoutContent class="p-6">
        <router-view />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style>
