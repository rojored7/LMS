/**
 * Tests Unitarios para Middleware de Autorización
 * HU-003: Sistema de Roles (RBAC)
 * Valida AC1-AC3 del middleware de autorización
 */

process.env.NODE_ENV = 'test';

import { Request, Response, NextFunction } from 'express';
import { authorize, requireAdmin, requireInstructor, requireAuth, hasRole, hasAnyRole, isAdmin, isInstructor } from '../../src/middleware/authorize';
import { UserRole } from '../../src/types/auth';
import { AuthorizationError, AuthenticationError } from '../../src/middleware/errorHandler';

/**
 * Suite de tests para HU-003: Sistema de Roles (RBAC)
 */
describe('HU-003: Sistema de Roles (RBAC) - Middleware de Autorización', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    req = {};
    res = {};
    next = jest.fn();
  });

  describe('authorize middleware', () => {
    /**
     * AC1: Permite acceso si el usuario tiene el rol correcto
     */
    it('AC1: Permite acceso si el usuario tiene el rol correcto', () => {
      req.user = {
        userId: 'user-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      const middleware = authorize([UserRole.ADMIN]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // Sin errores
    });

    /**
     * AC2: Deniega acceso si el usuario no tiene el rol correcto
     */
    it('AC2: Deniega acceso si el usuario no tiene el rol correcto', () => {
      req.user = {
        userId: 'user-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      const middleware = authorize([UserRole.ADMIN]);

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow(AuthorizationError);

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow('Acceso denegado');

      expect(next).not.toHaveBeenCalled();
    });

    /**
     * AC3: Permite múltiples roles
     */
    it('AC3: Permite múltiples roles - ADMIN puede acceder', () => {
      req.user = {
        userId: 'user-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      const middleware = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('AC3: Permite múltiples roles - INSTRUCTOR puede acceder', () => {
      req.user = {
        userId: 'user-123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
        name: 'Instructor User',
      };

      const middleware = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]);
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('AC3: Rechaza rol no permitido cuando hay múltiples roles permitidos', () => {
      req.user = {
        userId: 'user-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      const middleware = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]);

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow(AuthorizationError);

      expect(next).not.toHaveBeenCalled();
    });

    /**
     * AC2: Debe lanzar error si no hay usuario autenticado
     */
    it('AC2: Lanza AuthenticationError si no hay usuario autenticado', () => {
      // req.user es undefined
      const middleware = authorize([UserRole.ADMIN]);

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow(AuthenticationError);

      expect(() => {
        middleware(req as Request, res as Response, next);
      }).toThrow('No autenticado');

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin middleware', () => {
    /**
     * AC4: Solo permite ADMIN
     */
    it('AC4: Permite acceso a usuario ADMIN', () => {
      req.user = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      requireAdmin(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('AC4: Rechaza a usuario INSTRUCTOR', () => {
      req.user = {
        userId: 'instructor-123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
        name: 'Instructor User',
      };

      expect(() => {
        requireAdmin(req as Request, res as Response, next);
      }).toThrow(AuthorizationError);

      expect(next).not.toHaveBeenCalled();
    });

    it('AC4: Rechaza a usuario STUDENT', () => {
      req.user = {
        userId: 'student-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      expect(() => {
        requireAdmin(req as Request, res as Response, next);
      }).toThrow(AuthorizationError);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireInstructor middleware', () => {
    it('Permite acceso a usuario ADMIN', () => {
      req.user = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      requireInstructor(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Permite acceso a usuario INSTRUCTOR', () => {
      req.user = {
        userId: 'instructor-123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
        name: 'Instructor User',
      };

      requireInstructor(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Rechaza a usuario STUDENT', () => {
      req.user = {
        userId: 'student-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      expect(() => {
        requireInstructor(req as Request, res as Response, next);
      }).toThrow(AuthorizationError);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth middleware', () => {
    it('Permite acceso a usuario ADMIN', () => {
      req.user = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
        name: 'Admin User',
      };

      requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Permite acceso a usuario INSTRUCTOR', () => {
      req.user = {
        userId: 'instructor-123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
        name: 'Instructor User',
      };

      requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Permite acceso a usuario STUDENT', () => {
      req.user = {
        userId: 'student-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      requireAuth(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('Rechaza a usuario no autenticado', () => {
      // req.user es undefined

      expect(() => {
        requireAuth(req as Request, res as Response, next);
      }).toThrow(AuthenticationError);

      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Helper functions', () => {
    describe('hasRole', () => {
      it('Retorna true si el usuario tiene el rol especificado', () => {
        const user = {
          userId: 'user-123',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
          name: 'Admin User',
        };

        expect(hasRole(user, UserRole.ADMIN)).toBe(true);
        expect(hasRole(user, UserRole.INSTRUCTOR)).toBe(false);
        expect(hasRole(user, UserRole.STUDENT)).toBe(false);
      });

      it('Retorna false si el usuario es undefined', () => {
        expect(hasRole(undefined, UserRole.ADMIN)).toBe(false);
      });
    });

    describe('hasAnyRole', () => {
      it('Retorna true si el usuario tiene alguno de los roles especificados', () => {
        const user = {
          userId: 'user-123',
          email: 'instructor@test.com',
          role: UserRole.INSTRUCTOR,
          name: 'Instructor User',
        };

        expect(hasAnyRole(user, [UserRole.ADMIN, UserRole.INSTRUCTOR])).toBe(true);
        expect(hasAnyRole(user, [UserRole.ADMIN])).toBe(false);
        expect(hasAnyRole(user, [UserRole.STUDENT])).toBe(false);
      });

      it('Retorna false si el usuario es undefined', () => {
        expect(hasAnyRole(undefined, [UserRole.ADMIN])).toBe(false);
      });
    });

    describe('isAdmin', () => {
      it('Retorna true si el usuario es ADMIN', () => {
        const admin = {
          userId: 'admin-123',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
          name: 'Admin User',
        };

        expect(isAdmin(admin)).toBe(true);
      });

      it('Retorna false si el usuario no es ADMIN', () => {
        const student = {
          userId: 'student-123',
          email: 'student@test.com',
          role: UserRole.STUDENT,
          name: 'Student User',
        };

        expect(isAdmin(student)).toBe(false);
      });

      it('Retorna false si el usuario es undefined', () => {
        expect(isAdmin(undefined)).toBe(false);
      });
    });

    describe('isInstructor', () => {
      it('Retorna true si el usuario es INSTRUCTOR', () => {
        const instructor = {
          userId: 'instructor-123',
          email: 'instructor@test.com',
          role: UserRole.INSTRUCTOR,
          name: 'Instructor User',
        };

        expect(isInstructor(instructor)).toBe(true);
      });

      it('Retorna true si el usuario es ADMIN (admin tiene permisos de instructor)', () => {
        const admin = {
          userId: 'admin-123',
          email: 'admin@test.com',
          role: UserRole.ADMIN,
          name: 'Admin User',
        };

        expect(isInstructor(admin)).toBe(true);
      });

      it('Retorna false si el usuario es STUDENT', () => {
        const student = {
          userId: 'student-123',
          email: 'student@test.com',
          role: UserRole.STUDENT,
          name: 'Student User',
        };

        expect(isInstructor(student)).toBe(false);
      });

      it('Retorna false si el usuario es undefined', () => {
        expect(isInstructor(undefined)).toBe(false);
      });
    });
  });

  describe('Mensajes de error', () => {
    it('Mensaje de error debe indicar los roles requeridos', () => {
      req.user = {
        userId: 'student-123',
        email: 'student@test.com',
        role: UserRole.STUDENT,
        name: 'Student User',
      };

      const middleware = authorize([UserRole.ADMIN, UserRole.INSTRUCTOR]);

      try {
        middleware(req as Request, res as Response, next);
      } catch (error) {
        expect(error).toBeInstanceOf(AuthorizationError);
        if (error instanceof AuthorizationError) {
          expect(error.message).toContain('ADMIN');
          expect(error.message).toContain('INSTRUCTOR');
        }
      }
    });
  });
});
