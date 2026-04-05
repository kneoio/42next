// Re-exports for backward compatibility — import directly from the specific service files instead.
export type { User } from './coreApi'
export type { UserBillingDTO, UserSubscriptionDTO, SubscriptionProductDTO } from './officeframeApi'

export { coreApiService as default } from './coreApi'
export { officeframeApiService } from './officeframeApi'
export { mixplaApiService } from './mixplaApi'
