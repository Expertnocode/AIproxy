import { SecurityRule, RuleAction, PIIMatch, ProcessingResult } from '@aiproxy/shared';
import { logger } from '../utils/logger';

export interface RuleEvaluationResult {
  action: RuleAction;
  appliedRules: string[];
  blocked: boolean;
  warnings: string[];
}

export class SecurityRuleEngine {
  private rules: SecurityRule[] = [];

  constructor(rules: SecurityRule[] = []) {
    this.rules = rules.filter(rule => rule.enabled).sort((a, b) => b.priority - a.priority);
  }

  updateRules(rules: SecurityRule[]): void {
    this.rules = rules.filter(rule => rule.enabled).sort((a, b) => b.priority - a.priority);
    logger.info('Security rules updated', { ruleCount: this.rules.length });
  }

  evaluate(text: string, piiMatches: PIIMatch[]): RuleEvaluationResult {
    const result: RuleEvaluationResult = {
      action: RuleAction.ALLOW,
      appliedRules: [],
      blocked: false,
      warnings: []
    };

    logger.debug('Evaluating security rules', {
      textLength: text.length,
      piiMatchCount: piiMatches.length,
      ruleCount: this.rules.length
    });

    // Process all rules to collect complete violation information
    let shouldBlock = false;
    
    for (const rule of this.rules) {
      try {
        const matches = this.evaluateRule(rule, text, piiMatches);
        
        if (matches.length > 0) {
          result.appliedRules.push(rule.id);
          
          logger.info('Security rule triggered', {
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action,
            matchCount: matches.length,
            matches: matches.map(m => ({ text: m[0], index: m.index }))
          });

          // Apply the most restrictive action
          if (this.isMoreRestrictive(rule.action, result.action)) {
            result.action = rule.action;
          }

          if (rule.action === RuleAction.BLOCK) {
            shouldBlock = true;
            result.warnings.push(`Blocked by rule: ${rule.name}`);
            // Continue processing to collect all violations
          } else if (rule.action === RuleAction.WARN) {
            result.warnings.push(`Warning from rule: ${rule.name}`);
          }
        }
      } catch (error) {
        logger.error('Error evaluating security rule', {
          ruleId: rule.id,
          ruleName: rule.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Set blocked status after processing all rules
    result.blocked = shouldBlock;

    logger.debug('Security rule evaluation completed', {
      finalAction: result.action,
      appliedRuleCount: result.appliedRules.length,
      blocked: result.blocked,
      warningCount: result.warnings.length
    });

    return result;
  }

  private evaluateRule(rule: SecurityRule, text: string, piiMatches: PIIMatch[]): RegExpMatchArray[] {
    try {
      // Create regex from rule pattern
      const regex = new RegExp(rule.pattern, 'gi');
      const matches = Array.from(text.matchAll(regex));
      
      return matches;
    } catch (error) {
      logger.warn('Invalid regex pattern in security rule', {
        ruleId: rule.id,
        pattern: rule.pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return [];
    }
  }

  private isMoreRestrictive(newAction: RuleAction, currentAction: RuleAction): boolean {
    const actionPriority: Record<RuleAction, number> = {
      [RuleAction.BLOCK]: 4,
      [RuleAction.REDACT]: 3,
      [RuleAction.ANONYMIZE]: 2,
      [RuleAction.WARN]: 1,
      [RuleAction.ALLOW]: 0
    };

    return actionPriority[newAction] > actionPriority[currentAction];
  }

  getActiveRules(): SecurityRule[] {
    return this.rules;
  }

  getRuleCount(): number {
    return this.rules.length;
  }
}