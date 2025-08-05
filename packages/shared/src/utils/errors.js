"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderError = exports.PIIDetectionError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.APIError = void 0;
class APIError extends Error {
    constructor(message, code, statusCode = 500, details) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.APIError = APIError;
class ValidationError extends APIError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', 400, details);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends APIError {
    constructor(message = 'Authentication required') {
        super(message, 'AUTHENTICATION_ERROR', 401);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends APIError {
    constructor(message = 'Insufficient permissions') {
        super(message, 'AUTHORIZATION_ERROR', 403);
        this.name = 'AuthorizationError';
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends APIError {
    constructor(resource) {
        super(`${resource} not found`, 'NOT_FOUND', 404);
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends APIError {
    constructor(message) {
        super(message, 'CONFLICT', 409);
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends APIError {
    constructor(message = 'Rate limit exceeded') {
        super(message, 'RATE_LIMIT_EXCEEDED', 429);
        this.name = 'RateLimitError';
    }
}
exports.RateLimitError = RateLimitError;
class PIIDetectionError extends APIError {
    constructor(message) {
        super(message, 'PII_DETECTION_ERROR', 500);
        this.name = 'PIIDetectionError';
    }
}
exports.PIIDetectionError = PIIDetectionError;
class AIProviderError extends APIError {
    constructor(provider, message) {
        super(`${provider} API error: ${message}`, 'AI_PROVIDER_ERROR', 502);
        this.name = 'AIProviderError';
    }
}
exports.AIProviderError = AIProviderError;
