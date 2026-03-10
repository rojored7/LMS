/**
 * Certificate Service
 * Maneja la lógica de negocio para certificados
 * Generación de PDFs, verificación y envío por email
 */

import { prisma } from '../utils/prisma';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import crypto from 'crypto';
import notificationService from './notification.service';
import emailService from './email.service';
import fs from 'fs/promises';
import path from 'path';

/**
 * Certificate Service
 * Proporciona operaciones para gestión de certificados
 */
class CertificateService {
  private certificatesDir: string;

  constructor() {
    // Directorio donde se guardarán los certificados
    this.certificatesDir = path.join(process.cwd(), 'public', 'certificates');
    this.ensureCertificatesDirectory();
  }

  /**
   * Asegurar que el directorio de certificados existe
   */
  private async ensureCertificatesDirectory() {
    try {
      await fs.mkdir(this.certificatesDir, { recursive: true });
      logger.info(`Directorio de certificados: ${this.certificatesDir}`);
    } catch (error) {
      logger.error(`Error creando directorio de certificados: ${error}`);
    }
  }

  /**
   * Generar código de verificación único
   * @returns Código de verificación
   */
  private generateVerificationCode(): string {
    return crypto.randomBytes(16).toString('hex').toUpperCase();
  }

  /**
   * Generar certificado PDF
   * @param userId - ID del usuario
   * @param courseId - ID del curso
   * @returns URL del certificado generado
   */
  private async generateCertificatePDF(
    userName: string,
    courseName: string,
    completionDate: Date,
    verificationCode: string
  ): Promise<string> {
    // Nombre del archivo
    const filename = `certificate-${verificationCode}.html`;
    const filepath = path.join(this.certificatesDir, filename);

    // Por ahora, generamos un HTML simple en lugar de PDF
    // En producción, usar una librería como PDFKit o puppeteer
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certificado de Finalización</title>
  <style>
    body {
      font-family: 'Georgia', serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .certificate {
      background: white;
      padding: 60px;
      max-width: 800px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      border: 20px solid #f0f0f0;
      text-align: center;
    }
    .header {
      font-size: 48px;
      color: #667eea;
      font-weight: bold;
      margin-bottom: 20px;
      text-transform: uppercase;
      letter-spacing: 4px;
    }
    .subtitle {
      font-size: 18px;
      color: #666;
      margin-bottom: 40px;
    }
    .recipient {
      font-size: 32px;
      color: #333;
      margin: 30px 0;
      font-style: italic;
    }
    .course {
      font-size: 24px;
      color: #667eea;
      margin: 20px 0;
      font-weight: bold;
    }
    .date {
      font-size: 16px;
      color: #999;
      margin: 30px 0;
    }
    .verification {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px solid #f0f0f0;
      font-size: 12px;
      color: #999;
    }
    .code {
      font-family: monospace;
      font-size: 14px;
      color: #667eea;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">Certificado</div>
    <div class="subtitle">Se otorga el presente certificado a</div>
    <div class="recipient">${userName}</div>
    <div class="subtitle">Por completar exitosamente el curso</div>
    <div class="course">${courseName}</div>
    <div class="date">Fecha de finalización: ${completionDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}</div>
    <div class="verification">
      <p>Código de verificación:</p>
      <p class="code">${verificationCode}</p>
      <p>Este certificado puede ser verificado en nuestra plataforma</p>
    </div>
  </div>
</body>
</html>
    `;

    await fs.writeFile(filepath, html, 'utf-8');

    // Retornar URL relativa
    return `/certificates/${filename}`;
  }

  /**
   * Generar certificado para un usuario
   * @param userId - ID del usuario
   * @param courseId - ID del curso
   * @returns Certificado generado
   */
  async generateCertificate(userId: string, courseId: string) {
    // Verificar que el usuario completó el curso
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('No estás inscrito en este curso');
    }

    if (!enrollment.completedAt) {
      throw new ValidationError('Debes completar el curso para obtener el certificado');
    }

    // Verificar si ya tiene certificado
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingCertificate) {
      logger.info(`Usuario ${enrollment.user.email} ya tiene certificado para ${enrollment.course.title}`);
      return existingCertificate;
    }

    // Generar código de verificación
    const verificationCode = this.generateVerificationCode();

    // Generar PDF
    const certificateUrl = await this.generateCertificatePDF(
      enrollment.user.name,
      enrollment.course.title,
      enrollment.completedAt,
      verificationCode
    );

    // Crear registro en BD
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateUrl,
        verificationCode,
        emailSent: false,
      },
    });

    logger.info(
      `Certificado generado para ${enrollment.user.email} - Curso: ${enrollment.course.title} - Código: ${verificationCode}`
    );

    // Crear notificación
    await notificationService.notifyCertificateIssued(
      userId,
      enrollment.course.title,
      certificateUrl
    );

    return certificate;
  }

  /**
   * Enviar certificado por email
   * @param certificateId - ID del certificado
   * @returns Confirmación de envío
   */
  async sendCertificateByEmail(certificateId: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificado no encontrado');
    }

    if (certificate.emailSent) {
      logger.info(`Certificado ${certificateId} ya fue enviado por email`);
      return { alreadySent: true };
    }

    // Construir URL completa del certificado
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';
    const certificateFullUrl = `${baseUrl}${certificate.certificateUrl}`;

    // Enviar email
    try {
      await emailService.sendEmail({
        to: certificate.user.email,
        subject: `¡Tu certificado del curso "${certificate.course.title}" está listo!`,
        html: `
          <h1>¡Felicidades, ${certificate.user.name}!</h1>
          <p>Has completado exitosamente el curso <strong>"${certificate.course.title}"</strong>.</p>
          <p>Tu certificado está disponible en el siguiente enlace:</p>
          <p><a href="${certificateFullUrl}" style="padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">Descargar Certificado</a></p>
          <p>Código de verificación: <strong>${certificate.verificationCode}</strong></p>
          <p>¡Sigue aprendiendo!</p>
        `,
      });

      // Marcar como enviado
      await prisma.certificate.update({
        where: { id: certificateId },
        data: { emailSent: true },
      });

      logger.info(`Certificado enviado por email a ${certificate.user.email}`);

      return { alreadySent: false, sent: true };
    } catch (error) {
      logger.error(`Error enviando certificado por email: ${error}`);
      throw new Error('No se pudo enviar el certificado por email');
    }
  }

  /**
   * Verificar certificado por código
   * @param verificationCode - Código de verificación
   * @returns Información del certificado si es válido
   */
  async verifyCertificate(verificationCode: string) {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationCode },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!certificate) {
      throw new NotFoundError('Certificado no encontrado');
    }

    logger.info(`Certificado verificado: ${verificationCode}`);

    return {
      valid: true,
      userName: certificate.user.name,
      courseName: certificate.course.title,
      issuedAt: certificate.issuedAt,
      verificationCode: certificate.verificationCode,
    };
  }

  /**
   * Obtener certificados de un usuario
   * @param userId - ID del usuario
   * @returns Lista de certificados
   */
  async getUserCertificates(userId: string) {
    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            thumbnail: true,
          },
        },
      },
      orderBy: {
        issuedAt: 'desc',
      },
    });

    return certificates;
  }
}

// Exportar instancia singleton
export default new CertificateService();
