import api from '../api';

const API_URL = '/admin/courses';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface ModulePreview {
  title: string;
  lessons: number;
  quizzes: number;
  labs: number;
}

export interface CourseStructure {
  title: string;
  description: string;
  level: string;
  duration: number;
  modules: ModulePreview[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  preview?: CourseStructure;
}

export interface ImportResult {
  success: boolean;
  course?: any;
  message?: string;
  errors?: ValidationError[];
}

class CourseImportService {
  /**
   * Upload and import a ZIP file
   */
  async uploadZip(file: File, onProgress?: (progress: number) => void): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('courseZip', file);

    try {
      const response = await api.post(`${API_URL}/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      const envelope = response as any;
      const courseData = envelope.data || envelope;
      return {
        success: true,
        course: {
          id: courseData.courseId || courseData.id,
          title: courseData.title,
        },
        message: courseData.message || envelope.message || 'Curso importado exitosamente',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.error?.message || 'Error al importar el curso',
        errors: error?.error?.details || [],
      };
    }
  }

  /**
   * Validate ZIP without importing
   */
  async validateZip(file: File): Promise<ValidationResult> {
    const formData = new FormData();
    formData.append('courseZip', file);

    try {
      const response = await api.post(`${API_URL}/import/validate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000,
      });

      return (response as any).data || response;
    } catch (error: any) {
      return {
        valid: false,
        errors: [
          {
            field: 'file',
            message: error?.error?.message || 'Error al validar el archivo ZIP',
          },
        ],
        warnings: [],
      };
    }
  }

  /**
   * Check if a file is a valid ZIP
   */
  isValidZipFile(file: File): boolean {
    const validTypes = ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'];
    const validExtensions = ['.zip'];

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    return hasValidType || hasValidExtension;
  }

  /**
   * Check file size (max 50MB)
   */
  isValidFileSize(file: File, maxSizeMB: number = 50): boolean {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert MB to bytes
    return file.size <= maxSize;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const courseImportService = new CourseImportService();
export default courseImportService;
