/**
 * SCORM Package Uploader Component
 * HU-040: Upload and validate SCORM packages for courses
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  File,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileArchive,
  Info,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';

interface ScormValidation {
  isValid: boolean;
  version: string;
  errors: string[];
  warnings: string[];
  metadata: {
    title?: string;
    description?: string;
    duration?: string;
    objectives?: string[];
  };
}

interface ScormPackage {
  id: string;
  filename: string;
  size: number;
  uploadDate: Date;
  status: 'uploading' | 'validating' | 'valid' | 'invalid' | 'processing' | 'ready';
  validation?: ScormValidation;
  progress: number;
}

interface ScormUploaderProps {
  courseId?: string;
  onUploadComplete?: (packageId: string) => void;
  maxSize?: number; // in MB
  acceptedVersions?: string[];
  className?: string;
}

const ACCEPTED_VERSIONS = ['SCORM 1.2', 'SCORM 2004', 'xAPI (Tin Can)'];
const MAX_FILE_SIZE = 100; // MB

export const ScormUploader: React.FC<ScormUploaderProps> = ({
  courseId,
  onUploadComplete,
  maxSize = MAX_FILE_SIZE,
  acceptedVersions = ACCEPTED_VERSIONS,
  className
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [packages, setPackages] = useState<ScormPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<ScormPackage | null>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      if (!file.name.endsWith('.zip')) {
        // Show error toast
        console.error('Only ZIP files are accepted');
        continue;
      }

      if (file.size > maxSize * 1024 * 1024) {
        // Show error toast
        console.error(`File size exceeds ${maxSize}MB limit`);
        continue;
      }

      const packageId = `scorm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newPackage: ScormPackage = {
        id: packageId,
        filename: file.name,
        size: file.size,
        uploadDate: new Date(),
        status: 'uploading',
        progress: 0
      };

      setPackages(prev => [...prev, newPackage]);

      // Simulate upload
      await uploadPackage(file, packageId);
    }
  };

  const uploadPackage = async (file: File, packageId: string) => {
    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setPackages(prev => prev.map(pkg => {
        if (pkg.id === packageId) {
          const newProgress = Math.min(pkg.progress + 10, 100);
          if (newProgress === 100) {
            clearInterval(progressInterval);
            validatePackage(packageId);
            return { ...pkg, progress: newProgress, status: 'validating' };
          }
          return { ...pkg, progress: newProgress };
        }
        return pkg;
      }));
    }, 300);
  };

  const validatePackage = async (packageId: string) => {
    // Simulate validation
    setTimeout(() => {
      const validation: ScormValidation = {
        isValid: Math.random() > 0.3,
        version: acceptedVersions[Math.floor(Math.random() * acceptedVersions.length)],
        errors: Math.random() > 0.5 ? [] : ['Missing imsmanifest.xml file'],
        warnings: Math.random() > 0.7 ? [] : ['Some assets may not be compatible'],
        metadata: {
          title: 'Sample SCORM Course',
          description: 'This is a sample SCORM course for testing',
          duration: '2 hours',
          objectives: ['Objective 1', 'Objective 2', 'Objective 3']
        }
      };

      setPackages(prev => prev.map(pkg => {
        if (pkg.id === packageId) {
          return {
            ...pkg,
            status: validation.isValid ? 'valid' : 'invalid',
            validation
          };
        }
        return pkg;
      }));

      if (validation.isValid) {
        processPackage(packageId);
      }
    }, 2000);
  };

  const processPackage = async (packageId: string) => {
    // Simulate processing
    setTimeout(() => {
      setPackages(prev => prev.map(pkg => {
        if (pkg.id === packageId) {
          return { ...pkg, status: 'processing' };
        }
        return pkg;
      }));
    }, 1000);

    setTimeout(() => {
      setPackages(prev => prev.map(pkg => {
        if (pkg.id === packageId) {
          return { ...pkg, status: 'ready' };
        }
        return pkg;
      }));

      if (onUploadComplete) {
        onUploadComplete(packageId);
      }
    }, 3000);
  };

  const removePackage = (packageId: string) => {
    setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
    if (selectedPackage?.id === packageId) {
      setSelectedPackage(null);
    }
  };

  const getStatusIcon = (status: ScormPackage['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'validating':
        return <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />;
      case 'valid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'invalid':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-purple-500" />;
      case 'ready':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card className="p-8">
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-12 text-center transition-all',
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />

          <FileArchive className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('scorm.uploadTitle', 'Upload SCORM Package')}
          </h3>

          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('scorm.dragDropText', 'Drag and drop your SCORM package here, or click to browse')}
          </p>

          <Button
            variant="primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {t('scorm.selectFile', 'Select File')}
          </Button>

          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>{t('scorm.acceptedFormats', 'Accepted: ZIP files only')}</p>
            <p>{t('scorm.maxSize', `Max size: ${maxSize}MB`)}</p>
            <p>{t('scorm.supportedVersions', `Supported: ${acceptedVersions.join(', ')}`)}</p>
          </div>
        </div>
      </Card>

      {/* Uploaded Packages */}
      {packages.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('scorm.uploadedPackages', 'Uploaded Packages')}
          </h3>

          <div className="space-y-3">
            {packages.map(pkg => (
              <div
                key={pkg.id}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer',
                  selectedPackage?.id === pkg.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                )}
                onClick={() => setSelectedPackage(pkg)}
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(pkg.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {pkg.filename}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(pkg.size)}</span>
                    {pkg.validation?.version && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                        {pkg.validation.version}
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {(pkg.status === 'uploading' || pkg.status === 'processing') && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${pkg.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {pkg.status === 'ready' && (
                    <>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removePackage(pkg.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Package Details */}
      {selectedPackage?.validation && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('scorm.packageDetails', 'Package Details')}
          </h3>

          <div className="space-y-4">
            {/* Metadata */}
            {selectedPackage.validation.metadata.title && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('scorm.title', 'Title')}
                </p>
                <p className="text-gray-900 dark:text-white">
                  {selectedPackage.validation.metadata.title}
                </p>
              </div>
            )}

            {selectedPackage.validation.metadata.description && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('scorm.description', 'Description')}
                </p>
                <p className="text-gray-900 dark:text-white">
                  {selectedPackage.validation.metadata.description}
                </p>
              </div>
            )}

            {/* Validation Results */}
            {selectedPackage.validation.errors.length > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-300">
                      {t('scorm.validationErrors', 'Validation Errors')}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {selectedPackage.validation.errors.map((error, i) => (
                        <li key={i} className="text-sm text-red-700 dark:text-red-400">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedPackage.validation.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-300">
                      {t('scorm.warnings', 'Warnings')}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {selectedPackage.validation.warnings.map((warning, i) => (
                        <li key={i} className="text-sm text-yellow-700 dark:text-yellow-400">
                          • {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedPackage.status === 'ready' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-300">
                      {t('scorm.ready', 'Package Ready')}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      {t('scorm.readyMessage', 'The SCORM package has been validated and is ready to use.')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Info Section */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-300">
              {t('scorm.aboutTitle', 'About SCORM Packages')}
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              {t('scorm.aboutText', 'SCORM (Sharable Content Object Reference Model) is a set of technical standards for e-learning software products. SCORM packages allow you to import external course content that can track learner progress and completion.')}
            </p>
            <ul className="mt-3 space-y-1 text-sm text-blue-700 dark:text-blue-400">
              <li>• {t('scorm.benefit1', 'Track learner progress and completion')}</li>
              <li>• {t('scorm.benefit2', 'Import content from any SCORM-compliant authoring tool')}</li>
              <li>• {t('scorm.benefit3', 'Standardized format ensures compatibility')}</li>
              <li>• {t('scorm.benefit4', 'Includes quizzes, interactions, and multimedia content')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScormUploader;