"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyResponseSchema = exports.ProxyRequestSchema = exports.AIProvider = void 0;
const zod_1 = require("zod");
var AIProvider;
(function (AIProvider) {
    AIProvider["OPENAI"] = "OPENAI";
    AIProvider["CLAUDE"] = "CLAUDE";
    AIProvider["GEMINI"] = "GEMINI";
})(AIProvider || (exports.AIProvider = AIProvider = {}));
exports.ProxyRequestSchema = zod_1.z.object({
    provider: zod_1.z.nativeEnum(AIProvider),
    model: zod_1.z.string().min(1),
    messages: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['system', 'user', 'assistant']),
        content: zod_1.z.string()
    })),
    temperature: zod_1.z.number().min(0).max(2).optional(),
    maxTokens: zod_1.z.number().int().positive().optional(),
    stream: zod_1.z.boolean().default(false),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
exports.ProxyResponseSchema = zod_1.z.object({
    id: zod_1.z.string(),
    choices: zod_1.z.array(zod_1.z.object({
        message: zod_1.z.object({
            role: zod_1.z.string(),
            content: zod_1.z.string()
        }),
        finishReason: zod_1.z.string().optional()
    })),
    usage: zod_1.z.object({
        promptTokens: zod_1.z.number().int(),
        completionTokens: zod_1.z.number().int(),
        totalTokens: zod_1.z.number().int()
    }).optional(),
    model: zod_1.z.string(),
    created: zod_1.z.number().int()
});
