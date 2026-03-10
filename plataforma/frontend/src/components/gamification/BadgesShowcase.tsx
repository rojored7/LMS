/**
 * BadgesShowcase Component
 *
 * Displays a grid of user badges (earned and not earned) with animations
 */

import React, { useState } from 'react';
import { Badge, UserBadge } from '../../types';
import { Modal } from '../common/Modal';
import { CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export interface BadgesShowcaseProps {
  userBadges: UserBadge[];
  allBadges: Badge[];
  className?: string;
}

export const BadgesShowcase: React.FC<BadgesShowcaseProps> = ({
  userBadges,
  allBadges,
  className = '',
}) => {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [selectedUserBadge, setSelectedUserBadge] = useState<UserBadge | null>(null);

  const earnedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

  const handleBadgeClick = (badge: Badge) => {
    const userBadge = userBadges.find((ub) => ub.badgeId === badge.id);
    setSelectedBadge(badge);
    setSelectedUserBadge(userBadge || null);
  };

  const handleCloseModal = () => {
    setSelectedBadge(null);
    setSelectedUserBadge(null);
  };

  return (
    <>
      <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${className}`}>
        {allBadges.map((badge) => {
          const isEarned = earnedBadgeIds.has(badge.id);
          const userBadge = userBadges.find((ub) => ub.badgeId === badge.id);

          return (
            <button
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`
                group relative flex flex-col items-center p-4 rounded-lg border-2 transition-all duration-200
                ${
                  isEarned
                    ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 hover:shadow-lg hover:scale-105'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 opacity-60 hover:opacity-80'
                }
              `}
            >
              {/* Badge Icon */}
              <div
                className={`
                  relative w-16 h-16 mb-2 flex items-center justify-center rounded-full
                  ${isEarned ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                {badge.iconUrl ? (
                  <img
                    src={badge.iconUrl}
                    alt={badge.name}
                    className={`w-12 h-12 ${!isEarned && 'filter grayscale'}`}
                  />
                ) : (
                  <span className="text-3xl">
                    {isEarned ? '🏆' : '🔒'}
                  </span>
                )}

                {/* Earned Badge Check */}
                {isEarned && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                    <CheckCircleIcon className="w-4 h-4 text-white" />
                  </div>
                )}

                {/* Locked Badge */}
                {!isEarned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <LockClosedIcon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>

              {/* Badge Name */}
              <h3
                className={`
                  text-sm font-semibold text-center line-clamp-2
                  ${isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                `}
              >
                {badge.name}
              </h3>

              {/* Earned Date */}
              {isEarned && userBadge && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(userBadge.earnedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <Modal isOpen={true} onClose={handleCloseModal} size="md">
          <div className="p-6">
            {/* Celebration Effect for Earned Badges */}
            {selectedUserBadge && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="animate-pulse absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-lg" />
              </div>
            )}

            {/* Badge Icon Large */}
            <div className="relative flex justify-center mb-4">
              <div
                className={`
                  w-32 h-32 flex items-center justify-center rounded-full
                  ${selectedUserBadge ? 'bg-yellow-100 dark:bg-yellow-900/40' : 'bg-gray-200 dark:bg-gray-700'}
                `}
              >
                {selectedBadge.iconUrl ? (
                  <img
                    src={selectedBadge.iconUrl}
                    alt={selectedBadge.name}
                    className={`w-24 h-24 ${!selectedUserBadge && 'filter grayscale'}`}
                  />
                ) : (
                  <span className="text-7xl">
                    {selectedUserBadge ? '🏆' : '🔒'}
                  </span>
                )}
              </div>
            </div>

            {/* Badge Name */}
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {selectedBadge.name}
            </h2>

            {/* Badge Category */}
            <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">
              {selectedBadge.category}
            </p>

            {/* Badge Description */}
            <p className="text-gray-700 dark:text-gray-300 text-center mb-4">
              {selectedBadge.description}
            </p>

            {/* Badge Requirement */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                Requisito:
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {selectedBadge.requirement}
              </p>
            </div>

            {/* XP Reward */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                +{selectedBadge.xpReward} XP
              </span>
            </div>

            {/* Earned Status */}
            {selectedUserBadge ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-500 mx-auto mb-2" />
                <p className="text-green-900 dark:text-green-300 font-semibold">
                  Desbloqueado
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {formatDistanceToNow(new Date(selectedUserBadge.earnedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                <LockClosedIcon className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 font-semibold">
                  Bloqueado
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Completa el requisito para desbloquear este badge
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
