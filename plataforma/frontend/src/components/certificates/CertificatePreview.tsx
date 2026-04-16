/**
 * CertificatePreview Component
 * Modal preview of certificate before download
 */

import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import type { Certificate } from '../../services/api/certificate.service';

export interface CertificatePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  onDownload?: (certificateId: string) => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  isOpen,
  onClose,
  certificate,
  onDownload,
}) => {
  if (!certificate) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Vista Previa del Certificado">
      <div className="space-y-4">
        {/* Certificate Image/Preview */}
        {certificate.certificateUrl ? (
          <div className="relative w-full aspect-[1.414/1] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <iframe
              src={certificate.certificateUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="Certificate Preview"
            />
          </div>
        ) : (
          <div className="w-full aspect-[1.414/1] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-4 border-blue-600 dark:border-blue-500 rounded-lg flex items-center justify-center p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-900 dark:text-blue-300 mb-4">
                Certificado de Finalización
              </h2>
              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                {certificate.course?.title}
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Otorgado a {certificate.user?.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Código: {certificate.verificationCode}
              </p>
            </div>
          </div>
        )}

        {/* Certificate Info */}
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Curso:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {certificate.course?.title}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fecha de emisión:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {new Date(certificate.issuedAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Código de verificación:</span>
            <code className="font-mono text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-blue-600 dark:text-blue-400">
              {certificate.verificationCode}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>

          {onDownload && (
            <Button
              variant="primary"
              onClick={() => {
                onDownload(certificate.id);
                onClose();
              }}
              leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
              className="flex-1"
            >
              Descargar PDF
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
