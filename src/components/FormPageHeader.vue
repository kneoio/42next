
<template>
  
</template>


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

