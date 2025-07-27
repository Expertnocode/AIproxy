import { Router } from 'express';
import { CreateSecurityRuleSchema, UpdateSecurityRuleSchema, validateRequest, createAPIResponse, NotFoundError } from '@aiproxy/shared';
import { prisma } from '../utils/database';
import { authenticateToken, requireUser } from '../middleware/auth';

export const ruleRoutes = Router();

ruleRoutes.use(authenticateToken);

ruleRoutes.get('/', async (req, res, next) => {
  try {
    // Support both authenticated requests and User-ID header (for proxy service)
    let userId: string;
    
    if (req.headers['user-id']) {
      userId = req.headers['user-id'] as string;
    } else if (req.user) {
      userId = req.user.id;
    } else {
      return res.status(401).json(createAPIResponse(
        undefined,
        { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' },
        req.id
      ));
    }

    const rules = await prisma.securityRule.findMany({
      where: { userId },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json(createAPIResponse(rules, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

ruleRoutes.get('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const rule = await prisma.securityRule.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!rule) {
      throw new NotFoundError('Security rule');
    }

    res.json(createAPIResponse(rule, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

ruleRoutes.post('/', requireUser, async (req, res, next) => {
  try {
    const validation = validateRequest(CreateSecurityRuleSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { errors: validation.errors } },
        req.id
      ));
    }

    const rule = await prisma.securityRule.create({
      data: {
        ...validation.data,
        userId: req.user!.id
      }
    });

    res.status(201).json(createAPIResponse(rule, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

ruleRoutes.put('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingRule = await prisma.securityRule.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!existingRule) {
      throw new NotFoundError('Security rule');
    }

    const validation = validateRequest(UpdateSecurityRuleSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { errors: validation.errors } },
        req.id
      ));
    }

    const rule = await prisma.securityRule.update({
      where: { id },
      data: validation.data
    });

    res.json(createAPIResponse(rule, undefined, req.id));
  } catch (error) {
    next(error);
  }
});

ruleRoutes.delete('/:id', requireUser, async (req, res, next) => {
  try {
    const { id } = req.params;

    const rule = await prisma.securityRule.findFirst({
      where: { 
        id,
        userId: req.user!.id 
      }
    });

    if (!rule) {
      throw new NotFoundError('Security rule');
    }

    await prisma.securityRule.delete({
      where: { id }
    });

    res.json(createAPIResponse({ message: 'Security rule deleted successfully' }, undefined, req.id));
  } catch (error) {
    next(error);
  }
});