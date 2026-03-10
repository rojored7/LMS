/**
 * Auth Test Helpers
 * Funciones auxiliares para tests de autenticación
 */

import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

export function generateTestToken(payload: any, secret: string = 'test-secret'): string {
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

export function generateExpiredToken(payload: any, secret: string = 'test-secret'): string {
  return jwt.sign(payload, secret, { expiresIn: '-1h' });
}

export function generateRefreshToken(userId: string, secret: string = 'test-refresh-secret'): string {
  return jwt.sign({ userId, type: 'refresh' }, secret, { expiresIn: '7d' });
}

export function generateAuthHeaders(token: string): { [key: string]: string } {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function generateMockRequest(options: {
  user?: any;
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
  cookies?: any;
} = {}): any {
  return {
    user: options.user || null,
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    cookies: options.cookies || {},
    get: jest.fn((header: string) => options.headers?.[header]),
  };
}

export function generateMockResponse(): any {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    cookie: jest.fn(() => res),
    clearCookie: jest.fn(() => res),
    redirect: jest.fn(() => res),
    set: jest.fn(() => res),
    locals: {},
  };
  return res;
}

export function generateMockNext(): jest.Mock {
  return jest.fn();
}

export function createAuthenticatedRequest(userId: string, role: UserRole = UserRole.STUDENT): any {
  return generateMockRequest({
    user: {
      userId,
      email: `${role.toLowerCase()}@test.com`,
      role,
    },
    headers: {
      authorization: `Bearer ${generateTestToken({ userId, role })}`,
    },
  });
}

export function expectUnauthorizedResponse(res: any): void {
  expect(res.status).toHaveBeenCalledWith(401);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      error: expect.stringContaining('Unauthorized'),
    })
  );
}

export function expectForbiddenResponse(res: any): void {
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json).toHaveBeenCalledWith(
    expect.objectContaining({
      success: false,
      error: expect.stringContaining('Forbidden'),
    })
  );
}

export function expectSuccessResponse(res: any, data?: any): void {
  expect(res.status).toHaveBeenCalledWith(200);
  if (data) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data,
      })
    );
  } else {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  }
}

export function expectErrorResponse(res: any, status: number, errorMessage?: string): void {
  expect(res.status).toHaveBeenCalledWith(status);
  if (errorMessage) {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.stringContaining(errorMessage),
      })
    );
  } else {
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.any(String),
      })
    );
  }
}