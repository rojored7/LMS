/**
 * SubmissionStatusBadge Component
 * Colored badge for submission status
 */

import React from 'react';
import { SubmissionStatus } from '../../types/project';
import { cn } from '../../utils/cn';

export interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

const statusConfig: Record<
  SubmissionStatus,
  { label: string; className: string; icon: string }
> = {
  [SubmissionStatus.PENDING]: {
    label: 'Pendiente',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: '⏳',
  },
  [SubmissionStatus.REVIEWING]: {
    label: 'En Revisión',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    icon: '👁️',
  },
  [SubmissionStatus.APPROVED]: {
    label: 'Aprobado',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    icon: '✅',
  },
  [SubmissionStatus.REJECTED]: {
    label: 'Rechazado',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    icon: '❌',
  },
};

export const SubmissionStatusBadge: React.FC<SubmissionStatusBadgeProps> = ({
  status,
  className = '',
}) => {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        config.className,
        className
      )}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};
