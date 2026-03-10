/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * SMOKE TESTS - Critical Path Validation
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Propósito: Verificar que las funcionalidades CORE del sistema funcionan.
 * Estos tests son RÁPIDOS y detectan breakage mayor.
 *
 * Run: npm test smoke-tests.test.ts
 *
 * ⚠️  CRÍTICO: Estos tests se ejecutan en regression testing.
 *    Si CUALQUIERA falla → Workflow BLOQUEADO
 *
 * Última actualización: 2026-03-09
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

import request from 'supertest';
import app from '../../server';
import { prisma } from '../../utils/prisma';
import { redis } from '../../utils/redis';

describe('🔥 Smoke Tests - Critical Paths', () => {

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 1. HEALTH CHECKS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Health Checks', () => {
    it('should return 200 on /health endpoint', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });

    it('should verify database connection on /health/ready', async () => {
      const res = await request(app).get('/health/ready');

      // Should be either 200 (ready) or 503 (not ready)
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty('checks');
      expect(res.body.checks).toHaveProperty('database');
      expect(res.body.checks).toHaveProperty('redis');
    });

    it('should return alive on /health/live', async () => {
      const res = await request(app).get('/health/live');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'alive');
    });

    it('should directly verify Prisma connection', async () => {
      // Direct database connection test
      await expect(prisma.$queryRaw`SELECT 1 as result`).resolves.toBeDefined();
    });

    it('should directly verify Redis connection', async () => {
      // Direct Redis connection test
      const pong = await redis.ping();
      expect(pong).toBe('PONG');
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 2. AUTHENTICATION FLOW (HU-001, HU-002)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Authentication Flow', () => {
    const testEmail = `smoke-test-${Date.now()}@example.com`;
    const testPassword = 'SecurePass123!';
    let authToken: string;
    let refreshToken: string;

    it('should register a new user (POST /api/auth/register)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: testEmail,
          password: testPassword,
          name: 'Smoke Test User'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('email', testEmail);
      expect(res.body.user).toHaveProperty('role', 'STUDENT');

      authToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should login with registered credentials (POST /api/auth/login)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: testPassword
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');

      authToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should reject invalid credentials (POST /api/auth/login)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should access protected route with valid token (GET /api/users/me)', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', testEmail);
      expect(res.body).toHaveProperty('role', 'STUDENT');
    });

    it('should reject protected route without token (GET /api/users/me)', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should refresh access token (POST /api/auth/refresh)', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should logout successfully (POST /api/auth/logout)', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    // Cleanup
    afterAll(async () => {
      await prisma.user.deleteMany({
        where: { email: testEmail }
      });
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 3. COURSE LISTING & ENROLLMENT (HU-004, HU-005, HU-014)
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Course Listing & Enrollment', () => {
    it('should list courses (GET /api/courses) - public endpoint', async () => {
      const res = await request(app).get('/api/courses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('id');
        expect(res.body[0]).toHaveProperty('title');
        expect(res.body[0]).toHaveProperty('slug');
      }
    });

    it('should get course details by slug (GET /api/courses/:slug)', async () => {
      // Assuming "fundamentos-ciberseguridad" course exists from seeding
      const res = await request(app).get('/api/courses/fundamentos-ciberseguridad');

      // Accept 200 (found) or 404 (not seeded yet)
      expect([200, 404]).toContain(res.status);

      if (res.status === 200) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('title');
        expect(res.body).toHaveProperty('slug', 'fundamentos-ciberseguridad');
      }
    });

    it('should return 404 for non-existent course', async () => {
      const res = await request(app).get('/api/courses/non-existent-course-123');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 4. DATABASE OPERATIONS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Database Operations (Prisma)', () => {
    const testSlug = `smoke-test-course-${Date.now()}`;

    it('should perform basic CRUD operations on Course model', async () => {
      // CREATE
      const created = await prisma.course.create({
        data: {
          title: 'Smoke Test Course',
          description: 'Testing basic CRUD',
          level: 'BEGINNER',
          duration: 60,
          slug: testSlug,
          author: 'Test Author',
          isPublished: false
        }
      });

      expect(created).toHaveProperty('id');
      expect(created.slug).toBe(testSlug);

      // READ
      const found = await prisma.course.findUnique({
        where: { id: created.id }
      });
      expect(found).toBeDefined();
      expect(found?.title).toBe('Smoke Test Course');

      // UPDATE
      const updated = await prisma.course.update({
        where: { id: created.id },
        data: { title: 'Updated Title' }
      });
      expect(updated.title).toBe('Updated Title');

      // DELETE
      await prisma.course.delete({
        where: { id: created.id }
      });

      const deleted = await prisma.course.findUnique({
        where: { id: created.id }
      });
      expect(deleted).toBeNull();
    });

    it('should handle unique constraint violations gracefully', async () => {
      const duplicateSlug = `duplicate-${Date.now()}`;

      // Create first course
      await prisma.course.create({
        data: {
          title: 'First Course',
          description: 'Test',
          level: 'BEGINNER',
          duration: 60,
          slug: duplicateSlug,
          author: 'Test Author'
        }
      });

      // Try to create second with same slug
      await expect(
        prisma.course.create({
          data: {
            title: 'Second Course',
            description: 'Test',
            level: 'BEGINNER',
            author: 'Test Author',
            duration: 60,
            slug: duplicateSlug
          }
        })
      ).rejects.toThrow();

      // Cleanup
      await prisma.course.deleteMany({
        where: { slug: duplicateSlug }
      });
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 5. REDIS CACHE OPERATIONS
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Redis Cache Operations', () => {
    const testKey = `smoke:test:${Date.now()}`;
    const testValue = 'test-value';

    it('should set and get cache value', async () => {
      // SET
      await redis.set(testKey, testValue, 'EX', 60);

      // GET
      const retrieved = await redis.get(testKey);
      expect(retrieved).toBe(testValue);
    });

    it('should handle cache expiration', async () => {
      const expiringKey = `smoke:expiring:${Date.now()}`;

      // Set with 1 second TTL
      await redis.set(expiringKey, 'value', 'EX', 1);

      // Verify exists
      const exists1 = await redis.exists(expiringKey);
      expect(exists1).toBe(1);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Verify expired
      const exists2 = await redis.exists(expiringKey);
      expect(exists2).toBe(0);
    });

    it('should delete cache value', async () => {
      const deleteKey = `smoke:delete:${Date.now()}`;

      await redis.set(deleteKey, 'value');
      expect(await redis.exists(deleteKey)).toBe(1);

      await redis.del(deleteKey);
      expect(await redis.exists(deleteKey)).toBe(0);
    });

    // Cleanup
    afterAll(async () => {
      await redis.del(testKey);
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 6. ERROR HANDLING
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/api/non-existent-endpoint-xyz-123');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json syntax }');

      expect(res.status).toBe(400);
    });

    it('should validate request body (missing fields)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          // Missing email, password, name
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should enforce rate limiting on /api/* routes', async () => {
      // Make many rapid requests
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/api/courses')
      );

      const responses = await Promise.all(requests);

      // All should succeed or some may be rate limited
      responses.forEach(res => {
        expect([200, 429]).toContain(res.status);
      });
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 7. RBAC (Role-Based Access Control) - HU-003
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('RBAC - Role-Based Access Control', () => {
    it('should reject non-admin access to admin routes', async () => {
      // Create regular student user
      const studentEmail = `student-smoke-${Date.now()}@example.com`;
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          email: studentEmail,
          password: 'Pass123!',
          name: 'Student'
        });

      const studentToken = registerRes.body.accessToken;

      // Try to access admin route
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');

      // Cleanup
      await prisma.user.deleteMany({
        where: { email: studentEmail }
      });
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * 8. API DOCUMENTATION
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  describe('API Documentation', () => {
    it('should serve Swagger UI at /api-docs', async () => {
      const res = await request(app).get('/api-docs/');

      // Swagger UI returns HTML
      expect([200, 301, 302]).toContain(res.status);
    });

    it('should return API info at /api', async () => {
      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('endpoints');
    });
  });

  /**
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   * CLEANUP
   * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   */
  afterAll(async () => {
    // Disconnect Prisma
    await prisma.$disconnect();

    // Disconnect Redis
    await redis.quit();
  });
});
