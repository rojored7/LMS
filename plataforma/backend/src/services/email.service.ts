/**
 * Servicio de Email
 * Maneja el envío de correos electrónicos usando nodemailer
 */

import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../middleware/logger';

/**
 * Servicio de Email
 */
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar transporter SMTP
    this.transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT || 587,
      secure: config.SMTP_PORT === 465, // true para 465, false para otros puertos
      auth: config.SMTP_USER && config.SMTP_PASS ? {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      } : undefined,
    });
  }

  /**
   * Envía email de recuperación de contraseña
   * HU-005 AC3: Envío de email con link de recuperación
   *
   * @param email - Email del destinatario
   * @param resetToken - Token de reseteo (sin hash)
   * @returns Promise<void>
   * @throws Error si falla el envío del email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: config.SMTP_FROM || 'noreply@plataforma-cursos.com',
      to: email,
      subject: 'Recuperación de Contraseña - Plataforma Ciberseguridad',
      html: `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%);
              color: white;
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              padding: 40px 30px;
            }
            .content p {
              margin: 0 0 20px 0;
              color: #4b5563;
            }
            .button {
              display: inline-block;
              padding: 14px 32px;
              background-color: #0891b2;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
              transition: background-color 0.2s;
            }
            .button:hover {
              background-color: #0e7490;
            }
            .warning-box {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .warning-box p {
              margin: 0;
              color: #92400e;
              font-size: 14px;
            }
            .footer {
              background-color: #f9fafb;
              padding: 20px 30px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            .footer p {
              margin: 5px 0;
              color: #6b7280;
              font-size: 12px;
            }
            .link-box {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              word-break: break-all;
              margin: 20px 0;
            }
            .link-box a {
              color: #0891b2;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Recuperación de Contraseña</h1>
            </div>

            <div class="content">
              <p>Hola,</p>

              <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en la Plataforma de Ciberseguridad.</p>

              <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>

              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>

              <p>O copia y pega este enlace en tu navegador:</p>

              <div class="link-box">
                <a href="${resetUrl}">${resetUrl}</a>
              </div>

              <div class="warning-box">
                <p><strong>⏰ Este enlace expirará en 1 hora por seguridad.</strong></p>
              </div>

              <p>Si no solicitaste este cambio, puedes ignorar este email de forma segura. Tu contraseña no será modificada.</p>

              <p style="margin-top: 30px;">Saludos,<br><strong>Equipo de Plataforma de Ciberseguridad</strong></p>
            </div>

            <div class="footer">
              <p><strong>Plataforma Multi-Curso de Ciberseguridad</strong></p>
              <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
              <p style="margin-top: 10px;">
                Si tienes problemas con el botón, copia y pega el enlace directamente en tu navegador.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Recuperación de Contraseña - Plataforma de Ciberseguridad

        Hola,

        Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.

        Para crear una nueva contraseña, visita el siguiente enlace:
        ${resetUrl}

        Este enlace expirará en 1 hora por seguridad.

        Si no solicitaste este cambio, puedes ignorar este email de forma segura.

        Saludos,
        Equipo de Plataforma de Ciberseguridad
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info(`Email de recuperación enviado exitosamente a ${email}`);
    } catch (error) {
      logger.error(`Error al enviar email de recuperación a ${email}:`, error);
      throw new Error('Error al enviar email de recuperación. Por favor intenta de nuevo más tarde.');
    }
  }

  /**
   * Verifica la conexión SMTP
   * Útil para healthchecks
   *
   * @returns true si la conexión es exitosa, false si no
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Conexión SMTP verificada exitosamente');
      return true;
    } catch (error) {
      logger.error('Error verificando conexión SMTP:', error);
      return false;
    }
  }
}

// Exportar instancia singleton del servicio
export const emailService = new EmailService();
