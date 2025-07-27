import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createAPIResponse, validateEnv } from '@aiproxy/shared';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { createSecurityMiddleware } from './middleware/security';
import { proxyRoutes } from './routes/proxy';

dotenv.config();

validateEnv(process.env, [
  'NODE_ENV',
  'BACKEND_URL'
]);

const app = express();
const port = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: createAPIResponse(undefined, {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP'
  })
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(createSecurityMiddleware());

app.get('/health', (req, res) => {
  res.json(createAPIResponse({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'aiproxy-proxy'
  }));
});

app.use('/api/v1/proxy', proxyRoutes);

app.use('*', (req, res) => {
  res.status(404).json(createAPIResponse(undefined, {
    code: 'NOT_FOUND',
    message: 'Proxy endpoint not found'
  }));
});

app.use(errorHandler);

const server = app.listen(port, () => {
  logger.info(`AIProxy Proxy Service running on port ${port}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;