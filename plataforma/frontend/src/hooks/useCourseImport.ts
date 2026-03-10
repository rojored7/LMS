import { useState, useCallback } from 'react';
import courseImportService, {
  ValidationResult,
  ImportResult
} from '../services/api/courseImport.service';
import { useNavigate } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';

export interface UseCourseImportReturn {
  file: File | null;
  setFile: (file: File | null) => void;
  uploading: boolean;
  uploadProgress: number;
  validation: ValidationResult | null;
  error: string | null;
  validateZip: (file: File) => Promise<void>;
  importCourse: (file: File) => Promise<void>;
  resetState: () => void;
  isValidZip: (file: File) => boolean;
  isValidSize: (file: File) => boolean;
  formatFileSize: (bytes: number) => string;
}

export const useCourseImport = (): UseCourseImportReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { addToast } = useUiStore();

  const validateZip = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Check file validity
      if (!courseImportService.isValidZipFile(file)) {
        throw new Error('El archivo debe ser un ZIP válido');
      }

      if (!courseImportService.isValidFileSize(file)) {
        throw new Error('El archivo excede el tamaño máximo permitido (50MB)');
      }

      const result = await courseImportService.validateZip(file);
      setValidation(result);

      if (!result.valid) {
        const errorMessages = result.errors.map(e => e.message).join(', ');
        throw new Error(errorMessages);
      }

      if (result.warnings && result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          addToast({
            title: 'Advertencia',
            message: warning.message,
            type: 'warning',
            duration: 5000,
          });
        });
      }

      addToast({
        title: 'Validación exitosa',
        message: 'El archivo ZIP es válido y está listo para importar',
        type: 'success',
        duration: 3000,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Error al validar el archivo ZIP';
      setError(errorMessage);
      setValidation(null);

      addToast({
        title: 'Error de validación',
        message: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [addToast]);

  const importCourse = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      // Check file validity
      if (!courseImportService.isValidZipFile(file)) {
        throw new Error('El archivo debe ser un ZIP válido');
      }

      if (!courseImportService.isValidFileSize(file)) {
        throw new Error('El archivo excede el tamaño máximo permitido (50MB)');
      }

      const result: ImportResult = await courseImportService.uploadZip(
        file,
        (progress) => setUploadProgress(progress)
      );

      if (!result.success) {
        throw new Error(result.message || 'Error al importar el curso');
      }

      addToast({
        title: 'Importación exitosa',
        message: `El curso "${result.course?.title}" ha sido importado correctamente`,
        type: 'success',
        duration: 5000,
      });

      // Navigate to course editor with the imported course
      if (result.course?.id) {
        setTimeout(() => {
          navigate(`/admin/courses/${result.course.id}/edit`);
        }, 1000);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error al importar el curso';
      setError(errorMessage);

      addToast({
        title: 'Error de importación',
        message: errorMessage,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [addToast, navigate]);

  const resetState = useCallback(() => {
    setFile(null);
    setUploading(false);
    setUploadProgress(0);
    setValidation(null);
    setError(null);
  }, []);

  const isValidZip = useCallback((file: File): boolean => {
    return courseImportService.isValidZipFile(file);
  }, []);

  const isValidSize = useCallback((file: File): boolean => {
    return courseImportService.isValidFileSize(file);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    return courseImportService.formatFileSize(bytes);
  }, []);

  return {
    file,
    setFile,
    uploading,
    uploadProgress,
    validation,
    error,
    validateZip,
    importCourse,
    resetState,
    isValidZip,
    isValidSize,
    formatFileSize,
  };
};

export default useCourseImport;