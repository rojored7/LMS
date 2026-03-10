/**
 * Tests de Integración para HU-001: Registro de Usuario
 * Valida todos los criterios de aceptación de la historia de usuario
 */

// Set test environment before any imports
process.env['NODE_ENV'] = 'test';

import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/utils/prisma';

/**
 * Suite de tests para HU-001: Registro de Usuario
 */
describe('HU-001: Registro de Usuario', () => {
  /**
   * Limpiar usuarios de prueba después de todos los tests
   */
  afterAll(async () => {
    // Limpiar usuarios de prueba
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@test.com',
        },
      },
    });
    // Desconectar Prisma
    await prisma.$disconnect();
  });

  /**
   * AC1: Usuario puede registrarse con datos válidos
   */
  it('AC1: Usuario puede registrarse con datos válidos', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'nuevo@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!',
      name: 'Usuario Test',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Usuario registrado exitosamente');
    expect(response.body.data.user.email).toBe('nuevo@test.com');
    expect(response.body.data.user.name).toBe('Usuario Test');
    expect(response.body.data.user.role).toBe('STUDENT');
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('createdAt');
    // AC4: No debe retornar el password hash
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data.user).not.toHaveProperty('password');
  });

  /**
   * AC2: Email duplicado retorna error 409
   */
  it('AC2: Email duplicado retorna 409', async () => {
    // Crear usuario primero
    await request(app).post('/api/auth/register').send({
      email: 'duplicado@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!',
      name: 'Usuario Primero',
    });

    // Intentar duplicar
    const response = await request(app).post('/api/auth/register').send({
      email: 'duplicado@test.com',
      password: 'Test123!',
      confirmPassword: 'Test123!',
      name: 'Usuario Duplicado',
    });

    expect(response.status).toBe(409);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('email');
  });

  /**
   * AC3: Password débil retorna error 400
   */
  describe('AC3: Validación de requisitos de contraseña', () => {
    it('Rechaza contraseña sin mínimo 8 caracteres', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'corta@test.com',
        password: 'Test1!',
        confirmPassword: 'Test1!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza contraseña sin mayúscula', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'nomayus@test.com',
        password: 'test123!',
        confirmPassword: 'test123!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza contraseña sin minúscula', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'nominus@test.com',
        password: 'TEST123!',
        confirmPassword: 'TEST123!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza contraseña sin número', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'nonumero@test.com',
        password: 'TestTest!',
        confirmPassword: 'TestTest!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza contraseña sin carácter especial', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'noespecial@test.com',
        password: 'Test1234',
        confirmPassword: 'Test1234',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  /**
   * AC4: Contraseñas no coinciden retorna error 400
   */
  it('AC4: Contraseñas no coinciden retorna 400', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'mismatch@test.com',
      password: 'Test123!',
      confirmPassword: 'Test456!',
      name: 'Usuario Mismatch',
    });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('validación');
  });

  /**
   * AC5: Validación de campos obligatorios
   */
  describe('AC5: Validación de campos obligatorios', () => {
    it('Rechaza registro sin email', async () => {
      const response = await request(app).post('/api/auth/register').send({
        password: 'Test123!',
        confirmPassword: 'Test123!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
    });

    it('Rechaza registro sin password', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        confirmPassword: 'Test123!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
    });

    it('Rechaza registro sin nombre', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
      });

      expect(response.status).toBe(400);
    });

    it('Rechaza email inválido', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'invalid-email',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        name: 'Usuario Test',
      });

      expect(response.status).toBe(400);
    });

    it('Rechaza nombre muy corto (menos de 2 caracteres)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        name: 'A',
      });

      expect(response.status).toBe(400);
    });

    it('Rechaza nombre muy largo (más de 100 caracteres)', async () => {
      const response = await request(app).post('/api/auth/register').send({
        email: 'test@test.com',
        password: 'Test123!',
        confirmPassword: 'Test123!',
        name: 'A'.repeat(101),
      });

      expect(response.status).toBe(400);
    });
  });

  /**
   * AC4: Verificar que el password se almacena hasheado con bcrypt
   */
  it('AC4: Password se almacena hasheado con bcrypt', async () => {
    const password = 'SecurePass123!';
    const email = 'hashtest@test.com';

    await request(app).post('/api/auth/register').send({
      email,
      password,
      confirmPassword: password,
      name: 'Hash Test User',
    });

    // Verificar en la base de datos que el password está hasheado
    const user = await prisma.user.findUnique({
      where: { email },
      select: { passwordHash: true },
    });

    expect(user).toBeTruthy();
    expect(user!.passwordHash).toBeDefined();
    expect(user!.passwordHash).not.toBe(password);
    // Bcrypt hash siempre empieza con $2a$, $2b$ o $2y$
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$/);
  });
});
