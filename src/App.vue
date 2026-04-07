
<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <NLoadingBarProvider>
      <NMessageProvider>
        <NGlobalStyle />
        <RouterView />
      </NMessageProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NMessageProvider, NLoadingBarProvider, NGlobalStyle, NConfigProvider } from 'naive-ui'
import { darkTheme, type GlobalThemeOverrides } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'
import { onMounted, computed } from 'vue'

const themeStore = useThemeStore()

// Custom theme overrides with red as primary color
const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#A2000C',
    primaryColorHover: '#820009',
    primaryColorPressed: '#620007',
    primaryColorSuppl: '#c20010',
  }
}

// Computed theme object for Naive UI
const naiveTheme = computed(() => {
  return themeStore.isDark ? darkTheme : null
})

onMounted(() => {
  themeStore.initializeTheme()
})
</script>

