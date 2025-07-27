import { AuditLog, PaginatedResponse, PaginationParams } from '@aiproxy/shared'
import { apiService } from './api'

interface UsageRecord {
  id: string
  userId: string
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number | null
  processingTimeMs: number
  piiDetected: boolean
  rulesTriggered: string[]
  timestamp: string
  requestId: string
}

class AuditService {
  async getLogs(params?: Partial<PaginationParams>): Promise<PaginatedResponse<AuditLog>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder)

    const url = `/audit/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiService.get<PaginatedResponse<AuditLog>>(url)
  }

  async getUsage(params?: Partial<PaginationParams>): Promise<PaginatedResponse<UsageRecord>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set('page', params.page.toString())
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy)
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder)

    const url = `/audit/usage${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return apiService.get<PaginatedResponse<UsageRecord>>(url)
  }
}

export const auditService = new AuditService()