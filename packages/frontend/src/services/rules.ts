import { SecurityRule, CreateSecurityRuleRequest, UpdateSecurityRuleRequest } from '@aiproxy/shared'
import { apiService } from './api'

class RulesService {
  async getRules(): Promise<SecurityRule[]> {
    return apiService.get<SecurityRule[]>('/rules')
  }

  async getRule(id: string): Promise<SecurityRule> {
    return apiService.get<SecurityRule>(`/rules/${id}`)
  }

  async createRule(rule: CreateSecurityRuleRequest): Promise<SecurityRule> {
    return apiService.post<SecurityRule>('/rules', rule)
  }

  async updateRule(id: string, rule: UpdateSecurityRuleRequest): Promise<SecurityRule> {
    return apiService.put<SecurityRule>(`/rules/${id}`, rule)
  }

  async deleteRule(id: string): Promise<void> {
    return apiService.delete<void>(`/rules/${id}`)
  }
}

export const rulesService = new RulesService()