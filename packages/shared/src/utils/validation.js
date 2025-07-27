"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnv = void 0;
exports.validateRequest = validateRequest;
exports.createAPIResponse = createAPIResponse;
const zod_1 = require("zod");
function validateRequest(schema, data) {
    try {
        const validatedData = schema.parse(data);
        return { success: true, data: validatedData };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
            return { success: false, errors };
        }
        return { success: false, errors: ['Invalid data format'] };
    }
}
function createAPIResponse(data, error, requestId) {
    return {
        success: !error,
        data,
        error,
        meta: {
            timestamp: new Date().toISOString(),
            requestId: requestId || crypto.randomUUID(),
            version: '1.0.0'
        }
    };
}
const validateEnv = (envVars, required) => {
    const missing = required.filter(key => !envVars[key]);
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};
exports.validateEnv = validateEnv;
//# sourceMappingURL=validation.js.map