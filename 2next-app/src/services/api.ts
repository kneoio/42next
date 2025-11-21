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

class ApiService {
  private baseUrl = 'http://localhost:38700/api'

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
}

export const apiService = new ApiService()
export default apiService

