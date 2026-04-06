import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export interface EnvironmentProfile {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  name: string
  description: string
  allowedGenres: string[]
  explicitContent: boolean
}

export const useEnvironmentProfilesStore = defineStore('environmentProfiles', () => {
  const profiles = ref<EnvironmentProfile[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadProfiles(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<EnvironmentProfile>('/profiles', page, size)
      profiles.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile(id: string) {
    return mixplaApiService.getDocument<EnvironmentProfile>('/profiles', id)
  }

  async function saveProfile(id: string | null, data: Partial<EnvironmentProfile>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as EnvironmentProfile
    if (id) return mixplaApiService.updateDictionaryItem<EnvironmentProfile>('/profiles', id, payload)
    return mixplaApiService.createDictionaryItem<EnvironmentProfile>('/profiles', payload)
  }

  async function deleteProfile(id: string) {
    return mixplaApiService.deleteDictionaryItem('/profiles', id)
  }

  return { profiles, loading, totalCount, pageNum, pageSize, maxPage, loadProfiles, fetchProfile, saveProfile, deleteProfile }
})
