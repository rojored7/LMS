/**
 * Course Import Service
 * Handles importing courses from ZIP files containing Markdown structure
 */

import * as AdmZip from 'adm-zip';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';
import {
  CourseStructure,
  CourseMetadata,
  ModuleStructure,
  LessonFile,
  QuizFile,
  LabFile,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  MarkdownFiles,
  InvalidZipStructureError,
  MissingRequiredFilesError,
  InvalidMarkdownError,
  DuplicateCourseSlugError,
} from '../types/courseImport';
import { Course, Prisma } from '@prisma/client';

// Initialize DOMPurify with JSDOM
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export class CourseImportService {
  private readonly MAX_ZIP_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly REQUIRED_FOLDERS = ['teoria', 'evaluacion'];
  private readonly OPTIONAL_FOLDERS = ['laboratorios', 'recursos'];

  /**
   * Parse and validate a ZIP file containing course structure
   * @param zipBuffer Buffer containing the ZIP file
   * @returns Parsed course structure
   */
  async parseZipStructure(zipBuffer: Buffer): Promise<CourseStructure> {
    try {
      // Check size limit
      if (zipBuffer.length > this.MAX_ZIP_SIZE) {
        throw new InvalidZipStructureError(`ZIP file exceeds maximum size of 50MB`);
      }

      const zip = new AdmZip(zipBuffer);
      const entries = zip.getEntries();

      // Extract and organize files
      const markdownFiles: MarkdownFiles = {};
      let readmeContent = '';

      for (const entry of entries) {
        const entryName = entry.entryName;

        // Skip directories and non-markdown files
        if (entry.isDirectory || (!entryName.endsWith('.md') && !entryName.endsWith('.txt'))) {
          continue;
        }

        const content = entry.getData().toString('utf8');

        if (entryName === 'README.md' || entryName === 'readme.md') {
          readmeContent = content;
        } else {
          markdownFiles[entryName] = {
            content: this.sanitizeContent(content),
            frontmatter: this.extractFrontmatter(content),
          };
        }
      }

      if (!readmeContent) {
        throw new MissingRequiredFilesError('README.md file is required in the root directory');
      }

      // Parse course metadata from README
      const metadata = this.parseReadmeMetadata(readmeContent);

      // Organize content into modules
      const modules = this.organizeModules(markdownFiles);

      return {
        readme: readmeContent,
        modules,
        metadata,
      };
    } catch (error) {
      logger.error('Error parsing ZIP structure:', error);
      throw error;
    }
  }

  /**
   * Validate course structure for completeness and correctness
   * @param structure Course structure to validate
   * @returns Validation result with errors and warnings
   */
  validateCourseStructure(structure: CourseStructure): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate metadata
    if (!structure.metadata.title) {
      errors.push({
        type: 'MISSING_REQUIRED',
        message: 'Course title is required',
        path: 'metadata.title',
      });
    }

    if (!structure.metadata.description) {
      errors.push({
        type: 'MISSING_REQUIRED',
        message: 'Course description is required',
        path: 'metadata.description',
      });
    }

    if (!structure.metadata.author) {
      warnings.push({
        type: 'RECOMMENDATION',
        message: 'Course author should be specified',
        path: 'metadata.author',
      });
    }

    // Validate modules
    if (!structure.modules || structure.modules.length === 0) {
      errors.push({
        type: 'STRUCTURE',
        message: 'Course must have at least one module',
        path: 'modules',
      });
    }

    structure.modules.forEach((module, index) => {
      if (!module.name) {
        errors.push({
          type: 'MISSING_REQUIRED',
          message: `Module ${index + 1} is missing a name`,
          path: `modules[${index}].name`,
        });
      }

      if (!module.lessons || module.lessons.length === 0) {
        warnings.push({
          type: 'RECOMMENDATION',
          message: `Module "${module.name}" has no lessons`,
          path: `modules[${index}].lessons`,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Import a complete course from a ZIP file
   * @param zipBuffer ZIP file buffer
   * @param instructorId ID of the instructor importing the course
   * @param metadata Optional metadata overrides
   * @returns Created course
   */
  async importCourseFromZip(
    zipBuffer: Buffer,
    instructorId: string,
    metadata?: Partial<Course>
  ): Promise<Course> {
    try {
      // Parse ZIP structure
      const structure = await this.parseZipStructure(zipBuffer);

      // Validate structure
      const validation = this.validateCourseStructure(structure);
      if (!validation.valid) {
        throw new InvalidZipStructureError(
          `Invalid course structure: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Create course in database
      const course = await this.createCourseFromStructure(structure, instructorId, metadata);

      logger.info(`Course imported successfully: ${course.id}`);
      return course;
    } catch (error) {
      logger.error('Error importing course from ZIP:', error);
      throw error;
    }
  }

  /**
   * Create course and all related content in database
   * @param structure Parsed course structure
   * @param instructorId Instructor ID
   * @param overrides Optional metadata overrides
   * @returns Created course
   */
  async createCourseFromStructure(
    structure: CourseStructure,
    instructorId: string,
    overrides?: Partial<Course>
  ): Promise<Course> {
    const slug = this.generateSlug(structure.metadata.title);

    // Check for duplicate slug
    const existingCourse = await prisma.course.findUnique({
      where: { slug },
    });

    if (existingCourse) {
      throw new DuplicateCourseSlugError(`Course with slug "${slug}" already exists`);
    }

    // Create course with all related data in a transaction
    const course = await prisma.$transaction(async (tx) => {
      // Create course
      const newCourse = await tx.course.create({
        data: {
          slug,
          title: structure.metadata.title,
          description: structure.metadata.description,
          author: structure.metadata.author || instructorId,
          level: structure.metadata.level || 'BEGINNER',
          duration: structure.metadata.duration || 0,
          tags: structure.metadata.tags || [],
          version: structure.metadata.version || '1.0',
          thumbnail: structure.metadata.thumbnail,
          isPublished: false,
          ...overrides,
        },
      });

      // Create modules with content
      for (const moduleData of structure.modules) {
        const module = await tx.module.create({
          data: {
            courseId: newCourse.id,
            order: moduleData.order,
            title: moduleData.name,
            description: moduleData.description || '',
            duration: this.calculateModuleDuration(moduleData),
            isPublished: false,
          },
        });

        // Create lessons
        for (const lessonData of moduleData.lessons) {
          await tx.lesson.create({
            data: {
              moduleId: module.id,
              order: lessonData.order,
              title: lessonData.title,
              content: lessonData.content,
              type: lessonData.type || 'TEXT',
              estimatedTime: lessonData.estimatedTime || 10,
            },
          });
        }

        // Create quizzes
        for (const quizData of moduleData.quizzes) {
          const quiz = await tx.quiz.create({
            data: {
              moduleId: module.id,
              title: quizData.title,
              description: quizData.description,
              passingScore: quizData.passingScore,
              timeLimit: quizData.timeLimit,
              attempts: quizData.attempts || 3,
            },
          });

          // Create questions
          for (const questionData of quizData.questions) {
            await tx.question.create({
              data: {
                quizId: quiz.id,
                order: questionData.order,
                type: questionData.type,
                question: questionData.question,
                options: questionData.options || null,
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation,
              },
            });
          }
        }

        // Create labs
        for (const labData of moduleData.labs) {
          await tx.lab.create({
            data: {
              moduleId: module.id,
              title: labData.title,
              description: labData.description,
              language: labData.language,
              starterCode: labData.starterCode,
              solution: labData.solution,
              tests: labData.tests,
              hints: labData.hints || null,
            },
          });
        }
      }

      return newCourse;
    });

    return course;
  }

  /**
   * Extract frontmatter from Markdown content
   * @param content Markdown content
   * @returns Parsed frontmatter object
   */
  private extractFrontmatter(content: string): Record<string, any> {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
      return {};
    }

    const frontmatterText = match[1];
    const frontmatter: Record<string, any> = {};

    frontmatterText.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length > 0) {
        const value = valueParts.join(':').trim();
        frontmatter[key.trim()] = value;
      }
    });

    return frontmatter;
  }

  /**
   * Sanitize HTML/Markdown content
   * @param content Raw content
   * @returns Sanitized content
   */
  private sanitizeContent(content: string): string {
    // Convert Markdown to HTML
    const html = marked(content);

    // Sanitize HTML
    const sanitized = purify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'hr',
        'ul', 'ol', 'li',
        'a', 'strong', 'b', 'em', 'i', 'u',
        'code', 'pre', 'blockquote',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'img', 'figure', 'figcaption',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
    });

    return sanitized;
  }

  /**
   * Parse README metadata
   * @param readmeContent README content
   * @returns Course metadata
   */
  private parseReadmeMetadata(readmeContent: string): CourseMetadata {
    const frontmatter = this.extractFrontmatter(readmeContent);

    // Extract from frontmatter or parse from content
    const lines = readmeContent.split('\n');
    let title = frontmatter.title || '';
    let description = frontmatter.description || '';

    // Try to extract from content if not in frontmatter
    if (!title) {
      const titleMatch = lines.find(line => line.startsWith('# '));
      if (titleMatch) {
        title = titleMatch.replace('# ', '').trim();
      }
    }

    if (!description) {
      const descIndex = lines.findIndex(line => line.includes('## Descripción') || line.includes('## Description'));
      if (descIndex !== -1 && lines[descIndex + 1]) {
        description = lines[descIndex + 1].trim();
      }
    }

    return {
      title: title || 'Untitled Course',
      description: description || 'No description provided',
      author: frontmatter.author || 'Unknown',
      level: this.parseLevel(frontmatter.level) || 'BEGINNER',
      duration: parseInt(frontmatter.duration) || 0,
      tags: this.parseTags(frontmatter.tags) || [],
      version: frontmatter.version || '1.0',
      thumbnail: frontmatter.thumbnail,
    };
  }

  /**
   * Organize Markdown files into module structure
   * @param files Markdown files map
   * @returns Array of module structures
   */
  private organizeModules(files: MarkdownFiles): ModuleStructure[] {
    const modules: ModuleStructure[] = [];
    const moduleMap = new Map<string, ModuleStructure>();

    Object.keys(files).forEach((path) => {
      const parts = path.split('/');

      // Determine module from path
      if (parts[0] === 'teoria' && parts.length > 1) {
        const moduleName = this.extractModuleName(parts[1]);

        if (!moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, {
            name: moduleName,
            order: this.extractOrder(parts[1]),
            lessons: [],
            quizzes: [],
            labs: [],
          });
        }

        const module = moduleMap.get(moduleName)!;
        const file = files[path];

        // Add as lesson
        module.lessons.push({
          filename: path,
          title: file.frontmatter?.title || this.extractTitle(parts[parts.length - 1]),
          content: file.content,
          order: this.extractOrder(parts[parts.length - 1]),
          type: 'TEXT',
          estimatedTime: parseInt(file.frontmatter?.duration) || 10,
        });
      }

      // Handle quiz files
      if (parts[0] === 'evaluacion') {
        const moduleName = this.extractModuleFromQuizName(parts[parts.length - 1]);

        if (!moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, {
            name: moduleName,
            order: modules.length + 1,
            lessons: [],
            quizzes: [],
            labs: [],
          });
        }

        const module = moduleMap.get(moduleName)!;
        const file = files[path];

        // Parse quiz structure from content
        const quizData = this.parseQuizContent(file.content, file.frontmatter);
        module.quizzes.push(quizData);
      }

      // Handle lab files
      if (parts[0] === 'laboratorios') {
        const moduleName = this.extractModuleFromLabName(parts[parts.length - 1]);

        if (!moduleMap.has(moduleName)) {
          moduleMap.set(moduleName, {
            name: moduleName,
            order: modules.length + 1,
            lessons: [],
            quizzes: [],
            labs: [],
          });
        }

        const module = moduleMap.get(moduleName)!;
        const file = files[path];

        // Parse lab structure from content
        const labData = this.parseLabContent(file.content, file.frontmatter);
        module.labs.push(labData);
      }
    });

    // Convert map to array and sort by order
    return Array.from(moduleMap.values()).sort((a, b) => a.order - b.order);
  }

  /**
   * Parse quiz content from Markdown
   * @param content Quiz content
   * @param frontmatter Frontmatter data
   * @returns Quiz file structure
   */
  private parseQuizContent(content: string, frontmatter?: any): QuizFile {
    // This is a simplified parser - in production, you'd want more robust parsing
    const questions: any[] = [];

    // Parse questions from content (simplified)
    const questionBlocks = content.split(/\n## Pregunta \d+/);

    questionBlocks.slice(1).forEach((block, index) => {
      const lines = block.trim().split('\n');
      questions.push({
        order: index + 1,
        type: 'MULTIPLE_CHOICE',
        question: lines[0] || '',
        options: [],
        correctAnswer: '',
        explanation: '',
      });
    });

    return {
      filename: '',
      title: frontmatter?.title || 'Quiz',
      description: frontmatter?.description || '',
      passingScore: parseInt(frontmatter?.passingScore) || 70,
      timeLimit: parseInt(frontmatter?.timeLimit) || undefined,
      attempts: parseInt(frontmatter?.attempts) || 3,
      questions,
    };
  }

  /**
   * Parse lab content from Markdown
   * @param content Lab content
   * @param frontmatter Frontmatter data
   * @returns Lab file structure
   */
  private parseLabContent(content: string, frontmatter?: any): LabFile {
    return {
      filename: '',
      title: frontmatter?.title || 'Lab',
      description: frontmatter?.description || '',
      language: frontmatter?.language || 'python',
      starterCode: frontmatter?.starterCode || '',
      solution: frontmatter?.solution,
      tests: [],
      hints: frontmatter?.hints || [],
    };
  }

  /**
   * Generate URL-friendly slug from title
   * @param title Course title
   * @returns URL slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Parse level from string
   * @param level Level string
   * @returns Normalized level
   */
  private parseLevel(level?: string): 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' {
    const normalized = (level || '').toUpperCase();

    if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'].includes(normalized)) {
      return normalized as any;
    }

    return 'BEGINNER';
  }

  /**
   * Parse tags from string or array
   * @param tags Tags input
   * @returns Array of tags
   */
  private parseTags(tags?: string | string[]): string[] {
    if (!tags) return [];

    if (typeof tags === 'string') {
      return tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    return tags;
  }

  /**
   * Extract module name from folder name
   * @param folderName Folder name
   * @returns Module name
   */
  private extractModuleName(folderName: string): string {
    return folderName.replace(/^\d+[-_]/, '').replace(/[-_]/g, ' ');
  }

  /**
   * Extract order number from filename
   * @param filename Filename
   * @returns Order number
   */
  private extractOrder(filename: string): number {
    const match = filename.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 999;
  }

  /**
   * Extract title from filename
   * @param filename Filename
   * @returns Title
   */
  private extractTitle(filename: string): string {
    return filename
      .replace(/^\d+[-_]/, '')
      .replace(/\.(md|txt)$/, '')
      .replace(/[-_]/g, ' ');
  }

  /**
   * Extract module name from quiz filename
   * @param filename Quiz filename
   * @returns Module name
   */
  private extractModuleFromQuizName(filename: string): string {
    const match = filename.match(/quiz[_-](.+)\.(md|txt)/i);
    return match ? match[1].replace(/[-_]/g, ' ') : 'General';
  }

  /**
   * Extract module name from lab filename
   * @param filename Lab filename
   * @returns Module name
   */
  private extractModuleFromLabName(filename: string): string {
    const match = filename.match(/lab[_-](.+)\.(md|txt)/i);
    return match ? match[1].replace(/[-_]/g, ' ') : 'General';
  }

  /**
   * Calculate estimated module duration
   * @param module Module structure
   * @returns Duration in minutes
   */
  private calculateModuleDuration(module: ModuleStructure): number {
    let duration = 0;

    module.lessons.forEach(lesson => {
      duration += lesson.estimatedTime || 10;
    });

    module.quizzes.forEach(quiz => {
      duration += quiz.timeLimit || 15;
    });

    module.labs.forEach(() => {
      duration += 30; // Default lab time
    });

    return duration;
  }
}

// Export singleton instance
export default new CourseImportService();