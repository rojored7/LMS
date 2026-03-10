/**
 * LessonNavigation Component
 * Navigation buttons and breadcrumbs for lessons
 */

import { ChevronLeftIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface LessonNavigationProps {
  courseName: string;
  moduleName: string;
  lessonName: string;
  courseId: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export const LessonNavigation: React.FC<LessonNavigationProps> = ({
  courseName,
  moduleName,
  lessonName,
  courseId,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}) => {
  return (
    <div className="border-b border-gray-200 bg-white">
      {/* Breadcrumbs */}
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 overflow-x-auto">
        <Link to="/dashboard" className="hover:text-gray-700 flex items-center flex-shrink-0">
          <HomeIcon className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="hidden sm:inline">/</span>
        <Link to={`/courses/${courseId}`} className="hover:text-gray-700 truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" title={courseName}>
          {courseName}
        </Link>
        <span className="hidden sm:inline">/</span>
        <span className="text-gray-700 truncate max-w-[100px] sm:max-w-[150px] md:max-w-none" title={moduleName}>{moduleName}</span>
        <span className="hidden sm:inline">/</span>
        <span className="text-gray-900 font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-none" title={lessonName}>{lessonName}</span>
      </div>

      {/* Navigation Buttons */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 border-t border-gray-200">
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-2 min-h-[44px] rounded-lg transition-colors flex-1 sm:flex-initial ${
            hasPrevious
              ? 'text-blue-600 hover:bg-blue-50 border border-blue-300'
              : 'text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          <ChevronLeftIcon className="h-5 w-5 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Anterior</span>
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-2 min-h-[44px] rounded-lg transition-colors flex-1 sm:flex-initial ${
            hasNext
              ? 'text-blue-600 hover:bg-blue-50 border border-blue-300'
              : 'text-gray-400 cursor-not-allowed border border-gray-200'
          }`}
        >
          <span className="text-sm sm:text-base">Siguiente</span>
          <ChevronRightIcon className="h-5 w-5 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
};
