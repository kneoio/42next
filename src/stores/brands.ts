import { defineStore } from 'pinia'
import { ref } from 'vue'
import mixplaApiService from '@/services/mixplaApi'

export type BrandStatus = 'OFF_LINE' | 'ON_LINE' | 'QUEUE_SATURATED' | 'WARMING_UP' | 'IDLE' | 'SYSTEM_ERROR'
export type ManagedBy = 'ITSELF' | 'AI_AGENT' | 'MIX'
export type SubmissionPolicy = 'NOT_ALLOWED' | 'REVIEW_REQUIRED' | 'NO_RESTRICTIONS'
export type AiAgentMode = 'BASIC' | 'SCRIPT_FOLLOWING'

export interface Brand {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  status?: BrandStatus
  title?: string
  localizedName: Record<string, string>
  country?: string
  description?: string
  color?: string
  slugName?: string
  timeZone?: string
  aiAgentId?: string
  profileId?: string
  managedBy?: ManagedBy
  aiAgentMode?: AiAgentMode
  oneTimeStreamPolicy?: SubmissionPolicy
  submissionPolicy?: SubmissionPolicy
  messagingPolicy?: SubmissionPolicy
  aiOverriding?: { prompt?: string; talkativity?: number }
  scriptId?: string
  publicBrand?: number
  bitRate?: number
}

export const MANAGED_BY_OPTIONS: { label: string; value: ManagedBy }[] = [
  { label: 'Itself', value: 'ITSELF' },
  { label: 'AI Agent', value: 'AI_AGENT' },
  { label: 'Mix', value: 'MIX' },
]

export const AI_AGENT_MODE_OPTIONS: { label: string; value: AiAgentMode }[] = [
  { label: 'Basic', value: 'BASIC' },
  { label: 'Script Following', value: 'SCRIPT_FOLLOWING' },
]

export const SUBMISSION_POLICY_OPTIONS: { label: string; value: SubmissionPolicy }[] = [
  { label: 'Not Allowed', value: 'NOT_ALLOWED' },
  { label: 'Review Required', value: 'REVIEW_REQUIRED' },
  { label: 'No Restrictions', value: 'NO_RESTRICTIONS' },
]

export const useBrandsStore = defineStore('brands', () => {
  const brands = ref<Brand[]>([])
  const loading = ref(false)
  const totalCount = ref(0)
  const pageNum = ref(1)
  const pageSize = ref(10)
  const maxPage = ref(1)

  async function loadBrands(page = pageNum.value, size = pageSize.value) {
    loading.value = true
    try {
      const result = await mixplaApiService.getPagedDictionary<Brand>('/brands', page, size)
      brands.value = result.entries
      totalCount.value = result.count
      pageNum.value = result.pageNum
      pageSize.value = result.pageSize
      maxPage.value = result.maxPage
    } finally {
      loading.value = false
    }
  }

  async function fetchBrand(id: string) {
    return mixplaApiService.getDocument<Brand>('/brands', id)
  }

  async function saveBrand(id: string | null, data: Partial<Brand>) {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, status: _s, ...payload } = data as Brand
    if (id) return mixplaApiService.updateDictionaryItem<Brand>('/brands', id, payload)
    return mixplaApiService.createDictionaryItem<Brand>('/brands', payload)
  }

  async function deleteBrand(id: string) {
    return mixplaApiService.deleteDictionaryItem('/brands', id)
  }

  return { brands, loading, totalCount, pageNum, pageSize, maxPage, loadBrands, fetchBrand, saveBrand, deleteBrand }
})
