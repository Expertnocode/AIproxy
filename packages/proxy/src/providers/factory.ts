import { AIProvider, ValidationError } from '@aiproxy/shared';
import { OpenAIProvider } from './openai';
import { ClaudeProvider } from './claude';
import { GeminiProvider } from './gemini';

export interface AIProviderInterface {
  chat(request: any): Promise<any>;
  streamChat(request: any): Promise<AsyncIterable<any>>;
  getProvider(): AIProvider;
  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number;
}

export class ProviderFactory {
  static createProvider(
    provider: AIProvider, 
    config: Record<string, any>
  ): AIProviderInterface {
    switch (provider) {
      case AIProvider.OPENAI:
        if (!config.apiKey) {
          throw new ValidationError('OpenAI API key is required');
        }
        return new OpenAIProvider(config.apiKey, config.baseUrl);

      case AIProvider.CLAUDE:
        if (!config.apiKey) {
          throw new ValidationError('Claude API key is required');
        }
        return new ClaudeProvider(config.apiKey, config.baseUrl);

      case AIProvider.GEMINI:
        if (!config.apiKey) {
          throw new ValidationError('Gemini API key is required');
        }
        return new GeminiProvider(config.apiKey);

      default:
        throw new ValidationError(`Unsupported AI provider: ${provider}`);
    }
  }

  static getSupportedProviders(): AIProvider[] {
    return [AIProvider.OPENAI, AIProvider.CLAUDE, AIProvider.GEMINI];
  }

  static getProviderModels(provider: AIProvider): string[] {
    switch (provider) {
      case AIProvider.OPENAI:
        return ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      
      case AIProvider.CLAUDE:
        return [
          'claude-3-opus-20240229',
          'claude-3-sonnet-20240229',
          'claude-3-haiku-20240307'
        ];
      
      case AIProvider.GEMINI:
        return ['gemini-pro', 'gemini-pro-vision'];
      
      default:
        return [];
    }
  }
}