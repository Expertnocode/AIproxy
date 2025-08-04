import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, ProxyRequest, ProxyResponse, AIProviderError } from '@aiproxy/shared';
import { logger } from '../utils/logger';

export class ClaudeProvider {
  private client: Anthropic;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new Anthropic({
      apiKey,
      ...(baseURL && { baseURL })
    });
  }

  async chat(request: ProxyRequest): Promise<ProxyResponse> {
    try {
      logger.info('Making Claude request', {
        model: request.model,
        messageCount: request.messages.length,
        temperature: request.temperature,
        maxTokens: request.maxTokens
      });

      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = request.messages.filter(m => m.role !== 'system');

      const response = await (this.client as any).messages.create({
        model: request.model,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature,
        system: systemMessage,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      return {
        id: response.id,
        choices: [{
          message: {
            role: 'assistant',
            content: response.content[0]?.type === 'text' ? response.content[0].text : ''
          },
          finishReason: response.stop_reason || undefined
        }],
        usage: response.usage ? {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens
        } : undefined,
        model: response.model,
        created: Math.floor(Date.now() / 1000)
      };
    } catch (error: any) {
      logger.error('Claude API error:', {
        error: error.message,
        status: error.status,
        type: error.type
      });

      throw new AIProviderError('Claude', error.message || 'Unknown error occurred');
    }
  }

  async streamChat(request: ProxyRequest): Promise<AsyncIterable<any>> {
    try {
      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = request.messages.filter(m => m.role !== 'system');

      const stream = (this.client as any).messages.stream({
        model: request.model,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature,
        system: systemMessage,
        messages: userMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      });

      return stream;
    } catch (error: any) {
      logger.error('Claude streaming error:', {
        error: error.message,
        status: error.status,
        type: error.type
      });

      throw new AIProviderError('Claude', error.message || 'Unknown streaming error occurred');
    }
  }

  getProvider(): AIProvider {
    return AIProvider.CLAUDE;
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    const modelPricing: Record<string, { input: number; output: number }> = {
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
      'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 }
    };

    const pricing = modelPricing[model] || { input: 0.003, output: 0.015 };
    
    return (usage.promptTokens * pricing.input / 1000) + 
           (usage.completionTokens * pricing.output / 1000);
  }
}