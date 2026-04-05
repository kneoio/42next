import { ApiClient } from './base'
import { appConfig } from '@/config/appConfig'

class MixplaApiService extends ApiClient {
  constructor() {
    super(`${appConfig.mixplaServer}/datanest`)
  }
}

export const mixplaApiService = new MixplaApiService()
export default mixplaApiService
