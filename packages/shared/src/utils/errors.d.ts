export declare class APIError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(message: string, code: string, statusCode?: number, details?: Record<string, unknown> | undefined);
}
export declare class ValidationError extends APIError {
    constructor(message: string, details?: Record<string, unknown> | undefined);
}
export declare class AuthenticationError extends APIError {
    constructor(message?: string);
}
export declare class AuthorizationError extends APIError {
    constructor(message?: string);
}
export declare class NotFoundError extends APIError {
    constructor(resource: string);
}
export declare class ConflictError extends APIError {
    constructor(message: string);
}
export declare class RateLimitError extends APIError {
    constructor(message?: string);
}
export declare class PIIDetectionError extends APIError {
    constructor(message: string);
}
export declare class AIProviderError extends APIError {
    constructor(provider: string, message: string);
}
//# sourceMappingURL=errors.d.ts.map