/**
 * Course Export Service
 * Handles exporting courses from database to ZIP files with Markdown structure
 */

import * as AdmZip from 'adm-zip';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';
import { FileStructure } from '../types/courseImport';
import { CourseWithContent } from '../types/courseManagement';
import courseManagementService from './courseManagement.service';

export class CourseExportService {
  /**
   * Export a course to ZIP file
   * @param courseId Course ID to export
   * @returns ZIP file as Buffer
   */
  async exportCourseToZip(courseId: string): Promise<Buffer> {
    try {
      // Fetch course with all content
      const course = await courseManagementService.getCourseWithFullContent(courseId);

      if (!course) {
        throw new Error('Course not found');
      }

      // Generate markdown structure
      const structure = await this.generateMarkdownStructure(course);

      // Create ZIP archive
      const zipBuffer = await this.createZipArchive(structure);

      logger.info(`Course exported to ZIP: ${courseId}`);
      return zipBuffer;
    } catch (error) {
      logger.error('Error exporting course to ZIP:', error);
      throw error;
    }
  }

  /**
   * Generate Markdown file structure from course data
   * @param course Course with content
   * @returns File structure map
   */
  async generateMarkdownStructure(course: CourseWithContent): Promise<FileStructure> {
    const structure: FileStructure = {};

    // Generate README.md
    structure['README.md'] = this.generateReadmeFile(course);

    // Generate module content
    for (const module of course.modules) {
      const moduleFolder = this.formatModuleFolderName(module.order, module.title);

      // Generate lessons
      for (const lesson of module.lessons) {
        const lessonPath = `teoria/${moduleFolder}/${this.formatLessonFileName(lesson.order, lesson.title)}`;
        structure[lessonPath] = this.generateLessonMarkdown(lesson);
      }

      // Generate quizzes
      for (const quiz of module.quizzes) {
        const quizData = await prisma.quiz.findUnique({
          where: { id: quiz.id },
          include: { questions: true },
        });

        if (quizData) {
          const quizPath = `evaluacion/quiz_${this.sanitizeFileName(module.title)}.md`;
          structure[quizPath] = this.generateQuizMarkdown(quizData);
        }
      }

      // Generate labs
      for (const lab of module.labs) {
        const labPath = `laboratorios/lab_${this.sanitizeFileName(module.title)}_${this.sanitizeFileName(lab.title)}.md`;
        structure[labPath] = this.generateLabMarkdown(lab);
      }
    }

    // Generate projects if they exist
    if (course.projects && course.projects.length > 0) {
      for (const project of course.projects) {
        const projectPath = `proyectos/${this.sanitizeFileName(project.title)}.md`;
        structure[projectPath] = this.generateProjectMarkdown(project);
      }
    }

    // Add metadata file
    structure['metadata.json'] = JSON.stringify({
      exported: new Date().toISOString(),
      courseId: course.id,
      version: course.version,
      modules: course.modules.length,
      totalLessons: course.modules.reduce((sum, m) => sum + m.lessons.length, 0),
      totalQuizzes: course.modules.reduce((sum, m) => sum + m.quizzes.length, 0),
      totalLabs: course.modules.reduce((sum, m) => sum + m.labs.length, 0),
    }, null, 2);

    return structure;
  }

  /**
   * Create ZIP archive from file structure
   * @param structure File structure map
   * @returns ZIP buffer
   */
  async createZipArchive(structure: FileStructure): Promise<Buffer> {
    const zip = new AdmZip();

    // Add each file to the ZIP
    for (const [path, content] of Object.entries(structure)) {
      if (typeof content === 'string') {
        zip.addFile(path, Buffer.from(content, 'utf8'));
      } else {
        zip.addFile(path, content);
      }
    }

    return zip.toBuffer();
  }

  /**
   * Generate README.md content
   * @param course Course data
   * @returns README content
   */
  generateReadmeFile(course: any): string {
    const content = `---
title: ${course.title}
author: ${course.author}
level: ${course.level}
duration: ${course.duration}
tags: ${course.tags.join(', ')}
version: ${course.version}
${course.thumbnail ? `thumbnail: ${course.thumbnail}` : ''}
---

# ${course.title}

## Descripción

${course.description}

## Información del Curso

- **Nivel**: ${course.level}
- **Duración**: ${course.duration} minutos
- **Autor**: ${course.author}
- **Versión**: ${course.version}
- **Publicado**: ${course.isPublished ? 'Sí' : 'No'}
${course.price > 0 ? `- **Precio**: $${course.price}` : '- **Precio**: Gratuito'}

## Contenido del Curso

### Módulos

${course.modules.map((m: any) => `${m.order}. **${m.title}** (${m.duration} min)
   - ${m.lessons.length} lecciones
   - ${m.quizzes.length} evaluaciones
   - ${m.labs.length} laboratorios`).join('\n')}

## Tags

${course.tags.map((tag: string) => `- ${tag}`).join('\n')}

## Estadísticas

- **Total de módulos**: ${course.modules.length}
- **Total de lecciones**: ${course.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)}
- **Total de evaluaciones**: ${course.modules.reduce((sum: number, m: any) => sum + m.quizzes.length, 0)}
- **Total de laboratorios**: ${course.modules.reduce((sum: number, m: any) => sum + m.labs.length, 0)}
${course.enrollmentCount ? `- **Estudiantes inscritos**: ${course.enrollmentCount}` : ''}

---

*Exportado el ${new Date().toLocaleDateString('es-ES')}*`;

    return content;
  }

