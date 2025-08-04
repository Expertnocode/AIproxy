import { Router } from 'express';
import { UpdateUserSchema, validateRequest, createAPIResponse, NotFoundError } from '@aiproxy/shared';
import { prisma } from '../utils/database';
import { authenticateToken, requireAdmin, requireUser } from '../middleware/auth';

export const userRoutes = Router();

userRoutes.use(authenticateToken);

userRoutes.get('/', requireAdmin, async (req, res, next): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(createAPIResponse(users, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

userRoutes.get('/:id', requireUser, async (req, res, next): Promise<any> => {
  try {
    const { id } = req.params;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      return res.status(403).json(createAPIResponse(
        undefined,
        { code: 'AUTHORIZATION_ERROR', message: 'Insufficient permissions' },
        req.id
      ));
    }

    if (!id) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'User ID is required' },
        req.id
      ));
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json(createAPIResponse(user, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

userRoutes.put('/:id', requireUser, async (req, res, next): Promise<any> => {
  try {
    const { id } = req.params;

    if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
      return res.status(403).json(createAPIResponse(
        undefined,
        { code: 'AUTHORIZATION_ERROR', message: 'Insufficient permissions' },
        req.id
      ));
    }

    const validation = validateRequest(UpdateUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { errors: validation.errors } },
        req.id
      ));
    }

    const updateData = validation.data;

    if (updateData.role && req.user!.role !== 'ADMIN') {
      return res.status(403).json(createAPIResponse(
        undefined,
        { code: 'AUTHORIZATION_ERROR', message: 'Only admins can change user roles' },
        req.id
      ));
    }

    if (!id) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'User ID is required' },
        req.id
      ));
    }

    const user = await prisma.user.update({
      where: { id },
      data: Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      ),
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    res.json(createAPIResponse(user, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

userRoutes.delete('/:id', requireAdmin, async (req, res, next): Promise<any> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'User ID is required' },
        req.id
      ));
    }

    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json(createAPIResponse({ message: 'User deleted successfully' }, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});