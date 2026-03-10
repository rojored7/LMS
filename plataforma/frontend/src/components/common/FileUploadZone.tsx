import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { XMarkIcon, DocumentIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export interface FileUploadZoneProps {
  onDrop: (files: File[]) => void;
  onRemove?: () => void;
  file?: File | null;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
  uploading?: boolean;
  uploadProgress?: number;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onDrop,
  onRemove,
  file,
  accept = {
    'application/zip': ['.zip'],
    'application/x-zip-compressed': ['.zip'],
  },
  maxSize = 52428800, // 50MB
  multiple = false,
  disabled = false,
  className = '',
  error,
  uploading = false,
  uploadProgress = 0,
}) => {
  const [dragError, setDragError] = useState<string | null>(null);

  const handleDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setDragError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setDragError(`El archivo excede el tamaño máximo de ${formatFileSize(maxSize)}`);
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setDragError('Tipo de archivo no válido. Solo se permiten archivos ZIP');
        } else {
          setDragError('Error al cargar el archivo');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        onDrop(acceptedFiles);
      }
    },
    [onDrop, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: handleDrop,
    accept,
    maxSize,
    multiple,
    disabled: disabled || uploading,
  });

  const formatFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const displayError = error || dragError;

  return (
    <div className={`file-upload-zone ${className}`}>
      {!file ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isDragReject ? 'border-red-500 bg-red-50' : ''}
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
            ${displayError ? 'border-red-500' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center space-y-4">
            <ArrowUpTrayIcon className="w-12 h-12 text-gray-400" />

            {isDragActive ? (
              <p className="text-blue-600 font-medium">Suelta el archivo aquí...</p>
            ) : isDragReject ? (
              <p className="text-red-600 font-medium">Archivo no válido</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Arrastra y suelta tu archivo ZIP aquí
                </p>
                <p className="text-gray-500 text-sm">
                  o haz clic para seleccionar un archivo
                </p>
              </>
            )}

            <div className="text-xs text-gray-400">
              <p>Tamaño máximo: {formatFileSize(maxSize)}</p>
              <p>Formato: ZIP</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DocumentIcon className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
              </div>
            </div>

            {!uploading && onRemove && (
              <button
                onClick={onRemove}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Remover archivo"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Subiendo...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {displayError && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{displayError}</p>
        </div>
      )}
    </div>
  );
};

export default FileUploadZone;