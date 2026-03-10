/**
 * PublicBadges Component
 * Simple grid display of earned badges for public profile
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import type { UserBadge } from '../../types/gamification';
import { cn } from '../../utils/cn';

export interface PublicBadgesProps {
  userBadges: UserBadge[];
  maxDisplay?: number;
  className?: string;
}

export const PublicBadges: React.FC<PublicBadgesProps> = ({
  userBadges,
  maxDisplay,
  className = '',
}) => {
  const displayedBadges = maxDisplay ? userBadges.slice(0, maxDisplay) : userBadges;
  const hasMore = maxDisplay && userBadges.length > maxDisplay;

  if (userBadges.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-gray-500 dark:text-gray-400">
          Este usuario aún no ha desbloqueado ningún badge
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayedBadges.map((userBadge) => (
          <div
            key={userBadge.id}
            className="group relative flex flex-col items-center p-4 rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:shadow-lg hover:scale-105 transition-all"
          >
            {/* Badge Icon */}
            <div className="relative w-16 h-16 mb-2 flex items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/40">
              {userBadge.badge.iconUrl ? (
                <img
                  src={userBadge.badge.iconUrl}
                  alt={userBadge.badge.name}
                  className="w-12 h-12"
                />
              ) : (
                <span className="text-3xl">🏆</span>
              )}

              {/* Check Badge */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                <CheckCircleIcon className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Badge Name */}
            <h3 className="text-sm font-semibold text-center line-clamp-2 text-gray-900 dark:text-white mb-1">
              {userBadge.badge.name}
            </h3>

            {/* Earned Date */}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDistanceToNow(new Date(userBadge.earnedAt), {
                addSuffix: true,
                locale: es,
              })}
            </p>

            {/* Tooltip on Hover */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {userBadge.badge.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
            </div>
          </div>
        ))}

        {/* Show More Indicator */}
        {hasMore && (
          <div className="flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
            <span className="text-2xl text-gray-400 dark:text-gray-500 mb-1">+{userBadges.length - maxDisplay!}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center">
              más badges
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
