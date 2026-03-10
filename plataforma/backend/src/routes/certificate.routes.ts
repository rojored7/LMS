/**
 * Certificate Routes
 * Define los endpoints para gestión de certificados
 * HU-030: Generación de certificados, HU-031: Verificación de autenticidad
 */

import { Router } from 'express';
import { certificateController } from '../controllers/certificate.controller';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /api/certificates/generate/:courseId
 * Generar certificado para un curso completado
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Certificado generado exitosamente",
 *   data: {
 *     certificate: {
 *       id, userId, courseId, certificateUrl,
 *       verificationCode, issuedAt, emailSent
 *     }
 *   }
 * }
 */
router.post(
  '/generate/:courseId',
  authenticate,
  asyncHandler(certificateController.generateCertificate.bind(certificateController))
);

/**
 * IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros
 */

/**
 * GET /api/certificates/my-certificates
 * Obtener todos los certificados del usuario actual
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Certificados obtenidos exitosamente",
 *   data: {
 *     certificates: [
 *       {
 *         id, certificateUrl, verificationCode,
 *         issuedAt, course: { id, slug, title, thumbnail }
 *       }
 *     ]
 *   }
 * }
 */
router.get(
  '/my-certificates',
  authenticate,
  asyncHandler(certificateController.getMyCertificates.bind(certificateController))
);

/**
 * GET /api/certificates/verify/:verificationCode
 * Verificar autenticidad de certificado (endpoint público)
 *
 * Roles permitidos: Público (sin autenticación)
 *
 * Response:
 * {
 *   success: true,
 *   message: "Certificado verificado exitosamente",
 *   data: {
 *     valid: true,
 *     userName: "Juan Pérez",
 *     courseName: "Fundamentos de Ciberseguridad",
 *     issuedAt: "2024-03-04T...",
 *     verificationCode: "ABC123..."
 *   }
 * }
 */
router.get(
  '/verify/:verificationCode',
  asyncHandler(certificateController.verifyCertificate.bind(certificateController))
);

/**
 * GET /api/certificates/:certificateId
 * Obtener certificado por ID
 *
 * Roles permitidos: Todos los usuarios autenticados
 *
 * Response:
 * {
 *   success: true,
 *   message: "Certificado obtenido exitosamente",
 *   data: {
 *     certificate: {
 *       id, certificateUrl, verificationCode,
 *       issuedAt, course: {...}
 *     }
 *   }
 * }
 */
router.get(
  '/:certificateId',
  authenticate,
  asyncHandler(certificateController.getCertificate.bind(certificateController))
);

export default router;
