import { z } from 'zod';

export enum RuleAction {
  BLOCK = 'BLOCK',
  ANONYMIZE = 'ANONYMIZE',
  REDACT = 'REDACT',
  WARN = 'WARN',
  ALLOW = 'ALLOW'
}

export enum PIIType {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CREDIT_CARD = 'CREDIT_CARD',
  SSN = 'SSN',
  IP_ADDRESS = 'IP_ADDRESS',
  PERSON = 'PERSON',
  LOCATION = 'LOCATION',
  ORGANIZATION = 'ORGANIZATION',
  DATE_TIME = 'DATE_TIME',
  URL = 'URL',
  CUSTOM = 'CUSTOM'
}

export const SecurityRuleSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  pattern: z.string().min(1),
  action: z.nativeEnum(RuleAction),
  enabled: z.boolean().default(true),
  priority: z.number().int().default(0),
  userId: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const CreateSecurityRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pattern: z.string().min(1),
  action: z.nativeEnum(RuleAction),
  enabled: z.boolean().default(true),
  priority: z.number().int().default(0)
});

export const UpdateSecurityRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pattern: z.string().min(1).optional(),
  action: z.nativeEnum(RuleAction).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().optional()
});

export type SecurityRule = z.infer<typeof SecurityRuleSchema>;
export type CreateSecurityRuleRequest = z.infer<typeof CreateSecurityRuleSchema>;
export type UpdateSecurityRuleRequest = z.infer<typeof UpdateSecurityRuleSchema>;

export interface PIIMatch {
  entityType: PIIType;
  start: number;
  end: number;
  score: number;
  text: string;
}

export interface TokenMapping {
  original: string;
  anonymized: string;
  entityType: PIIType;
  id: string;
}

export interface ProcessingResult {
  originalText: string;
  processedText: string;
  matches: PIIMatch[];
  tokenMap: TokenMapping[];
  appliedRules: string[];
  processingTime: number;
}