import { ApiClient } from './base'
import { appConfig } from '@/config/appConfig'

export interface User {
  identifier: string | null
  name: string
  login: string
  email: string
  language: string | null
  theme: string | null
  roles: any[]
  modules: any[]
}

class CoreApiService extends ApiClient {
  constructor() {
    super(`${appConfig.mixplaServer}/core`)
  }
}

export const coreApiService = new CoreApiService()
export default coreApiService
