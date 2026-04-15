import React from 'react';

interface StatusBadgeProps {
  isPublished: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isPublished }) => (
  <span
    className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${
        isPublished
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      }
    `}
  >
    {isPublished ? 'Publicado' : 'Borrador'}
  </span>
);

export default StatusBadge;
