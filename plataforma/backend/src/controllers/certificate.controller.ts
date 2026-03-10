/**
 * Certificate Controller
 * Maneja las solicitudes HTTP relacionadas con certificados
 * HU-030: Generación de certificados, HU-031: Verificación de autenticidad
 */

import { Request, Response } from 'express';
import certificateService from '../services/certificate.service';

/**
 * Certificate Controller
 * Proporciona endpoints para gestión de certificados
 */
export class CertificateController {
  /**
   * POST /api/certificates/generate/:courseId
   * Generar certificado para un curso completado
   */
  async generateCertificate(req: Request, res: Response): Promise<void> {
    const { courseId } = req.params;
    const userId = req.user!.userId;

    // Generar certificado (el servicio verifica que el curso esté completado)
    const certificate = await certificateService.generateCertificate(userId, courseId);

    // Enviar por email si está configurado
    try {
      await certificateService.sendCertificateByEmail(certificate.id);
    } catch (error) {
      // No falla si el email no se puede enviar
      console.warn('No se pudo enviar el certificado por email:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Certificado generado exitosamente',
      data: { certificate },
    });
  }

  /**
   * GET /api/certificates/:certificateId
   * Obtener certificado por ID
   */
  async getCertificate(req: Request, res: Response): Promise<void> {
    const { certificateId } = req.params;
    const userId = req.user!.userId;

    // Obtener certificado de BD
    const certificate = await certificateService.getUserCertificates(userId);

    // Filtrar solo el certificado solicitado
    const requestedCertificate = certificate.find((cert) => cert.id === certificateId);

    if (!requestedCertificate) {
      res.status(404).json({
        success: false,
        message: 'Certificado no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Certificado obtenido exitosamente',
      data: { certificate: requestedCertificate },
    });
  }

  /**
   * GET /api/certificates/verify/:verificationCode
   * Verificar autenticidad de certificado (endpoint público)
   */
  async verifyCertificate(req: Request, res: Response): Promise<void> {
    const { verificationCode } = req.params;

    // Verificar certificado
    const verification = await certificateService.verifyCertificate(verificationCode);

    res.status(200).json({
      success: true,
      message: 'Certificado verificado exitosamente',
      data: verification,
    });
  }

  /**
   * GET /api/certificates/my-certificates
   * Obtener todos los certificados del usuario actual
   */
  async getMyCertificates(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId;

    const certificates = await certificateService.getUserCertificates(userId);

    res.status(200).json({
      success: true,
      message: 'Certificados obtenidos exitosamente',
      data: { certificates },
    });
  }
}

// Exportar instancia singleton del controlador
export const certificateController = new CertificateController();
