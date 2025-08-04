import OpenAI from 'openai';
import { AIProvider, ProxyRequest, ProxyResponse, AIProviderError } from '@aiproxy/shared';
import { logger } from '../utils/logger';

export class OpenAIProvider {
  private client: OpenAI;

  constructor(apiKey: string, baseURL?: string) {
    this.client = new OpenAI({
      apiKey,
      ...(baseURL && { baseURL })
    });
  }

  async chat(request: ProxyRequest): Promise<ProxyResponse> {
    try {
      logger.info('Making OpenAI request', {
        model: request.model,
        messageCount: request.messages.length,
        temperature: request.temperature,
        maxTokens: request.maxTokens
      });

      const response = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.maxTokens !== undefined && { max_tokens: request.maxTokens }),
        stream: false
      });

      return {
        id: response.id,
        choices: response.choices.map(choice => ({
          message: {
            role: choice.message.role,
            content: choice.message.content || ''
          },
          finishReason: choice.finish_reason || undefined
        })),
        usage: response.usage ? {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens
        } : undefined,
        model: response.model,
        created: response.created
      };
    } catch (error: any) {
      logger.error('OpenAI API error:', {
        error: error.message,
        status: error.status,
        code: error.code
      });

      throw new AIProviderError('OpenAI', error.message || 'Unknown error occurred');
    }
  }

  async streamChat(request: ProxyRequest): Promise<AsyncIterable<any>> {
    try {
      const stream = await this.client.chat.completions.create({
        model: request.model,
        messages: request.messages,
        ...(request.temperature !== undefined && { temperature: request.temperature }),
        ...(request.maxTokens !== undefined && { max_tokens: request.maxTokens }),
        stream: true
      });

      return stream;
    } catch (error: any) {
      logger.error('OpenAI streaming error:', {
        error: error.message,
        status: error.status,
        code: error.code
      });

      throw new AIProviderError('OpenAI', error.message || 'Unknown streaming error occurred');
    }
  }

  getProvider(): AIProvider {
    return AIProvider.OPENAI;
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    const modelPricing: Record<string, { input: number; output: number }> = {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.001, output: 0.002 }
    };

    const pricing = modelPricing[model] || { input: 0.001, output: 0.002 };
    
    return (usage.promptTokens * pricing.input / 1000) + 
           (usage.completionTokens * pricing.output / 1000);
  }
}