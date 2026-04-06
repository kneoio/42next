import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export type FragmentType =
  | 'SONG' | 'ADVERTISEMENT' | 'JINGLE' | 'NEWS' | 'WEATHER'
  | 'JINGLE_INTRO' | 'JINGLE_OUTRO' | 'BACKGROUND_LOOP'

export const FRAGMENT_TYPES: { label: string; value: FragmentType }[] = [
  { label: 'Song', value: 'SONG' },
  { label: 'Advertisement', value: 'ADVERTISEMENT' },
  { label: 'Jingle', value: 'JINGLE' },
  { label: 'Jingle Intro', value: 'JINGLE_INTRO' },
  { label: 'Jingle Outro', value: 'JINGLE_OUTRO' },
  { label: 'News', value: 'NEWS' },
  { label: 'Weather', value: 'WEATHER' },
  { label: 'Background Loop', value: 'BACKGROUND_LOOP' },
]

export interface SoundFragment {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  slugName: string
  type: FragmentType
  title?: string
  artist?: string
  genres: string[]
  labels?: string[]
  album?: string
  url?: string
  description: string
  representedInBrands: string[]
  source?: string
  length?: string | number
}

export const useSoundFragmentsStore = defineStore('soundFragments', () => {
  const fragments = ref<SoundFragment[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadFragments(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<SoundFragment>('/soundfragments', page, size)
      fragments.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchFragment(id: string) {
    return mixplaApiService.getDocument<SoundFragment>('/soundfragments', id)
  }

  async function saveFragment(id: string | null, data: Partial<SoundFragment>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = data as SoundFragment
    if (id) return mixplaApiService.updateDictionaryItem<SoundFragment>('/soundfragments', id, payload)
    return mixplaApiService.createDictionaryItem<SoundFragment>('/soundfragments', payload)
  }

  async function deleteFragment(id: string) {
    return mixplaApiService.deleteDictionaryItem('/soundfragments', id)
  }

  return { fragments, loading, totalCount, pageNum, pageSize, maxPage, loadFragments, fetchFragment, saveFragment, deleteFragment }
})
