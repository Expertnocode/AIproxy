import React, { useState, useEffect } from 'react'
import { SecurityRule, CreateSecurityRuleRequest } from '@aiproxy/shared'

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

  const presetPatterns = [
    {
      name: 'Email Addresses',
      pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
      description: 'Detects email addresses'
    },
    {
      name: 'Phone Numbers',
      pattern: '\\b(?:\\+?1[-.\s]?)?\\(?[0-9]{3}\\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\\b',
      description: 'Detects US phone numbers'
    },
    {
      name: 'Credit Card Numbers',
      pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\\b',
      description: 'Detects credit card numbers'
    },
    {
      name: 'Social Security Numbers',
      pattern: '\\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\\b',
      description: 'Detects US Social Security Numbers'
    },
    {
      name: 'IP Addresses',
      pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
      description: 'Detects IPv4 addresses'
    }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Rule Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            className="input"
            placeholder="Enter rule name"
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="label">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            className="input"
            placeholder="Enter rule description (optional)"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="pattern" className="label">
            Regular Expression Pattern
          </label>
          <input
            type="text"
            name="pattern"
            id="pattern"
            required
            className="input font-mono"
            placeholder="Enter regex pattern"
            value={formData.pattern}
            onChange={handleInputChange}
          />
          <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer text-primary-600 hover:text-primary-700">
                Common Patterns
              </summary>
              <div className="mt-2 space-y-2">
                {presetPatterns.map((preset, index) => (
                  <div key={index} className="p-2 border rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{preset.name}</p>
                        <p className="text-xs text-gray-500">{preset.description}</p>
                        <code className="block mt-1 text-xs bg-gray-100 p-1 rounded">
                          {preset.pattern}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, pattern: preset.pattern }))}
                        className="ml-2 text-xs btn-outline"
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div>
          <label htmlFor="action" className="label">
            Action
          </label>
          <select
            name="action"
            id="action"
            className="input"
            value={formData.action}
            onChange={handleInputChange}
          >
            <option value="ALLOW">Allow</option>
            <option value="WARN">Warn</option>
            <option value="ANONYMIZE">Anonymize</option>
            <option value="REDACT">Redact</option>
            <option value="BLOCK">Block</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Action to take when this rule matches
          </p>
        </div>

        <div>
          <label htmlFor="priority" className="label">
            Priority
          </label>
          <input
            type="number"
            name="priority"
            id="priority"
            min="0"
            max="100"
            className="input"
            value={formData.priority}
            onChange={handleInputChange}
          />
          <p className="mt-1 text-xs text-gray-500">
            Higher numbers = higher priority (0-100)
          </p>
        </div>

        <div className="sm:col-span-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="enabled"
              id="enabled"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={formData.enabled}
              onChange={handleInputChange}
            />
            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
              Enable this rule
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {rule ? 'Updating...' : 'Creating...'}
            </div>
          ) : (
            rule ? 'Update Rule' : 'Create Rule'
          )}
        </button>
      </div>
    </form>
  )
}