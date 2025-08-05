import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, AlertTriangle, CheckCircle, MessageSquare, Zap } from 'lucide-react'
import { Card, CardHeader, CardContent, Button, Badge } from '../components/ui'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  hasAnonymization?: boolean
  provider?: string
  model?: string
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

interface ChatSettings {
  provider: 'OPENAI' | 'CLAUDE' | 'GEMINI'
  model: string
}

const PROVIDERS = {
  OPENAI: {
    name: 'OpenAI',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    color: 'green',
    icon: '🤖'
  },
  CLAUDE: {
    name: 'Claude',
    models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    color: 'purple',
    icon: '🧠'
  },
  GEMINI: {
    name: 'Gemini', 
    models: ['gemini-pro', 'gemini-pro-vision'],
    color: 'blue',
    icon: '💎'
  }
} as const

const EXAMPLE_MESSAGES = [
  "Hello! How can you help me today?",
  "My email is john.doe@company.com and my phone is 555-123-4567",
  "Can you analyze this data: Credit card 4532-1234-5678-9012",
  "What's the weather like? My address is 123 Main St, New York, NY 10001"
]

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<ChatSettings>({
    provider: 'OPENAI',
    model: 'gpt-3.5-turbo'
  })
  const [showSettings, setShowSettings] = useState(false)
  const [totalTokens, setTotalTokens] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3000/api/v1/proxy/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          messages: [
            ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({
              role: m.role,
              content: m.content
            })),
            { role: 'user', content: input }
          ]
        })
      })

      const data = await response.json()

      if (data.success && data.data.choices?.[0]?.message) {
        const usage = data.data.usage
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.choices[0].message.content,
          timestamp: new Date(),
          hasAnonymization: data.data.hasAnonymization || false,
          provider: settings.provider,
          model: settings.model,
          ...(usage && {
            tokenUsage: {
              promptTokens: usage.promptTokens || usage.prompt_tokens || 0,
              completionTokens: usage.completionTokens || usage.completion_tokens || 0,
              totalTokens: usage.totalTokens || usage.total_tokens || 0
            }
          })
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Update total token count
        if (usage) {
          setTotalTokens(prev => prev + (usage.totalTokens || usage.total_tokens || 0))
        }
      } else {
        throw new Error(data.error?.message || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Failed to send message'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Focus back to input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setTotalTokens(0)
    inputRef.current?.focus()
  }

  const useExampleMessage = (message: string) => {
    setInput(message)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-primary-600" />
            AI Chat Interface
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Test the AI proxy with security rules and PII detection
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <Badge variant="secondary" size="sm" className="flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            {totalTokens.toLocaleString()} tokens used
          </Badge>
          <Badge variant="info" size="sm">
            {PROVIDERS[settings.provider].icon} {PROVIDERS[settings.provider].name} - {settings.model}
          </Badge>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="animate-slide-down">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Chat Settings
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Provider
                </label>
                <select
                  value={settings.provider}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    provider: e.target.value as ChatSettings['provider'],
                    model: PROVIDERS[e.target.value as ChatSettings['provider']].models[0]
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {Object.entries(PROVIDERS).map(([key, provider]) => (
                    <option key={key} value={key}>
                      {provider.icon} {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Model
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  {PROVIDERS[settings.provider].models.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Example Messages */}
      {messages.length === 0 && (
        <Card className="animate-slide-up">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Try these examples to test security features:
            </h3>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAMPLE_MESSAGES.map((message, index) => (
                <button
                  key={index}
                  onClick={() => useExampleMessage(message)}
                  className="text-left p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                >
                  "{message}"
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Chat */}
        <Card className="lg:col-span-3 h-96 md:h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Conversation
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  icon={<Settings className="h-4 w-4" />}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearChat}
                  disabled={messages.length === 0}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                  <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">Start a conversation</p>
                  <p className="text-sm">Your messages will be processed through security rules and PII detection</p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.hasAnonymization && (
                        <div className="flex items-center">
                          <AlertTriangle className="h-3 w-3 text-yellow-400" />
                          <span className="text-xs ml-1">PII Detected</span>
                        </div>
                      )}
                      {message.role === 'assistant' && !message.content.startsWith('❌') && (
                        <CheckCircle className="h-3 w-3 text-green-400" />
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    {message.tokenUsage && (
                      <div className="text-xs opacity-75 mt-2 flex items-center space-x-2">
                        <span>🔥 {message.tokenUsage.totalTokens} tokens</span>
                        {message.provider && (
                          <span>• {PROVIDERS[message.provider as keyof typeof PROVIDERS].icon} {message.model}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0">
              <div className="flex space-x-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (try including an email or phone number to test security rules)"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={2}
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  icon={<Send className="h-4 w-4" />}
                  className="self-end"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Security Info
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">PII Detection</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Emails, phones, SSNs, and credit cards are automatically detected
              </p>
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-1">Security Rules</h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Custom rules process all messages before reaching AI providers
              </p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">Token Tracking</h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Monitor usage and costs across all AI providers
              </p>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Messages:</span>
                  <span className="font-medium">{messages.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Tokens:</span>
                  <span className="font-medium">{totalTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="font-medium">{PROVIDERS[settings.provider].name}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}