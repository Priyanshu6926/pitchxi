import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  hashPassword,
  comparePassword,
  generateAuthTokens,
  verifyRefreshToken
} from '../services/authService';
import { authenticateJwt, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

/**
 * POST /api/auth/register
 * Registers a new user account and returns JWT tokens.
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Validation Error', message: 'A valid email address is required.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Validation Error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0) {
      res.status(400).json({ error: 'Validation Error', message: 'A display name is required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      res.status(409).json({ error: 'Conflict', message: 'An account with this email address already exists.' });
      return;
    }

    // Hash password and save user
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: displayName.trim()
      }
    });

    // Generate tokens
    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      displayName: user.displayName
    });

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      },
      tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to complete registration.' });
  }
});

/**
 * POST /api/auth/login
 * Verifies email and password and returns new JWT tokens.
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Validation Error', message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await comparePassword(String(password), user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid email or password.' });
      return;
    }

    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      displayName: user.displayName
    });

    res.json({
      message: 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt
      },
      tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to process login.' });
  }
});

/**
 * POST /api/auth/refresh
 * Validates a refresh token and generates a new access token.
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Validation Error', message: 'Refresh token is required.' });
      return;
    }

    let payload: { userId: string; email: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired refresh token.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not found.' });
      return;
    }

    const tokens = generateAuthTokens({
      userId: user.id,
      email: user.email,
      displayName: user.displayName
    });

    res.json({
      message: 'Tokens refreshed successfully.',
      tokens
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to refresh token.' });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently authenticated user profile.
 */
router.get('/me', authenticateJwt, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'Not Found', message: 'User profile not found.' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch user profile.' });
  }
});

export default router;
