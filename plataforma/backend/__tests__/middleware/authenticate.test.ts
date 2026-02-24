/**
 * Tests de integración para el middleware de autenticación
 * HU-004: Middleware de Autenticación JWT
 *
 * Prueba todos los criterios de aceptación de la historia de usuario:
 * - AC1: Extracción del JWT del header Authorization
 * - AC2: Validación de firma y expiración del token
 * - AC3: Población de req.user con datos del token
 * - AC4: Respuesta 401 para tokens inválidos/expirados/faltantes
 * - AC5: Refresh token mechanism
 * - AC6: Endpoint /auth/logout que invalida tokens
 * - AC7: Sistema de blacklist en Redis
 */

import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/utils/prisma';
import { redis } from '../../src/utils/redis';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import { tokenService } from '../../src/services/token.service';
import bcrypt from 'bcrypt';

describe('HU-004: Middleware de Autenticación JWT', () => {
  let testUser: any;
  let validAccessToken: string;
  let validRefreshToken: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    testUser = await prisma.user.create({
      data: {
        email: 'auth-test@example.com',
        passwordHash: await bcrypt.hash('TestPassword123!', 12),
        name: 'Auth Test User',
        role: 'STUDENT',
      },
    });

    // Generar tokens válidos
    validAccessToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      config.JWT_SECRET,
      { expiresIn: '1h' }
    );

    validRefreshToken = jwt.sign(
      {
        userId: testUser.id,
        email: testUser.email,
        role: testUser.role,
      },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Guardar refresh token en BD
    await prisma.refreshToken.create({
      data: {
        userId: testUser.id,
        token: validRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.refreshToken.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });

    // Limpiar Redis (blacklist)
    const keys = await redis.keys('blacklist:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    const userKeys = await redis.keys('user:*:tokens_invalidated');
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }
  });

  describe('AC1 & AC3: Extracción de token y población de req.user', () => {
    it('Debe extraer token del header Authorization (Bearer) y adjuntar req.user', async () => {
      // Usar un endpoint protegido existente
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validAccessToken}`);

      // El endpoint debe responder exitosamente
      expect(res.status).not.toBe(401);

      // El usuario debe estar presente en la respuesta
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('Debe rechazar token sin el prefijo Bearer', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', validAccessToken); // Sin "Bearer "

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Formato de token inválido');
    });

    it('Debe rechazar Authorization header vacío', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', '');

      expect(res.status).toBe(401);
    });
  });

  describe('AC4: Respuesta 401 para tokens inválidos, expirados o faltantes', () => {
    it('Debe retornar 401 cuando no se proporciona token', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('No se proporcionó token');
    });

    it('Debe retornar 401 con token inválido', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token inválido');
    });

    it('Debe retornar 401 con token expirado', async () => {
      // Crear token expirado (hace 1 hora)
      const expiredToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('expirado');
    });

    it('Debe retornar 401 con token firmado con secret incorrecto', async () => {
      const fakeToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        'wrong-secret-key',
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${fakeToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Token inválido');
    });

    it('Debe retornar 401 con token de usuario inexistente', async () => {
      const fakeUserId = '00000000-0000-0000-0000-000000000000';
      const tokenWithFakeUser = jwt.sign(
        {
          userId: fakeUserId,
          email: 'fake@example.com',
          role: 'STUDENT',
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${tokenWithFakeUser}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Usuario no encontrado');
    });
  });

  describe('AC5: Refresh token mechanism', () => {
    it('Debe renovar access token con refresh token válido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: validRefreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      // El nuevo access token debe ser diferente al original
      expect(res.body.data.accessToken).not.toBe(validAccessToken);

      // El nuevo token debe ser válido
      const decoded = jwt.verify(res.body.data.accessToken, config.JWT_SECRET) as any;
      expect(decoded.userId).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
    });

    it('Debe rechazar refresh token inválido', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('Debe rechazar refresh token expirado', async () => {
      const expiredRefreshToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_REFRESH_SECRET,
        { expiresIn: '-1d' }
      );

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredRefreshToken });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('AC6 & AC7: Logout y blacklist de tokens', () => {
    it('Debe agregar access token a blacklist en logout', async () => {
      // Crear un nuevo token para esta prueba
      const testToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Crear refresh token
      const testRefreshToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await prisma.refreshToken.create({
        data: {
          userId: testUser.id,
          token: testRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Hacer logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ refreshToken: testRefreshToken });

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
      expect(logoutRes.body.message).toContain('Logout exitoso');

      // Verificar que el token está en blacklist
      const isBlacklisted = await tokenService.isBlacklisted(testToken);
      expect(isBlacklisted).toBe(true);

      // Verificar que el token ya no funciona
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('revocado');
    });

    it('Debe eliminar refresh token de la BD en logout', async () => {
      // Crear refresh token
      const testRefreshToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      await prisma.refreshToken.create({
        data: {
          userId: testUser.id,
          token: testRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Hacer logout
      await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: testRefreshToken });

      // Verificar que el refresh token fue eliminado
      const storedToken = await prisma.refreshToken.findFirst({
        where: { token: testRefreshToken },
      });

      expect(storedToken).toBeNull();

      // Intentar usar el refresh token
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: testRefreshToken });

      expect(res.status).toBe(401);
    });

    it('Debe manejar logout sin tokens (idempotente)', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('AC7: Sistema de blacklist con TTL en Redis', () => {
    it('Debe almacenar token en blacklist con TTL correcto', async () => {
      const testToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Agregar a blacklist
      await tokenService.blacklistToken(testToken);

      // Verificar que existe en Redis
      const exists = await redis.exists(`blacklist:${testToken}`);
      expect(exists).toBe(1);

      // Verificar TTL (debe ser aproximadamente 1 hora = 3600 segundos)
      const ttl = await redis.ttl(`blacklist:${testToken}`);
      expect(ttl).toBeGreaterThan(3500); // Tolerancia de 100 segundos
      expect(ttl).toBeLessThanOrEqual(3600);
    });

    it('No debe agregar a blacklist un token ya expirado', async () => {
      const expiredToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      // Intentar agregar a blacklist
      await tokenService.blacklistToken(expiredToken);

      // Verificar que NO existe en Redis (no se debe blacklistear tokens ya expirados)
      const exists = await redis.exists(`blacklist:${expiredToken}`);
      expect(exists).toBe(0);
    });

    it('Debe rechazar token en blacklist incluso si es válido', async () => {
      const testToken = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Agregar a blacklist
      await tokenService.blacklistToken(testToken);

      // Intentar usar el token
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('revocado');
    });
  });

  describe('AC2: Validación de firma y expiración del token', () => {
    it('Debe validar correctamente la firma del token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${validAccessToken}`);

      expect(res.status).not.toBe(401);
      expect(res.body.data.user.id).toBe(testUser.id);
    });

    it('Debe rechazar token con payload incompleto', async () => {
      // Token sin email
      const incompleteToken = jwt.sign(
        {
          userId: testUser.id,
          role: testUser.role,
          // email faltante
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${incompleteToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('incompletos');
    });
  });

  describe('Flujo completo: Login → Access → Refresh → Logout', () => {
    it('Debe completar el flujo de autenticación exitosamente', async () => {
      // 1. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@example.com',
          password: 'TestPassword123!',
        });

      expect(loginRes.status).toBe(200);
      const { accessToken, refreshToken } = loginRes.body.data;
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // 2. Acceder a recurso protegido
      const accessRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(accessRes.status).toBe(200);
      expect(accessRes.body.data.user.email).toBe('auth-test@example.com');

      // 3. Renovar token
      const refreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      const newAccessToken = refreshRes.body.data.accessToken;
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(accessToken);

      // 4. Usar nuevo token
      const newAccessRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(newAccessRes.status).toBe(200);

      // 5. Logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ refreshToken });

      expect(logoutRes.status).toBe(200);

      // 6. Verificar que los tokens ya no funcionan
      const afterLogoutRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${newAccessToken}`);

      expect(afterLogoutRes.status).toBe(401);

      const afterLogoutRefreshRes = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(afterLogoutRefreshRes.status).toBe(401);
    });
  });

  describe('Invalidación masiva de tokens', () => {
    it('Debe invalidar todos los tokens del usuario cuando se solicita', async () => {
      // Crear varios tokens para el usuario
      const token1 = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const token2 = jwt.sign(
        {
          userId: testUser.id,
          email: testUser.email,
          role: testUser.role,
        },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Invalidar todos los tokens del usuario
      await tokenService.blacklistUserTokens(testUser.id);

      // Ambos tokens deben ser rechazados
      const res1 = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token1}`);

      const res2 = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token2}`);

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
    });
  });
});
