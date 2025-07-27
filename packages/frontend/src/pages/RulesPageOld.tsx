import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Shield, AlertCircle } from 'lucide-react'
import { SecurityRule, CreateSecurityRuleRequest } from '@aiproxy/shared'
import { rulesService } from '../services/rules'
import { RuleForm } from '../components/RuleForm'

export function RulesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null)
  const queryClient = useQueryClient()

  const { data: rules, isLoading } = useQuery({
    queryKey: ['rules'],
    queryFn: rulesService.getRules
  })

  const createMutation = useMutation({
    mutationFn: rulesService.createRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setShowForm(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, rule }: { id: string; rule: any }) => 
      rulesService.updateRule(id, rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
      setEditingRule(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: rulesService.deleteRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] })
    }
  })

  const handleCreate = (rule: CreateSecurityRuleRequest) => {
    createMutation.mutate(rule)
  }

  const handleUpdate = (rule: any) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, rule })
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(id)
    }
  }

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      BLOCK: 'badge-error',
      REDACT: 'badge-warning',
      ANONYMIZE: 'badge-info',
      WARN: 'badge-warning',
      ALLOW: 'badge-success'
    }
    return styles[action] || 'badge-info'
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card">
            <div className="card-content">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Security Rules</h1>
          <p className="mt-1 text-sm text-gray-600">
            Configure rules to detect and handle sensitive content
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {(showForm || editingRule) && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h3>
          </div>
          <div className="card-content">
            <RuleForm
              rule={editingRule}
              onSubmit={editingRule ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingRule(null)
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </div>
        </div>
      )}

      {rules?.length ? (
        <div className="space-y-4">
          {rules.map((rule) => (
            <div key={rule.id} className="card">
              <div className="card-content">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {rule.name}
                      </h3>
                      <span className={`badge ${getActionBadge(rule.action)}`}>
                        {rule.action}
                      </span>
                      {!rule.enabled && (
                        <span className="badge bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                      <span className="text-sm text-gray-500">
                        Priority: {rule.priority}
                      </span>
                    </div>
                    {rule.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {rule.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Pattern:</span>
                        <code className="ml-1 px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                          {rule.pattern}
                        </code>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-400">
                      Created: {new Date(rule.createdAt).toLocaleDateString()} •
                      Updated: {new Date(rule.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="btn-outline"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="btn-outline text-red-600 hover:bg-red-50"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No security rules</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first security rule.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </button>
          </div>
        </div>
      )}
    </div>
  )
}