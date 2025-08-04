import { Router } from 'express';
import { createAPIResponse, NotFoundError } from '@aiproxy/shared';
import { prisma } from '../utils/database';
import { authenticateToken, requireUser, authenticateUserIdHeader } from '../middleware/auth';
import { z } from 'zod';

const ProxyConfigUpdateSchema = z.object({
  defaultProvider: z.enum(['OPENAI', 'CLAUDE', 'GEMINI']).optional(),
  enablePIIDetection: z.boolean().optional(),
  enableRuleEngine: z.boolean().optional(),
  enableAuditLogging: z.boolean().optional(),
  rateLimitWindowMs: z.number().int().positive().optional(),
  rateLimitMaxRequests: z.number().int().positive().optional(),
  providerConfigs: z.record(z.any()).optional()
});

export const configRoutes = Router();

// Use User-ID header authentication for internal proxy requests, fallback to token auth
configRoutes.use(authenticateUserIdHeader);

configRoutes.get('/', requireUser, async (req, res, next): Promise<any> => {
  try {
    let config = await prisma.proxyConfig.findUnique({
      where: { userId: req.user!.id }
    });

    if (!config) {
      config = await prisma.proxyConfig.create({
        data: {
          userId: req.user!.id,
          defaultProvider: 'OPENAI',
          enablePIIDetection: true,
          enableRuleEngine: true,
          enableAuditLogging: true,
          rateLimitWindowMs: 900000,
          rateLimitMaxRequests: 100,
          providerConfigs: {}
        }
      });
    }

    res.json(createAPIResponse(config, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

configRoutes.put('/', requireUser, async (req, res, next): Promise<any> => {
  try {
    const validation = z.object({
      data: ProxyConfigUpdateSchema
    }).safeParse({ data: req.body });

    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { 
          code: 'VALIDATION_ERROR', 
          message: 'Invalid configuration data',
          details: { errors: validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) }
        },
        req.id
      ));
    }

    const updateData = validation.data.data;

    let config = await prisma.proxyConfig.findUnique({
      where: { userId: req.user!.id }
    });

    if (!config) {
      config = await prisma.proxyConfig.create({
        data: {
          userId: req.user!.id,
          defaultProvider: updateData.defaultProvider || 'OPENAI',
          enablePIIDetection: updateData.enablePIIDetection ?? true,
          enableRuleEngine: updateData.enableRuleEngine ?? true,
          enableAuditLogging: updateData.enableAuditLogging ?? true,
          rateLimitWindowMs: updateData.rateLimitWindowMs ?? 900000,
          rateLimitMaxRequests: updateData.rateLimitMaxRequests ?? 100,
          providerConfigs: updateData.providerConfigs ?? {}
        }
      });
    } else {
      config = await prisma.proxyConfig.update({
        where: { userId: req.user!.id },
        data: Object.fromEntries(
          Object.entries(updateData).filter(([_, value]) => value !== undefined)
        )
      });
    }

    res.json(createAPIResponse(config, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

configRoutes.get('/models', requireUser, async (req, res, next): Promise<any> => {
  try {
    const models = [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'OPENAI',
        contextLength: 8192,
        inputCostPer1kTokens: 0.03,
        outputCostPer1kTokens: 0.06,
        supportsStreaming: true,
        supportsVision: false
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'OPENAI',
        contextLength: 4096,
        inputCostPer1kTokens: 0.001,
        outputCostPer1kTokens: 0.002,
        supportsStreaming: true,
        supportsVision: false
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus',
        provider: 'CLAUDE',
        contextLength: 200000,
        inputCostPer1kTokens: 0.015,
        outputCostPer1kTokens: 0.075,
        supportsStreaming: true,
        supportsVision: true
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'CLAUDE',
        contextLength: 200000,
        inputCostPer1kTokens: 0.003,
        outputCostPer1kTokens: 0.015,
        supportsStreaming: true,
        supportsVision: true
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'GEMINI',
        contextLength: 32768,
        inputCostPer1kTokens: 0.0005,
        outputCostPer1kTokens: 0.0015,
        supportsStreaming: true,
        supportsVision: false
      }
    ];

    res.json(createAPIResponse(models, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});