import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Settings, Zap, Shield, AlertCircle, Code, Copy, CheckCircle } from 'lucide-react'
import { configService } from '../services/config'

export function ConfigPage() {
  const [hasChanges, setHasChanges] = useState(false)
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: configService.getConfig
  })

  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: configService.getModels
  })

  const updateMutation = useMutation({
    mutationFn: configService.updateConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      setHasChanges(false)
    }
  })

  const [formData, setFormData] = useState({
    defaultProvider: 'OPENAI' as 'OPENAI' | 'CLAUDE' | 'GEMINI',
    enablePIIDetection: true,
    enableRuleEngine: true,
    enableAuditLogging: true,
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 100
  })

  React.useEffect(() => {
    if (config) {
      setFormData({
        defaultProvider: config.defaultProvider,
        enablePIIDetection: config.enablePIIDetection,
        enableRuleEngine: config.enableRuleEngine,
        enableAuditLogging: config.enableAuditLogging,
        rateLimitWindowMs: config.rateLimitWindowMs,
        rateLimitMaxRequests: config.rateLimitMaxRequests
      })
    }
  }, [config])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
              type === 'number' ? parseInt(value) || 0 : value
    }))
    setHasChanges(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  const handleCopyEndpoint = async (endpoint: string) => {
    try {
      await navigator.clipboard.writeText(endpoint)
      setCopiedEndpoint(endpoint)
      setTimeout(() => setCopiedEndpoint(null), 2000)
    } catch (err) {
      console.error('Failed to copy endpoint:', err)
    }
  }

  const apiEndpoints = [
    {
      title: 'Chat Completion',
      endpoint: 'http://localhost:3000/api/v1/proxy/chat',
      method: 'POST',
      description: 'Send chat messages through the secure proxy with PII detection and security rules',
      example: `{
  "provider": "OPENAI",
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello, world!"}
  ]
}`
    },
    {
      title: 'Available Models',
      endpoint: 'http://localhost:3000/api/v1/proxy/models',
      method: 'GET',
      description: 'Get list of available AI models from all configured providers',
      example: null
    }
  ]

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card">
              <div className="card-content">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configuration</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure your AIProxy security gateway settings
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">General Settings</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div>
              <label htmlFor="defaultProvider" className="label">
                Default AI Provider
              </label>
              <select
                name="defaultProvider"
                id="defaultProvider"
                className="input"
                value={formData.defaultProvider}
                onChange={handleInputChange}
              >
                <option value="OPENAI">OpenAI</option>
                <option value="CLAUDE">Claude (Anthropic)</option>
                <option value="GEMINI">Gemini (Google)</option>
              </select>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Default provider for AI requests when not specified
              </p>
            </div>
          </div>
        </div>

        {/* Available Models */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Available Models</h3>
          </div>
          <div className="card-content">
            {models?.length ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Provider
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Context Length
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Cost (per 1K tokens)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {models.map((model) => (
                      <tr key={model.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {model.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {model.provider}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {model.contextLength.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          ${model.inputCostPer1kTokens.toFixed(4)} / ${model.outputCostPer1kTokens.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No models available</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Configure your AI provider API keys to see available models.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enablePIIDetection" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    PII Detection
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically detect and handle personally identifiable information
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="enablePIIDetection"
                  id="enablePIIDetection"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.enablePIIDetection}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enableRuleEngine" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Security Rule Engine
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Apply custom security rules to requests and responses
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="enableRuleEngine"
                  id="enableRuleEngine"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.enableRuleEngine}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enableAuditLogging" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Audit Logging
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Log all requests and security events for compliance
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="enableAuditLogging"
                  id="enableAuditLogging"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.enableAuditLogging}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Rate Limiting</h3>
            </div>
          </div>
          <div className="card-content space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="rateLimitMaxRequests" className="label">
                  Max Requests
                </label>
                <input
                  type="number"
                  name="rateLimitMaxRequests"
                  id="rateLimitMaxRequests"
                  min="1"
                  className="input"
                  value={formData.rateLimitMaxRequests}
                  onChange={handleInputChange}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Maximum requests per time window
                </p>
              </div>

              <div>
                <label htmlFor="rateLimitWindowMs" className="label">
                  Time Window (minutes)
                </label>
                <input
                  type="number"
                  name="rateLimitWindowMs"
                  id="rateLimitWindowMs"
                  min="1"
                  className="input"
                  value={Math.floor(formData.rateLimitWindowMs / 60000)}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 1
                    setFormData(prev => ({
                      ...prev,
                      rateLimitWindowMs: minutes * 60000
                    }))
                    setHasChanges(true)
                  }}
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Time window for rate limiting
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Code className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">API Endpoints</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Use these endpoints to integrate with your applications and bots
            </p>
          </div>
          <div className="card-content space-y-6">
            {apiEndpoints.map((api, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">{api.title}</h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {api.method}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {api.description}
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint</span>
                    <button
                      onClick={() => handleCopyEndpoint(api.endpoint)}
                      className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {copiedEndpoint === api.endpoint ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <code className="text-sm text-gray-900 dark:text-gray-100 font-mono break-all">
                    {api.endpoint}
                  </code>
                </div>
                
                {api.example && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Example Request Body</span>
                      <button
                        onClick={() => handleCopyEndpoint(api.example!)}
                        className="inline-flex items-center px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {copiedEndpoint === api.example ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 dark:bg-gray-800 p-3 rounded-md text-sm overflow-x-auto">
                      <code>{api.example}</code>
                    </pre>
                  </div>
                )}
                
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Authentication:</strong> Include your JWT token in the Authorization header: 
                    <code className="ml-1 text-xs bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">
                      Bearer YOUR_TOKEN_HERE
                    </code>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  )
}