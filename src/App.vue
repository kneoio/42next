
<template>
  <NConfigProvider :theme="naiveTheme">
    <NMessageProvider>
      <NGlobalStyle />
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>
<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NMessageProvider, NGlobalStyle, NConfigProvider } from 'naive-ui'
import { darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'
import { onMounted, computed } from 'vue'

const themeStore = useThemeStore()

// Computed theme object for Naive UI
const naiveTheme = computed(() => {
  return themeStore.isDark ? darkTheme : null
})

onMounted(() => {
  themeStore.initializeTheme()
})
</script>

