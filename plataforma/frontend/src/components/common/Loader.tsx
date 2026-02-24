/**
 * Loader component
 */

import React from 'react';
import { cn } from '../../utils/cn';

export interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
  fullScreen?: boolean;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const colorStyles = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
};

export const Loader: React.FC<LoaderProps> = ({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-2">
      <svg
        className={cn('animate-spin', sizeStyles[size], colorStyles[color])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <p className={cn('text-sm font-medium', colorStyles[color])}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80">
        {spinner}
      </div>
    );
  }

  return spinner;
};
