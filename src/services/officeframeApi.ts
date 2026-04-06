import { ApiClient } from './base'
import { appConfig } from '@/config/appConfig'

// Officeframe serves: /officeframe/labels, /officeframe/genres
// All methods are inherited from ApiClient base class.

class OfficeframeApiService extends ApiClient {
  constructor() {
    super(`${appConfig.mixplaServer}/officeframe`)
  }
}

export const officeframeApiService = new OfficeframeApiService()
export default officeframeApiService
