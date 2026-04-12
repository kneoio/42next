import { ApiClient } from './base'
import { appConfig } from '@/config/appConfig'

class RaquelApiService extends ApiClient {
  constructor() {
    super(`${appConfig.raquelServer}/raquel`)
  }
}

export const raquelApiService = new RaquelApiService()
export default raquelApiService
