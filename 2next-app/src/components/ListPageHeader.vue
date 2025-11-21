<script setup lang="ts">
import { NPageHeader } from 'naive-ui'

interface Props {
  title: string
  subtitle?: string
  count?: number
}

const props = defineProps<Props>()
</script>

<template>
  <div class="list-page-header">
    <NPageHeader :title="title" :subtitle="subtitle">
      <template #extra>
        <div class="list-header-extra">
          <span v-if="count !== undefined" class="total-count">
            Total: {{ count }}
          </span>
          <slot name="actions" />
        </div>
      </template>
    </NPageHeader>
  </div>
</template>

<style scoped>
.list-page-header {
  margin-bottom: 16px;
}

.list-header-extra {
  display: flex;
  align-items: center;
  gap: 16px;
}

.total-count {
  font-size: 13px;
  color: var(--text-color);
}
</style>
