/**
 * Prisma Client Mock
 * Mock completo del cliente de Prisma para tests
 */

import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

// Configurar comportamiento por defecto para métodos comunes
const setupDefaultMocks = () => {
  // User model defaults
  prismaMock.user.findUnique.mockResolvedValue(null);
  prismaMock.user.findFirst.mockResolvedValue(null);
  prismaMock.user.findMany.mockResolvedValue([]);
  prismaMock.user.count.mockResolvedValue(0);

  // Course model defaults
  prismaMock.course.findUnique.mockResolvedValue(null);
  prismaMock.course.findFirst.mockResolvedValue(null);
  prismaMock.course.findMany.mockResolvedValue([]);
  prismaMock.course.count.mockResolvedValue(0);

  // Enrollment model defaults
  prismaMock.enrollment.findUnique.mockResolvedValue(null);
  prismaMock.enrollment.findFirst.mockResolvedValue(null);
  prismaMock.enrollment.findMany.mockResolvedValue([]);
  prismaMock.enrollment.count.mockResolvedValue(0);

  // Module model defaults
  prismaMock.module.findUnique.mockResolvedValue(null);
  prismaMock.module.findFirst.mockResolvedValue(null);
  prismaMock.module.findMany.mockResolvedValue([]);
  prismaMock.module.count.mockResolvedValue(0);

  // Lesson model defaults
  prismaMock.lesson.findUnique.mockResolvedValue(null);
  prismaMock.lesson.findFirst.mockResolvedValue(null);
  prismaMock.lesson.findMany.mockResolvedValue([]);
  prismaMock.lesson.count.mockResolvedValue(0);

  // Quiz model defaults
  prismaMock.quiz.findUnique.mockResolvedValue(null);
  prismaMock.quiz.findFirst.mockResolvedValue(null);
  prismaMock.quiz.findMany.mockResolvedValue([]);
  prismaMock.quiz.count.mockResolvedValue(0);

  // Lab model defaults
  prismaMock.lab.findUnique.mockResolvedValue(null);
  prismaMock.lab.findFirst.mockResolvedValue(null);
  prismaMock.lab.findMany.mockResolvedValue([]);
  prismaMock.lab.count.mockResolvedValue(0);

  // Project model defaults
  prismaMock.project.findUnique.mockResolvedValue(null);
  prismaMock.project.findFirst.mockResolvedValue(null);
  prismaMock.project.findMany.mockResolvedValue([]);
  prismaMock.project.count.mockResolvedValue(0);

  // UserProgress model defaults
  prismaMock.userProgress.findUnique.mockResolvedValue(null);
  prismaMock.userProgress.findFirst.mockResolvedValue(null);
  prismaMock.userProgress.findMany.mockResolvedValue([]);
  prismaMock.userProgress.count.mockResolvedValue(0);

  // RefreshToken model defaults
  prismaMock.refreshToken.findUnique.mockResolvedValue(null);
  prismaMock.refreshToken.findFirst.mockResolvedValue(null);
  prismaMock.refreshToken.findMany.mockResolvedValue([]);
  prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

  // Certificate model defaults
  prismaMock.certificate.findUnique.mockResolvedValue(null);
  prismaMock.certificate.findFirst.mockResolvedValue(null);
  prismaMock.certificate.findMany.mockResolvedValue([]);
  prismaMock.certificate.count.mockResolvedValue(0);

  // Badge model defaults
  prismaMock.badge.findUnique.mockResolvedValue(null);
  prismaMock.badge.findFirst.mockResolvedValue(null);
  prismaMock.badge.findMany.mockResolvedValue([]);
  prismaMock.badge.count.mockResolvedValue(0);

  // TrainingProfile model defaults
  prismaMock.trainingProfile.findUnique.mockResolvedValue(null);
  prismaMock.trainingProfile.findFirst.mockResolvedValue(null);
  prismaMock.trainingProfile.findMany.mockResolvedValue([]);
  prismaMock.trainingProfile.count.mockResolvedValue(0);

  // Notification model defaults
  prismaMock.notification.findUnique.mockResolvedValue(null);
  prismaMock.notification.findFirst.mockResolvedValue(null);
  prismaMock.notification.findMany.mockResolvedValue([]);
  prismaMock.notification.count.mockResolvedValue(0);

  // ProjectSubmission model defaults
  prismaMock.projectSubmission.findUnique.mockResolvedValue(null);
  prismaMock.projectSubmission.findFirst.mockResolvedValue(null);
  prismaMock.projectSubmission.findMany.mockResolvedValue([]);
  prismaMock.projectSubmission.count.mockResolvedValue(0);

  // QuizAttempt model defaults
  prismaMock.quizAttempt.findUnique.mockResolvedValue(null);
  prismaMock.quizAttempt.findFirst.mockResolvedValue(null);
  prismaMock.quizAttempt.findMany.mockResolvedValue([]);
  prismaMock.quizAttempt.count.mockResolvedValue(0);

  // LabSubmission model defaults
  prismaMock.labSubmission.findUnique.mockResolvedValue(null);
  prismaMock.labSubmission.findFirst.mockResolvedValue(null);
  prismaMock.labSubmission.findMany.mockResolvedValue([]);
  prismaMock.labSubmission.count.mockResolvedValue(0);

  // Transaction mock
  prismaMock.$transaction.mockImplementation((callback) => {
    if (typeof callback === 'function') {
      return callback(prismaMock);
    }
    return Promise.resolve(callback);
  });

  // Connect/disconnect mocks
  prismaMock.$connect.mockResolvedValue();
  prismaMock.$disconnect.mockResolvedValue();
};

// Aplicar mocks por defecto
setupDefaultMocks();

// Exportar función para resetear mocks en tests específicos
export const resetPrismaMocks = () => {
  mockReset(prismaMock);
  setupDefaultMocks();
};

export default prismaMock;