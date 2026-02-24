/**
 * Tests de Integración para HU-002: Login con Credenciales
 * Valida todos los criterios de aceptación de la historia de usuario
 */

// Set test environment before any imports
process.env['NODE_ENV'] = 'test';

import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/server';
import { prisma } from '../../src/utils/prisma';
import { config } from '../../src/config';

/**
 * Suite de tests para HU-002: Login con Credenciales
 */
describe('HU-002: Login con Credenciales', () => {
  // Datos del usuario de prueba
  const testUser = {
    email: 'login@test.com',
    password: 'Test123!',
    name: 'Usuario Login Test',
  };

  /**
   * Crear usuario de prueba antes de todos los tests
   */
  beforeAll(async () => {
    // Limpiar usuarios de prueba existentes
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@test.com',
        },
      },
    });

    // Crear usuario de prueba
    await request(app).post('/api/auth/register').send({
      email: testUser.email,
      password: testUser.password,
      confirmPassword: testUser.password,
      name: testUser.name,
    });
  });

  /**
   * Limpiar después de todos los tests
   */
  afterAll(async () => {
    // Limpiar usuarios y tokens de prueba
    await prisma.refreshToken.deleteMany({
      where: {
        user: {
          email: {
            contains: '@test.com',
          },
        },
      },
    });

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
   * AC1: Formulario de login con campos email y password
   * AC2: Login exitoso con credenciales válidas
   * AC3: Generación de JWT token con userId, email, role
   * AC4: Almacenamiento seguro de token
   * AC8: Generación de refresh token
   */
  it('AC1, AC2, AC3, AC4, AC8: Login exitoso con credenciales válidas retorna usuario y tokens', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    // Verificar status code
    expect(response.status).toBe(200);

    // Verificar estructura de respuesta
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Login exitoso');
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data).toHaveProperty('refreshToken');

    // Verificar datos del usuario
    expect(response.body.data.user.email).toBe(testUser.email);
    expect(response.body.data.user.name).toBe(testUser.name);
    expect(response.body.data.user.role).toBe('STUDENT');
    expect(response.body.data.user).toHaveProperty('id');

    // AC4: Usuario no debe contener passwordHash
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
    expect(response.body.data.user).not.toHaveProperty('password');

    // AC3: Verificar que el JWT contiene userId, email y role
    const accessToken = response.body.data.accessToken;
    const decoded = jwt.decode(accessToken) as any;

    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
    expect(decoded.email).toBe(testUser.email);
    expect(decoded.role).toBe('STUDENT');

    // Verificar que el token es válido
    const verified = jwt.verify(accessToken, config.JWT_SECRET) as any;
    expect(verified.userId).toBeDefined();

    // AC8: Verificar que el refresh token existe
    const refreshToken = response.body.data.refreshToken;
    expect(refreshToken).toBeDefined();
    expect(typeof refreshToken).toBe('string');

    // Verificar que el refresh token está en la base de datos
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(storedToken).toBeTruthy();
    expect(storedToken!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  /**
   * AC6: Password incorrecto retorna error genérico 401
   */
  it('AC6: Password incorrecto retorna error 401 con mensaje genérico', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword123!',
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    // AC6: Mensaje genérico para evitar enumeración de usuarios
    expect(response.body.message).toBe('Email o contraseña incorrectos');
  });

  /**
   * AC6: Email no registrado retorna error genérico 401
   */
  it('AC6: Email no registrado retorna error 401 con mensaje genérico', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noexiste@test.com',
        password: 'Test123!',
      });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    // AC6: Mensaje genérico para evitar enumeración de usuarios
    expect(response.body.message).toBe('Email o contraseña incorrectos');
  });

  /**
   * AC3: JWT debe contener userId, email y role
   */
  it('AC3: JWT contiene userId, email y role correctos', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);

    const accessToken = response.body.data.accessToken;
    const decoded = jwt.decode(accessToken) as any;

    // Verificar estructura del payload
    expect(decoded).toHaveProperty('userId');
    expect(decoded).toHaveProperty('email');
    expect(decoded).toHaveProperty('role');
    expect(decoded).toHaveProperty('iat'); // issued at
    expect(decoded).toHaveProperty('exp'); // expiration

    // Verificar valores
    expect(decoded.email).toBe(testUser.email);
    expect(decoded.role).toBe('STUDENT');
    expect(typeof decoded.userId).toBe('string');

    // Verificar que el token no ha expirado
    const now = Math.floor(Date.now() / 1000);
    expect(decoded.exp).toBeGreaterThan(now);
  });

  /**
   * AC8: Refresh token renueva access token
   */
  it('AC8: Refresh token renueva access token correctamente', async () => {
    // 1. Login para obtener tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);

    const originalAccessToken = loginResponse.body.data.accessToken;
    const refreshToken = loginResponse.body.data.refreshToken;

    // Esperar 1 segundo para que el iat (issued at) sea diferente
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. Usar refresh token para obtener nuevo access token
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.success).toBe(true);
    expect(refreshResponse.body.data).toHaveProperty('accessToken');

    const newAccessToken = refreshResponse.body.data.accessToken;

    // 3. Verificar que el nuevo token es diferente
    expect(newAccessToken).not.toBe(originalAccessToken);

    // 4. Verificar que ambos tokens son válidos
    const originalDecoded = jwt.verify(originalAccessToken, config.JWT_SECRET) as any;
    const newDecoded = jwt.verify(newAccessToken, config.JWT_SECRET) as any;

    // 5. Verificar que contienen el mismo userId, email y role
    expect(newDecoded.userId).toBe(originalDecoded.userId);
    expect(newDecoded.email).toBe(originalDecoded.email);
    expect(newDecoded.role).toBe(originalDecoded.role);

    // 6. Verificar que el iat (issued at) es diferente
    expect(newDecoded.iat).toBeGreaterThan(originalDecoded.iat);
  });

  /**
   * Refresh token inválido retorna error 401
   */
  it('Refresh token inválido retorna error 401', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: 'invalid-token' });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('inválido');
  });

  /**
   * Refresh token expirado retorna error 401
   */
  it('Refresh token no encontrado retorna error 401', async () => {
    // Generar un token válido pero que no existe en la base de datos
    const fakeToken = jwt.sign(
      { userId: 'fake-user-id', email: 'fake@test.com', role: 'STUDENT' },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    const response = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: fakeToken });

    expect(response.status).toBe(401);
    expect(response.body.status).toBe('error');
    expect(response.body.message).toContain('no encontrado');
  });

  /**
   * Logout invalida el refresh token
   */
  it('Logout invalida el refresh token correctamente', async () => {
    // 1. Login para obtener tokens
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(loginResponse.status).toBe(200);
    const refreshToken = loginResponse.body.data.refreshToken;

    // 2. Verificar que el token existe en la BD
    let storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(storedToken).toBeTruthy();

    // 3. Hacer logout
    const logoutResponse = await request(app)
      .post('/api/auth/logout')
      .send({ refreshToken });

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.body.success).toBe(true);
    expect(logoutResponse.body.message).toBe('Logout exitoso');

    // 4. Verificar que el token fue eliminado de la BD
    storedToken = await prisma.refreshToken.findFirst({
      where: { token: refreshToken },
    });
    expect(storedToken).toBeNull();

    // 5. Verificar que el refresh token ya no funciona
    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken });

    expect(refreshResponse.status).toBe(401);
  });

  /**
   * Validación de campos obligatorios en login
   */
  describe('Validación de campos en login', () => {
    it('Rechaza login sin email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza login sin password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza login con email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Test123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  /**
   * Validación de campos en refresh
   */
  describe('Validación de campos en refresh', () => {
    it('Rechaza refresh sin refreshToken', async () => {
      const response = await request(app).post('/api/auth/refresh').send({});

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });

    it('Rechaza refresh con refreshToken vacío', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });

  /**
   * Verificar actualización de lastLoginAt
   */
  it('Login actualiza lastLoginAt del usuario', async () => {
    // Obtener lastLoginAt antes del login
    const userBefore = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { lastLoginAt: true },
    });

    const lastLoginBefore = userBefore?.lastLoginAt;

    // Esperar 1 segundo
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Hacer login
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.status).toBe(200);

    // Obtener lastLoginAt después del login
    const userAfter = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: { lastLoginAt: true },
    });

    expect(userAfter?.lastLoginAt).toBeTruthy();

    // Si había lastLoginAt antes, verificar que el nuevo es más reciente
    if (lastLoginBefore) {
      expect(userAfter!.lastLoginAt!.getTime()).toBeGreaterThan(lastLoginBefore.getTime());
    }
  });
});
