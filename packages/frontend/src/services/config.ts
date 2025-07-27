import { AIModelInfo } from '@aiproxy/shared'
import { apiService } from './api'

interface ProxyConfig {
  id: string
  userId: string
  defaultProvider: 'OPENAI' | 'CLAUDE' | 'GEMINI'
  enablePIIDetection: boolean
  enableRuleEngine: boolean
  enableAuditLogging: boolean
  rateLimitWindowMs: number
  rateLimitMaxRequests: number
  providerConfigs: Record<string, any>
  createdAt: string
  updatedAt: string
}

class ConfigService {
  async getConfig(): Promise<ProxyConfig> {
    return apiService.get<ProxyConfig>('/config')
  }

  async updateConfig(config: Partial<ProxyConfig>): Promise<ProxyConfig> {
    return apiService.put<ProxyConfig>('/config', config)
  }

  async getModels(): Promise<AIModelInfo[]> {
    return apiService.get<AIModelInfo[]>('/config/models')
  }
}

export const configService = new ConfigService()