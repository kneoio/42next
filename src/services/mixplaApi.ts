import { ApiClient } from './base'
import { appConfig } from '@/config/appConfig'

class MixplaApiService extends ApiClient {
  constructor() {
    super(`${appConfig.mixplaServer}/datanest`)
  }

  async fetchVoices(engine: string, langFilter: string[] = []): Promise<any[]> {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('size', '200')
    const filterObj: any = { engineType: engine.toUpperCase() }
    if (langFilter.length) filterObj.languages = langFilter
    params.set('filter', JSON.stringify(filterObj))
    const response = await this.request<any>(`/voices?${params.toString()}`)
    const viewData = response?.payload?.viewData ?? response?.viewData
    return (viewData?.entries ?? []).map((v: any) => ({
      id: v.id, name: v.name, language: v.language,
      labels: v.labels, engineType: v.engineType,
      label: v.name, value: v.id
    })).sort((a: any, b: any) => a.name.localeCompare(b.name))
  }
}

export const mixplaApiService = new MixplaApiService()
export default mixplaApiService
