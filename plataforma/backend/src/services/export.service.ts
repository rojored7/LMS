/**
 * Export Service
 * Business logic for exporting user progress data
 */

import { prisma } from '../utils/prisma';
import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';

interface ExportData {
  user: any;
  enrollments: any[];
  quizzes: any[];
  labs: any[];
  certificates: any[];
  badges: any[];
}

class ExportService {
  /**
   * Export user progress in specified format
   */
  async exportUserProgress(userId: string, format: 'csv' | 'pdf' | 'json'): Promise<Buffer> {
    const data = await this.getUserCompleteData(userId);

    switch (format) {
      case 'csv':
        return this.generateCSV(data);
      case 'pdf':
        return this.generatePDF(data);
      case 'json':
        return Buffer.from(JSON.stringify(data, null, 2));
      default:
        throw new Error(`Formato no soportado: ${format}`);
    }
  }

  /**
   * Get complete user data for export
   */
  private async getUserCompleteData(userId: string): Promise<ExportData> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        xp: true,
        createdAt: true,
        lastLoginAt: true,
        trainingProfile: {
          select: {
            name: true,
            description: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const [enrollments, quizAttempts, labSubmissions, certificates, badges] = await Promise.all([
      // Get enrollments with course details
      prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              title: true,
              description: true,
              level: true,
              duration: true
            }
          }
        }
      }),

      // Get quiz attempts
      prisma.quizAttempt.findMany({
        where: { userId },
        include: {
          quiz: {
            select: {
              title: true,
              module: {
                select: {
                  title: true,
                  course: {
                    select: { title: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 100 // Limit to last 100 attempts
      }),

      // Get lab submissions
      prisma.labSubmission.findMany({
        where: { userId },
        include: {
          lab: {
            select: {
              title: true,
              module: {
                select: {
                  title: true,
                  course: {
                    select: { title: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 100
      }),

      // Get certificates
      prisma.certificate.findMany({
        where: { userId },
        include: {
          course: {
            select: { title: true }
          }
        }
      }),

      // Get badges
      prisma.userBadge.findMany({
        where: { userId },
        include: {
          badge: {
            select: {
              name: true,
              description: true,
              xpReward: true
            }
          }
        }
      })
    ]);

    return {
      user,
      enrollments,
      quizzes: quizAttempts,
      labs: labSubmissions,
      certificates,
      badges
    };
  }

  /**
   * Generate CSV export
   */
  private generateCSV(data: ExportData): Buffer {
    // Prepare enrollment data for CSV
    const enrollmentData = data.enrollments.map(e => ({
      'Curso': e.course.title,
      'Nivel': e.course.level,
      'Fecha Inscripción': new Date(e.enrolledAt).toLocaleDateString(),
      'Progreso (%)': e.progressPercentage || 0,
      'Completado': e.completedAt ? 'Sí' : 'No',
      'Fecha Completado': e.completedAt ? new Date(e.completedAt).toLocaleDateString() : 'N/A'
    }));

    // Prepare quiz data for CSV
    const quizData = data.quizzes.map(q => ({
      'Curso': q.quiz.module.course.title,
      'Módulo': q.quiz.module.title,
      'Quiz': q.quiz.title,
      'Puntuación': q.score,
      'Aprobado': q.passed ? 'Sí' : 'No',
      'Fecha': new Date(q.completedAt || q.startedAt).toLocaleDateString()
    }));

    // Prepare lab data for CSV
    const labData = data.labs.map(l => ({
      'Curso': l.lab.module.course.title,
      'Módulo': l.lab.module.title,
      'Laboratorio': l.lab.title,
      'Aprobado': l.passed ? 'Sí' : 'No',
      'Intentos': l.attempts,
      'Fecha': new Date(l.submittedAt).toLocaleDateString()
    }));

    // Create CSV sections
    const csvSections = [];

    // User info section
    csvSections.push('INFORMACIÓN DEL USUARIO');
    csvSections.push(`Nombre: ${data.user.name}`);
    csvSections.push(`Email: ${data.user.email}`);
    csvSections.push(`Rol: ${data.user.role}`);
    csvSections.push(`XP Total: ${data.user.xp}`);
    csvSections.push(`Perfil: ${data.user.trainingProfile?.name || 'N/A'}`);
    csvSections.push('');

    // Enrollments section
    if (enrollmentData.length > 0) {
      csvSections.push('CURSOS INSCRITOS');
      const parser1 = new Parser();
      csvSections.push(parser1.parse(enrollmentData));
      csvSections.push('');
    }

    // Quizzes section
    if (quizData.length > 0) {
      csvSections.push('INTENTOS DE QUIZ');
      const parser2 = new Parser();
      csvSections.push(parser2.parse(quizData));
      csvSections.push('');
    }

    // Labs section
    if (labData.length > 0) {
      csvSections.push('LABORATORIOS COMPLETADOS');
      const parser3 = new Parser();
      csvSections.push(parser3.parse(labData));
      csvSections.push('');
    }

    // Certificates section
    if (data.certificates.length > 0) {
      csvSections.push('CERTIFICADOS OBTENIDOS');
      data.certificates.forEach(cert => {
        csvSections.push(`- ${cert.course.title} (${new Date(cert.issuedAt).toLocaleDateString()})`);
      });
      csvSections.push('');
    }

    // Badges section
    if (data.badges.length > 0) {
      csvSections.push('INSIGNIAS OBTENIDAS');
      data.badges.forEach(b => {
        csvSections.push(`- ${b.badge.name}: ${b.badge.description} (+${b.badge.xpReward} XP)`);
      });
    }

    return Buffer.from(csvSections.join('\n'));
  }

  /**
   * Generate PDF export
   */
  private async generatePDF(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(24).text('Reporte de Progreso', { align: 'center' });
      doc.moveDown();

      // User information
      doc.fontSize(16).text('Información del Usuario', { underline: true });
      doc.fontSize(12);
      doc.text(`Nombre: ${data.user.name}`);
      doc.text(`Email: ${data.user.email}`);
      doc.text(`Rol: ${data.user.role}`);
      doc.text(`XP Total: ${data.user.xp}`);
      doc.text(`Perfil de Entrenamiento: ${data.user.trainingProfile?.name || 'No asignado'}`);
      doc.text(`Fecha de Registro: ${new Date(data.user.createdAt).toLocaleDateString()}`);
      doc.moveDown();

      // Enrollments
      if (data.enrollments.length > 0) {
        doc.fontSize(16).text('Cursos Inscritos', { underline: true });
        doc.fontSize(11);
        data.enrollments.forEach(e => {
          doc.text(`• ${e.course.title}`);
          doc.fontSize(10).fillColor('gray');
          doc.text(`  Nivel: ${e.course.level} | Progreso: ${e.progressPercentage || 0}%`);
          doc.text(`  Inscrito: ${new Date(e.enrolledAt).toLocaleDateString()}`);
          if (e.completedAt) {
            doc.text(`  ✓ Completado: ${new Date(e.completedAt).toLocaleDateString()}`);
          }
          doc.fontSize(11).fillColor('black');
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }

      // Quiz Performance Summary
      if (data.quizzes.length > 0) {
        doc.fontSize(16).text('Resumen de Quizzes', { underline: true });
        doc.fontSize(11);

        const totalQuizzes = data.quizzes.length;
        const passedQuizzes = data.quizzes.filter(q => q.passed).length;
        const avgScore = data.quizzes.reduce((acc, q) => acc + q.score, 0) / totalQuizzes;

        doc.text(`Total de intentos: ${totalQuizzes}`);
        doc.text(`Quizzes aprobados: ${passedQuizzes} (${Math.round(passedQuizzes/totalQuizzes*100)}%)`);
        doc.text(`Puntuación promedio: ${Math.round(avgScore)}%`);
        doc.moveDown();
      }

      // Lab Summary
      if (data.labs.length > 0) {
        doc.fontSize(16).text('Resumen de Laboratorios', { underline: true });
        doc.fontSize(11);

        const totalLabs = data.labs.length;
        const passedLabs = data.labs.filter(l => l.passed).length;

        doc.text(`Total de laboratorios intentados: ${totalLabs}`);
        doc.text(`Laboratorios completados: ${passedLabs} (${Math.round(passedLabs/totalLabs*100)}%)`);
        doc.moveDown();
      }

      // Certificates
      if (data.certificates.length > 0) {
        doc.addPage();
        doc.fontSize(16).text('Certificados Obtenidos', { underline: true });
        doc.fontSize(11);
        data.certificates.forEach(cert => {
          doc.text(`• ${cert.course.title}`);
          doc.fontSize(10).fillColor('gray');
          doc.text(`  Código de verificación: ${cert.verificationCode}`);
          doc.text(`  Fecha de emisión: ${new Date(cert.issuedAt).toLocaleDateString()}`);
          doc.fontSize(11).fillColor('black');
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }

      // Badges
      if (data.badges.length > 0) {
        doc.fontSize(16).text('Insignias Obtenidas', { underline: true });
        doc.fontSize(11);
        data.badges.forEach(b => {
          doc.text(`• ${b.badge.name} (+${b.badge.xpReward} XP)`);
          doc.fontSize(10).fillColor('gray');
          doc.text(`  ${b.badge.description}`);
          doc.text(`  Obtenida: ${new Date(b.awardedAt).toLocaleDateString()}`);
          doc.fontSize(11).fillColor('black');
          doc.moveDown(0.5);
        });
      }

      // Footer
      doc.moveDown();
      doc.fontSize(10).fillColor('gray');
      doc.text(`Reporte generado el ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    });
  }

  /**
   * Export course analytics
   */
  async exportCourseAnalytics(courseId: string, format: 'csv' | 'json') {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        modules: {
          include: {
            quizzes: {
              include: {
                _count: {
                  select: { quizAttempts: true }
                }
              }
            },
            labs: {
              include: {
                _count: {
                  select: { submissions: true }
                }
              }
            }
          }
        }
      }
    });

    if (!course) {
      throw new Error('Curso no encontrado');
    }

    if (format === 'json') {
      return Buffer.from(JSON.stringify(course, null, 2));
    }

    // Format as CSV
    const studentData = course.enrollments.map(e => ({
      'Estudiante': e.user.name,
      'Email': e.user.email,
      'Fecha Inscripción': new Date(e.enrolledAt).toLocaleDateString(),
      'Progreso (%)': e.progressPercentage || 0,
      'Completado': e.completedAt ? 'Sí' : 'No'
    }));

    const parser = new Parser();
    const csv = parser.parse(studentData);

    return Buffer.from(csv);
  }
}

export default new ExportService();