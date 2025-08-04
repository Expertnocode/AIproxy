import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { SecurityProcessor } from '../security/processor';
import { PresidioDetector } from '../security/presidio';
import { SecurityRuleEngine } from '../security/ruleEngine';
import { SecurityRule } from '@aiproxy/shared';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      securityProcessor?: SecurityProcessor;
      processingResult?: any;
    }
  }
}

// Cache for rules and config to avoid fetching on every request
let cachedRules: SecurityRule[] = [];
let cachedUserConfig: any = null;
let lastRuleFetch = 0;
let lastConfigFetch = 0;
const RULE_CACHE_TTL = 60000; // 1 minute
const CONFIG_CACHE_TTL = 300000; // 5 minutes

async function fetchUserRules(userId: string): Promise<SecurityRule[]> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await axios.get(`${backendUrl}/api/v1/rules`, {
      headers: {
        'User-ID': userId // We'll pass the user ID from the JWT
      }
    });
    
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    logger.warn('Failed to fetch user rules:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return [];
  }
}

async function fetchUserConfig(userId: string): Promise<any> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const response = await axios.get(`${backendUrl}/api/v1/config`, {
      headers: {
        'User-ID': userId // We'll pass the user ID from the JWT
      }
    });
    
    if (response.data.success) {
      return response.data.data || null;
    }
    return null;
  } catch (error) {
    logger.warn('Failed to fetch user config:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });
    return null;
  }
}

export function createSecurityMiddleware() {
  const presidioDetector = new PresidioDetector();
  
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip security processing for non-proxy requests
      if (!req.url.includes('/proxy/chat')) {
        return next();
      }

      logger.debug('Security middleware processing request', {
        requestId: req.id,
        url: req.url,
        method: req.method
      });

      // Extract user ID from JWT token
      const authHeader = req.headers.authorization;
      let userId: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
          userId = decoded.userId;
        } catch (error) {
          logger.warn('Failed to decode JWT for security rules:', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Fetch and cache user rules and config
      let userRules: SecurityRule[] = [];
      let userConfig: any = null;
      
      if (userId) {
        const now = Date.now();
        
        // Fetch user rules
        if (now - lastRuleFetch > RULE_CACHE_TTL) {
          cachedRules = await fetchUserRules(userId);
          lastRuleFetch = now;
        }
        userRules = cachedRules;
        
        // Fetch user config
        if (now - lastConfigFetch > CONFIG_CACHE_TTL) {
          cachedUserConfig = await fetchUserConfig(userId);
          lastConfigFetch = now;
        }
        userConfig = cachedUserConfig;
      }

      // Use user configuration if available, otherwise fall back to environment variables
      const securityConfig = {
        enablePIIDetection: userConfig?.enablePIIDetection ?? (process.env.ENABLE_PII_DETECTION !== 'false'),
        enableRuleEngine: userConfig?.enableRuleEngine ?? (process.env.ENABLE_RULE_ENGINE !== 'false'),
        fallbackToRegex: process.env.FALLBACK_TO_REGEX === 'true'
      };

      logger.debug('Security configuration applied', {
        requestId: req.id,
        userId,
        enablePIIDetection: securityConfig.enablePIIDetection,
        enableRuleEngine: securityConfig.enableRuleEngine,
        rulesCount: userRules.length,
        configSource: userConfig ? 'database' : 'environment'
      });

      // Create rule engine with user's rules
      const ruleEngine = new SecurityRuleEngine(userRules);
      
      const securityProcessor = new SecurityProcessor(
        presidioDetector,
        ruleEngine,
        securityConfig
      );

      // Attach security processor to request for use in routes
      req.securityProcessor = securityProcessor;
      
      next();
    } catch (error) {
      logger.error('Security middleware error:', {
        requestId: req.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  };
}

export async function processProxyRequest(
  securityProcessor: SecurityProcessor,
  messages: Array<{ role: string; content: string }>
): Promise<{
  processedMessages: Array<{ role: string; content: string }>;
  processingResults: any[];
}> {
  const processedMessages = [];
  const processingResults = [];

  for (const message of messages) {
    try {
      const result = await securityProcessor.processText(message.content);
      
      processedMessages.push({
        role: message.role,
        content: result.processedText
      });
      
      processingResults.push(result);
      
      logger.debug('Message processed by security', {
        originalLength: message.content.length,
        processedLength: result.processedText.length,
        piiDetected: result.matches.length > 0,
        rulesApplied: result.appliedRules.length
      });
    } catch (error) {
      logger.error('Failed to process message for security:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageRole: message.role,
        messageLength: message.content.length
      });
      
      // On security processing failure, either block or allow based on configuration
      if (process.env.BLOCK_ON_SECURITY_FAILURE === 'true') {
        throw error;
      } else {
        // Allow original message through with warning
        processedMessages.push(message);
        processingResults.push({
          originalText: message.content,
          processedText: message.content,
          matches: [],
          tokenMap: [],
          appliedRules: [],
          processingTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return { processedMessages, processingResults };
}

export async function restoreProxyResponse(
  securityProcessor: SecurityProcessor,
  responseContent: string,
  processingResults: any[]
): Promise<string> {
  try {
    // Find the most recent processing result with token mapping
    const resultWithTokens = processingResults.find(r => r.tokenMap && r.tokenMap.length > 0);
    
    if (!resultWithTokens) {
      return responseContent;
    }

    const restoredContent = await securityProcessor.restoreText(
      responseContent,
      resultWithTokens.tokenMap
    );

    logger.debug('Response restored from security processing', {
      originalLength: responseContent.length,
      restoredLength: restoredContent.length,
      tokenCount: resultWithTokens.tokenMap.length
    });

    return restoredContent;
  } catch (error) {
    logger.error('Failed to restore response from security processing:', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Return original response on restoration failure
    return responseContent;
  }
}