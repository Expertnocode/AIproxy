import React, { useState, useEffect } from 'react'
import { SecurityRule, CreateSecurityRuleRequest } from '@aiproxy/shared'
import { Card, CardHeader, CardContent, Button, Badge, Tooltip } from './ui'
import { RegexComposer } from './RegexComposer'
import { RegexPatternLibrary } from './RegexPatternLibrary'
import { PatternTester } from './PatternTester'
import { cn } from '../lib/utils'

interface RuleFormProps {
  rule?: SecurityRule | null
  onSubmit: (rule: CreateSecurityRuleRequest) => void
  onCancel: () => void
  isLoading: boolean
}

export function RuleForm({ rule, onSubmit, onCancel, isLoading }: RuleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pattern: '',
    action: 'WARN' as any,
    enabled: true,
    priority: 0
  })

  const [activeTab, setActiveTab] = useState<'form' | 'patterns' | 'ai-composer' | 'tester'>('form')
  const [patternValidation, setPatternValidation] = useState<{ isValid: boolean; error?: string } | null>(null)

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description || '',
        pattern: rule.pattern,
        action: rule.action,
        enabled: rule.enabled,
        priority: rule.priority
      })
    }
  }, [rule])

  const validatePattern = (pattern: string) => {
    try {
      new RegExp(pattern)
      setPatternValidation({ isValid: true })
    } catch (err) {
      setPatternValidation({ 
        isValid: false, 
        error: err instanceof Error ? err.message : 'Invalid pattern' 
      })
    }
  }

  useEffect(() => {
    if (formData.pattern) {
      validatePattern(formData.pattern)
    }
  }, [formData.pattern])

  const actionTooltips = {
    ALLOW: "Allow - Let information or content pass through as-is, without any intervention",
    WARN: "Warn - Display a warning to the user when potentially problematic content is detected",
    ANONYMIZE: "Anonymize - Remove or modify personally identifiable information to protect privacy",
    REDACT: "Redact - Hide or replace sensitive information with symbols like **",
    BLOCK: "Block - Completely prevent content from passing through or being displayed"
  }

  const actionColors = {
    ALLOW: 'success' as const,
    WARN: 'warning' as const,
    ANONYMIZE: 'info' as const,
    REDACT: 'secondary' as const,
    BLOCK: 'error' as const
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handlePatternSelect = (pattern: string) => {
    setFormData(prev => ({ ...prev, pattern }))
    setActiveTab('form')
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'form', name: 'Form', icon: '📝' },
            { id: 'patterns', name: 'Library', icon: '📚' },
            { id: 'ai-composer', name: 'AI Assistant', icon: '🤖' },
            { id: 'tester', name: 'Tester', icon: '🧪' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                'py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'patterns' && (
        <RegexPatternLibrary onPatternSelect={handlePatternSelect} />
      )}

      {activeTab === 'ai-composer' && (
        <RegexComposer onPatternGenerated={handlePatternSelect} />
      )}

      {activeTab === 'tester' && formData.pattern && (
        <PatternTester pattern={formData.pattern} />
      )}

      {activeTab === 'tester' && !formData.pattern && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Please first enter a pattern in the form to use the tester.
            </p>
            <Button 
              onClick={() => setActiveTab('form')} 
              className="mt-4"
              variant="outline"
            >
              Go to Form
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'form' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">
                {rule ? 'Edit Security Rule' : 'Create New Security Rule'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Configure the detection parameters and action to apply
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Rule Name */}
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Ex: Personal email detection"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Optional description of the rule and its purpose"
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Pattern */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Regular Expression *
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('patterns')}
                      >
                        📚 Library
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setActiveTab('ai-composer')}
                      >
                        🤖 AI Assistant
                      </Button>
                      {formData.pattern && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setActiveTab('tester')}
                        >
                          🧪 Tester
                        </Button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    name="pattern"
                    id="pattern"
                    required
                    className={cn(
                      "w-full p-3 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:border-transparent",
                      patternValidation?.isValid === false
                        ? "border-red-300 dark:border-red-600 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                    )}
                    placeholder="Ex: \\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b"
                    value={formData.pattern}
                    onChange={handleInputChange}
                  />
                  {patternValidation && (
                    <div className={cn(
                      "mt-2 p-2 rounded-md text-sm",
                      patternValidation.isValid
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    )}>
                      {patternValidation.isValid 
                        ? "✓ Valid pattern" 
                        : `✗ Error: ${patternValidation.error}`
                      }
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="sm:col-span-2">
                  <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action to Perform *
                  </label>
                  <div className="space-y-2">
                    {Object.entries(actionTooltips).map(([actionValue, tooltip]) => (
                      <Tooltip key={actionValue} content={tooltip} position="right">
                        <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="action"
                            value={actionValue}
                            checked={formData.action === actionValue}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                          />
                          <div className="ml-3 flex items-center gap-2">
                            <Badge 
                              variant={actionColors[actionValue as keyof typeof actionColors]} 
                              size="sm"
                            >
                              {actionValue}
                            </Badge>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {actionValue === 'ALLOW' && 'Allow'}
                              {actionValue === 'WARN' && 'Warn'}
                              {actionValue === 'ANONYMIZE' && 'Anonymize'}
                              {actionValue === 'REDACT' && 'Redact'}
                              {actionValue === 'BLOCK' && 'Block'}
                            </span>
                          </div>
                        </label>
                      </Tooltip>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    name="priority"
                    id="priority"
                    min="0"
                    max="100"
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    value={formData.priority}
                    onChange={handleInputChange}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Higher priority = processed first (0-100)
                  </p>
                </div>

                {/* Enable Rule */}
                <div>
                  <label className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                    <input
                      type="checkbox"
                      name="enabled"
                      id="enabled"
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      checked={formData.enabled}
                      onChange={handleInputChange}
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Enable this rule
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        The rule will be applied to requests if enabled
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || patternValidation?.isValid === false}
              loading={isLoading}
            >
              {rule ? 'Update Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}