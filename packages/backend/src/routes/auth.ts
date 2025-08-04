import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { LoginSchema, CreateUserSchema, validateRequest, createAPIResponse, ConflictError, AuthenticationError } from '@aiproxy/shared';
import { prisma } from '../utils/database';
import { authenticateToken } from '../middleware/auth';

export const authRoutes = Router();

authRoutes.post('/register', async (req, res, next): Promise<any> => {
  try {
    const validation = validateRequest(CreateUserSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { errors: validation.errors } },
        req.id
      ));
    }

    const { email, name, password, role } = validation.data;

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        ...(role && { role })
      },
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

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    res.status(201).json(createAPIResponse({
      user,
      token,
      expiresAt: expiresAt.toISOString()
    }, undefined, req.id));

  } catch (error) {
    next(error);
    return;
  }
});

authRoutes.post('/login', async (req, res, next): Promise<any> => {
  try {
    const validation = validateRequest(LoginSchema, req.body);
    if (!validation.success) {
      return res.status(400).json(createAPIResponse(
        undefined,
        { code: 'VALIDATION_ERROR', message: 'Invalid input', details: { errors: validation.errors } },
        req.id
      ));
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new AuthenticationError('Invalid email or password');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.userSession.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    const { passwordHash, ...userWithoutPassword } = user;

    res.json(createAPIResponse({
      user: userWithoutPassword,
      token,
      expiresAt: expiresAt.toISOString()
    }, undefined, req.id));

  } catch (error) {
    next(error);
    return;
  }
});

authRoutes.post('/logout', authenticateToken, async (req, res, next): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (token) {
      await prisma.userSession.deleteMany({
        where: { 
          userId: req.user!.id,
          token 
        }
      });
    }

    res.json(createAPIResponse({ message: 'Logged out successfully' }, undefined, req.id));
  } catch (error) {
    next(error);
    return;
  }
});

authRoutes.get('/me', authenticateToken, async (req, res, next): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
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