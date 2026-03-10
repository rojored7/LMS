/**
 * Tests de Integración para Recuperación de Contraseña
 * HU-005: Recuperación de Contraseña
 */

import request from 'supertest';
import app from '../../server';
import { prisma } from '../../utils/prisma';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

describe('HU-005: Recuperación de Contraseña', () => {
  let testEmail: string;
  let testUserId: string;

  beforeAll(async () => {
    // Crear usuario de prueba
    testEmail = 'reset@test.com';
    const passwordHash = await bcrypt.hash('OldPassword123!', 12);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        name: 'Test User',
        role: 'STUDENT',
      },
    });

    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.passwordResetToken.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('AC1: Debe aceptar solicitud con email válido', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('recibirás instrucciones');
    });

    it('AC2: Debe generar token único y guardarlo con expiración', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      const token = await prisma.passwordResetToken.findFirst({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(token).toBeTruthy();
      expect(token!.token).toBeDefined();
      expect(token!.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(token!.usedAt).toBeNull();
    });

    it('AC8: No debe revelar si el email existe', async () => {
      const res1 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail });

      const res2 = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'noexiste@test.com' });

      // Ambas respuestas deben ser idénticas
      expect(res1.status).toBe(res2.status);
      expect(res1.body.message).toBe(res2.body.message);
    });

    it('Debe rechazar email inválido', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/verify-reset-token/:token', () => {
    it('AC4: Debe verificar token válido', async () => {
      // Generar token manualmente
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 3600000), // 1 hora
        },
      });

      const res = await request(app)
        .get(`/api/auth/verify-reset-token/${plainToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(true);
      expect(res.body.data.userId).toBe(testUserId);
    });

    it('AC4: Debe rechazar token expirado', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() - 1000), // Expirado
        },
      });

      const res = await request(app)
        .get(`/api/auth/verify-reset-token/${plainToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(false);
    });

    it('Debe rechazar token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/verify-reset-token/invalid-token-123');

      expect(res.status).toBe(200);
      expect(res.body.data.valid).toBe(false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('AC4, AC5, AC6: Debe resetear contraseña con token válido', async () => {
      // Generar token manualmente
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: plainToken,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('restablecida exitosamente');

      // Verificar que la contraseña cambió
      const user = await prisma.user.findUnique({ where: { id: testUserId } });
      const passwordMatch = await bcrypt.compare('NewPassword123!', user!.passwordHash);
      expect(passwordMatch).toBe(true);

      // Verificar que el token fue marcado como usado
      const token = await prisma.passwordResetToken.findFirst({
        where: { token: tokenHash },
      });
      expect(token!.usedAt).not.toBeNull();
    });

    it('AC5: Debe validar requisitos de contraseña', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Contraseña débil
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: plainToken,
          newPassword: 'weak',
          confirmPassword: 'weak',
        });

      expect(res.status).toBe(400);
    });

    it('AC6: Debe rechazar token ya usado', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 3600000),
          usedAt: new Date(), // Ya usado
        },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: plainToken,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
    });

    it('Debe rechazar si las contraseñas no coinciden', async () => {
      const plainToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: testUserId,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: plainToken,
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('AC7: Flujo completo de recuperación', () => {
    it('Debe completar flujo: solicitar → verificar → resetear → login', async () => {
      const newEmail = 'fullflow@test.com';
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewSecurePassword123!';

      // 1. Crear usuario
      const passwordHash = await bcrypt.hash(oldPassword, 12);
      const user = await prisma.user.create({
        data: {
          email: newEmail,
          passwordHash,
          name: 'Full Flow Test',
          role: 'STUDENT',
        },
      });

      try {
        // 2. Solicitar reseteo
        const forgotRes = await request(app)
          .post('/api/auth/forgot-password')
          .send({ email: newEmail });

        expect(forgotRes.status).toBe(200);

        // 3. Obtener token (en test, desde DB)
        const resetToken = await prisma.passwordResetToken.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
        });

        expect(resetToken).toBeTruthy();

        // Generar token plano desde hash (en producción viene del email)
        // Para el test, necesitamos recrear el token plano
        const plainToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

        // Actualizar con nuestro token conocido
        await prisma.passwordResetToken.update({
          where: { id: resetToken!.id },
          data: { token: tokenHash },
        });

        // 4. Verificar token
        const verifyRes = await request(app)
          .get(`/api/auth/verify-reset-token/${plainToken}`);

        expect(verifyRes.body.data.valid).toBe(true);

        // 5. Resetear contraseña
        const resetRes = await request(app)
          .post('/api/auth/reset-password')
          .send({
            token: plainToken,
            newPassword,
            confirmPassword: newPassword,
          });

        expect(resetRes.status).toBe(200);

        // 6. Verificar login con nueva contraseña
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: newEmail,
            password: newPassword,
          });

        expect(loginRes.status).toBe(200);
        expect(loginRes.body.data.accessToken).toBeDefined();

        // 7. Verificar que contraseña vieja no funciona
        const loginOldRes = await request(app)
          .post('/api/auth/login')
          .send({
            email: newEmail,
            password: oldPassword,
          });

        expect(loginOldRes.status).toBe(401);
      } finally {
        // Cleanup
        await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    });
  });
});
