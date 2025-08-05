import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'
import { Card, CardHeader, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { cn } from '../lib/utils'

interface PatternTesterProps {
  pattern: string
  className?: string
}

interface TestResult {
  matches: Array<{
    text: string
    index: number
    groups: string[]
  }>
  isValid: boolean
  error?: string
}

export function PatternTester({ pattern, className }: PatternTesterProps) {
  const [testText, setTestText] = useState('')
  const [result, setResult] = useState<TestResult | null>(null)
  const [flags, setFlags] = useState('gi')

  const testPattern = () => {
    if (!pattern || !testText) {
      setResult(null)
      return
    }

    try {
      const regex = new RegExp(pattern, flags)
      const matches: Array<{ text: string; index: number; groups: string[] }> = []
      let match

      // Reset regex for global search
      regex.lastIndex = 0

      if (flags.includes('g')) {
        while ((match = regex.exec(testText)) !== null) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          })
          // Prevent infinite loop
          if (match.index === regex.lastIndex) {
            regex.lastIndex++
          }
        }
      } else {
        match = regex.exec(testText)
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1)
          })
        }
      }

      setResult({
        matches,
        isValid: true
      })
    } catch (err) {
      setResult({
        matches: [],
        isValid: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  useEffect(() => {
    testPattern()
  }, [pattern, testText, flags])

  const highlightMatches = (text: string, matches: Array<{ text: string; index: number }>) => {
    if (matches.length === 0) return text

    const parts = []
    let lastIndex = 0

    matches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`before-${i}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        )
      }

      // Add highlighted match
      parts.push(
        <span 
          key={`match-${i}`}
          className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 px-1 rounded"
        >
          {match.text}
        </span>
      )

      lastIndex = match.index + match.text.length
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key="after">
          {text.slice(lastIndex)}
        </span>
      )
    }

    return parts
  }

  const sampleTexts = [
    'Contact me at user@example.com or call 01.23.45.67.89',
    'My IBAN is FR1420041010050500013M02606 and my card 4532 1234 5678 9012',
    'API Key: sk-1234567890abcdef1234567890abcdef',
    'My IP address is 192.168.1.100 and server at https://api.example.com',
    'Order reference: ORDER-123456789, Postal code: 75001'
  ]

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Pattern Tester</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test your regular expression with sample text
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pattern Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Pattern
          </label>
          <code className="block p-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm break-all">
            /{pattern}/{flags}
          </code>
        </div>

        {/* Flags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Options (flags)
          </label>
          <div className="flex gap-2">
            {[
              { flag: 'g', name: 'Global', desc: 'Find all matches' },
              { flag: 'i', name: 'Case Insensitive', desc: 'Ignore case differences' },
              { flag: 'm', name: 'Multiline', desc: 'Multiline mode' },
              { flag: 's', name: 'Dotall', desc: '. matches newlines' }
            ].map(({ flag, name, desc }) => (
              <label key={flag} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={flags.includes(flag)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFlags(prev => prev + flag)
                    } else {
                      setFlags(prev => prev.replace(flag, ''))
                    }
                  }}
                  className="rounded"
                />
                <span title={desc}>{name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sample Texts */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sample Texts
          </label>
          <div className="grid grid-cols-1 gap-2">
            {sampleTexts.map((sample, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setTestText(sample)}
                className="text-left justify-start h-auto py-2 whitespace-normal"
              >
                {sample}
              </Button>
            ))}
          </div>
        </div>

        {/* Test Text Input */}
        <div>
          <label htmlFor="testText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Text to Test
          </label>
          <textarea
            id="testText"
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Enter or paste text to test..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
          />
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Results</h4>
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <>
                    <Badge variant="success">
                      ✓ Valid pattern
                    </Badge>
                    <Badge variant="info">
                      {result.matches.length} match{result.matches.length !== 1 ? 'es' : ''}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="error">
                    ✗ Invalid pattern
                  </Badge>
                )}
              </div>
            </div>

            {result.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                <strong>Error:</strong> {result.error}
              </div>
            )}

            {result.isValid && testText && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Text with highlighted matches
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm font-mono whitespace-pre-wrap">
                  {highlightMatches(testText, result.matches)}
                </div>
              </div>
            )}

            {result.matches.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Match Details
                </label>
                <div className="space-y-2">
                  {result.matches.map((match, index) => (
                    <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="info" size="sm">#{index + 1}</Badge>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Position: {match.index}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Match: </span>
                          <code className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 rounded">
                            {match.text}
                          </code>
                        </div>
                        {match.groups.length > 0 && (
                          <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Groups: </span>
                            {match.groups.map((group, groupIndex) => (
                              <code key={groupIndex} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-1 rounded mr-1">
                                ${groupIndex + 1}: {group || '(empty)'}
                              </code>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}