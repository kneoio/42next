<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NH3, NP, NButton, NSpace } from 'naive-ui'

const loading = ref(false)
</script>

<template>
  <div class="languages-view">
    <NCard>
      <template #header>
        <div class="flex justify-between items-center">
          <NH3>Languages Management</NH3>
          <NSpace>
            <NButton type="primary">Create Language</NButton>
            <NButton type="warning" disabled>Archive Selected</NButton>
          </NSpace>
        </div>
      </template>
      
      <NP class="text-gray-600">
        Languages management functionality will be implemented here. 
        This will include CRUD operations for system languages with the same pattern as Users.
      </NP>
      
      <div class="mt-4 p-4 bg-gray-50 rounded">
        <NP class="text-sm text-gray-500 mb-2">Coming soon:</NP>
        <ul class="text-sm text-gray-600 space-y-1">
          <li>• View all languages in a data table</li>
          <li>• Create new languages</li>
          <li>• Edit existing languages</li>
          <li>• Archive/Delete languages</li>
          <li>• Bulk operations</li>
        </ul>
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.languages-view {
  width: 100%;
}
</style>
