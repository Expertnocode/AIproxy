import { Router } from 'express';
import axios from 'axios';
import { createAPIResponse } from '@aiproxy/shared';
import { authenticateToken, requireUser } from '../middleware/auth';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

export const proxyRoutes = Router();

proxyRoutes.use(authenticateToken);

interface ChatRequest {
  provider: 'OPENAI' | 'CLAUDE' | 'GEMINI';
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  usage?: {
    promptTokens?: number;
    prompt_tokens?: number;
    completionTokens?: number;
    completion_tokens?: number;
    totalTokens?: number;
    total_tokens?: number;
  };
  hasAnonymization?: boolean;
  piiDetected?: boolean;
}

proxyRoutes.post('/chat', requireUser, async (req, res, next) => {
  try {
    const chatRequest: ChatRequest = req.body;
    const userId = req.user!.id;

    // Forward request to proxy service
    const token = req.headers.authorization;
    const proxyResponse = await axios.post<{
      success: boolean;
      data: ChatResponse;
      error?: any;
    }>('http://localhost:3000/api/v1/proxy/chat', chatRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
        'User-ID': userId // Pass user ID for rule fetching
      }
    });

    if (!proxyResponse.data.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { 
          code: 'PROXY_ERROR', 
          message: proxyResponse.data.error?.message || 'Proxy request failed' 
        },
        req.id
      ));
    }

    const responseData = proxyResponse.data.data;
    
    logger.info('Proxy response received', {
      responseKeys: Object.keys(responseData),
      hasAnonymization: responseData.hasAnonymization,
      piiDetected: responseData.piiDetected,
      securityProcessing: responseData.securityProcessing
    });
    const usage = responseData.usage;

    // Calculate cost (simplified pricing)
    const costPerToken = {
      'OPENAI': {
        'gpt-4': 0.00006, // $0.06 per 1K tokens
        'gpt-3.5-turbo': 0.000002, // $0.002 per 1K tokens
      },
      'CLAUDE': {
        'claude-3-opus': 0.000075, // $0.075 per 1K tokens
        'claude-3-sonnet': 0.000015, // $0.015 per 1K tokens
        'claude-3-haiku': 0.0000005, // $0.0005 per 1K tokens
      },
      'GEMINI': {
        'gemini-pro': 0.000001, // $0.001 per 1K tokens
        'gemini-pro-vision': 0.000002, // $0.002 per 1K tokens
      }
    };

    const totalTokens = usage?.totalTokens || usage?.total_tokens || 0;
    const promptTokens = usage?.promptTokens || usage?.prompt_tokens || 0;
    const completionTokens = usage?.completionTokens || usage?.completion_tokens || 0;
    
    const modelCost = costPerToken[chatRequest.provider]?.[chatRequest.model] || 0.000001;
    const cost = totalTokens * modelCost;

    // Save usage to database
    const piiDetectedValue = responseData.hasAnonymization || responseData.piiDetected || false;
    
    logger.info('Saving usage to database', {
      userId,
      provider: chatRequest.provider,
      model: chatRequest.model,
      totalTokens,
      piiDetected: piiDetectedValue,
      hasAnonymization: responseData.hasAnonymization,
      piiDetectedFromProxy: responseData.piiDetected
    });
    
    await prisma.usage.create({
      data: {
        userId,
        provider: chatRequest.provider,
        model: chatRequest.model,
        inputTokens: promptTokens,
        outputTokens: completionTokens,
        totalTokens,
        cost,
        processingTimeMs: 0, // TODO: Calculate actual processing time
        piiDetected: piiDetectedValue,
        rulesTriggered: [], // TODO: Get triggered rules from proxy response
        timestamp: new Date(),
        requestId: req.id || `chat-${Date.now()}`
      }
    });

    logger.info('Chat request processed', {
      userId,
      provider: chatRequest.provider,
      model: chatRequest.model,
      totalTokens,
      cost,
      piiDetected: responseData.hasAnonymization || responseData.piiDetected
    });

    res.json(createAPIResponse(responseData, undefined, req.id));
  } catch (error) {
    logger.error('Proxy chat error', { error, userId: req.user?.id });
    next(error);
  }
});

// Health check endpoint for proxy
proxyRoutes.get('/health', async (req, res, next) => {
  try {
    const proxyResponse = await axios.get('http://localhost:3000/health', {
      timeout: 5000
    });
    
    res.json(createAPIResponse({
      proxy: proxyResponse.data,
      backend: { status: 'healthy', timestamp: new Date().toISOString() }
    }, undefined, req.id));
  } catch (error) {
    res.status(503).json(createAPIResponse(
      undefined,
      { code: 'PROXY_UNAVAILABLE', message: 'Proxy service is not available' },
      req.id
    ));
  }
});