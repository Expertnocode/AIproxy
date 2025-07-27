import { z } from 'zod';
export declare function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: string[];
};
export declare function createAPIResponse<T>(data?: T, error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
}, requestId?: string): {
    success: boolean;
    data: T | undefined;
    error: {
        code: string;
        message: string;
        details?: Record<string, unknown>;
    } | undefined;
    meta: {
        timestamp: string;
        requestId: string;
        version: string;
    };
};
export declare const validateEnv: (envVars: Record<string, string | undefined>, required: string[]) => void;
//# sourceMappingURL=validation.d.ts.map