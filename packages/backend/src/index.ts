/**
 * AIProxy - Secure AI Gateway for Enterprises
 * Copyright (C) 2025 Expertnocode
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createAPIResponse, validateEnv } from '@aiproxy/shared';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { ruleRoutes } from './routes/rules';
import { auditRoutes } from './routes/audit';
import { configRoutes } from './routes/config';
import { proxyRoutes } from './routes/proxy';

dotenv.config();

validateEnv(process.env, [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
]);

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
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

app.get('/health', (req, res) => {
  res.json(createAPIResponse({ status: 'healthy', timestamp: new Date().toISOString() }));
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rules', ruleRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/proxy', proxyRoutes);

app.use('*', (req, res) => {
  res.status(404).json(createAPIResponse(undefined, {
    code: 'NOT_FOUND',
    message: 'Endpoint not found'
  }));
});

app.use(errorHandler);

const server = app.listen(port, '0.0.0.0', () => {
  logger.info(`AIProxy Backend running on port ${port}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export default app;