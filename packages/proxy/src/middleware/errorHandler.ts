import { Request, Response, NextFunction } from 'express';
import { APIError, createAPIResponse } from '@aiproxy/shared';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = req.id || 'unknown';
  
  logger.error('Proxy request error:', {
    requestId,
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method
  });

  if (error instanceof APIError) {
    res.status(error.statusCode).json(createAPIResponse(
      undefined,
      {
        code: error.code,
        message: error.message,
        details: error.details
      },
      requestId
    ));
    return;
  }

  if (error.name === 'ValidationError') {
    res.status(400).json(createAPIResponse(
      undefined,
      {
        code: 'VALIDATION_ERROR',
        message: error.message
      },
      requestId
    ));
    return;
  }

  res.status(500).json(createAPIResponse(
    undefined,
    {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred in proxy service' 
        : error.message
    },
    requestId
  ));
}