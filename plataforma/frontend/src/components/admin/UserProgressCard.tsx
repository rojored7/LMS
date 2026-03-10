/**
 * User Progress Card Component
 * Displays user progress for a specific enrollment
 */

import { BookOpen, Calendar, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserProgressCardProps {
  enrollment: {
    id: string;
    enrolledAt: string;
    completedAt: string | null;
    progress: number;
    course: {
      id: string;
      slug: string;
      title: string;
      thumbnail: string | null;
      level: string;
      duration: number;
    };
  };
  onRemove: () => void;
}

export const UserProgressCard: React.FC<UserProgressCardProps> = ({ enrollment, onRemove }) => {
  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'ADVANCED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatLevel = (level: string) => {
    const levels: Record<string, string> = {
      BEGINNER: 'Principiante',
      INTERMEDIATE: 'Intermedio',
      ADVANCED: 'Avanzado',
    };
    return levels[level.toUpperCase()] || level;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        {enrollment.course.thumbnail ? (
          <img
            src={enrollment.course.thumbnail}
            alt={enrollment.course.title}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {enrollment.course.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${getLevelColor(
                    enrollment.course.level
                  )}`}
                >
                  {formatLevel(enrollment.course.level)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {enrollment.course.duration}h
                </span>
              </div>
            </div>

            <button
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Retirar curso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">Progreso</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {enrollment.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getProgressColor(enrollment.progress)}`}
                style={{ width: `${enrollment.progress}%` }}
              />
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Inscrito{' '}
                {formatDistanceToNow(new Date(enrollment.enrolledAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
            {enrollment.completedAt && (
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <span>Completado</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
