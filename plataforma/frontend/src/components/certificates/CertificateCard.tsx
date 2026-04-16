/**
 * CertificateCard Component
 * Displays a certificate with download and share options
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import type { Certificate } from '../../services/api/certificate.service';
import { cn } from '../../utils/cn';

export interface CertificateCardProps {
  certificate: Certificate;
  onDownload?: (certificateId: string) => void;
  onShare?: (certificate: Certificate) => void;
  className?: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  onDownload,
  onShare,
  className = '',
}) => {
  const handleShare = () => {
    if (onShare) {
      onShare(certificate);
    } else {
      // Fallback: copy verification URL to clipboard
      const url = `${window.location.origin}/certificates/verify/${certificate.verificationCode}`;
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        'border-2 border-blue-200 dark:border-blue-800 rounded-lg p-6 hover:shadow-xl transition-all',
        className
      )}
    >
      {/* Certificate Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-blue-600 dark:bg-blue-700 rounded-lg">
          <AcademicCapIcon className="w-8 h-8 text-white" />
        </div>

        <CheckBadgeIcon className="w-8 h-8 text-green-600 dark:text-green-500" />
      </div>

      {/* Course Title */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        {certificate.course?.title || 'Certificado de Finalización'}
      </h3>

      {/* Issued Date */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Emitido{' '}
        {formatDistanceToNow(new Date(certificate.issuedAt), {
          addSuffix: true,
          locale: es,
        })}
      </p>

      {/* Verification Code */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          Código de Verificación:
        </p>
        <code className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all">
          {certificate.verificationCode}
        </code>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onDownload && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onDownload(certificate.id)}
            leftIcon={<ArrowDownTrayIcon className="w-4 h-4" />}
            className="flex-1"
          >
            Descargar PDF
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          leftIcon={<ShareIcon className="w-4 h-4" />}
        >
          Compartir
        </Button>
      </div>
    </div>
  );
};