  /**
   * Generate module markdown
   * @param module Module data
   * @returns Module markdown content
   */
  generateModuleMarkdown(module: any): string {
    return `---
title: ${module.title}
order: ${module.order}
duration: ${module.duration}
published: ${module.isPublished}
---

# ${module.title}

${module.description}

## Información del Módulo

- **Orden**: ${module.order}
- **Duración estimada**: ${module.duration} minutos
- **Estado**: ${module.isPublished ? 'Publicado' : 'Borrador'}

## Contenido

- **Lecciones**: ${module.lessons.length}
- **Evaluaciones**: ${module.quizzes.length}
- **Laboratorios**: ${module.labs.length}`;
  }

  /**
   * Generate lesson markdown
   * @param lesson Lesson data
   * @returns Lesson markdown content
   */
  generateLessonMarkdown(lesson: any): string {
    return `---
title: ${lesson.title}
order: ${lesson.order}
type: ${lesson.type}
estimatedTime: ${lesson.estimatedTime}
---

# ${lesson.title}

${lesson.content}

---

*Tiempo estimado: ${lesson.estimatedTime} minutos*
*Tipo: ${lesson.type}*`;
  }

  /**
   * Generate quiz markdown
   * @param quiz Quiz data with questions
   * @returns Quiz markdown content
   */
  generateQuizMarkdown(quiz: any): string {
    let content = `---
title: ${quiz.title}
passingScore: ${quiz.passingScore}
timeLimit: ${quiz.timeLimit || 'Sin límite'}
attempts: ${quiz.attempts}
---

# ${quiz.title}

${quiz.description}

## Configuración

- **Puntuación mínima para aprobar**: ${quiz.passingScore}%
- **Límite de tiempo**: ${quiz.timeLimit ? `${quiz.timeLimit} minutos` : 'Sin límite'}
- **Intentos permitidos**: ${quiz.attempts}

## Preguntas

`;

    // Add questions
    quiz.questions.forEach((question: any, index: number) => {
      content += `### Pregunta ${index + 1}

**Tipo**: ${question.type}

${question.question}

`;

      if (question.options && Array.isArray(question.options)) {
        content += `**Opciones**:\n`;
        question.options.forEach((option: string, i: number) => {
          content += `${String.fromCharCode(65 + i)}. ${option}\n`;
        });
        content += '\n';
      }

      if (question.explanation) {
        content += `**Explicación**: ${question.explanation}\n\n`;
      }

      content += `---\n\n`;
    });

    return content;
  }

  /**
   * Generate lab markdown
   * @param lab Lab data
   * @returns Lab markdown content
   */
  generateLabMarkdown(lab: any): string {
    let content = `---
title: ${lab.title}
language: ${lab.language}
---

# ${lab.title}

${lab.description}

## Lenguaje

\`${lab.language}\`

## Código Inicial

\`\`\`${lab.language}
${lab.starterCode}
\`\`\`

`;

    if (lab.hints && Array.isArray(lab.hints)) {
      content += `## Pistas\n\n`;
      lab.hints.forEach((hint: string, index: number) => {
        content += `${index + 1}. ${hint}\n`;
      });
      content += '\n';
    }

    if (lab.solution) {
      content += `## Solución de Referencia

\`\`\`${lab.language}
${lab.solution}
\`\`\`

`;
    }

    if (lab.tests) {
      content += `## Tests

\`\`\`json
${JSON.stringify(lab.tests, null, 2)}
\`\`\`
`;
    }

    return content;
  }

  /**
   * Generate project markdown
   * @param project Project data
   * @returns Project markdown content
   */
  generateProjectMarkdown(project: any): string {
    return `---
title: ${project.title}
dueDate: ${project.dueDate ? new Date(project.dueDate).toISOString() : 'Sin fecha límite'}
---

# ${project.title}

${project.description}

## Requisitos

${JSON.stringify(project.requirements, null, 2)}

## Rúbrica de Evaluación

${JSON.stringify(project.rubric, null, 2)}

${project.dueDate ? `## Fecha de Entrega\n\n${new Date(project.dueDate).toLocaleDateString('es-ES')}\n` : ''}`;
  }

  /**
   * Format module folder name
   * @param order Module order
   * @param title Module title
   * @returns Formatted folder name
   */
  private formatModuleFolderName(order: number, title: string): string {
    const paddedOrder = order.toString().padStart(2, '0');
    const sanitized = this.sanitizeFileName(title);
    return `${paddedOrder}_${sanitized}`;
  }

  /**
   * Format lesson file name
   * @param order Lesson order
   * @param title Lesson title
   * @returns Formatted file name
   */
  private formatLessonFileName(order: number, title: string): string {
    const paddedOrder = order.toString().padStart(2, '0');
    const sanitized = this.sanitizeFileName(title);
    return `${paddedOrder}_${sanitized}.md`;
  }

  /**
   * Sanitize filename for filesystem compatibility
   * @param name Original name
   * @returns Sanitized filename
   */
  private sanitizeFileName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .substring(0, 100); // Limit filename length
  }
}

// Export singleton instance
export default new CourseExportService();