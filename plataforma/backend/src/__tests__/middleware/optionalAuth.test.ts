/**
 * optionalAuth Middleware Tests
 * Tests exhaustivos para el middleware de optionalauth
 */

import { Request, Response, NextFunction } from 'express';
import { optionalAuthMiddleware } from '../../middleware/optionalAuth';
import {
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  expectUnauthorizedResponse,
  expectForbiddenResponse
} from '../helpers/auth.helper';

describe('OptionalAuthMiddleware', () => {
  let middleware: OptionalAuthMiddleware;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    middleware = new OptionalAuthMiddleware();
    req = generateMockRequest();
    res = generateMockResponse();
    next = generateMockNext();
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should pass valid request', async () => {
      req.headers = { authorization: 'Bearer valid-token' };

      await middleware.validate(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject invalid request', async () => {
      req.headers = {};

      await middleware.validate(req, res, next);

      expectUnauthorizedResponse(res);
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle malformed data', async () => {
      req.headers = { authorization: 'malformed' };

      await middleware.validate(req, res, next);

      expectUnauthorizedResponse(res);
    });

    it('should pass errors to next middleware', async () => {
      const error = new Error('Middleware error');
      jest.spyOn(middleware, 'validate').mockRejectedValue(error);

      await middleware.validate(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('rate limiting', () => {
    it('should allow requests within limit', async () => {
      for (let i = 0; i < 10; i++) {
        await middleware.checkRateLimit(req, res, next);
        expect(next).toHaveBeenCalled();
      }
    });

    it('should block requests exceeding limit', async () => {
      for (let i = 0; i < 100; i++) {
        await middleware.checkRateLimit(req, res, next);
      }

      await middleware.checkRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('sanitization', () => {
    it('should sanitize input data', async () => {
      req.body = {
        text: '<script>alert("XSS")</script>Normal text',
        safe: 'No dangerous content'
      };

      await middleware.sanitize(req, res, next);

      expect(req.body.text).not.toContain('<script>');
      expect(req.body.safe).toBe('No dangerous content');
      expect(next).toHaveBeenCalled();
    });

    it('should handle SQL injection attempts', async () => {
      req.body = {
        query: "'; DROP TABLE users; --"
      };

      await middleware.sanitize(req, res, next);

      expect(req.body.query).not.toContain('DROP TABLE');
    });
  });

  describe('cors', () => {
    it('should set proper CORS headers', async () => {
      req.headers.origin = 'http://localhost:3000';

      await middleware.cors(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://localhost:3000');
      expect(next).toHaveBeenCalled();
    });

    it('should reject unauthorized origins', async () => {
      req.headers.origin = 'http://malicious-site.com';

      await middleware.cors(req, res, next);

      expect(res.set).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://malicious-site.com');
    });
  });

  describe('logging', () => {
    it('should log requests', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();

      await middleware.logRequest(req, res, next);

      expect(logSpy).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('should log response time', async () => {
      const start = Date.now();

      await middleware.logResponseTime(req, res, next);

      expect(res.locals.responseTime).toBeDefined();
      expect(res.locals.responseTime).toBeGreaterThanOrEqual(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and format errors', async () => {
      const error = new Error('Test error');

      await middleware.handleError(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Test error'
        })
      );
    });

    it('should handle different error types', async () => {
      const validationError = { type: 'validation', message: 'Invalid input' };

      await middleware.handleError(validationError, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
