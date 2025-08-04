import { Router } from 'express';
import { ProxyRequestSchema, validateRequest, createAPIResponse, ValidationError } from '@aiproxy/shared';
import { ProviderFactory } from '../providers/factory';
import { processProxyRequest, restoreProxyResponse } from '../middleware/security';
import { logger } from '../utils/logger';

export const proxyRoutes = Router();

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
      const securityResult = await processProxyRequest(req.securityProcessor, request.messages);
      processedMessages = securityResult.processedMessages as { role: 'system' | 'user' | 'assistant'; content: string; }[];
      processingResults = securityResult.processingResults;

      logger.info('Security processing completed', {
        requestId: req.id,
        originalMessageCount: request.messages.length,
        processedMessageCount: processedMessages.length,
        piiDetected: processingResults.some(r => r.matches && r.matches.length > 0)
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