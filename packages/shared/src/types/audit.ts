import { z } from 'zod';
import { AIProvider } from './proxy';

export enum AuditEventType {
  PROXY_REQUEST = 'PROXY_REQUEST',
  PII_DETECTED = 'PII_DETECTED',
  RULE_TRIGGERED = 'RULE_TRIGGERED',
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  ERROR_OCCURRED = 'ERROR_OCCURRED'
}

export const AuditLogSchema = z.object({
  id: z.string().cuid(),
  eventType: z.nativeEnum(AuditEventType),
  userId: z.string().cuid().nullable(),
  requestId: z.string().uuid(),
  timestamp: z.date(),
  metadata: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

export const CreateAuditLogSchema = z.object({
  eventType: z.nativeEnum(AuditEventType),
  userId: z.string().cuid().nullable(),
  requestId: z.string().uuid(),
  metadata: z.record(z.any()),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
export type CreateAuditLogRequest = z.infer<typeof CreateAuditLogSchema>;

export interface ProxyAuditMetadata {
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  processingTimeMs: number;
  piiDetected: boolean;
  rulesTriggered: string[];
  cost?: number;
}

export interface SecurityAuditMetadata {
  ruleId: string;
  ruleName: string;
  action: string;
  matches: Array<{
    entityType: string;
    start: number;
    end: number;
    score: number;
  }>;
}