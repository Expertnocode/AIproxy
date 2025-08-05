import { z } from 'zod';
export declare enum RuleAction {
    BLOCK = "BLOCK",
    ANONYMIZE = "ANONYMIZE",
    REDACT = "REDACT",
    WARN = "WARN",
    ALLOW = "ALLOW"
}
export declare enum PIIType {
    EMAIL = "EMAIL",
    PHONE = "PHONE",
    CREDIT_CARD = "CREDIT_CARD",
    SSN = "SSN",
    IP_ADDRESS = "IP_ADDRESS",
    PERSON = "PERSON",
    LOCATION = "LOCATION",
    ORGANIZATION = "ORGANIZATION",
    DATE_TIME = "DATE_TIME",
    URL = "URL",
    CUSTOM = "CUSTOM"
}
export declare const SecurityRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    pattern: z.ZodString;
    action: z.ZodNativeEnum<typeof RuleAction>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    priority: z.ZodDefault<z.ZodNumber>;
    userId: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    pattern: string;
    action: RuleAction;
    enabled: boolean;
    priority: number;
    userId: string;
    description?: string | undefined;
}, {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    pattern: string;
    action: RuleAction;
    userId: string;
    description?: string | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
}>;
export declare const CreateSecurityRuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    pattern: z.ZodString;
    action: z.ZodNativeEnum<typeof RuleAction>;
    enabled: z.ZodDefault<z.ZodBoolean>;
    priority: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    pattern: string;
    action: RuleAction;
    enabled: boolean;
    priority: number;
    description?: string | undefined;
}, {
    name: string;
    pattern: string;
    action: RuleAction;
    description?: string | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
}>;
export declare const UpdateSecurityRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    pattern: z.ZodOptional<z.ZodString>;
    action: z.ZodOptional<z.ZodNativeEnum<typeof RuleAction>>;
    enabled: z.ZodOptional<z.ZodBoolean>;
    priority: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    pattern?: string | undefined;
    action?: RuleAction | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    pattern?: string | undefined;
    action?: RuleAction | undefined;
    enabled?: boolean | undefined;
    priority?: number | undefined;
}>;
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
