/**
 * Admin Service
 * Maneja la lógica de negocio para operaciones administrativas
 * Gestión de enrollments, progreso de usuarios y estadísticas del sistema
 */

import { prisma } from '../utils/prisma';
import { UserRole } from '../types/auth';
import { NotFoundError, AuthorizationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import progressService from './progress.service';

/**
 * Interfaz para enrollment con información completa
 */
export interface EnrollmentWithProgress {
  id: string;
  enrolledAt: Date;
  completedAt: Date | null;
  progress: number;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string | null;
    level: string;
    duration: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Interfaz para usuario con enrollments
 */
export interface UserWithEnrollments {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string | null;
  createdAt: Date;
  enrollments: Array<{
    id: string;
    enrolledAt: Date;
    completedAt: Date | null;
    progress: number;
    course: {
      id: string;
      slug: string;
      title: string;
      thumbnail: string | null;
      level: string;
      duration: number;
    };
  }>;
}

/**
 * Interfaz para estadísticas del dashboard admin
 */
export interface DashboardStats {
  users: {
    total: number;
    byRole: {
      ADMIN: number;
      INSTRUCTOR: number;
      STUDENT: number;
    };
  };
  courses: {
    total: number;
    published: number;
  };
  enrollments: {
    total: number;
    active: number;
    completed: number;
  };
  systemHealth: {
    averageProgress: number;
    activeUsers: number; // usuarios con al menos 1 enrollment
  };
}

/**
 * Admin Service
 * Proporciona operaciones de gestión administrativa
 */
class AdminService {
  /**
   * Verificar que el usuario solicitante es ADMIN
   * @param adminId - ID del usuario a verificar
   * @throws AuthorizationError si el usuario no es ADMIN
   */
  private async verifyAdmin(adminId: string): Promise<void> {
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      logger.warn(`Intento no autorizado de operación admin - userId: ${adminId}`);
      throw new AuthorizationError('Solo administradores pueden realizar esta acción');
    }
  }

  /**
   * Obtener usuario con sus enrollments y progreso
   * @param adminId - ID del administrador
   * @param userId - ID del usuario a consultar
   * @returns Usuario con enrollments y progreso calculado
   */
  async getUserWithEnrollments(adminId: string, userId: string): Promise<UserWithEnrollments> {
    await this.verifyAdmin(adminId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                thumbnail: true,
                level: true,
                duration: true,
              },
            },
          },
          orderBy: {
            enrolledAt: 'desc',
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Calcular progreso para cada enrollment
    const enrollmentsWithProgress = await Promise.all(
      user.enrollments.map(async (enrollment) => {
        const progress = await progressService.getCourseProgress(userId, enrollment.course.id);
        return {
          ...enrollment,
          progress,
        };
      })
    );

    logger.info(`Admin ${adminId} consultó enrollments de usuario ${userId}`);

    return {
      ...user,
      enrollments: enrollmentsWithProgress,
    };
  }

  /**
   * Asignar curso a usuario (como administrador)
   * @param adminId - ID del administrador
   * @param userId - ID del usuario a inscribir
   * @param courseIdOrSlug - ID o slug del curso
   * @returns Enrollment creado con progreso
   */
  async assignCourseToUser(
    adminId: string,
    userId: string,
    courseIdOrSlug: string
  ): Promise<EnrollmentWithProgress> {
    await this.verifyAdmin(adminId);

    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Verificar que el curso existe (acepta ID o slug)
    const course = await prisma.course.findFirst({
      where: {
        OR: [{ id: courseIdOrSlug }, { slug: courseIdOrSlug }],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        thumbnail: true,
        level: true,
        duration: true,
        isPublished: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Curso no encontrado');
    }

    // Verificar si ya está inscrito
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id,
        },
      },
    });

    if (existingEnrollment) {
      // Si ya está inscrito, devolver el enrollment existente con progreso
      const progress = await progressService.getCourseProgress(userId, course.id);

      logger.info(
        `Admin ${adminId} intentó asignar curso ${course.title} a usuario ${user.email} (ya inscrito)`
      );

      return {
        ...existingEnrollment,
        progress,
        course,
        user,
      };
    }

    // Crear enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId: course.id,
      },
    });

    logger.info(
      `Admin ${adminId} asignó curso "${course.title}" a usuario ${user.email}`
    );

    return {
      ...enrollment,
      progress: 0,
      course,
      user,
    };
  }

  /**
   * Retirar curso de usuario (eliminar enrollment)
   * @param adminId - ID del administrador
   * @param enrollmentId - ID del enrollment a eliminar
   * @returns Confirmación de eliminación
   */
  async removeEnrollment(
    adminId: string,
    enrollmentId: string
  ): Promise<{ success: boolean; message: string }> {
    await this.verifyAdmin(adminId);

    // Verificar que el enrollment existe y obtener información para logging
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: { email: true, name: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Inscripción no encontrada');
    }

    // Eliminar enrollment (cascada eliminará progreso relacionado)
    await prisma.enrollment.delete({
      where: { id: enrollmentId },
    });

    logger.info(
      `Admin ${adminId} retiró curso "${enrollment.course.title}" de usuario ${enrollment.user.email}`
    );

    return {
      success: true,
      message: `Curso "${enrollment.course.title}" retirado de ${enrollment.user.name}`,
    };
  }

  /**
   * Listar todos los enrollments del sistema con paginación
   * @param adminId - ID del administrador
   * @param page - Número de página (default: 1)
   * @param limit - Límite por página (default: 20)
   * @returns Lista paginada de enrollments con progreso
   */
  async getAllEnrollments(
    adminId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    enrollments: EnrollmentWithProgress[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    await this.verifyAdmin(adminId);

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnail: true,
              level: true,
              duration: true,
            },
          },
        },
        orderBy: {
          enrolledAt: 'desc',
        },
      }),
      prisma.enrollment.count(),
    ]);

    // Calcular progreso para cada enrollment
    const enrollmentsWithProgress: EnrollmentWithProgress[] = await Promise.all(
      enrollments.map(async (enrollment) => {
        const progress = await progressService.getCourseProgress(
          enrollment.user.id,
          enrollment.course.id
        );
        return {
          ...enrollment,
          progress,
        };
      })
    );

    logger.info(`Admin ${adminId} listó ${enrollments.length} enrollments (página ${page})`);

    return {
      enrollments: enrollmentsWithProgress,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener estadísticas del sistema para dashboard admin
   * @param adminId - ID del administrador
   * @returns Estadísticas completas del sistema
   */
  async getDashboardStats(adminId: string): Promise<DashboardStats> {
    await this.verifyAdmin(adminId);

    // Consultas en paralelo para mejor performance
    const [
      totalUsers,
      adminCount,
      instructorCount,
      studentCount,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      activeEnrollments,
      usersWithEnrollments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { role: UserRole.INSTRUCTOR } }),
      prisma.user.count({ where: { role: UserRole.STUDENT } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.enrollment.count({ where: { completedAt: { not: null } } }),
      prisma.enrollment.count({ where: { completedAt: null } }),
      prisma.user.count({
        where: {
          enrollments: {
            some: {},
          },
        },
      }),
    ]);

    // Calcular progreso promedio del sistema (sample de enrollments activos)
    const sampleEnrollments = await prisma.enrollment.findMany({
      where: { completedAt: null },
      take: 100, // Sample de 100 para no sobrecargar
      select: {
        userId: true,
        courseId: true,
      },
    });

    let averageProgress = 0;
    if (sampleEnrollments.length > 0) {
      const progresses = await Promise.all(
        sampleEnrollments.map((e) => progressService.getCourseProgress(e.userId, e.courseId))
      );
      averageProgress = Math.round(
        progresses.reduce((sum, p) => sum + p, 0) / progresses.length
      );
    }

    logger.info(`Admin ${adminId} consultó estadísticas del dashboard`);

    return {
      users: {
        total: totalUsers,
        byRole: {
          ADMIN: adminCount,
          INSTRUCTOR: instructorCount,
          STUDENT: studentCount,
        },
      },
      courses: {
        total: totalCourses,
        published: publishedCourses,
      },
      enrollments: {
        total: totalEnrollments,
        active: activeEnrollments,
        completed: completedEnrollments,
      },
      systemHealth: {
        averageProgress,
        activeUsers: usersWithEnrollments,
      },
    };
  }

  /**
   * Obtener progreso detallado de un usuario en un curso específico
   * @param adminId - ID del administrador
   * @param userId - ID del usuario
   * @param courseId - ID del curso
   * @returns Progreso detallado por módulo
   */
  async getUserCourseProgress(adminId: string, userId: string, courseId: string) {
    await this.verifyAdmin(adminId);

    // Verificar que el enrollment existe
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        course: {
          select: { title: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('El usuario no está inscrito en este curso');
    }

    const detailedProgress = await progressService.getDetailedCourseProgress(userId, courseId);

    logger.info(
      `Admin ${adminId} consultó progreso de ${enrollment.user.email} en curso "${enrollment.course.title}"`
    );

    return {
      enrollment: {
        id: enrollment.id,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
      },
      user: enrollment.user,
      course: enrollment.course,
      progress: detailedProgress,
    };
  }
}

// Exportar instancia singleton
export default new AdminService();
