import { z } from 'zod';
import { AIProvider } from './proxy';
export declare enum AuditEventType {
    PROXY_REQUEST = "PROXY_REQUEST",
    PII_DETECTED = "PII_DETECTED",
    RULE_TRIGGERED = "RULE_TRIGGERED",
    USER_LOGIN = "USER_LOGIN",
    USER_LOGOUT = "USER_LOGOUT",
    CONFIG_CHANGED = "CONFIG_CHANGED",
    ERROR_OCCURRED = "ERROR_OCCURRED"
}
export declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    eventType: z.ZodNativeEnum<typeof AuditEventType>;
    userId: z.ZodNullable<z.ZodString>;
    requestId: z.ZodString;
    timestamp: z.ZodDate;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string | null;
    metadata: Record<string, any>;
    eventType: AuditEventType;
    requestId: string;
    timestamp: Date;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    id: string;
    userId: string | null;
    metadata: Record<string, any>;
    eventType: AuditEventType;
    requestId: string;
    timestamp: Date;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
export declare const CreateAuditLogSchema: z.ZodObject<{
    eventType: z.ZodNativeEnum<typeof AuditEventType>;
    userId: z.ZodNullable<z.ZodString>;
    requestId: z.ZodString;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    ipAddress: z.ZodOptional<z.ZodString>;
    userAgent: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string | null;
    metadata: Record<string, any>;
    eventType: AuditEventType;
    requestId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}, {
    userId: string | null;
    metadata: Record<string, any>;
    eventType: AuditEventType;
    requestId: string;
    ipAddress?: string | undefined;
    userAgent?: string | undefined;
}>;
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
//# sourceMappingURL=audit.d.ts.map