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

<template>
  <NConfigProvider :theme="naiveTheme">
    <NMessageProvider>
      <NGlobalStyle />
      <RouterView />
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
