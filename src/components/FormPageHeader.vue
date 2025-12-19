<script setup lang="ts">
import { NPageHeader } from 'naive-ui'

interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

function handleBack() {
  emit('back')
}
</script>

<template>
  <div class="form-page-header">
    <NPageHeader
      :title="title"
      :subtitle="subtitle"
      @back="handleBack"
    />
    <div class="actions-bar">
      <slot name="actions" />
    </div>
  </div>
</template>

<style scoped>
.form-page-header {
  margin-bottom: 16px;
}

.actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 8px;
}
</style>
