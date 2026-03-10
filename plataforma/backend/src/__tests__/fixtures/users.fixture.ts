/**
 * User Test Fixtures
 * Datos de prueba para usuarios
 */

import { User, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const hashedPassword = bcrypt.hashSync('Test123!@#', 10);

export const testUsers: Partial<User>[] = [
  {
    id: 'user-1',
    email: 'student1@test.com',
    password: hashedPassword,
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.STUDENT,
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'student2@test.com',
    password: hashedPassword,
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.STUDENT,
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
  {
    id: 'instructor-1',
    email: 'instructor@test.com',
    password: hashedPassword,
    firstName: 'Professor',
    lastName: 'Brown',
    role: UserRole.INSTRUCTOR,
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'admin-1',
    email: 'admin@test.com',
    password: hashedPassword,
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'inactive-user',
    email: 'inactive@test.com',
    password: hashedPassword,
    firstName: 'Inactive',
    lastName: 'User',
    role: UserRole.STUDENT,
    isActive: false,
    emailVerified: false,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
  },
];

export const mockUserInput = {
  email: 'newuser@test.com',
  password: 'NewUser123!@#',
  firstName: 'New',
  lastName: 'User',
};

export const mockLoginInput = {
  email: 'student1@test.com',
  password: 'Test123!@#',
};

export const mockInvalidLoginInput = {
  email: 'student1@test.com',
  password: 'WrongPassword',
};

export const mockTokenPayload = {
  userId: 'user-1',
  email: 'student1@test.com',
  role: UserRole.STUDENT,
};

export const mockAdminTokenPayload = {
  userId: 'admin-1',
  email: 'admin@test.com',
  role: UserRole.ADMIN,
};

export const mockInstructorTokenPayload = {
  userId: 'instructor-1',
  email: 'instructor@test.com',
  role: UserRole.INSTRUCTOR,
};

export function getTestUser(role: UserRole = UserRole.STUDENT): Partial<User> {
  return testUsers.find(u => u.role === role) || testUsers[0];
}

export function getTestUserById(id: string): Partial<User> | undefined {
  return testUsers.find(u => u.id === id);
}

export function getTestUserByEmail(email: string): Partial<User> | undefined {
  return testUsers.find(u => u.email === email);
}