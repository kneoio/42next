import authService from './auth'

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

export interface ApiResponse<T> {
  payload: {
    viewData: {
      count: number
      pageNum: number
      maxPage: number
      pageSize: number
      entries: T[]
    }
  }
}

export interface PagedResult<T> {
  entries: T[]
  count: number
  pageNum: number
  maxPage: number
  pageSize: number
}

export interface ApiDocResponse<T> {
  payload: {
    docData: T
  }
}

export interface ViewData<T> {
  entries: T[]
  count: number
  page: number
  maxPage: number
  size: number
}

export interface ViewPage<T> {
  page: number
  size: number
  maxPage: number
  payloads: {
    VIEW_DATA: ViewData<T>
  }
}

export interface FormPage<T> {
  payloads: {
    DOC_DATA: T
  }
}

export interface PagedViewResult<T> {
  entries: T[]
  count: number
  page: number
  maxPage: number
  size: number
}

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
  localizedName: {
    [languageCode: string]: string
  }
  localizedDescription: {
    [languageCode: string]: string
  }
  stripePriceId: string
  stripeProductId: string
  active: boolean
  meta: Record<string, unknown> | null
}

class ApiService {
  //private baseUrl = 'http://localhost:38700/api'
  private baseUrl = 'http://localhost:38707/api'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = authService.getAuthHeader()
    
