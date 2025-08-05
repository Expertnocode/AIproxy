import { Router } from 'express';
import { ProxyRequestSchema, validateRequest, createAPIResponse, ValidationError } from '@aiproxy/shared';
import { ProviderFactory } from '../providers/factory';
import { processProxyRequest, restoreProxyResponse } from '../middleware/security';
import { logger } from '../utils/logger';
import axios from 'axios';

export const proxyRoutes = Router();

async function createAuditLog(userId: string, requestData: any, responseData: any, processingResults: any[], startTime?: number) {
  try {
    logger.info('Starting audit log creation', { 
      userId, 
      provider: requestData.provider, 
      model: requestData.model,
      hasUsage: !!responseData.usage 
    });
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    
    const auditData = {
      eventType: 'PROXY_REQUEST',
      requestId: responseData.id || `req-${Date.now()}`,
      metadata: {
        provider: requestData.provider,
        model: requestData.model,
        messageCount: requestData.messages?.length || 0,
        usage: responseData.usage || {},
        piiDetected: processingResults.some(r => r.matches && r.matches.length > 0),
        rulesApplied: processingResults.reduce((total, r) => total + (r.appliedRules?.length || 0), 0),
        securityProcessing: {
          processed: processingResults.length > 0,
          piiDetected: processingResults.some(r => r.matches && r.matches.length > 0),
          rulesTriggered: processingResults.reduce((total, r) => total + (r.appliedRules?.length || 0), 0)
        }
      },
      ipAddress: '127.0.0.1', // In a real scenario, get from req.ip
      userAgent: 'AIProxy/1.0'
    };

    // Create audit log
    await axios.post(`${backendUrl}/api/v1/audit/logs`, auditData, {
      headers: {
        'User-ID': userId,
        'Content-Type': 'application/json'
      }
    });

    // Create usage record for analytics
    if (responseData.usage) {
      const usageData = {
        provider: requestData.provider,
        model: requestData.model,
        inputTokens: responseData.usage.promptTokens || responseData.usage.prompt_tokens || 0,
        outputTokens: responseData.usage.completionTokens || responseData.usage.completion_tokens || 0,
        totalTokens: responseData.usage.totalTokens || responseData.usage.total_tokens || 0,
        cost: 0, // Calculate cost based on provider/model pricing
        processingTimeMs: startTime ? Date.now() - startTime : 0,
        piiDetected: processingResults.some(r => r.matches && r.matches.length > 0),
        rulesTriggered: processingResults.map(r => r.appliedRules || []).flat(),
        requestId: responseData.id || `req-${Date.now()}`
      };

      await axios.post(`${backendUrl}/api/v1/audit/usage`, usageData, {
        headers: {
          'User-ID': userId,
          'Content-Type': 'application/json'
        }
      });
    }

    logger.info('Audit log and usage created successfully', { userId, action: auditData.action });
  } catch (error) {
    logger.error('Failed to create audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
  }
}

proxyRoutes.get('/models', async (req, res, next) => {
  try {
    const supportedProviders = ProviderFactory.getSupportedProviders();
    const models = supportedProviders.flatMap(provider => 
      ProviderFactory.getProviderModels(provider).map(model => ({
        id: model,
        provider,
        name: model
      }))
    );

    res.json(createAPIResponse(models, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

proxyRoutes.post('/chat', async (req, res, next) => {
  try {
    const validation = validateRequest(ProxyRequestSchema, req.body);
    if (!validation.success) {
      res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid request format', details: { errors: validation.errors } },
        req.id
      ));
      return;
    }

    const request = validation.data;
    const startTime = Date.now();

    // Extract user ID from JWT for audit logging
    let userId: string | null = null;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        userId = decoded.userId;
      } catch (error) {
        logger.warn('Failed to decode JWT for audit logging:', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const providerConfig = getProviderConfig(request.provider);
    const provider = ProviderFactory.createProvider(request.provider, providerConfig);

    logger.info('Processing proxy request', {
      requestId: req.id,
      provider: request.provider,
      model: request.model,
      messageCount: request.messages.length,
      stream: request.stream
    });

    // Process messages through security middleware
    let processedMessages = request.messages as { role: 'system' | 'user' | 'assistant'; content: string; }[];
    let processingResults: any[] = [];

    if (req.securityProcessor) {
      logger.info('Starting security processing for proxy request', {
        requestId: req.id,
        messageCount: request.messages.length,
        messages: request.messages.map(m => ({ role: m.role, contentLength: m.content?.length || 0 }))
      });

      const securityResult = await processProxyRequest(req.securityProcessor, request.messages);
      processedMessages = securityResult.processedMessages as { role: 'system' | 'user' | 'assistant'; content: string; }[];
      processingResults = securityResult.processingResults;

      logger.info('Security processing completed', {
        requestId: req.id,
        originalMessageCount: request.messages.length,
        processedMessageCount: processedMessages.length,
        piiDetected: processingResults.some(r => r.matches && r.matches.length > 0),
        rulesApplied: processingResults.reduce((total, r) => total + (r.appliedRules?.length || 0), 0),
        processingResults: processingResults.map(r => ({
          piiMatches: r.matches?.length || 0,
          appliedRules: r.appliedRules?.length || 0,
          textChanged: r.originalText !== r.processedText
        }))
      });
    } else {
      logger.warn('No security processor found on request', {
        requestId: req.id,
        url: req.url
      });
    }

    const processedRequest = { ...request, messages: processedMessages };

    if (request.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      try {
        const stream = await provider.streamChat(processedRequest);
        
        for await (const chunk of stream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`);
        res.end();
        throw error;
      }
    } else {
      const response = await provider.chat(processedRequest);
      const processingTime = Date.now() - startTime;

      // Restore original content in response if needed
      if (req.securityProcessor && response.choices && response.choices.length > 0) {
        for (const choice of response.choices) {
          if (choice.message?.content) {
            choice.message.content = await restoreProxyResponse(
              req.securityProcessor,
              choice.message.content,
              processingResults
            );
          }
        }
      }

      const cost = response.usage ? 
        provider.calculateCost(response.usage, processedRequest.model) : 
        undefined;

      const piiDetected = processingResults.some(r => r.matches && r.matches.length > 0);
      
      logger.info('Proxy request completed', {
        requestId: req.id,
        provider: processedRequest.provider,
        model: processedRequest.model,
        processingTime,
        usage: response.usage,
        cost,
        piiDetected,
        securityProcessed: processingResults.length > 0
      });

      // Add security metadata to response
      const responseWithSecurity = {
        ...response,
        piiDetected,
        hasAnonymization: piiDetected,
        securityProcessing: {
          processed: processingResults.length > 0,
          piiDetected,
          rulesTriggered: processingResults.filter(r => r.ruleTriggered).length
        }
      };

      // Create audit log (async, don't wait for it)
      if (userId) {
        logger.info('About to create audit log for user', { 
          userId, 
          hasUsage: !!response.usage,
          requestProvider: request.provider,
          requestModel: request.model,
          responseUsage: response.usage
        });
        createAuditLog(userId, request, response, processingResults, startTime).catch(err => {
          logger.error('Failed to create audit log', { 
            error: err.message, 
            stack: err.stack,
            userId 
          });
        });
      } else {
        logger.warn('No userId found for audit logging - JWT decode failed');
      }

      res.json(createAPIResponse(responseWithSecurity, undefined, req.id));
    }
  } catch (error) {
    next(error);
  }
});

function getProviderConfig(provider: string): Record<string, any> {
  switch (provider) {
    case 'OPENAI':
      return {
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL
      };
    
    case 'CLAUDE':
      return {
        apiKey: process.env.CLAUDE_API_KEY,
        baseUrl: process.env.CLAUDE_BASE_URL
      };
    
    case 'GEMINI':
      return {
        apiKey: process.env.GEMINI_API_KEY
      };
    
    default:
      throw new ValidationError(`Provider ${provider} configuration not found`);
  }
}