/**
 * FileUploader Component
 * Drag and drop file upload with validation
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { cn } from '../../utils/cn';

export interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  selectedFiles?: File[];
  onFileRemove?: (index: number) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: Record<string, string[]>;
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'text/*': ['.txt', '.md', '.py', '.js', '.ts', '.java', '.cpp'],
  'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  selectedFiles = [],
  onFileRemove,
  maxFiles = 5,
  maxSize = MAX_FILE_SIZE,
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  className = '',
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remainingSlots = maxFiles - selectedFiles.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);
      onFilesSelected(filesToAdd);
    },
    [onFilesSelected, maxFiles, selectedFiles.length]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes,
    disabled: selectedFiles.length >= maxFiles,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={className}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all',
          isDragActive && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
          !isDragActive && 'border-gray-300 dark:border-gray-600 hover:border-gray-400',
          selectedFiles.length >= maxFiles && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          <CloudArrowUpIcon
            className={cn(
              'w-16 h-16',
              isDragActive ? 'text-blue-600 dark:text-blue-500' : 'text-gray-400 dark:text-gray-500'
            )}
          />

          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-500 font-medium">
              Suelta los archivos aquí...
            </p>
          ) : (
            <>
              <div>
                <p className="text-gray-700 dark:text-gray-300 font-medium">
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Máximo {maxFiles} archivos • Tamaño máximo {formatFileSize(maxSize)}
                </p>
              </div>

              <div className="text-xs text-gray-400 dark:text-gray-500">
                Archivos aceptados: PDF, ZIP, código fuente, imágenes
              </div>
            </>
          )}
        </div>
      </div>

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
            Algunos archivos no pudieron ser agregados:
          </p>
          <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                <span className="font-medium">{file.name}</span>:{' '}
                {errors.map((e) => e.message).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Archivos seleccionados ({selectedFiles.length}/{maxFiles}):
          </p>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <DocumentIcon className="w-8 h-8 text-blue-600 dark:text-blue-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                {onFileRemove && (
                  <button
                    onClick={() => onFileRemove(index)}
                    className="ml-2 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    aria-label="Eliminar archivo"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
