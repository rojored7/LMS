/**
 * Storage Service
 * Handles file uploads for projects and other content
 */

import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { logger } from '../middleware/logger';

// Allowed file types for project uploads
const ALLOWED_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.py', '.java', '.cpp', '.c', '.h',
  '.html', '.css', '.scss', '.json',
  '.md', '.txt', '.pdf', '.doc', '.docx',
  '.zip', '.tar', '.gz', '.rar',
  '.png', '.jpg', '.jpeg', '.gif', '.svg',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export class StorageService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(__dirname, '../../uploads');
    this.ensureDirectoriesExist();
  }

  /**
   * Ensures required directories exist
   */
  private ensureDirectoriesExist(): void {
    const dirs = ['projects', 'avatars', 'temp'];

    dirs.forEach(dir => {
      const dirPath = path.join(this.uploadsDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.info('Created upload directory', { path: dirPath });
      }
    });
  }

  /**
   * Multer storage configuration for project files
   */
  getProjectStorage(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const projectDir = path.join(this.uploadsDir, 'projects');
        cb(null, projectDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        const basename = path.basename(file.originalname, ext);
        // Sanitize filename
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
      },
    });

    return multer({
      storage,
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: 10, // Max 10 files per upload
      },
      fileFilter: this.fileFilter,
    });
  }

  /**
   * Multer storage configuration for user avatars
   */
  getAvatarStorage(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const avatarDir = path.join(this.uploadsDir, 'avatars');
        cb(null, avatarDir);
      },
      filename: (req, file, cb) => {
        const userId = (req as any).user?.userId || 'unknown';
        const ext = path.extname(file.originalname);
        cb(null, `avatar-${userId}-${Date.now()}${ext}`);
      },
    });

    return multer({
      storage,
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB for avatars
        files: 1,
      },
      fileFilter: (req, file, cb) => {
        const allowedImageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();

        if (allowedImageTypes.includes(ext)) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed: ${allowedImageTypes.join(', ')}`));
        }
      },
    });
  }

  /**
   * File filter for project uploads
   */
  private fileFilter(
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ): void {
    const ext = path.extname(file.originalname).toLowerCase();

    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${ext}". Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`));
    }
  }

  /**
   * Gets file URL from file path
   */
  getFileUrl(filepath: string): string {
    const relativePath = path.relative(this.uploadsDir, filepath);
    return `/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  /**
   * Gets file metadata
   */
  getFileMetadata(file: Express.Multer.File): { name: string; url: string; size: number } {
    return {
      name: file.originalname,
      url: this.getFileUrl(file.path),
      size: file.size,
    };
  }

  /**
   * Deletes a file
   */
  async deleteFile(filepath: string): Promise<void> {
    try {
      // Convert URL to file path if needed
      let actualPath = filepath;
      if (filepath.startsWith('/uploads/')) {
        actualPath = path.join(this.uploadsDir, filepath.replace('/uploads/', ''));
      }

      if (fs.existsSync(actualPath)) {
        fs.unlinkSync(actualPath);
        logger.info('File deleted', { filepath: actualPath });
      } else {
        logger.warn('File not found for deletion', { filepath: actualPath });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error deleting file', { error: errorMessage, filepath });
      throw new Error(`Failed to delete file: ${errorMessage}`);
    }
  }

  /**
   * Deletes multiple files
   */
  async deleteFiles(filepaths: string[]): Promise<void> {
    await Promise.all(filepaths.map(fp => this.deleteFile(fp)));
  }

  /**
   * Gets disk usage information
   */
  getDiskUsage(): { total: number; used: number; free: number } {
    // This is a placeholder - implement actual disk usage check if needed
    return {
      total: 0,
      used: 0,
      free: 0,
    };
  }

  /**
   * Cleans up old temporary files
   */
  async cleanupTempFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const tempDir = path.join(this.uploadsDir, 'temp');
      const files = fs.readdirSync(tempDir);
      const now = Date.now();
      const cutoffTime = now - olderThanHours * 60 * 60 * 1000;

      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(tempDir, file);
        const stats = fs.statSync(filepath);

        if (stats.mtimeMs < cutoffTime) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      logger.info('Cleaned up temporary files', { deletedCount, olderThanHours });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error cleaning up temp files', { error: errorMessage });
    }
  }
}

// Export singleton instance
export const storageService = new StorageService();
