import { z } from 'zod';
export declare enum AIProvider {
    OPENAI = "OPENAI",
    CLAUDE = "CLAUDE",
    GEMINI = "GEMINI"
}
export declare const ProxyRequestSchema: z.ZodObject<{
    provider: z.ZodNativeEnum<typeof AIProvider>;
    model: z.ZodString;
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant"]>;
        content: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        role: "system" | "user" | "assistant";
        content: string;
    }, {
        role: "system" | "user" | "assistant";
        content: string;
    }>, "many">;
    temperature: z.ZodOptional<z.ZodNumber>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    stream: z.ZodDefault<z.ZodBoolean>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    provider: AIProvider;
    model: string;
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
    }[];
    stream: boolean;
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    provider: AIProvider;
    model: string;
    messages: {
        role: "system" | "user" | "assistant";
        content: string;
    }[];
    temperature?: number | undefined;
    maxTokens?: number | undefined;
    stream?: boolean | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export declare const ProxyResponseSchema: z.ZodObject<{
    id: z.ZodString;
    choices: z.ZodArray<z.ZodObject<{
        message: z.ZodObject<{
            role: z.ZodString;
            content: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            role: string;
            content: string;
        }, {
            role: string;
            content: string;
        }>;
        finishReason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        message: {
            role: string;
            content: string;
        };
        finishReason?: string | undefined;
    }, {
        message: {
            role: string;
            content: string;
        };
        finishReason?: string | undefined;
    }>, "many">;
    usage: z.ZodOptional<z.ZodObject<{
        promptTokens: z.ZodNumber;
        completionTokens: z.ZodNumber;
        totalTokens: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }, {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    }>>;
    model: z.ZodString;
    created: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    model: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finishReason?: string | undefined;
    }[];
    created: number;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    } | undefined;
}, {
    id: string;
    model: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finishReason?: string | undefined;
    }[];
    created: number;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    } | undefined;
}>;
export type ProxyRequest = z.infer<typeof ProxyRequestSchema>;
export type ProxyResponse = z.infer<typeof ProxyResponseSchema>;
export interface AIModelInfo {
    id: string;
    name: string;
    provider: AIProvider;
    contextLength: number;
    inputCostPer1kTokens: number;
    outputCostPer1kTokens: number;
    supportsStreaming: boolean;
    supportsVision: boolean;
}
export interface ProxyConfig {
    defaultProvider: AIProvider;
    enablePIIDetection: boolean;
    enableRuleEngine: boolean;
    enableAuditLogging: boolean;
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
    };
    providers: {
        [AIProvider.OPENAI]: {
            apiKey: string;
            baseUrl?: string;
            organization?: string;
        };
        [AIProvider.CLAUDE]: {
            apiKey: string;
            baseUrl?: string;
        };
        [AIProvider.GEMINI]: {
            apiKey: string;
            baseUrl?: string;
        };
    };
}
