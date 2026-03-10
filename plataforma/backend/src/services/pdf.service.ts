/**
 * PDF Generation Service
 * Generates certificates and other PDF documents
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '../middleware/logger';

export class PDFService {
  private publicDir: string;

  constructor() {
    this.publicDir = path.join(__dirname, '../../public');
    this.ensureDirectoriesExist();
  }

  /**
   * Ensures required directories exist
   */
  private ensureDirectoriesExist(): void {
    const certificatesDir = path.join(this.publicDir, 'certificates');
    if (!fs.existsSync(certificatesDir)) {
      fs.mkdirSync(certificatesDir, { recursive: true });
      logger.info('Created certificates directory', { path: certificatesDir });
    }
  }

  /**
   * Generates a course completion certificate
   */
  async generateCertificate(params: {
    userName: string;
    courseName: string;
    completionDate: Date;
    certificateId: string;
  }): Promise<string> {
    const { userName, courseName, completionDate, certificateId } = params;

    logger.info('Generating certificate', { userName, courseName, certificateId });

    return new Promise((resolve, reject) => {
      try {
        // Create PDF document in landscape orientation
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: {
            top: 50,
            bottom: 50,
            left: 72,
            right: 72,
          },
        });

        const filename = `${certificateId}.pdf`;
        const filepath = path.join(this.publicDir, 'certificates', filename);
        const stream = fs.createWriteStream(filepath);

        doc.pipe(stream);

        // Certificate design
        this.drawCertificateBackground(doc);
        this.drawCertificateContent(doc, userName, courseName, completionDate, certificateId);

        doc.end();

        stream.on('finish', () => {
          const url = `/certificates/${filename}`;
          logger.info('Certificate generated successfully', { url, filepath });
          resolve(url);
        });

        stream.on('error', (error) => {
          logger.error('Error writing certificate file', { error: error.message });
          reject(new Error('Failed to write certificate file'));
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Error generating certificate', { error: errorMessage });
        reject(new Error(`Failed to generate certificate: ${errorMessage}`));
      }
    });
  }

  /**
   * Draws certificate background and border
   */
  private drawCertificateBackground(doc: typeof PDFDocument.prototype): void {
    // Outer border
    doc
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .lineWidth(3)
      .strokeColor('#2563eb')
      .stroke();

    // Inner border
    doc
      .rect(40, 40, doc.page.width - 80, doc.page.height - 80)
      .lineWidth(1)
      .strokeColor('#60a5fa')
      .stroke();

    // Decorative corner elements
    const cornerSize = 50;
    doc.fillColor('#dbeafe').opacity(0.5);
    doc.circle(50, 50, cornerSize / 2).fill();
    doc.circle(doc.page.width - 50, 50, cornerSize / 2).fill();
    doc.circle(50, doc.page.height - 50, cornerSize / 2).fill();
    doc.circle(doc.page.width - 50, doc.page.height - 50, cornerSize / 2).fill();
    doc.opacity(1);
  }

  /**
   * Draws certificate content
   */
  private drawCertificateContent(
    doc: typeof PDFDocument.prototype,
    userName: string,
    courseName: string,
    completionDate: Date,
    certificateId: string
  ): void {
    const centerX = doc.page.width / 2;
    let currentY = 100;

    // Title
    doc
      .fontSize(40)
      .fillColor('#1e40af')
      .font('Helvetica-Bold')
      .text('CERTIFICADO DE COMPLETACIÓN', 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    currentY += 80;

    // "Se otorga a" text
    doc
      .fontSize(18)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text('Se otorga a', 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    currentY += 40;

    // User name (highlighted)
    doc
      .fontSize(32)
      .fillColor('#1e40af')
      .font('Helvetica-Bold')
      .text(userName, 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    // Underline for name
    const nameWidth = doc.widthOfString(userName);
    doc
      .moveTo(centerX - nameWidth / 2, currentY + 40)
      .lineTo(centerX + nameWidth / 2, currentY + 40)
      .lineWidth(2)
      .strokeColor('#93c5fd')
      .stroke();

    currentY += 70;

    // "Por haber completado exitosamente" text
    doc
      .fontSize(16)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text('Por haber completado exitosamente el curso', 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    currentY += 40;

    // Course name
    doc
      .fontSize(24)
      .fillColor('#1e40af')
      .font('Helvetica-Bold')
      .text(courseName, 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    currentY += 60;

    // Date
    doc
      .fontSize(14)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text(`Fecha de finalización: ${this.formatDate(completionDate)}`, 0, currentY, {
        align: 'center',
        width: doc.page.width,
      });

    // Certificate ID at the bottom
    doc
      .fontSize(10)
      .fillColor('#9ca3af')
      .font('Helvetica')
      .text(`ID de verificación: ${certificateId}`, 0, doc.page.height - 80, {
        align: 'center',
        width: doc.page.width,
      });

    // Logo/Brand text
    doc
      .fontSize(12)
      .fillColor('#2563eb')
      .font('Helvetica-Bold')
      .text('Plataforma de Ciberseguridad', 0, doc.page.height - 100, {
        align: 'center',
        width: doc.page.width,
      });
  }

  /**
   * Formats date in Spanish
   */
  private formatDate(date: Date): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  }

  /**
   * Deletes a certificate file
   */
  async deleteCertificate(certificateUrl: string): Promise<void> {
    try {
      const filename = path.basename(certificateUrl);
      const filepath = path.join(this.publicDir, 'certificates', filename);

      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        logger.info('Certificate deleted', { filepath });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting certificate', { error: errorMessage, url: certificateUrl });
    }
  }
}

// Export singleton instance
export const pdfService = new PDFService();
