import { ApiClient, type PagedViewResult } from './base'
import { appConfig } from '@/config/appConfig'

export interface UserBillingDTO {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  userId: number
  stripeCustomerId: string
  meta: Record<string, unknown> | null
}

export interface UserSubscriptionDTO {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  userId: number
  stripeSubscriptionId: string
  subscriptionType: string
  subscriptionStatus: string
  trialEnd: string | null
  active: boolean
  meta: Record<string, unknown> | null
}

export interface SubscriptionProductDTO {
  id: string
  author: string
  regDate: string
  lastModifier: string
  lastModifiedDate: string
  identifier: string
  localizedName: { [languageCode: string]: string }
  localizedDescription: { [languageCode: string]: string }
  stripePriceId: string
  stripeProductId: string
  active: boolean
  meta: Record<string, unknown> | null
}

class OfficeframeApiService extends ApiClient {
  constructor() {
    super(`${appConfig.mixplaServer}/officeframe`)
  }

  async getBillings(page: number, size: number): Promise<PagedViewResult<UserBillingDTO>> {
    const response = await this.request<any>(`/billings?page=${page}&size=${size}`)
    return this.resolvePagedViewResult(response, page, size)
  }

  async getBillingDocument(id: string): Promise<UserBillingDTO> {
    const response = await this.request<any>(`/billings/${id}`)
    return this.resolveDocData(response)
  }

  async createBilling(billing: Partial<UserBillingDTO>): Promise<UserBillingDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = billing
    return this.request<UserBillingDTO>('/billings', { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateBilling(id: string, billing: Partial<UserBillingDTO>): Promise<UserBillingDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = billing
    return this.request<UserBillingDTO>(`/billings/${id}`, { method: 'POST', body: JSON.stringify({ ...payload, id }) })
  }

  async deleteBilling(id: string): Promise<void> {
    await this.request<void>(`/billings/${id}`, { method: 'DELETE' })
  }

  async getSubscriptions(page: number, size: number): Promise<PagedViewResult<UserSubscriptionDTO>> {
    const response = await this.request<any>(`/subscriptions?page=${page}&size=${size}`)
    return this.resolvePagedViewResult(response, page, size)
  }

  async getSubscriptionDocument(id: string): Promise<UserSubscriptionDTO> {
    const response = await this.request<any>(`/subscriptions/${id}`)
    return this.resolveDocData(response)
  }

  async createSubscription(subscription: Partial<UserSubscriptionDTO>): Promise<UserSubscriptionDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = subscription
    return this.request<UserSubscriptionDTO>('/subscriptions', { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateSubscription(id: string, subscription: Partial<UserSubscriptionDTO>): Promise<UserSubscriptionDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = subscription
    return this.request<UserSubscriptionDTO>(`/subscriptions/${id}`, { method: 'POST', body: JSON.stringify({ ...payload, id }) })
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.request<void>(`/subscriptions/${id}`, { method: 'DELETE' })
  }

  async getSubscriptionProducts(page: number, size: number): Promise<PagedViewResult<SubscriptionProductDTO>> {
    const response = await this.request<any>(`/subscription-products?page=${page}&size=${size}`)
    return this.resolvePagedViewResult(response, page, size)
  }

  async getSubscriptionProductDocument(id: string): Promise<SubscriptionProductDTO> {
    const response = await this.request<any>(`/subscription-products/${id}`)
    return this.resolveDocData(response)
  }

  async createSubscriptionProduct(product: Partial<SubscriptionProductDTO>): Promise<SubscriptionProductDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = product
    return this.request<SubscriptionProductDTO>('/subscription-products', { method: 'POST', body: JSON.stringify(payload) })
  }

  async updateSubscriptionProduct(id: string, product: Partial<SubscriptionProductDTO>): Promise<SubscriptionProductDTO> {
    const { id: _id, author: _a, regDate: _r, lastModifier: _lm, lastModifiedDate: _lmd, ...payload } = product
    return this.request<SubscriptionProductDTO>(`/subscription-products/${id}`, { method: 'POST', body: JSON.stringify({ ...payload, id }) })
  }

  async deleteSubscriptionProduct(id: string): Promise<void> {
    await this.request<void>(`/subscription-products/${id}`, { method: 'DELETE' })
  }
}

export const officeframeApiService = new OfficeframeApiService()
export default officeframeApiService
