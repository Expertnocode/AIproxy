import { ProcessingResult, PIIMatch, TokenMapping, RuleAction } from '@aiproxy/shared';
import { PresidioDetector } from './presidio';
import { SecurityRuleEngine, RuleEvaluationResult } from './ruleEngine';
import { logger } from '../utils/logger';

export interface SecurityProcessorConfig {
  enablePIIDetection: boolean;
  enableRuleEngine: boolean;
  fallbackToRegex: boolean;
}

export class SecurityProcessor {
  private presidioDetector: PresidioDetector;
  private ruleEngine: SecurityRuleEngine;
  private config: SecurityProcessorConfig;

  constructor(
    presidioDetector: PresidioDetector,
    ruleEngine: SecurityRuleEngine,
    config: SecurityProcessorConfig
  ) {
    this.presidioDetector = presidioDetector;
    this.ruleEngine = ruleEngine;
    this.config = config;
  }

  async processText(text: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    logger.info('Starting security processing', {
      textLength: text.length,
      enablePIIDetection: this.config.enablePIIDetection,
      enableRuleEngine: this.config.enableRuleEngine
    });

    let piiMatches: PIIMatch[] = [];
    let tokenMap: TokenMapping[] = [];
    let processedText = text;
    let ruleEvaluation: RuleEvaluationResult | null = null;

    try {
      // Step 1: PII Detection
      if (this.config.enablePIIDetection) {
        try {
          piiMatches = await this.presidioDetector.detect(text);
          logger.debug('PII detection completed', { matchCount: piiMatches.length });
        } catch (error) {
          logger.warn('PII detection failed, falling back to regex if enabled', { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
          
          if (this.config.fallbackToRegex) {
            piiMatches = this.fallbackRegexDetection(text);
            logger.info('Fallback regex detection completed', { matchCount: piiMatches.length });
          }
        }
      }

      // Step 2: Rule Engine Evaluation
      if (this.config.enableRuleEngine) {
        ruleEvaluation = this.ruleEngine.evaluate(text, piiMatches);
        logger.debug('Rule evaluation completed', { 
          action: ruleEvaluation.action,
          appliedRules: ruleEvaluation.appliedRules.length
        });

        // Handle blocking
        if (ruleEvaluation.blocked) {
          throw new Error(`Request blocked by security rules: ${ruleEvaluation.warnings.join(', ')}`);
        }
      }

      // Step 3: Apply Processing Based on Rules and PII
      const finalAction = ruleEvaluation?.action || RuleAction.ALLOW;
      
      if (finalAction === RuleAction.ANONYMIZE || (finalAction === RuleAction.ALLOW && piiMatches.length > 0)) {
        const anonymizationResult = await this.presidioDetector.anonymize(text, piiMatches);
        processedText = anonymizationResult.anonymizedText;
        tokenMap = anonymizationResult.tokenMap;
        
        logger.debug('Text anonymization completed', { 
          tokenCount: tokenMap.length,
          originalLength: text.length,
          processedLength: processedText.length
        });
      } else if (finalAction === RuleAction.REDACT) {
        processedText = this.redactText(text, piiMatches);
        logger.debug('Text redaction completed');
      }

      const processingTime = Date.now() - startTime;

      const result: ProcessingResult = {
        originalText: text,
        processedText,
        matches: piiMatches,
        tokenMap,
        appliedRules: ruleEvaluation?.appliedRules || [],
        processingTime
      };

      logger.info('Security processing completed', {
        processingTime,
        piiMatches: piiMatches.length,
        appliedRules: result.appliedRules.length,
        finalAction,
        textChanged: text !== processedText
      });

      return result;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      logger.error('Security processing failed', {
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  async restoreText(anonymizedText: string, tokenMap: TokenMapping[]): Promise<string> {
    if (tokenMap.length === 0) {
      return anonymizedText;
    }

    try {
      const restoredText = await this.presidioDetector.restore(anonymizedText, tokenMap);
      
      logger.debug('Text restoration completed', {
        tokenCount: tokenMap.length,
        anonymizedLength: anonymizedText.length,
        restoredLength: restoredText.length
      });

      return restoredText;
    } catch (error) {
      logger.error('Text restoration failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return anonymized text as fallback
      return anonymizedText;
    }
  }

  private fallbackRegexDetection(text: string): PIIMatch[] {
    const patterns = [
      { type: 'EMAIL', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
      { type: 'PHONE', regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g },
      { type: 'CREDIT_CARD', regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g },
      { type: 'SSN', regex: /\b(?!000|666)[0-8][0-9]{2}-(?!00)[0-9]{2}-(?!0000)[0-9]{4}\b/g },
      { type: 'IP_ADDRESS', regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g }
    ];

    const matches: PIIMatch[] = [];

    patterns.forEach(pattern => {
      const regexMatches = Array.from(text.matchAll(pattern.regex));
      regexMatches.forEach(match => {
        if (match.index !== undefined) {
          matches.push({
            entityType: pattern.type as any,
            start: match.index,
            end: match.index + match[0].length,
            score: 0.8, // Default confidence for regex matches
            text: match[0]
          });
        }
      });
    });

    return matches;
  }

  private redactText(text: string, piiMatches: PIIMatch[]): string {
    let redactedText = text;
    
    // Sort matches by position in descending order to avoid offset issues
    const sortedMatches = [...piiMatches].sort((a, b) => b.start - a.start);
    
    sortedMatches.forEach(match => {
      const redactionLength = match.end - match.start;
      const redaction = '*'.repeat(Math.min(redactionLength, 10));
      redactedText = redactedText.substring(0, match.start) + redaction + redactedText.substring(match.end);
    });

    return redactedText;
  }

  async healthCheck(): Promise<{ presidio: boolean; ruleEngine: boolean }> {
    const presidioHealth = await this.presidioDetector.healthCheck();
    const ruleEngineHealth = this.ruleEngine.getRuleCount() >= 0; // Simple check

    return {
      presidio: presidioHealth,
      ruleEngine: ruleEngineHealth
    };
  }
}