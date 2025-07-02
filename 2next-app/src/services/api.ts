import authService from './auth'

export interface User {
  id: number
  author: number
  regDate: string
  lastModifier: number
  login: string
  modules: any[]
  roles: any[]
  pageSize: number
  defaultLang: number
  timeZone: string
  confirmationCode: number
  userName: string
  supervisor: boolean
  activatedRoles: any[]
  active: boolean
  editable: boolean
}

export interface ApiResponse<T> {
  payload: {
    viewData: T[]
  }
}

class ApiService {
  private baseUrl = 'http://localhost:38700/api'

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = authService.getAuthHeader()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
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

  // Users API
  async getUsers(): Promise<User[]> {
    const response = await this.request<ApiResponse<User>>('/users')
    return response.payload.viewData
  }

  async createUser(user: Partial<User>): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  }

  async updateUser(id: number, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    })
  }

  async deleteUser(id: number): Promise<void> {
    await this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    })
  }

  async archiveUsers(ids: number[]): Promise<void> {
    await this.request<void>('/users/archive', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  // Generic methods for other dictionary entities
  async getDictionary<T>(endpoint: string): Promise<T[]> {
    const response = await this.request<ApiResponse<T>>(endpoint)
    return response.payload.viewData
  }

  async createDictionaryItem<T>(endpoint: string, item: Partial<T>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(item),
    })
  }

  async updateDictionaryItem<T>(endpoint: string, id: number, item: Partial<T>): Promise<T> {
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    })
  }

  async deleteDictionaryItem(endpoint: string, id: number): Promise<void> {
    await this.request<void>(`${endpoint}/${id}`, {
      method: 'DELETE',
    })
  }

  async archiveDictionaryItems(endpoint: string, ids: number[]): Promise<void> {
    await this.request<void>(`${endpoint}/archive`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }
}

export const apiService = new ApiService()
export default apiService
