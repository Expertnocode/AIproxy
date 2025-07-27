import { z } from 'zod';

export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Invalid data format'] };
  }
}

export function createAPIResponse<T>(
  data?: T,
  error?: { code: string; message: string; details?: Record<string, unknown> },
  requestId?: string
) {
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

export const validateEnv = (envVars: Record<string, string | undefined>, required: string[]): void => {
  const missing = required.filter(key => !envVars[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};