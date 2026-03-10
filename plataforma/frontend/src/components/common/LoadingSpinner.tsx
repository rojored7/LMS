/**
 * LoadingSpinner Component
 *
 * Reusable loading spinner with different sizes and optional fullscreen mode
 */

import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

export interface LoadingSpinnerProps {
  size?: SpinnerSize;
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-3',
  xl: 'h-16 w-16 border-4',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullScreen = false,
  message,
  className = '',
}) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`
          ${sizeClasses[size]}
          animate-spin
          rounded-full
          border-gray-300
          border-t-blue-600
          dark:border-gray-600
          dark:border-t-blue-500
          ${className}
        `}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

/**
 * Inline Loading Spinner for buttons or small spaces
 */
export const InlineSpinner: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};
