import authService from './auth'

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

export interface PagedViewResult<T> {
  entries: T[]
  count: number
  page: number
  maxPage: number
  size: number
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = authService.getAuthHeader()
    const url = `${this.baseUrl}${endpoint}`

    if (import.meta.env.DEV) {
      console.debug('[api]', options.method || 'GET', url)
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
        if (response.status === 401 && typeof (data as any).error === 'string') {
          errorMessage = (data as any).error
        } else if (data && typeof (data as any).message === 'string') {
          errorMessage = (data as any).message
        }
      } catch {}
      throw new Error(errorMessage)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json()
  }

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

    const response = await this.request<ApiResponse<T>>(`${endpoint}?${params.toString()}`)
    const viewData = response.payload.viewData
    return {
      entries: viewData.entries,
      count: viewData.count,
      pageNum: viewData.pageNum,
      maxPage: viewData.maxPage,
      pageSize: viewData.pageSize,
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
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ...item, id }),
    })
  }

  async deleteDictionaryItem(endpoint: string, id: number | string): Promise<void> {
    await this.request<void>(`${endpoint}/${id}`, { method: 'DELETE' })
  }

  async archiveDictionaryItems(endpoint: string, ids: (number | string)[]): Promise<void> {
    await this.request<void>(`${endpoint}/archive`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    })
  }

  async post<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async fetchBlob(endpoint: string): Promise<Blob> {
    const authHeaders = authService.getAuthHeader()
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      headers: { ...authHeaders },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.blob()
  }

  async getText(endpoint: string, body: unknown): Promise<string> {
    const authHeaders = authService.getAuthHeader()
    const url = `${this.baseUrl}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    return response.text()
  }

  protected resolvePagedViewResult<T>(response: any, page: number, size: number): PagedViewResult<T> {
    const viewData = response?.payloads?.VIEW_DATA ?? response?.payload?.viewData
    if (!viewData) throw new Error('Unexpected paged response format')
    return {
      entries: viewData.entries,
      count: viewData.count,
      page: viewData.page ?? viewData.pageNum ?? page,
      maxPage: viewData.maxPage,
      size: viewData.size ?? viewData.pageSize ?? size,
    }
  }

  protected resolveDocData<T>(response: any): T {
    const doc = response?.payloads?.DOC_DATA ?? response?.payload?.DOC_DATA ?? response?.payload?.docData
    if (!doc) throw new Error('Unexpected document response format')
    return doc as T
  }
}
