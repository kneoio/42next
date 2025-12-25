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
  NFlex,
  NIcon,
  type MenuOption
} from 'naive-ui'
import {
  PersonOutline as UsersIcon,
  ShieldOutline as RolesIcon,
  ExtensionPuzzleOutline as ModulesIcon,
  LanguageOutline as LanguagesIcon,
  PricetagOutline as LabelsIcon,
  MusicalNotesOutline as GenresIcon,
  DocumentAttachOutline as AgreementsIcon,
  HandLeftOutline as ConsentsIcon,
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
    label: 'Billings',
    key: 'billings',
    icon: () => h(NIcon, null, { default: () => h(UsersIcon) })
  },
  {
    label: 'Subscriptions',
    key: 'subscriptions',
    icon: () => h(NIcon, null, { default: () => h(ModulesIcon) })
  },
  {
    label: 'Subscription Products',
    key: 'subscription-products',
    icon: () => h(NIcon, null, { default: () => h(LabelsIcon) })
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
  },
  {
    label: 'Labels',
    key: 'labels',
    icon: () => h(NIcon, null, { default: () => h(LabelsIcon) })
  },
  {
    label: 'Genres',
    key: 'genres',
    icon: () => h(NIcon, null, { default: () => h(GenresIcon) })
  },
  {
    label: 'Agreements',
    key: 'agreements',
    icon: () => h(NIcon, null, { default: () => h(AgreementsIcon) })
  },
  {
    label: 'Consents',
    key: 'consents',
    icon: () => h(NIcon, null, { default: () => h(ConsentsIcon) })
  },
  {
    key: 'divider-logout',
    type: 'divider'
  },
  {
    label: 'Logout',
    key: 'logout',
    icon: () => h(NIcon, null, { default: () => h(LogoutIcon) })
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

const handleMenuSelect = async (key: string) => {
  if (key === 'logout') {
    await authStore.logout()
    return
  }

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
  <NLayout has-sider style="min-height: 100vh; width: 100%; overflow-x: hidden;">
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
      <NSpace vertical style="padding: 16px;">
        <NFlex justify="center">
          <h2 v-if="!collapsed">2next Platform</h2>
          <h2 v-else>2n</h2>
        </NFlex>
        
        <NMenu
          :collapsed="collapsed"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
          :value="activeKey"
          @update:value="handleMenuSelect"
        />
      </NSpace>
    </NLayoutSider>

    <NLayout style="flex: 1; min-width: 1000px;">
      <NLayoutHeader bordered style="padding: 16px;">
        <NFlex justify="space-between" align="center">
          <h1 style="text-transform: capitalize;">
            {{ activeKey }} Management
          </h1>
          
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
                <NSpace align="center" :size="8">
                  <NAvatar size="small" :src="authStore.userProfile?.picture">
                    {{ authStore.userName.charAt(0).toUpperCase() }}
                  </NAvatar>
                  <span v-if="!collapsed">{{ authStore.userName }}</span>
                </NSpace>
              </NButton>
            </NDropdown>
          </NSpace>
        </NFlex>
      </NLayoutHeader>

      <NLayoutContent style="padding: 24px; min-width: 800px;">
        <router-view />
      </NLayoutContent>
    </NLayout>
  </NLayout>
</template>

