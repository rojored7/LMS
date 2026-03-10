/**
 * Training Profile Controller
 * Maneja las solicitudes HTTP relacionadas con perfiles de entrenamiento
 * CRUD completo de perfiles y asignación a cursos
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import trainingProfileService from '../services/trainingProfile.service';

/**
 * Schema de validación para crear perfil
 */
const createProfileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal válido').optional(),
});

/**
 * Schema de validación para actualizar perfil
 */
const updateProfileSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  description: z.string().min(10).optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

/**
 * Schema de validación para asignar cursos
 */
const assignCoursesSchema = z.object({
  courses: z.array(
    z.object({
      courseId: z.string().cuid('ID de curso inválido'),
      required: z.boolean().default(false),
      order: z.number().int().min(0),
    })
  ),
});

/**
 * Training Profile Controller
 * Proporciona endpoints para gestión de perfiles de entrenamiento
 */
export class TrainingProfileController {
  /**
   * GET /api/training-profiles
   * Obtener todos los perfiles de entrenamiento
   *
   * @param req - Request
   * @param res - Response con lista de perfiles
   */
  async getAllProfiles(req: Request, res: Response): Promise<void> {
    const profiles = await trainingProfileService.getAllProfiles();

    res.status(200).json({
      success: true,
      message: 'Perfiles obtenidos exitosamente',
      data: { profiles },
    });
  }

  /**
   * GET /api/training-profiles/:id
   * Obtener perfil por ID con cursos asignados
   *
   * @param req - Request con id en params
   * @param res - Response con perfil completo
   */
  async getProfileById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const profile = await trainingProfileService.getProfileById(id);

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: { profile },
    });
  }

  /**
   * GET /api/training-profiles/slug/:slug
   * Obtener perfil por slug con cursos asignados
   *
   * @param req - Request con slug en params
   * @param res - Response con perfil completo
   */
  async getProfileBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params;

    const profile = await trainingProfileService.getProfileBySlug(slug);

    res.status(200).json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: { profile },
    });
  }

  /**
   * POST /api/training-profiles
   * Crear nuevo perfil de entrenamiento
   *
   * @param req - Request con datos del perfil en body
   * @param res - Response con perfil creado
   */
  async createProfile(req: Request, res: Response): Promise<void> {
    // Validar datos
    const data = createProfileSchema.parse(req.body);

    const profile = await trainingProfileService.createProfile(data);

    res.status(201).json({
      success: true,
      message: 'Perfil creado exitosamente',
      data: { profile },
    });
  }

  /**
   * PUT /api/training-profiles/:id
   * Actualizar perfil de entrenamiento
   *
   * @param req - Request con id en params y datos en body
   * @param res - Response con perfil actualizado
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Validar datos
    const data = updateProfileSchema.parse(req.body);

    const profile = await trainingProfileService.updateProfile(id, data);

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: { profile },
    });
  }

  /**
   * DELETE /api/training-profiles/:id
   * Eliminar perfil de entrenamiento
   *
   * @param req - Request con id en params
   * @param res - Response con confirmación
   */
  async deleteProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const result = await trainingProfileService.deleteProfile(id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  /**
   * POST /api/training-profiles/:id/courses
   * Asignar cursos a un perfil
   *
   * @param req - Request con id en params y lista de cursos en body
   * @param res - Response con asignaciones creadas
   */
  async assignCourses(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    // Validar datos
    const { courses } = assignCoursesSchema.parse(req.body);

    const assignments = await trainingProfileService.assignCourses(id, courses);

    res.status(200).json({
      success: true,
      message: 'Cursos asignados exitosamente',
      data: { assignments },
    });
  }
}

// Exportar instancia singleton del controlador
export const trainingProfileController = new TrainingProfileController();
