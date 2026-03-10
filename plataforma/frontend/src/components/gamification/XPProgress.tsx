/**
 * XPProgress Component
 *
 * Displays user XP progress with level and breakdown
 */

import React, { useState } from 'react';
import { XPLevel, XPBreakdown } from '../../types';
import { SparklesIcon } from '@heroicons/react/24/solid';

export interface XPProgressProps {
  xpLevel: XPLevel;
  xpBreakdown?: XPBreakdown;
  showBreakdown?: boolean;
  compact?: boolean;
  className?: string;
}

export const XPProgress: React.FC<XPProgressProps> = ({
  xpLevel,
  xpBreakdown,
  showBreakdown = false,
  compact = false,
  className = '',
}) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const { level, currentXP, xpForNextLevel, totalXP, progressPercentage } = xpLevel;

  if (compact) {
    return (
      <div className={`relative ${className}`}>
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-all"
          onMouseEnter={() => setIsTooltipOpen(true)}
          onMouseLeave={() => setIsTooltipOpen(false)}
        >
          <SparklesIcon className="w-4 h-4" />
          <span className="font-bold">Nivel {level}</span>
          <span className="text-sm opacity-90">
            {currentXP}/{xpForNextLevel} XP
          </span>
        </button>

        {/* Tooltip */}
        {isTooltipOpen && xpBreakdown && (
          <div className="absolute top-full left-0 mt-2 z-50 w-64 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
            <XPBreakdownContent breakdown={xpBreakdown} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Level Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white font-bold">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Nivel {level}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {totalXP.toLocaleString()} XP total
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {progressPercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
        </div>
      </div>

      {/* XP Breakdown */}
      {showBreakdown && xpBreakdown && (
        <div className="mt-4">
          <XPBreakdownContent breakdown={xpBreakdown} />
        </div>
      )}
    </div>
  );
};

/**
 * XP Breakdown Content Component
 */
const XPBreakdownContent: React.FC<{ breakdown: XPBreakdown }> = ({ breakdown }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Desglose de XP
      </h4>

      {breakdown.lessons > 0 && (
        <BreakdownItem label="Lecciones" value={breakdown.lessons} icon="📚" />
      )}

      {breakdown.quizzes > 0 && (
        <BreakdownItem label="Quizzes" value={breakdown.quizzes} icon="📝" />
      )}

      {breakdown.labs > 0 && (
        <BreakdownItem label="Laboratorios" value={breakdown.labs} icon="💻" />
      )}

      {breakdown.projects > 0 && (
        <BreakdownItem label="Proyectos" value={breakdown.projects} icon="🚀" />
      )}

      {breakdown.badges > 0 && (
        <BreakdownItem label="Badges" value={breakdown.badges} icon="🏆" />
      )}

      <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
        <BreakdownItem
          label="Total"
          value={breakdown.total}
          icon="⭐"
          isTotal
        />
      </div>
    </div>
  );
};

/**
 * Breakdown Item Component
 */
const BreakdownItem: React.FC<{
  label: string;
  value: number;
  icon: string;
  isTotal?: boolean;
}> = ({ label, value, icon, isTotal = false }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span
          className={`text-sm ${
            isTotal
              ? 'font-bold text-gray-900 dark:text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
        </span>
      </div>
      <span
        className={`text-sm ${
          isTotal
            ? 'font-bold text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {value.toLocaleString()} XP
      </span>
    </div>
  );
};
