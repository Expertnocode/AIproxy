import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardHeader, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { cn } from '../lib/utils'

interface RegexComposerProps {
  onPatternGenerated: (pattern: string) => void
  className?: string
}

interface GeneratedPattern {
  pattern: string
  explanation: string
  testCases: Array<{
    input: string
    shouldMatch: boolean
  }>
}

export function RegexComposer({ onPatternGenerated, className }: RegexComposerProps) {
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedPattern, setGeneratedPattern] = useState<GeneratedPattern | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState<boolean | null>(null)

  const generatePattern = async () => {
    if (!description.trim()) return

    setIsLoading(true)
    setError(null)
    setGeneratedPattern(null)

    try {
      // Mock API call - in real implementation, this would call the backend
      // const response = await fetch('/api/v1/ai/generate-regex', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ description })
      // })

      // Mock response for demonstration
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockPattern = generateMockPattern(description)
      setGeneratedPattern(mockPattern)
    } catch (err) {
      setError('Failed to generate pattern. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockPattern = (desc: string): GeneratedPattern => {
    const lowerDesc = desc.toLowerCase()
    
    if (lowerDesc.includes('email')) {
      return {
        pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
        explanation: 'Matches email addresses with standard format: username@domain.extension',
        testCases: [
          { input: 'user@example.com', shouldMatch: true },
          { input: 'invalid.email', shouldMatch: false },
          { input: 'test.user+tag@domain.co.uk', shouldMatch: true }
        ]
      }
    } else if (lowerDesc.includes('phone') || lowerDesc.includes('telephone')) {
      return {
        pattern: '(?:\\+33\\s?|0)[1-9](?:[\\s.-]?\\d{2}){4}',
        explanation: 'Matches French phone numbers in various formats (international and national)',
        testCases: [
          { input: '+33 1 23 45 67 89', shouldMatch: true },
          { input: '01.23.45.67.89', shouldMatch: true },
          { input: '1234567890', shouldMatch: false }
        ]
      }
    } else if (lowerDesc.includes('iban')) {
      return {
        pattern: '[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}',
        explanation: 'Matches IBAN (International Bank Account Number) format',
        testCases: [
          { input: 'FR1420041010050500013M02606', shouldMatch: true },
          { input: 'DE89370400440532013000', shouldMatch: true },
          { input: 'INVALID123', shouldMatch: false }
        ]
      }
    } else if (lowerDesc.includes('api key') || lowerDesc.includes('token')) {
      return {
        pattern: '(?:sk-|pk_live_|pk_test_)[A-Za-z0-9]{32,}',
        explanation: 'Matches common API key formats (Stripe, OpenAI, etc.)',
        testCases: [
          { input: 'sk-1234567890abcdef1234567890abcdef', shouldMatch: true },
          { input: 'pk_live_abcdef1234567890', shouldMatch: true },
          { input: 'regular-text', shouldMatch: false }
        ]
      }
    } else {
      return {
        pattern: '\\b' + desc.replace(/\s+/g, '\\s+') + '\\b',
        explanation: `Simple word boundary match for: "${description}"`,
        testCases: [
          { input: description, shouldMatch: true },
          { input: `Contains ${description} in text`, shouldMatch: true },
          { input: 'Different text', shouldMatch: false }
        ]
      }
    }
  }

  const testPattern = () => {
    if (!generatedPattern || !testInput) {
      setTestResult(null)
      return
    }

    try {
      const regex = new RegExp(generatedPattern.pattern, 'gi')
      const matches = regex.test(testInput)
      setTestResult(matches)
    } catch (err) {
      setTestResult(null)
    }
  }

  const usePattern = () => {
    if (generatedPattern) {
      onPatternGenerated(generatedPattern.pattern)
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-semibold">AI Regex Assistant</h3>
          <Badge variant="info" size="sm">Beta</Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Describe what you want to detect and the AI will generate a regex pattern for you
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Natural language description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: email addresses, phone numbers, API keys, IBAN numbers..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
          />
        </div>

        <Button 
          onClick={generatePattern}
          disabled={!description.trim() || isLoading}
          loading={isLoading}
          className="w-full"
        >
          {isLoading ? 'Generating...' : 'Generate Pattern'}
        </Button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        {generatedPattern && (
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Generated Pattern
              </label>
              <div className="relative">
                <code className="block p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm break-all">
                  {generatedPattern.pattern}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => navigator.clipboard.writeText(generatedPattern.pattern)}
                >
                  Copy
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Explanation
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                {generatedPattern.explanation}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Cases
              </label>
              <div className="space-y-2">
                {generatedPattern.testCases.map((testCase, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant={testCase.shouldMatch ? 'success' : 'error'} size="sm">
                      {testCase.shouldMatch ? '✓' : '✗'}
                    </Badge>
                    <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {testCase.input}
                    </code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test your text
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter text to test..."
                  className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  onKeyDown={(e) => e.key === 'Enter' && testPattern()}
                />
                <Button onClick={testPattern} variant="outline">
                  Test
                </Button>
              </div>
              {testResult !== null && (
                <div className={cn(
                  'mt-2 p-2 rounded-md text-sm',
                  testResult 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                )}>
                  {testResult ? '✓ Match found' : '✗ No match'}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={usePattern} className="flex-1">
                Use this Pattern
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setGeneratedPattern(null)}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}