    const url = `${this.baseUrl}${endpoint}`
    if (import.meta && import.meta.env && import.meta.env.DEV) {
      // Debug the outgoing request during development
      // eslint-disable-next-line no-console
      console.debug('[api] ', options.method || 'GET', url)
    }
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
        ...options.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`

      try {
        const data = await response.json()
        if (response.status === 401 && data && typeof (data as any).error === 'string') {
          errorMessage = (data as any).error
        } else if (response.status === 400) {
          if (data && typeof (data as any).message === 'string') {
            errorMessage = (data as any).message
          } else {
            errorMessage = 'Invalid JSON payload'
          }
        } else if (data && typeof (data as any).message === 'string') {
          errorMessage = (data as any).message
        }
      } catch {
        // Ignore JSON parse errors and fallback to default message
      }

      throw new Error(errorMessage)
    }

    // Some endpoints (e.g. DELETE) legitimately return 204 No Content.
    // In that case there is no body to parse.
    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }



  // Generic methods for other dictionary entities
  async getDictionary<T>(endpoint: string): Promise<T[]> {
    const response = await this.request<ApiResponse<T>>(endpoint)
    return response.payload.viewData.entries
  }

  async getPagedDictionary<T>(
    endpoint: string,
    pageNum: number,
    pageSize: number,
    filters?: Record<string, string | number | boolean | null | undefined>
  ): Promise<PagedResult<T>> {
    const params = new URLSearchParams()
    params.set('page', String(pageNum))
    params.set('size', String(pageSize))

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value))
        }
      }
    }

    const query = `?${params.toString()}`
    const response = await this.request<ApiResponse<T>>(`${endpoint}${query}`)
    const viewData = response.payload.viewData

    return {
      entries: viewData.entries,
      count: viewData.count,
      pageNum: viewData.pageNum,
      maxPage: viewData.maxPage,
      pageSize: viewData.pageSize
    }
  }

  async getDocument<T>(endpoint: string, id: string | number): Promise<T> {
    const response = await this.request<ApiDocResponse<T>>(`${endpoint}/${id}`)
    return response.payload.docData
  }

  async createDictionaryItem<T>(endpoint: string, item: Partial<T>): Promise<T> {
    return this.request<T>(`${endpoint}/new`, {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  async updateDictionaryItem<T>(endpoint: string, id: number | string, item: Partial<T>): Promise<T> {
    // Post to /{endpoint}/{id} for updates; backend uses path UUID
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...item, id }),
    })
  }

  async deleteDictionaryItem(endpoint: string, id: number | string): Promise<void> {
    await this.request<void>(`${endpoint}/${id}`, {
      method: 'DELETE',
    })
  }

  async archiveDictionaryItems(endpoint: string, ids: (number | string)[]): Promise<void> {
    await this.request<void>(`${endpoint}/archive`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  async getBillings(page: number, size: number): Promise<PagedViewResult<UserBillingDTO>> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))

    const response = await this.request<any>(`/billings?${params.toString()}`)
    const legacyViewData = response?.payload?.viewData
    const newViewData = response?.payloads?.VIEW_DATA
    const viewData = newViewData ?? legacyViewData

    if (!viewData) {
      throw new Error('Unexpected billings response format')
    }

    const pageValue = viewData.page ?? viewData.pageNum ?? page
    const sizeValue = viewData.size ?? viewData.pageSize ?? size

    return {
      entries: viewData.entries,
      count: viewData.count,
      page: pageValue,
      maxPage: viewData.maxPage,
      size: sizeValue
    }
  }

  async getBillingDocument(id: string | 'new'): Promise<UserBillingDTO> {
    const response = await this.request<any>(`/billings/${id}`)
    const doc =
      response?.payloads?.DOC_DATA ??
      response?.payload?.DOC_DATA ??
      response?.payload?.docData

    if (!doc) {
      throw new Error('Unexpected billing document response format')
    }

    return doc as UserBillingDTO
  }

  async createBilling(billing: Partial<UserBillingDTO>): Promise<UserBillingDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = billing as Partial<UserBillingDTO>

    return this.request<UserBillingDTO>('/billings', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateBilling(id: string, billing: Partial<UserBillingDTO>): Promise<UserBillingDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = billing as Partial<UserBillingDTO>

    return this.request<UserBillingDTO>(`/billings/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, id }),
    })
  }

  async deleteBilling(id: string): Promise<void> {
    await this.request<void>(`/billings/${id}`, {
      method: 'DELETE',
    })
  }

  async getSubscriptions(page: number, size: number): Promise<PagedViewResult<UserSubscriptionDTO>> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))

    const response = await this.request<any>(`/subscriptions?${params.toString()}`)
    const legacyViewData = response?.payload?.viewData
    const newViewData = response?.payloads?.VIEW_DATA
    const viewData = newViewData ?? legacyViewData

    if (!viewData) {
      throw new Error('Unexpected subscriptions response format')
    }

    const pageValue = viewData.page ?? viewData.pageNum ?? page
    const sizeValue = viewData.size ?? viewData.pageSize ?? size

    return {
      entries: viewData.entries,
      count: viewData.count,
      page: pageValue,
      maxPage: viewData.maxPage,
      size: sizeValue
    }
  }

  async getSubscriptionDocument(id: string | 'new'): Promise<UserSubscriptionDTO> {
    const response = await this.request<any>(`/subscriptions/${id}`)
    const doc =
      response?.payloads?.DOC_DATA ??
      response?.payload?.DOC_DATA ??
      response?.payload?.docData

    if (!doc) {
      throw new Error('Unexpected subscription document response format')
    }

    return doc as UserSubscriptionDTO
  }

  async createSubscription(subscription: Partial<UserSubscriptionDTO>): Promise<UserSubscriptionDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = subscription as Partial<UserSubscriptionDTO>

    return this.request<UserSubscriptionDTO>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateSubscription(id: string, subscription: Partial<UserSubscriptionDTO>): Promise<UserSubscriptionDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = subscription as Partial<UserSubscriptionDTO>

    return this.request<UserSubscriptionDTO>(`/subscriptions/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, id }),
    })
  }

  async deleteSubscription(id: string): Promise<void> {
    await this.request<void>(`/subscriptions/${id}`, {
      method: 'DELETE',
    })
  }

  async getSubscriptionProducts(page: number, size: number): Promise<PagedViewResult<SubscriptionProductDTO>> {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('size', String(size))

    const response = await this.request<any>(`/subscription-products?${params.toString()}`)
    const legacyViewData = response?.payload?.viewData
    const newViewData = response?.payloads?.VIEW_DATA
    const viewData = newViewData ?? legacyViewData

    if (!viewData) {
      throw new Error('Unexpected subscription products response format')
    }

    const pageValue = viewData.page ?? viewData.pageNum ?? page
    const sizeValue = viewData.size ?? viewData.pageSize ?? size

    return {
      entries: viewData.entries,
      count: viewData.count,
      page: pageValue,
      maxPage: viewData.maxPage,
      size: sizeValue
    }
  }

  async getSubscriptionProductDocument(id: string | 'new'): Promise<SubscriptionProductDTO> {
    const response = await this.request<any>(`/subscription-products/${id}`)
    const doc =
      response?.payloads?.DOC_DATA ??
      response?.payload?.DOC_DATA ??
      response?.payload?.docData

    if (!doc) {
      throw new Error('Unexpected subscription product document response format')
    }

    return doc as SubscriptionProductDTO
  }

  async createSubscriptionProduct(product: Partial<SubscriptionProductDTO>): Promise<SubscriptionProductDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = product as Partial<SubscriptionProductDTO>

    return this.request<SubscriptionProductDTO>('/subscription-products', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateSubscriptionProduct(id: string, product: Partial<SubscriptionProductDTO>): Promise<SubscriptionProductDTO> {
    const {
      id: _id,
      author: _author,
      regDate: _regDate,
      lastModifier: _lastModifier,
      lastModifiedDate: _lastModifiedDate,
      ...payload
    } = product as Partial<SubscriptionProductDTO>

    return this.request<SubscriptionProductDTO>(`/subscription-products/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, id }),
    })
  }

  async deleteSubscriptionProduct(id: string): Promise<void> {
    await this.request<void>(`/subscription-products/${id}`, {
      method: 'DELETE',
    })
  }
}

export const apiService = new ApiService()
export default apiService

