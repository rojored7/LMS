/**
 * SubmissionCard Component
 * Displays a project submission summary
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { DocumentTextIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { Button } from '../common/Button';
import { SubmissionStatusBadge } from './SubmissionStatusBadge';
import type { ProjectSubmission } from '../../types/project';

export interface SubmissionCardProps {
  submission: ProjectSubmission;
  onViewDetails?: (submissionId: string) => void;
  showUserInfo?: boolean;
  className?: string;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onViewDetails,
  showUserInfo = false,
  className = '',
}) => {
  const hasScore = submission.score !== undefined && submission.score !== null;

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-500" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Entrega #{submission.id.substring(0, 8)}
            </h3>

            {showUserInfo && submission.user && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {submission.user.name} ({submission.user.email})
              </p>
            )}
          </div>
        </div>

        <SubmissionStatusBadge status={submission.status} />
      </div>

      {/* Description */}
      {submission.description && (
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {submission.description}
        </p>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Enviado{' '}
            {formatDistanceToNow(new Date(submission.submittedAt), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        </div>

        {hasScore && (
          <div className="flex items-center gap-2 text-sm">
            <ChartBarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600 dark:text-gray-400">
              Calificación: <span className="font-semibold">{submission.score}/100</span>
            </span>
          </div>
        )}
      </div>

      {/* Files Count */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {submission.files.length} archivo{submission.files.length !== 1 ? 's' : ''} adjunto
          {submission.files.length !== 1 ? 's' : ''}
        </span>

        {onViewDetails && (
          <Button variant="ghost" size="sm" onClick={() => onViewDetails(submission.id)}>
            Ver detalles
          </Button>
        )}
      </div>

      {/* Feedback (if graded) */}
      {submission.feedback && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Retroalimentación:
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
            {submission.feedback}
          </p>
        </div>
      )}
    </div>
  );
};
