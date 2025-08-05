import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardHeader, CardContent } from './ui/Card'
import { Badge } from './ui/Badge'
import { cn } from '../lib/utils'

interface RegexPattern {
  name: string
  pattern: string
  description: string
  exampleMatch: string
  useCase: string
  category: string
  tags: string[]
}

interface RegexPatternLibraryProps {
  onPatternSelect: (pattern: string) => void
  className?: string
}

const regexPatterns: RegexPattern[] = [
  // Personal Information
  {
    name: 'Email Addresses',
    pattern: '\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b',
    description: 'Detects standard email addresses',
    exampleMatch: 'user@example.com',
    useCase: 'Personal data protection',
    category: 'personal',
    tags: ['email', 'pii', 'personal']
  },
  {
    name: 'French Phone Numbers',
    pattern: '(?:\\+33\\s?|0)[1-9](?:[\\s.-]?\\d{2}){4}',
    description: 'French phone numbers (national and international formats)',
    exampleMatch: '+33 1 23 45 67 89 or 01.23.45.67.89',
    useCase: 'French personal data protection',
    category: 'personal',
    tags: ['phone', 'france', 'pii']
  },
  {
    name: 'French Social Security Numbers',
    pattern: '[12][0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[0-9]{3}[0-9]{3}[0-9]{2}',
    description: 'French social security numbers (NIR)',
    exampleMatch: '1234567890123',
    useCase: 'French sensitive data protection',
    category: 'personal',
    tags: ['nir', 'social security', 'france', 'sensitive']
  },
  {
    name: 'Credit Cards',
    pattern: '\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\\b',
    description: 'Credit card numbers (Visa, MasterCard, Amex, Discover)',
    exampleMatch: '4532 1234 5678 9012',
    useCase: 'Sensitive financial information',
    category: 'financial',
    tags: ['credit card', 'visa', 'mastercard', 'financial']
  },
  
  // French/European Specific
  {
    name: 'European IBAN',
    pattern: '[A-Z]{2}\\d{2}[A-Z0-9]{4}\\d{7}([A-Z0-9]?){0,16}',
    description: 'IBAN codes (International Bank Account Number)',
    exampleMatch: 'FR1420041010050500013M02606',
    useCase: 'European bank accounts',
    category: 'financial',
    tags: ['iban', 'bank', 'europe', 'financial']
  },
  {
    name: 'French Postal Codes',
    pattern: '\\b(?:0[1-9]|[1-8]\\d|9[0-6])\\d{3}\\b',
    description: 'French postal codes (5 digits)',
    exampleMatch: '75001, 69000, 13008',
    useCase: 'French address data protection',
    category: 'personal',
    tags: ['postal code', 'france', 'address']
  },
  {
    name: 'SIRET Numbers',
    pattern: '\\b\\d{3}\\s?\\d{3}\\s?\\d{3}\\s?\\d{5}\\b',
    description: 'French business SIRET identification numbers',
    exampleMatch: '123 456 789 12345',
    useCase: 'French business identification',
    category: 'business',
    tags: ['siret', 'business', 'france']
  },
  {
    name: 'European VAT Numbers',
    pattern: '[A-Z]{2}[A-Z0-9]{2,12}',
    description: 'European VAT identification numbers',
    exampleMatch: 'FR12345678901',
    useCase: 'European tax identifier protection',
    category: 'business',
    tags: ['vat', 'europe', 'tax']
  },
  
  // Technical/API
  {
    name: 'OpenAI API Keys',
    pattern: 'sk-[A-Za-z0-9]{48}',
    description: 'OpenAI secret API keys',
    exampleMatch: 'sk-1234567890abcdef...',
    useCase: 'API key security',
    category: 'technical',
    tags: ['api', 'openai', 'secret', 'key']
  },
  {
    name: 'JWT Tokens',
    pattern: 'eyJ[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.?[A-Za-z0-9-_.+/=]*',
    description: 'JSON Web Tokens (JWT)',
    exampleMatch: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    useCase: 'Authentication tokens',
    category: 'technical',
    tags: ['jwt', 'token', 'auth', 'security']
  },
  {
    name: 'Complete URLs',
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: 'Complete HTTP and HTTPS URLs',
    exampleMatch: 'https://www.example.com/path?param=value',
    useCase: 'Sensitive web links',
    category: 'technical',
    tags: ['url', 'web', 'link']
  },
  {
    name: 'IPv4 Addresses',
    pattern: '\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b',
    description: 'IP version 4 addresses',
    exampleMatch: '192.168.1.1',
    useCase: 'Network infrastructure',
    category: 'technical',
    tags: ['ip', 'network', 'infrastructure']
  },
  {
    name: 'File Paths',
    pattern: '(?:[a-zA-Z]:|\\\\|/)(?:[\\\\\\w\\s.-]+[\\\\])*[\\w\\s.-]+\\.[a-zA-Z0-9]+',
    description: 'Windows and Unix file paths',
    exampleMatch: 'C:\\Users\\Documents\\file.txt or /home/user/file.txt',
    useCase: 'Sensitive system paths',
    category: 'technical',
    tags: ['file', 'path', 'system']
  },
  
  // Business Patterns
  {
    name: 'Tracking Codes',
    pattern: '\\b[A-Z0-9]{10,20}\\b',
    description: 'Package tracking codes (generic format)',
    exampleMatch: 'ABC123456789DEF',
    useCase: 'Logistics and deliveries',
    category: 'business',
    tags: ['tracking', 'package', 'logistics']
  },
  {
    name: 'Internal References',
    pattern: '(?:REF|ORDER|CMD|INV)[_-]?\\d{6,12}',
    description: 'Internal order/invoice references',
    exampleMatch: 'REF_123456789, ORDER-987654321',
    useCase: 'Business documents',
    category: 'business',
    tags: ['reference', 'order', 'invoice']
  },
  
  // Sensitive Content
  {
    name: 'Potential Passwords',
    pattern: '(?i)(?:password|passwd|pwd|mot[_\\s]?de[_\\s]?passe)\\s*[=:]\\s*[\"\\\'\\s]*([^\\s\"\\\'\\n\\r]{6,})',
    description: 'Detects passwords in text (English and French patterns)',
    exampleMatch: 'password: mySecretPassword123',
    useCase: 'Credential security protection',
    category: 'security',
    tags: ['password', 'security', 'credential']
  },
  {
    name: 'Connection Strings',
    pattern: '(?i)(?:server|host|database|uid|pwd|password)\\s*=\\s*[^;\\s]+',
    description: 'Database connection strings',
    exampleMatch: 'Server=localhost;Database=mydb;Uid=user;Pwd=pass;',
    useCase: 'Database configuration security',
    category: 'security',
    tags: ['database', 'connection', 'configuration']
  }
]

