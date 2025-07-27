import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { APIResponse } from '@aiproxy/shared'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api/v1',
      timeout: 30000,
    })

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<APIResponse<T>> = await this.client.get(url)
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed')
    }
    return response.data.data!
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<APIResponse<T>> = await this.client.post(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed')
    }
    return response.data.data!
  }

  async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<APIResponse<T>> = await this.client.put(url, data)
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed')
    }
    return response.data.data!
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<APIResponse<T>> = await this.client.delete(url)
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Request failed')
    }
    return response.data.data!
  }
}

export const apiService = new ApiService()