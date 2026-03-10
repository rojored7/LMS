/**
 * Admin Controller
 * Maneja las solicitudes HTTP relacionadas con operaciones administrativas
 * Gestión de enrollments, progreso de usuarios y estadísticas del sistema
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import adminService from '../services/admin.service';

/**
 * Schema de validación para asignar curso a usuario
 */
const assignCourseSchema = z.object({
  userId: z.string().cuid('ID de usuario inválido'),
  courseId: z.string().min(1, 'ID o slug de curso requerido'),
});

/**
 * Schema de validación para paginación
 */
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Admin Controller
 * Proporciona endpoints para operaciones administrativas (solo ADMIN)
 */
export class AdminController {
  /**
   * GET /api/admin/users/:userId/enrollments
   * Obtener enrollments de un usuario con progreso
   *
   * @param req - Request con userId en params
   * @param res - Response con usuario y enrollments
   */
  async getUserEnrollments(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario requerido',
      });
      return;
    }

    const userWithEnrollments = await adminService.getUserWithEnrollments(
      req.user!.userId,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Enrollments obtenidos exitosamente',
      data: userWithEnrollments,
    });
  }

  /**
   * POST /api/admin/enrollments
   * Asignar curso a usuario (como administrador)
   *
   * @param req - Request con userId y courseId en body
   * @param res - Response con enrollment creado
   */
  async assignCourseToUser(req: Request, res: Response): Promise<void> {
    // Validar datos
    const { userId, courseId } = assignCourseSchema.parse(req.body);

    const enrollment = await adminService.assignCourseToUser(
      req.user!.userId,
      userId,
      courseId
    );

    res.status(201).json({
      success: true,
      message: 'Curso asignado exitosamente',
      data: { enrollment },
    });
  }

  /**
   * DELETE /api/admin/enrollments/:enrollmentId
   * Retirar curso de usuario (eliminar enrollment)
   *
   * @param req - Request con enrollmentId en params
   * @param res - Response con confirmación
   */
  async removeEnrollment(req: Request, res: Response): Promise<void> {
    const { enrollmentId } = req.params;

    if (!enrollmentId) {
      res.status(400).json({
        success: false,
        message: 'ID de inscripción requerido',
      });
      return;
    }

    const result = await adminService.removeEnrollment(req.user!.userId, enrollmentId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }

  /**
   * GET /api/admin/enrollments
   * Listar todos los enrollments del sistema con paginación
   *
   * @param req - Request con query params (page, limit)
   * @param res - Response con enrollments paginados
   */
  async getAllEnrollments(req: Request, res: Response): Promise<void> {
    // Validar parámetros de paginación
    const { page, limit } = paginationSchema.parse(req.query);

    const result = await adminService.getAllEnrollments(req.user!.userId, page, limit);

    res.status(200).json({
      success: true,
      message: 'Enrollments obtenidos exitosamente',
      data: result,
    });
  }

  /**
   * GET /api/admin/stats
   * Obtener estadísticas del sistema para dashboard admin
   *
   * @param req - Request con usuario autenticado
   * @param res - Response con estadísticas completas
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    const stats = await adminService.getDashboardStats(req.user!.userId);

    res.status(200).json({
      success: true,
      message: 'Estadísticas obtenidas exitosamente',
      data: stats,
    });
  }

  /**
   * GET /api/admin/users/:userId/courses/:courseId/progress
   * Obtener progreso detallado de un usuario en un curso específico
   *
   * @param req - Request con userId y courseId en params
   * @param res - Response con progreso detallado por módulo
   */
  async getUserCourseProgress(req: Request, res: Response): Promise<void> {
    const { userId, courseId } = req.params;

    if (!userId || !courseId) {
      res.status(400).json({
        success: false,
        message: 'ID de usuario y curso requeridos',
      });
      return;
    }

    const progress = await adminService.getUserCourseProgress(
      req.user!.userId,
      userId,
      courseId
    );

    res.status(200).json({
      success: true,
      message: 'Progreso obtenido exitosamente',
      data: progress,
    });
  }
}

// Exportar instancia singleton del controlador
export const adminController = new AdminController();