const categories = {
  personal: { name: 'Personal Data', color: 'error' as const, icon: '👤' },
  financial: { name: 'Financial Information', color: 'warning' as const, icon: '💳' },
  business: { name: 'Business Data', color: 'info' as const, icon: '🏢' },
  technical: { name: 'Technical/API', color: 'secondary' as const, icon: '⚙️' },
  security: { name: 'Security', color: 'error' as const, icon: '🔒' }
}

export function RegexPatternLibrary({ onPatternSelect, className }: RegexPatternLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedPattern, setCopiedPattern] = useState<string | null>(null)

  const filteredPatterns = regexPatterns.filter(pattern => {
    const matchesCategory = !selectedCategory || pattern.category === selectedCategory
    const matchesSearch = !searchTerm || 
      pattern.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pattern.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const copyToClipboard = async (pattern: string) => {
    try {
      await navigator.clipboard.writeText(pattern)
      setCopiedPattern(pattern)
      setTimeout(() => setCopiedPattern(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Regex Pattern Library</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Collection of pre-defined patterns for different types of data
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search patterns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
        />

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {Object.entries(categories).map(([key, category]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>

        {/* Patterns Grid */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredPatterns.map((pattern, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {pattern.name}
                    </h4>
                    <Badge 
                      variant={categories[pattern.category as keyof typeof categories]?.color} 
                      size="sm"
                    >
                      {categories[pattern.category as keyof typeof categories]?.icon} 
                      {categories[pattern.category as keyof typeof categories]?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {pattern.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <strong>Example:</strong> {pattern.exampleMatch}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    <strong>Use case:</strong> {pattern.useCase}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                <code className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                  {pattern.pattern}
                </code>
              </div>

              <div className="flex flex-wrap gap-1 mb-2">
                {pattern.tags.map((tag, tagIndex) => (
                  <span 
                    key={tagIndex}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onPatternSelect(pattern.pattern)}
                  className="flex-1"
                >
                  Use
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(pattern.pattern)}
                >
                  {copiedPattern === pattern.pattern ? '✓ Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredPatterns.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No patterns found for this search.</p>
            <p className="text-sm mt-1">Try adjusting your search criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}