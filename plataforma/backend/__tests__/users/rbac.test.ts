/**
 * Tests de Integración para HU-003: Sistema de Roles (RBAC)
 * Valida todos los criterios de aceptación de autorización por roles
 */

process.env.NODE_ENV = 'test';

import request from 'supertest';
import app from '../../src/server';
import { prisma } from '../../src/utils/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import { UserRole } from '../../src/types/auth';
import bcrypt from 'bcrypt';

/**
 * Helper para generar tokens JWT de prueba
 */
function generateTestToken(userId: string, email: string, role: UserRole, name: string): string {
  return jwt.sign(
    { userId, email, role, name },
    config.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Suite de tests para HU-003: Sistema de Roles (RBAC)
 */
describe('HU-003: Sistema de Roles (RBAC) - Integration Tests', () => {
  let adminToken: string;
  let adminUserId: string;
  let instructorToken: string;
  let instructorUserId: string;
  let studentToken: string;
  let studentUserId: string;

  /**
   * Configuración inicial: Crear usuarios de prueba con diferentes roles
   */
  beforeAll(async () => {
    // Limpiar usuarios de prueba anteriores
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['rbac-admin@test.com', 'rbac-instructor@test.com', 'rbac-student@test.com'],
        },
      },
    });

    const passwordHash = await bcrypt.hash('Test123!', 12);

    // Crear usuario ADMIN
    const admin = await prisma.user.create({
      data: {
        email: 'rbac-admin@test.com',
        passwordHash,
        name: 'Test Admin',
        role: UserRole.ADMIN,
      },
    });
    adminUserId = admin.id;
    adminToken = generateTestToken(admin.id, admin.email, admin.role as UserRole, admin.name);

    // Crear usuario INSTRUCTOR
    const instructor = await prisma.user.create({
      data: {
        email: 'rbac-instructor@test.com',
        passwordHash,
        name: 'Test Instructor',
        role: UserRole.INSTRUCTOR,
      },
    });
    instructorUserId = instructor.id;
    instructorToken = generateTestToken(
      instructor.id,
      instructor.email,
      instructor.role as UserRole,
      instructor.name
    );

    // Crear usuario STUDENT
    const student = await prisma.user.create({
      data: {
        email: 'rbac-student@test.com',
        passwordHash,
        name: 'Test Student',
        role: UserRole.STUDENT,
      },
    });
    studentUserId = student.id;
    studentToken = generateTestToken(
      student.id,
      student.email,
      student.role as UserRole,
      student.name
    );
  });

  /**
   * Limpieza después de todos los tests
   */
  afterAll(async () => {
    // Eliminar usuarios de prueba
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['rbac-admin@test.com', 'rbac-instructor@test.com', 'rbac-student@test.com'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/users - Listar todos los usuarios', () => {
    /**
     * AC5: ADMIN puede ver todos los usuarios
     */
    it('AC5: ADMIN puede ver todos los usuarios', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('total');
    });

    /**
     * AC5: INSTRUCTOR no puede ver todos los usuarios
     */
    it('AC5: INSTRUCTOR no puede ver todos los usuarios', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Acceso denegado');
    });

    /**
     * AC5: STUDENT no puede ver todos los usuarios
     */
    it('AC5: STUDENT no puede ver todos los usuarios', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Acceso denegado');
    });

    /**
     * AC6: Usuario sin token no puede acceder
     */
    it('AC6: Usuario sin token no puede acceder', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('PUT /api/users/role - Cambiar rol de usuario', () => {
    /**
     * AC6: ADMIN puede cambiar roles
     */
    it('AC6: ADMIN puede cambiar roles de otro usuario', async () => {
      const res = await request(app)
        .put('/api/users/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: studentUserId,
          newRole: UserRole.INSTRUCTOR,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe(UserRole.INSTRUCTOR);

      // Revertir cambio para otros tests
      await prisma.user.update({
        where: { id: studentUserId },
        data: { role: UserRole.STUDENT },
      });
    });

    /**
     * AC7: STUDENT no puede cambiar roles
     */
    it('AC7: STUDENT no puede cambiar roles', async () => {
      const res = await request(app)
        .put('/api/users/role')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          userId: instructorUserId,
          newRole: UserRole.STUDENT,
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Acceso denegado');
    });

    /**
     * AC7: INSTRUCTOR no puede cambiar roles
     */
    it('AC7: INSTRUCTOR no puede cambiar roles', async () => {
      const res = await request(app)
        .put('/api/users/role')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({
          userId: studentUserId,
          newRole: UserRole.ADMIN,
        });

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('ADMIN no puede quitarse a sí mismo el rol de administrador', async () => {
      const res = await request(app)
        .put('/api/users/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: adminUserId,
          newRole: UserRole.STUDENT,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('quitarte a ti mismo');
    });
  });

  describe('DELETE /api/users/:userId - Eliminar usuario', () => {
    let userToDelete: any;
    let userToDeleteToken: string;

    beforeAll(async () => {
      // Crear usuario temporal para eliminar
      const passwordHash = await bcrypt.hash('Test123!', 12);
      userToDelete = await prisma.user.create({
        data: {
          email: 'delete-me@test.com',
          passwordHash,
          name: 'User To Delete',
          role: UserRole.STUDENT,
        },
      });
      userToDeleteToken = generateTestToken(
        userToDelete.id,
        userToDelete.email,
        userToDelete.role as UserRole,
        userToDelete.name
      );
    });

    it('ADMIN puede eliminar usuarios', async () => {
      const res = await request(app)
        .delete(`/api/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('eliminado');

      // Verificar que el usuario fue eliminado
      const deletedUser = await prisma.user.findUnique({
        where: { id: userToDelete.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('STUDENT no puede eliminar usuarios', async () => {
      const res = await request(app)
        .delete(`/api/users/${instructorUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('ADMIN no puede eliminarse a sí mismo', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('eliminarte a ti mismo');
    });
  });

  describe('GET /api/users/:userId - Obtener usuario por ID', () => {
    /**
     * AC3: ADMIN puede ver cualquier usuario
     */
    it('AC3: ADMIN puede ver cualquier usuario', async () => {
      const res = await request(app)
        .get(`/api/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(studentUserId);
    });

    /**
     * AC3: Usuario puede ver su propio perfil
     */
    it('AC3: Usuario puede ver su propio perfil', async () => {
      const res = await request(app)
        .get(`/api/users/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(studentUserId);
    });

    /**
     * AC3: Usuario no puede ver perfil de otro usuario
     */
    it('AC3: STUDENT no puede ver perfil de otro usuario', async () => {
      const res = await request(app)
        .get(`/api/users/${instructorUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('permiso');
    });
  });

  describe('GET /api/users/me - Obtener mi perfil', () => {
    /**
     * AC3: Cualquier usuario autenticado puede ver su propio perfil
     */
    it('AC3: ADMIN puede ver su propio perfil', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(adminUserId);
      expect(res.body.data.user.role).toBe(UserRole.ADMIN);
    });

    it('AC3: INSTRUCTOR puede ver su propio perfil', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(instructorUserId);
      expect(res.body.data.user.role).toBe(UserRole.INSTRUCTOR);
    });

    it('AC3: STUDENT puede ver su propio perfil', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe(studentUserId);
      expect(res.body.data.user.role).toBe(UserRole.STUDENT);
    });

    it('Usuario sin token no puede acceder', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/users/stats/roles - Estadísticas de roles', () => {
    it('ADMIN puede ver estadísticas de roles', async () => {
      const res = await request(app)
        .get('/api/users/stats/roles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('byRole');
      expect(res.body.data.byRole).toHaveProperty('ADMIN');
      expect(res.body.data.byRole).toHaveProperty('INSTRUCTOR');
      expect(res.body.data.byRole).toHaveProperty('STUDENT');
    });

    it('INSTRUCTOR no puede ver estadísticas', async () => {
      const res = await request(app)
        .get('/api/users/stats/roles')
        .set('Authorization', `Bearer ${instructorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });

    it('STUDENT no puede ver estadísticas', async () => {
      const res = await request(app)
        .get('/api/users/stats/roles')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.status).toBe('error');
    });
  });

  /**
   * AC5: Tests de matriz completa de permisos
   */
  describe('AC5: Matriz completa de permisos por endpoint', () => {
    const endpoints = [
      {
        method: 'GET',
        path: '/api/users',
        allowedRoles: [UserRole.ADMIN],
        description: 'Listar todos los usuarios',
      },
      {
        method: 'GET',
        path: '/api/users/me',
        allowedRoles: [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT],
        description: 'Ver mi perfil',
      },
      {
        method: 'PUT',
        path: '/api/users/role',
        allowedRoles: [UserRole.ADMIN],
        description: 'Cambiar rol de usuario',
        body: { userId: studentUserId, newRole: UserRole.INSTRUCTOR },
      },
      {
        method: 'GET',
        path: '/api/users/stats/roles',
        allowedRoles: [UserRole.ADMIN],
        description: 'Ver estadísticas',
      },
    ];

    const testRoles = [
      { role: UserRole.ADMIN, token: () => adminToken, userId: () => adminUserId },
      { role: UserRole.INSTRUCTOR, token: () => instructorToken, userId: () => instructorUserId },
      { role: UserRole.STUDENT, token: () => studentToken, userId: () => studentUserId },
    ];

    endpoints.forEach((endpoint) => {
      testRoles.forEach((testRole) => {
        const shouldAllow = endpoint.allowedRoles.includes(testRole.role);
        const expectedStatus = shouldAllow ? 200 : 403;

        it(`${endpoint.description}: ${testRole.role} ${shouldAllow ? 'PUEDE' : 'NO PUEDE'} acceder`, async () => {
          let req = request(app)[endpoint.method.toLowerCase() as 'get' | 'put' | 'delete'](
            endpoint.path
          ).set('Authorization', `Bearer ${testRole.token()}`);

          if (endpoint.body) {
            req = req.send(endpoint.body);
          }

          const res = await req;

          if (shouldAllow) {
            expect(res.status).toBe(expectedStatus);
            expect(res.body.success).toBe(true);
          } else {
            expect(res.status).toBe(expectedStatus);
            expect(res.body.status).toBe('error');
          }
        });
      });
    });
  });
});
