/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog with different variants (danger, warning, info)
 */

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon, InformationCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: ConfirmDialogVariant;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    icon: ExclamationCircleIcon,
    iconColor: 'text-red-600 dark:text-red-500',
    iconBg: 'bg-red-100 dark:bg-red-900/20',
    buttonColor: 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700',
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-yellow-600 dark:text-yellow-500',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-600 dark:hover:bg-yellow-700',
  },
  info: {
    icon: InformationCircleIcon,
    iconColor: 'text-blue-600 dark:text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-900/20',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
  },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'info',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  const style = variantStyles[variant];
  const Icon = style.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center p-6">
        {/* Icon */}
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${style.iconBg}`}>
          <Icon className={`h-6 w-6 ${style.iconColor}`} aria-hidden="true" />
        </div>

        {/* Title */}
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>

        {/* Message */}
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>

        {/* Actions */}
        <div className="mt-6 flex w-full gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
            className={`flex-1 ${style.buttonColor}`}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
