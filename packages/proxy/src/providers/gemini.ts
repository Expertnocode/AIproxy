import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, ProxyRequest, ProxyResponse, AIProviderError } from '@aiproxy/shared';
import { logger } from '../utils/logger';

export class GeminiProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async chat(request: ProxyRequest): Promise<ProxyResponse> {
    try {
      logger.info('Making Gemini request', {
        model: request.model,
        messageCount: request.messages.length,
        temperature: request.temperature,
        maxTokens: request.maxTokens
      });

      const model = this.client.getGenerativeModel({ 
        model: request.model,
        generationConfig: {
          ...(request.temperature !== undefined && { temperature: request.temperature }),
          ...(request.maxTokens !== undefined && { maxOutputTokens: request.maxTokens })
        }
      });

      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = request.messages.filter(m => m.role !== 'system');
      
      const chatHistory = userMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = userMessages[userMessages.length - 1]?.content || '';

      const chat = model.startChat({
        history: chatHistory
      });

      const result = await chat.sendMessage(lastMessage);
      const response = result.response;

      return {
        id: `gemini-${Date.now()}`,
        choices: [{
          message: {
            role: 'assistant',
            content: response.text()
          },
          finishReason: response.candidates?.[0]?.finishReason || undefined
        }],
        usage: (response as any).usageMetadata ? {
          promptTokens: (response as any).usageMetadata.promptTokenCount || 0,
          completionTokens: (response as any).usageMetadata.candidatesTokenCount || 0,
          totalTokens: (response as any).usageMetadata.totalTokenCount || 0
        } : undefined,
        model: request.model,
        created: Math.floor(Date.now() / 1000)
      };
    } catch (error: any) {
      logger.error('Gemini API error:', {
        error: error.message,
        status: error.status
      });

      throw new AIProviderError('Gemini', error.message || 'Unknown error occurred');
    }
  }

  async streamChat(request: ProxyRequest): Promise<AsyncIterable<any>> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: request.model,
        generationConfig: {
          ...(request.temperature !== undefined && { temperature: request.temperature }),
          ...(request.maxTokens !== undefined && { maxOutputTokens: request.maxTokens })
        }
      });

      const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
      const userMessages = request.messages.filter(m => m.role !== 'system');
      
      const chatHistory = userMessages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      const lastMessage = userMessages[userMessages.length - 1]?.content || '';

      const chat = model.startChat({
        history: chatHistory
      });

      const result = await chat.sendMessageStream(lastMessage);
      return result.stream;
    } catch (error: any) {
      logger.error('Gemini streaming error:', {
        error: error.message,
        status: error.status
      });

      throw new AIProviderError('Gemini', error.message || 'Unknown streaming error occurred');
    }
  }

  getProvider(): AIProvider {
    return AIProvider.GEMINI;
  }

  calculateCost(usage: { promptTokens: number; completionTokens: number }, model: string): number {
    const modelPricing: Record<string, { input: number; output: number }> = {
      'gemini-pro': { input: 0.0005, output: 0.0015 },
      'gemini-pro-vision': { input: 0.0005, output: 0.0015 }
    };

    const pricing = modelPricing[model] || { input: 0.0005, output: 0.0015 };
    
    return (usage.promptTokens * pricing.input / 1000) + 
           (usage.completionTokens * pricing.output / 1000);
  }
}