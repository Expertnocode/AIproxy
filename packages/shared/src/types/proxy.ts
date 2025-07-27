import { z } from 'zod';

export enum AIProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI'
}

export const ProxyRequestSchema = z.object({
  provider: z.nativeEnum(AIProvider),
  model: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().positive().optional(),
  stream: z.boolean().default(false),
  metadata: z.record(z.any()).optional()
});

export const ProxyResponseSchema = z.object({
  id: z.string(),
  choices: z.array(z.object({
    message: z.object({
      role: z.string(),
      content: z.string()
    }),
    finishReason: z.string().optional()
  })),
  usage: z.object({
    promptTokens: z.number().int(),
    completionTokens: z.number().int(),
    totalTokens: z.number().int()
  }).optional(),
  model: z.string(),
  created: z.number().int()
});

export type ProxyRequest = z.infer<typeof ProxyRequestSchema>;
export type ProxyResponse = z.infer<typeof ProxyResponseSchema>;

export interface AIModelInfo {
  id: string;
  name: string;
  provider: AIProvider;
  contextLength: number;
  inputCostPer1kTokens: number;
  outputCostPer1kTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

export interface ProxyConfig {
  defaultProvider: AIProvider;
  enablePIIDetection: boolean;
  enableRuleEngine: boolean;
  enableAuditLogging: boolean;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
  };
  providers: {
    [AIProvider.OPENAI]: {
      apiKey: string;
      baseUrl?: string;
      organization?: string;
    };
    [AIProvider.CLAUDE]: {
      apiKey: string;
      baseUrl?: string;
    };
    [AIProvider.GEMINI]: {
      apiKey: string;
      baseUrl?: string;
    };
  };
}