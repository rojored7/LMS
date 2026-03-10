/**
 * Training Profile Service
 * Maneja la lógica de negocio para perfiles de entrenamiento
 * CRUD completo de perfiles y asignación a cursos
 */

import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

/**
 * Interfaz para crear perfil de entrenamiento
 */
export interface CreateTrainingProfileData {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color?: string;
}

/**
 * Interfaz para actualizar perfil de entrenamiento
 */
export interface UpdateTrainingProfileData {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Training Profile Service
 * Proporciona operaciones CRUD para perfiles de entrenamiento
 */
class TrainingProfileService {
  /**
   * Obtener todos los perfiles de entrenamiento
   * @returns Lista de perfiles con conteo de usuarios y cursos
   */
  async getAllProfiles() {
    const profiles = await prisma.trainingProfile.findMany({
      include: {
        _count: {
          select: {
            users: true,
            courseProfiles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    logger.info(`Obtenidos ${profiles.length} perfiles de entrenamiento`);

    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      icon: profile.icon,
      color: profile.color,
      createdAt: profile.createdAt,
      usersCount: profile._count.users,
      coursesCount: profile._count.courseProfiles,
    }));
  }

  /**
   * Obtener perfil por ID
   * @param profileId - ID del perfil
   * @returns Perfil con cursos asignados
   */
  async getProfileById(profileId: string) {
    const profile = await prisma.trainingProfile.findUnique({
      where: { id: profileId },
      include: {
        courseProfiles: {
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                thumbnail: true,
                level: true,
                duration: true,
                isPublished: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Perfil de entrenamiento no encontrado');
    }

    logger.info(`Obtenido perfil de entrenamiento: ${profile.name}`);

    return {
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      icon: profile.icon,
      color: profile.color,
      createdAt: profile.createdAt,
      usersCount: profile._count.users,
      courses: profile.courseProfiles.map((cp) => ({
        ...cp.course,
        required: cp.required,
        order: cp.order,
      })),
    };
  }

  /**
   * Obtener perfil por slug
   * @param slug - Slug del perfil
   * @returns Perfil con cursos asignados
   */
  async getProfileBySlug(slug: string) {
    const profile = await prisma.trainingProfile.findUnique({
      where: { slug },
      include: {
        courseProfiles: {
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
                description: true,
                thumbnail: true,
                level: true,
                duration: true,
                isPublished: true,
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Perfil de entrenamiento no encontrado');
    }

    logger.info(`Obtenido perfil de entrenamiento por slug: ${slug}`);

    return {
      id: profile.id,
      name: profile.name,
      slug: profile.slug,
      description: profile.description,
      icon: profile.icon,
      color: profile.color,
      createdAt: profile.createdAt,
      usersCount: profile._count.users,
      courses: profile.courseProfiles.map((cp) => ({
        ...cp.course,
        required: cp.required,
        order: cp.order,
      })),
    };
  }

  /**
   * Crear perfil de entrenamiento
   * @param data - Datos del perfil
   * @returns Perfil creado
   */
  async createProfile(data: CreateTrainingProfileData) {
    // Verificar que el slug no exista
    const existingProfile = await prisma.trainingProfile.findUnique({
      where: { slug: data.slug },
    });

    if (existingProfile) {
      throw new ValidationError('Ya existe un perfil con ese slug');
    }

    const profile = await prisma.trainingProfile.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
      },
    });

    logger.info(`Perfil de entrenamiento creado: ${profile.name} (${profile.slug})`);

    return profile;
  }

  /**
   * Actualizar perfil de entrenamiento
   * @param profileId - ID del perfil
   * @param data - Datos a actualizar
   * @returns Perfil actualizado
   */
  async updateProfile(profileId: string, data: UpdateTrainingProfileData) {
    // Verificar que el perfil existe
    const existingProfile = await prisma.trainingProfile.findUnique({
      where: { id: profileId },
    });

    if (!existingProfile) {
      throw new NotFoundError('Perfil de entrenamiento no encontrado');
    }

    // Si se cambia el slug, verificar que no exista otro con ese slug
    if (data.slug && data.slug !== existingProfile.slug) {
      const slugExists = await prisma.trainingProfile.findUnique({
        where: { slug: data.slug },
      });

      if (slugExists) {
        throw new ValidationError('Ya existe un perfil con ese slug');
      }
    }

    const profile = await prisma.trainingProfile.update({
      where: { id: profileId },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        color: data.color,
      },
    });

    logger.info(`Perfil de entrenamiento actualizado: ${profile.name}`);

    return profile;
  }

  /**
   * Eliminar perfil de entrenamiento
   * @param profileId - ID del perfil
   * @returns Confirmación de eliminación
   */
  async deleteProfile(profileId: string) {
    // Verificar que el perfil existe
    const profile = await prisma.trainingProfile.findUnique({
      where: { id: profileId },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundError('Perfil de entrenamiento no encontrado');
    }

    // Advertir si hay usuarios asignados
    if (profile._count.users > 0) {
      logger.warn(
        `Eliminando perfil ${profile.name} que tiene ${profile._count.users} usuarios asignados`
      );
    }

    await prisma.trainingProfile.delete({
      where: { id: profileId },
    });

    logger.info(`Perfil de entrenamiento eliminado: ${profile.name}`);

    return {
      success: true,
      message: `Perfil "${profile.name}" eliminado exitosamente`,
    };
  }

  /**
   * Asignar cursos a un perfil
   * @param profileId - ID del perfil
   * @param courseAssignments - Lista de asignaciones de cursos
   * @returns Cursos asignados
   */
  async assignCourses(
    profileId: string,
    courseAssignments: Array<{ courseId: string; required: boolean; order: number }>
  ) {
    // Verificar que el perfil existe
    const profile = await prisma.trainingProfile.findUnique({
      where: { id: profileId },
    });

    if (!profile) {
      throw new NotFoundError('Perfil de entrenamiento no encontrado');
    }

    // Eliminar asignaciones existentes
    await prisma.courseProfile.deleteMany({
      where: { profileId },
    });

    // Crear nuevas asignaciones
    const assignments = await Promise.all(
      courseAssignments.map((assignment) =>
        prisma.courseProfile.create({
          data: {
            profileId,
            courseId: assignment.courseId,
            required: assignment.required,
            order: assignment.order,
          },
          include: {
            course: {
              select: {
                id: true,
                slug: true,
                title: true,
              },
            },
          },
        })
      )
    );

    logger.info(
      `Asignados ${assignments.length} cursos al perfil ${profile.name}`
    );

    return assignments;
  }
}

// Exportar instancia singleton
export default new TrainingProfileService();
