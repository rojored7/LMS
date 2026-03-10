/**
 * Badge Controller
 * Maneja las solicitudes HTTP relacionadas con badges y gamificación
 * HU-029: Sistema de badges y logros
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import badgeService, { CreateBadgeData } from '../services/badge.service';

/**
 * Schema de validación para crear badge
 */
const createBadgeSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'El color debe ser hexadecimal válido').optional(),
  xpReward: z.number().int().min(0, 'El XP debe ser un número positivo'),
});

/**
 * Badge Controller
 * Proporciona endpoints para gestión de badges y gamificación
 */
export class BadgeController {
  /**
   * GET /api/badges
   * Obtener todos los badges disponibles
   */
  async getAllBadges(req: Request, res: Response): Promise<void> {
    const badges = await badgeService.getAllBadges();

    res.status(200).json({
      success: true,
      message: 'Badges obtenidos exitosamente',
      data: { badges },
    });
  }

  /**
   * GET /api/badges/my-badges
   * Obtener badges del usuario actual
   */
  async getMyBadges(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const userBadges = await badgeService.getUserBadges(userId);

    res.status(200).json({
      success: true,
      message: 'Badges del usuario obtenidos exitosamente',
      data: { badges: userBadges },
    });
  }

  /**
   * GET /api/badges/users/:userId/badges
   * Obtener badges de un usuario específico (público para perfiles)
   */
  async getUserBadges(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;

    const userBadges = await badgeService.getUserBadges(userId);

    res.status(200).json({
      success: true,
      message: 'Badges del usuario obtenidos exitosamente',
      data: { badges: userBadges },
    });
  }

  /**
   * GET /api/badges/:badgeId
   * Obtener badge por ID
   */
  async getBadgeById(req: Request, res: Response): Promise<void> {
    const { badgeId } = req.params;

    const badge = await badgeService.getBadgeById(badgeId);

    res.status(200).json({
      success: true,
      message: 'Badge obtenido exitosamente',
      data: { badge },
    });
  }

  /**
   * POST /api/badges (ADMIN only)
   * Crear nuevo badge
   */
  async createBadge(req: Request, res: Response): Promise<void> {
    // Validar datos
    const data = createBadgeSchema.parse(req.body) as CreateBadgeData;

    const badge = await badgeService.createBadge(data);

    res.status(201).json({
      success: true,
      message: 'Badge creado exitosamente',
      data: { badge },
    });
  }

  /**
   * DELETE /api/badges/:badgeId (ADMIN only)
   * Eliminar badge
   */
  async deleteBadge(req: Request, res: Response): Promise<void> {
    const { badgeId } = req.params;

    const result = await badgeService.deleteBadge(badgeId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  }
}

// Exportar instancia singleton del controlador
export const badgeController = new BadgeController();
