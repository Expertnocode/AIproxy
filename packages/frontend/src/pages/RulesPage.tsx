import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Shield, AlertCircle, Activity } from 'lucide-react'
import { SecurityRule, CreateSecurityRuleRequest } from '@aiproxy/shared'
import { rulesService } from '../services/rules'
import { RuleForm } from '../components/RuleForm'
import { Card, CardHeader, CardContent, Button, Badge } from '../components/ui'

export function RulesPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null)
  const queryClient = useQueryClient()

  const { data: rules, isLoading, error } = useQuery({
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

  const handleEdit = (rule: SecurityRule) => {
    setEditingRule(rule)
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteMutation.mutate(id)
    }
  }

  const getActionBadge = (action: string) => {
    const variants = {
      BLOCK: 'error' as const,
      REDACT: 'warning' as const,
      ANONYMIZE: 'info' as const,
      WARN: 'warning' as const,
      ALLOW: 'success' as const
    }
    return variants[action as keyof typeof variants] || 'info'
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to load rules
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to fetch security rules. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64" />
          </div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Security Rules
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure rules to detect and handle sensitive content in AI interactions
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingRule(null)
            }}
            icon={<Plus className="h-4 w-4" />}
            className="animate-slide-up"
          >
            Add Rule
          </Button>
        </div>
      </div>

      {/* Form */}
      {(showForm || editingRule) && (
        <Card className="animate-slide-down">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {editingRule ? 'Edit Rule' : 'Create New Rule'}
            </h3>
          </CardHeader>
          <CardContent>
            <RuleForm
              rule={editingRule}
              onSubmit={editingRule ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false)
                setEditingRule(null)
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {rules?.length ? (
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <Card 
              key={rule.id} 
              className="transition-all duration-200 hover:shadow-lg animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {rule.name}
                      </h3>
                      <Badge variant={getActionBadge(rule.action)}>
                        {rule.action}
                      </Badge>
                      {!rule.enabled && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                      <Badge variant="secondary" size="sm">
                        Priority: {rule.priority}
                      </Badge>
                    </div>
                    
                    {rule.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {rule.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {rule.pattern}
                      </span>
                      <span className="flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        {rule.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(rule)}
                      icon={<Edit className="h-4 w-4" />}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={deleteMutation.isPending}
                      icon={<Trash2 className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="animate-slide-up">
          <CardContent className="text-center py-12">
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No security rules configured
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Create your first security rule to start protecting sensitive data in AI interactions.
            </p>
            <Button
              onClick={() => setShowForm(true)}
              icon={<Plus className="h-4 w-4" />}
            >
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}