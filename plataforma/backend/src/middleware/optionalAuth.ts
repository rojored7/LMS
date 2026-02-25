/**
 * Optional Authentication Middleware
 * Similar to authenticate, but doesn't throw error if no token is provided
 * If token exists, validates it and attaches user to request
 * If no token, continues without user
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types/auth';
import { prisma } from '../utils/prisma';

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Try to extract token
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      // No token provided, continue without authentication
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      // Invalid format, continue without authentication
      return next();
    }

    const token = parts[1];

    try {
      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
        },
      });

      if (user) {
        // Attach user to request (usando userId para consistencia con authenticate middleware)
        req.user = {
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar || undefined,
        };
      }
    } catch (error) {
      // Token invalid or expired, continue without authentication
      // Don't throw error, just continue
    }

    next();
  } catch (error) {
    // Any unexpected error, continue without authentication
    next();
  }
}
