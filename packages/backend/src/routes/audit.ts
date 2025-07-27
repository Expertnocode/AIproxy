import { Router } from 'express';
import { PaginationSchema, validateRequest, createAPIResponse } from '@aiproxy/shared';
import { prisma } from '../utils/database';
import { authenticateToken, requireUser, requireAdmin } from '../middleware/auth';

export const auditRoutes = Router();

auditRoutes.use(authenticateToken);

auditRoutes.get('/logs', requireUser, async (req, res, next) => {
  try {
    // Convert query string parameters to proper types
    const queryData = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const validation = validateRequest(PaginationSchema, queryData);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid pagination parameters', details: { errors: validation.errors } },
        req.id
      ));
    }

    const { page, limit, sortBy, sortOrder } = validation.data;
    const skip = (page - 1) * limit;

    const where = req.user!.role === 'ADMIN' 
      ? {} 
      : { userId: req.user!.id };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy 
          ? { [sortBy]: sortOrder }
          : { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json(createAPIResponse({
      items: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

auditRoutes.get('/usage', requireUser, async (req, res, next) => {
  try {
    // Convert query string parameters to proper types
    const queryData = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    };

    const validation = validateRequest(PaginationSchema, queryData);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid pagination parameters', details: { errors: validation.errors } },
        req.id
      ));
    }

    const { page, limit, sortBy, sortOrder } = validation.data;
    const skip = (page - 1) * limit;

    const where = req.user!.role === 'ADMIN' 
      ? {} 
      : { userId: req.user!.id };

    const [usage, total] = await Promise.all([
      prisma.usage.findMany({
        where,
        skip,
        take: limit,
        orderBy: sortBy 
          ? { [sortBy]: sortOrder }
          : { timestamp: 'desc' }
      }),
      prisma.usage.count({ where })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json(createAPIResponse({
      data: usage,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

auditRoutes.get('/analytics/summary', requireUser, async (req, res, next) => {
  try {
    const userId = req.user!.role === 'ADMIN' ? undefined : req.user!.id;
    const where = userId ? { userId } : {};

    // Calculate date ranges for comparison
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeekWhere = { ...where, timestamp: { gte: oneWeekAgo } };
    const lastWeekWhere = { 
      ...where, 
      timestamp: { 
        gte: twoWeeksAgo, 
        lt: oneWeekAgo 
      } 
    };

    const [
      // Current totals
      totalRequests,
      totalTokens,
      totalCost,
      piiDetections,
      
      // This week stats
      thisWeekRequests,
      thisWeekTokens,
      thisWeekCost,
      thisWeekPii,
      
      // Last week stats
      lastWeekRequests,
      lastWeekTokens,
      lastWeekCost,
      lastWeekPii,
      
      recentActivity
    ] = await Promise.all([
      // Current totals
      prisma.usage.count({ where }),
      prisma.usage.aggregate({
        where,
        _sum: { totalTokens: true }
      }),
      prisma.usage.aggregate({
        where,
        _sum: { cost: true }
      }),
      prisma.usage.count({
        where: { ...where, piiDetected: true }
      }),
      
      // This week
      prisma.usage.count({ where: thisWeekWhere }),
      prisma.usage.aggregate({
        where: thisWeekWhere,
        _sum: { totalTokens: true }
      }),
      prisma.usage.aggregate({
        where: thisWeekWhere,
        _sum: { cost: true }
      }),
      prisma.usage.count({
        where: { ...thisWeekWhere, piiDetected: true }
      }),
      
      // Last week
      prisma.usage.count({ where: lastWeekWhere }),
      prisma.usage.aggregate({
        where: lastWeekWhere,
        _sum: { totalTokens: true }
      }),
      prisma.usage.aggregate({
        where: lastWeekWhere,
        _sum: { cost: true }
      }),
      prisma.usage.count({
        where: { ...lastWeekWhere, piiDetected: true }
      }),
      
      prisma.usage.findMany({
        where,
        take: 10,
        orderBy: { timestamp: 'desc' },
        select: {
          provider: true,
          model: true,
          totalTokens: true,
          timestamp: true,
          piiDetected: true
        }
      })
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): { value: number; direction: 'up' | 'down' | 'neutral' } => {
      if (previous === 0) {
        return { value: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'neutral' };
      }
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
      };
    };

    const requestsChange = calculateChange(thisWeekRequests, lastWeekRequests);
    const tokensChange = calculateChange(
      thisWeekTokens._sum.totalTokens || 0, 
      lastWeekTokens._sum.totalTokens || 0
    );
    const costChange = calculateChange(
      Number(thisWeekCost._sum.cost || 0), 
      Number(lastWeekCost._sum.cost || 0)
    );
    const piiChange = calculateChange(thisWeekPii, lastWeekPii);

    res.json(createAPIResponse({
      summary: {
        totalRequests,
        totalTokens: totalTokens._sum.totalTokens || 0,
        totalCost: totalCost._sum.cost || 0,
        piiDetections
      },
      trends: {
        requests: {
          thisWeek: thisWeekRequests,
          lastWeek: lastWeekRequests,
          change: requestsChange
        },
        tokens: {
          thisWeek: thisWeekTokens._sum.totalTokens || 0,
          lastWeek: lastWeekTokens._sum.totalTokens || 0,
          change: tokensChange
        },
        cost: {
          thisWeek: Number(thisWeekCost._sum.cost || 0),
          lastWeek: Number(lastWeekCost._sum.cost || 0),
          change: costChange
        },
        pii: {
          thisWeek: thisWeekPii,
          lastWeek: lastWeekPii,
          change: piiChange
        }
      },
      recentActivity
    }, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

