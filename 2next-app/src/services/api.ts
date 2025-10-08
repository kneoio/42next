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
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }



  // Generic methods for other dictionary entities
  async getDictionary<T>(endpoint: string): Promise<T[]> {
    const response = await this.request<ApiResponse<T>>(endpoint)
    return response.payload.viewData.entries
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

