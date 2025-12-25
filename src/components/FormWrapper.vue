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

    <div class="form-content">
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
</style>
