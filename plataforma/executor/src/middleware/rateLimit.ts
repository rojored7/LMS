import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Rate Limiting Middleware using Redis
 * Limits execution requests per user to prevent abuse
 */
export class RateLimiter {
  private redis: Redis;
  private windowMs: number;
  private maxRequests: number;

  constructor() {
    this.redis = new Redis(config.REDIS_URL);
    this.windowMs = config.RATE_LIMIT_WINDOW_MS;
    this.maxRequests = config.RATE_LIMIT_MAX_REQUESTS;

    this.redis.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });
  }

  /**
   * Express middleware for rate limiting
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Get user identifier (from auth token, IP, or header)
        const userId = this.getUserId(req);

        if (!userId) {
          logger.warn('Rate limit: No user identifier found');
          res.status(400).json({
            success: false,
            error: 'User identification required',
          });
          return;
        }

        const allowed = await this.checkRateLimit(userId);

        if (!allowed.allowed) {
          logger.warn('Rate limit exceeded', {
            userId,
            current: allowed.current,
            limit: this.maxRequests,
            resetAt: allowed.resetAt,
          });

          res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            details: {
              limit: this.maxRequests,
              windowMs: this.windowMs,
              current: allowed.current,
              resetAt: allowed.resetAt,
            },
          });
          return;
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', (this.maxRequests - allowed.current).toString());
        res.setHeader('X-RateLimit-Reset', allowed.resetAt.toString());

        logger.debug('Rate limit check passed', {
          userId,
          current: allowed.current,
          limit: this.maxRequests,
        });

        next();
      } catch (error) {
        logger.error('Rate limit middleware error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // On error, allow request to proceed but log it
        next();
      }
    };
  }

  /**
   * Checks if user has exceeded rate limit
   */
  private async checkRateLimit(userId: string): Promise<{
    allowed: boolean;
    current: number;
    resetAt: number;
  }> {
    const key = `ratelimit:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Use Redis sorted set to track requests with timestamps
      // Remove old requests outside the window
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count requests in current window
      const count = await this.redis.zcard(key);

      // Get TTL for reset time
      const ttl = await this.redis.pttl(key);
      const resetAt = ttl > 0 ? now + ttl : now + this.windowMs;

      if (count >= this.maxRequests) {
        return {
          allowed: false,
          current: count,
          resetAt,
        };
      }

      // Add current request
      await this.redis
        .pipeline()
        .zadd(key, now, `${now}-${Math.random()}`)
        .pexpire(key, this.windowMs)
        .exec();

      return {
        allowed: true,
        current: count + 1,
        resetAt,
      };
    } catch (error) {
      logger.error('Rate limit check error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      // On error, allow request
      return {
        allowed: true,
        current: 0,
        resetAt: now + this.windowMs,
      };
    }
  }

  /**
   * Extracts user identifier from request
   */
  private getUserId(req: Request): string | null {
    // Priority order:
    // 1. User ID from authenticated session (if auth middleware is present)
    // 2. IP address as fallback
    // NOTE: Never trust client-provided headers for rate limiting identity

    // From auth middleware (if implemented)
    if ((req as any).user?.id) {
      return (req as any).user.id;
    }

    // Fallback to IP
    const ip = req.ip || req.socket.remoteAddress;
    if (ip) {
      return `ip:${ip}`;
    }

    return null;
  }

  /**
   * Manually reset rate limit for a user (admin function)
   */
  async resetUserLimit(userId: string): Promise<void> {
    const key = `ratelimit:${userId}`;
    try {
      await this.redis.del(key);
      logger.info('Rate limit reset for user', { userId });
    } catch (error) {
      logger.error('Failed to reset rate limit', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * Get current rate limit status for a user
   */
  async getUserStatus(userId: string): Promise<{
    current: number;
    limit: number;
    resetAt: number;
  }> {
    const key = `ratelimit:${userId}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      await this.redis.zremrangebyscore(key, 0, windowStart);
      const count = await this.redis.zcard(key);
      const ttl = await this.redis.pttl(key);
      const resetAt = ttl > 0 ? now + ttl : now + this.windowMs;

      return {
        current: count,
        limit: this.maxRequests,
        resetAt,
      };
    } catch (error) {
      logger.error('Failed to get user rate limit status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
      });
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
    logger.info('Rate limiter Redis connection closed');
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
export const rateLimitMiddleware = rateLimiter.middleware();
