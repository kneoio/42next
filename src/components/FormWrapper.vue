<template>
  <div class="form-wrapper">
    <PageHeader :title="title" :subtitle="subtitle">
      <template #actions>
        <slot name="header-actions" />
      </template>
    </PageHeader>

    <ActionBar>
      <slot name="actions" />
    </ActionBar>

    <div :class="['form-content', { 'form-content--full': fullWidth }]">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import PageHeader from './PageHeader.vue'
import ActionBar from './ActionBar.vue'

interface Props {
  title: string
  subtitle?: string
  fullWidth?: boolean
}

const props = defineProps<Props>()
</script>

<style scoped>
.form-wrapper {
  width: 100%;
}

.form-content {
  max-width: 600px;
}

.form-content--full {
  max-width: none;
}
</style>
