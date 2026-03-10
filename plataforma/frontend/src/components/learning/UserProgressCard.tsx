/**
 * UserProgressCard Component
 * Displays a user's progress in a course with visual progress bar
 */

import { CheckCircle, Clock, BookOpen } from 'lucide-react';

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
  onRemove?: (enrollmentId: string) => void;
  onViewProgress?: (courseId: string) => void;
  showActions?: boolean;
}

export default function UserProgressCard({
  enrollment,
  onRemove,
  onViewProgress,
  showActions = true,
}: UserProgressCardProps) {
  const { course, progress, enrolledAt, completedAt } = enrollment;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLevelColor = (level: string) => {
    const colors = {
      BEGINNER: 'text-green-600 bg-green-100',
      INTERMEDIATE: 'text-yellow-600 bg-yellow-100',
      ADVANCED: 'text-red-600 bg-red-100',
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-100';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-blue-600';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-20 h-20 rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
          )}
        </div>

        {/* Course Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {course.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${getLevelColor(
                    course.level
                  )}`}
                >
                  {course.level}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration} horas
                </span>
              </div>
            </div>

            {/* Completion Badge */}
            {completedAt && (
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progreso
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Inscrito: {formatDate(enrolledAt)}</span>
            {completedAt && <span>Completado: {formatDate(completedAt)}</span>}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2 mt-4">
              {onViewProgress && (
                <button
                  onClick={() => onViewProgress(course.id)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  Ver Progreso Detallado
                </button>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(enrollment.id)}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Retirar Curso
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
