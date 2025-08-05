import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
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
interface UserRuleCache {
  rules: SecurityRule[];
  lastFetch: number;
}

interface UserConfigCache {
  config: any;
  lastFetch: number;
}

const ruleCache = new Map<string, UserRuleCache>();
const configCache = new Map<string, UserConfigCache>();
const RULE_CACHE_TTL = 60000; // 1 minute
const CONFIG_CACHE_TTL = 300000; // 5 minutes

async function fetchUserRules(userId: string, authToken?: string): Promise<SecurityRule[]> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const headers: Record<string, string> = {
      'User-ID': userId
    };
    
    // Add JWT token if available for proper authentication
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    logger.info('Fetching user rules from backend', {
      userId,
      backendUrl,
      hasAuthToken: !!authToken
    });
    
    const response = await axios.get(`${backendUrl}/api/v1/rules`, { headers });
    
    logger.info('Backend rules response', {
      userId,
      success: response.data.success,
      rulesCount: response.data.data?.length || 0,
      rules: response.data.data
    });
    
    if (response.data.success) {
      return response.data.data || [];
    }
    return [];
  } catch (error) {
    logger.error('Failed to fetch user rules:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      stack: error instanceof Error ? error.stack : undefined
    });
    return [];
  }
}

async function fetchUserConfig(userId: string, authToken?: string): Promise<any> {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    const headers: Record<string, string> = {
      'User-ID': userId
    };
    
    // Add JWT token if available for proper authentication
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const response = await axios.get(`${backendUrl}/api/v1/config`, { headers });
    
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
      if (!req.url.startsWith('/api/v1/proxy')) {
        return next();
      }

      logger.info('Security middleware processing request', {
        requestId: req.id,
        url: req.url,
        method: req.method,
        hasAuthHeader: !!req.headers.authorization
      });

      // Extract user ID and token from JWT
      const authHeader = req.headers.authorization;
      let userId: string | null = null;
      let authToken: string | null = null;
      
      if (authHeader?.startsWith('Bearer ')) {
        try {
          authToken = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as { userId: string };
          userId = decoded.userId;
        } catch (error) {
          logger.warn('Failed to decode JWT for security rules:', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      // Fetch and cache user rules and config per user
      let userRules: SecurityRule[] = [];
      let userConfig: any = null;
      
      if (userId) {
        const now = Date.now();
        
        // Fetch user rules with per-user caching
        const cachedRuleData = ruleCache.get(userId);
        if (!cachedRuleData || (now - cachedRuleData.lastFetch) > RULE_CACHE_TTL) {
          const rules = await fetchUserRules(userId, authToken || undefined);
          ruleCache.set(userId, { rules, lastFetch: now });
          userRules = rules;
          
          logger.info('User rules fetched and cached', {
            userId,
            ruleCount: rules.length,
            cached: !cachedRuleData,
            rules: rules.map(r => ({ id: r.id, name: r.name, action: r.action, enabled: r.enabled }))
          });
        } else {
          userRules = cachedRuleData.rules;
          logger.debug('User rules retrieved from cache', {
            userId,
            ruleCount: userRules.length
          });
        }
        
        // Fetch user config with per-user caching
        const cachedConfigData = configCache.get(userId);
        if (!cachedConfigData || (now - cachedConfigData.lastFetch) > CONFIG_CACHE_TTL) {
          const config = await fetchUserConfig(userId, authToken || undefined);
          configCache.set(userId, { config, lastFetch: now });
          userConfig = config;
        } else {
          userConfig = cachedConfigData.config;
        }
      }

      // Use user configuration if available, otherwise fall back to environment variables
      const securityConfig = {
        enablePIIDetection: userConfig?.enablePIIDetection ?? (process.env.ENABLE_PII_DETECTION !== 'false'),
        enableRuleEngine: userConfig?.enableRuleEngine ?? (process.env.ENABLE_RULE_ENGINE !== 'false'),
        fallbackToRegex: process.env.FALLBACK_TO_REGEX === 'true'
      };

      logger.info('Security configuration applied', {
        requestId: req.id,
        userId,
        enablePIIDetection: securityConfig.enablePIIDetection,
        enableRuleEngine: securityConfig.enableRuleEngine,
        rulesCount: userRules.length,
        configSource: userConfig ? 'database' : 'environment',
        securityProcessorAttached: true
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
      logger.info('Processing message through security', {
        role: message.role,
        contentLength: message.content.length,
        contentPreview: message.content.substring(0, 100)
      });

      const result = await securityProcessor.processText(message.content);
      
      processedMessages.push({
        role: message.role,
        content: result.processedText
      });
      
      processingResults.push(result);
      
      logger.info('Message processed by security', {
        originalLength: message.content.length,
        processedLength: result.processedText.length,
        piiDetected: result.matches.length > 0,
        rulesApplied: result.appliedRules.length,
        textChanged: message.content !== result.processedText,
        appliedRules: result.appliedRules,
        matches: result.matches.map(m => ({ type: m.entityType, text: m.text, start: m.start, end: m.end }))
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