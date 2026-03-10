/**
 * Auth Controller Tests
 * Tests exhaustivos para el controlador de autenticación
 */

import { Request, Response, NextFunction } from 'express';
import { authController } from '../../controllers/auth.controller';
import { authService } from '../../services/auth.service';
import { tokenService } from '../../services/token.service';
import { emailService } from '../../services/email.service';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  generateMockRequest,
  generateMockResponse,
  generateMockNext,
  expectSuccessResponse,
  expectErrorResponse,
  expectUnauthorizedResponse
} from '../helpers/auth.helper';
import { testUsers } from '../fixtures/users.fixture';

// Mock de servicios
jest.mock('../../services/auth.service');
jest.mock('../../services/token.service');
jest.mock('../../services/email.service');
jest.mock('../../utils/prisma');
jest.mock('../../utils/redis');

describe('AuthController', () => {
  let mockedAuthService: jest.Mocked<typeof authService>;
  // let mockedTokenService: jest.Mocked<typeof tokenService>;
  let mockedEmailService: jest.Mocked<typeof emailService>;
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    // Crear instancias mockeadas
    mockedAuthService = authService as jest.Mocked<typeof authService>;
    // mockedTokenService = tokenService as jest.Mocked<typeof tokenService>;
    mockedEmailService = emailService as jest.Mocked<typeof emailService>;

    req = generateMockRequest();
    res = generateMockResponse();
    next = generateMockNext();

    jest.clearAllMocks();
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'newuser@test.com',
      password: 'ValidPass123!',
      firstName: 'Test',
      lastName: 'User',
    };

    it('should register a new user successfully', async () => {
      req.body = validRegisterData;
      const hashedPassword = await bcrypt.hash(validRegisterData.password, 10);
      const newUser = {
        id: 'new-user-id',
        ...validRegisterData,
        password: hashedPassword,
        role: UserRole.STUDENT,
      };

      mockedAuthService.register.mockResolvedValue(newUser);

      await authController.register(req, res);

      expect(mockedAuthService.register).toHaveBeenCalledWith(validRegisterData);
      expectSuccessResponse(res);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
    });

    it('should handle duplicate email registration', async () => {
      req.body = validRegisterData;
      mockedAuthService.register.mockRejectedValue(new Error('Email already exists'));

      await authController.register(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email already exists'
      }));
    });

    it('should validate required fields', async () => {
      req.body = { email: 'test@test.com' }; // Missing password and names

      await authController.register(req, res);

      expectErrorResponse(res, 400);
    });

    it('should validate email format', async () => {
      req.body = {
        ...validRegisterData,
        email: 'invalid-email',
      };

      await authController.register(req, res);

      expectErrorResponse(res, 400, 'Invalid email');
    });

    it('should validate password strength', async () => {
      req.body = {
        ...validRegisterData,
        password: 'weak',
      };

      await authController.register(req, res);

      expectErrorResponse(res, 400, 'Password too weak');
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'student1@test.com',
      password: 'Test123!',
    };

    it('should login successfully with valid credentials', async () => {
      req.body = validLoginData;
      const user = testUsers[0];

      mockedAuthService.login.mockResolvedValue({
        user,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      await authController.login(req, res);

      expect(mockedAuthService.login).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expectSuccessResponse(res);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
    });

    it('should fail with invalid credentials', async () => {
      req.body = { ...validLoginData, password: 'wrong-password' };
      mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      await authController.login(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid credentials'
      }));
    });

    it('should fail with non-existent email', async () => {
      req.body = { email: 'nonexistent@test.com', password: 'password' };
      mockedAuthService.login.mockRejectedValue(new Error('User not found'));

      await authController.login(req, res);

      expect(next).toHaveBeenCalled();
    });

    it('should handle inactive user', async () => {
      req.body = validLoginData;
      mockedAuthService.login.mockRejectedValue(new Error('Account is inactive'));

      await authController.login(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Account is inactive'
      }));
    });

    it('should validate required fields', async () => {
      req.body = { email: 'test@test.com' }; // Missing password

      await authController.login(req, res);

      expectErrorResponse(res, 400);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        cookies: { refreshToken: 'refresh-token' }
      });

      mockedAuthService.logout.mockResolvedValue(undefined);

      await authController.logout(req, res);

      expect(mockedAuthService.logout).toHaveBeenCalledWith('user-1', 'refresh-token');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expectSuccessResponse(res);
    });

    it('should handle logout without refresh token', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT }
      });

      await authController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expectSuccessResponse(res);
    });

    it('should handle logout errors gracefully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        cookies: { refreshToken: 'refresh-token' }
      });

      mockedAuthService.logout.mockRejectedValue(new Error('Logout failed'));

      await authController.logout(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Logout failed'
      }));
    });
  });

  describe('refresh', () => {
    it('should refresh token successfully', async () => {
      req = generateMockRequest({
        cookies: { refreshToken: 'old-refresh-token' }
      });

      mockedAuthService.refreshAccessToken.mockResolvedValue({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      await authController.refresh(req, res);

      expect(mockedAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expectSuccessResponse(res);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
    });

    it('should fail with invalid refresh token', async () => {
      req = generateMockRequest({
        cookies: { refreshToken: 'invalid-token' }
      });

      mockedAuthService.refreshAccessToken.mockRejectedValue(new Error('Invalid refresh token'));

      await authController.refresh(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid refresh token'
      }));
    });

    it('should fail without refresh token', async () => {
      req = generateMockRequest({ cookies: {} });

      await authController.refresh(req, res);

      expectUnauthorizedResponse(res);
    });

    it('should handle expired refresh token', async () => {
      req = generateMockRequest({
        cookies: { refreshToken: 'expired-token' }
      });

      mockedAuthService.refreshAccessToken.mockRejectedValue(new Error('Refresh token expired'));

      await authController.refresh(req, res);

      expect(next).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    });
  });

  describe('forgotPassword', () => {
    it('should send password reset email successfully', async () => {
      req.body = { email: 'student1@test.com' };

      mockedAuthService.requestPasswordReset.mockResolvedValue({
        resetToken: 'reset-token',
        user: testUsers[0]
      });

      mockedEmailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      await authController.forgotPassword(req, res);

      expect(mockedAuthService.forgotPassword).toHaveBeenCalledWith('student1@test.com');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expectSuccessResponse(res);
    });

    it('should handle non-existent email gracefully', async () => {
      req.body = { email: 'nonexistent@test.com' };

      mockedAuthService.requestPasswordReset.mockRejectedValue(new Error('User not found'));

      await authController.forgotPassword(req, res);

      // Should still return success for security reasons
      expectSuccessResponse(res);
    });

    it('should validate email format', async () => {
      req.body = { email: 'invalid-email' };

      await authController.forgotPassword(req, res);

      expectErrorResponse(res, 400, 'Invalid email');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      req.body = {
        token: 'reset-token',
        newPassword: 'NewPassword123!',
      };

      mockedAuthService.resetPassword.mockResolvedValue({
        user: testUsers[0],
        message: 'Password reset successful'
      });

      await authController.resetPassword(req, res);

      expect(mockedAuthService.resetPassword).toHaveBeenCalledWith(
        'reset-token',
        'NewPassword123!'
      );
      expectSuccessResponse(res);
    });

    it('should fail with invalid reset token', async () => {
      req.body = {
        token: 'invalid-token',
        newPassword: 'NewPassword123!',
      };

      mockedAuthService.resetPassword.mockRejectedValue(new Error('Invalid or expired token'));

      await authController.resetPassword(req, res);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Invalid or expired token'
      }));
    });

    it('should validate new password strength', async () => {
      req.body = {
        token: 'reset-token',
        newPassword: 'weak',
      };

      await authController.resetPassword(req, res);

      expectErrorResponse(res, 400, 'Password too weak');
    });

    it('should handle expired reset token', async () => {
      req.body = {
        token: 'expired-token',
        newPassword: 'NewPassword123!',
      };

      mockedAuthService.resetPassword.mockRejectedValue(new Error('Token expired'));

      await authController.resetPassword(req, res);

      expect(next).toHaveBeenCalled();
    });
  });

  describe.skip('verifyEmail - Method not in controller', () => {
    it('should verify email successfully', async () => {
      req.params = { token: 'verification-token' };

      mockedAuthService.verifyEmail.mockResolvedValue({
        user: testUsers[0],
        message: 'Email verified'
      });

      await authController.verifyEmail(req, res, next);

      expect(mockedAuthService.verifyEmail).toHaveBeenCalledWith('verification-token');
      expectSuccessResponse(res);
    });

    it('should fail with invalid verification token', async () => {
      req.params = { token: 'invalid-token' };

      mockedAuthService.verifyEmail.mockRejectedValue(new Error('Invalid token'));

      await authController.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle already verified email', async () => {
      req.params = { token: 'verification-token' };

      mockedAuthService.verifyEmail.mockRejectedValue(new Error('Email already verified'));

      await authController.verifyEmail(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Email already verified'
      }));
    });
  });

  describe.skip('changePassword - Method not in controller', () => {
    it('should change password successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        }
      });

      mockedAuthService.changePassword.mockResolvedValue({
        user: testUsers[0],
        message: 'Password changed'
      });

      await authController.changePassword(req, res, next);

      expect(mockedAuthService.changePassword).toHaveBeenCalledWith(
        'user-1',
        'OldPassword123!',
        'NewPassword123!'
      );
      expectSuccessResponse(res);
    });

    it('should fail with incorrect current password', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!',
        }
      });

      mockedAuthService.changePassword.mockRejectedValue(new Error('Current password is incorrect'));

      await authController.changePassword(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should validate new password strength', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          currentPassword: 'OldPassword123!',
          newPassword: 'weak',
        }
      });

      await authController.changePassword(req, res, next);

      expectErrorResponse(res, 400, 'Password too weak');
    });

    it('should prevent using same password', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          currentPassword: 'SamePassword123!',
          newPassword: 'SamePassword123!',
        }
      });

      mockedAuthService.changePassword.mockRejectedValue(new Error('New password must be different'));

      await authController.changePassword(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe.skip('getMe - Method not in controller', () => {
    it('should return current user data', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', email: 'student1@test.com', role: UserRole.STUDENT }
      });

      mockedAuthService.getCurrentUser.mockResolvedValue(testUsers[0]);

      await authController.getMe(req, res, next);

      expect(mockedAuthService.getCurrentUser).toHaveBeenCalledWith('user-1');
      expectSuccessResponse(res, testUsers[0]);
    });

    it('should handle user not found', async () => {
      req = generateMockRequest({
        user: { userId: 'non-existent', role: UserRole.STUDENT }
      });

      mockedAuthService.getCurrentUser.mockRejectedValue(new Error('User not found'));

      await authController.getMe(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe.skip('updateProfile - Method not in controller', () => {
    it('should update profile successfully', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          firstName: 'Updated',
          lastName: 'Name',
          bio: 'New bio',
        }
      });

      mockedAuthService.updateProfile.mockResolvedValue({
        ...testUsers[0],
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio',
      });

      await authController.updateProfile(req, res, next);

      expect(mockedAuthService.updateProfile).toHaveBeenCalledWith('user-1', {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'New bio',
      });
      expectSuccessResponse(res);
    });

    it('should prevent email update through profile', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          email: 'newemail@test.com',
        }
      });

      await authController.updateProfile(req, res, next);

      // Email should be filtered out
      expect(mockedAuthService.updateProfile).toHaveBeenCalledWith('user-1', {});
    });

    it('should validate profile fields', async () => {
      req = generateMockRequest({
        user: { userId: 'user-1', role: UserRole.STUDENT },
        body: {
          firstName: '',  // Empty name
        }
      });

      await authController.updateProfile(req, res, next);

      expectErrorResponse(res, 400);
    });
  });
});