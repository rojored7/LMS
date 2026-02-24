/**
 * Avatar component with fallback
 */

import React, { useState } from 'react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/formatters';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
}

const sizeStyles = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const shapeStyles = {
  circle: 'rounded-full',
  square: 'rounded-md',
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    { className, src, alt, name, size = 'md', shape = 'circle', ...props },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const showFallback = !src || imageError;
    const initials = name ? getInitials(name) : '?';

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center overflow-hidden bg-gray-200 dark:bg-gray-700',
          sizeStyles[size],
          shapeStyles[shape],
          className
        )}
        {...props}
      >
        {showFallback ? (
          <span className="font-medium text-gray-600 dark:text-gray-300">
            {initials}
          </span>
        ) : (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
