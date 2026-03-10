/**
 * UserEnrollmentList Component
 * Displays a list of enrollments for a user with expand/collapse functionality
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react';
import UserProgressCard from './UserProgressCard';

interface Enrollment {
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
}

interface UserEnrollmentListProps {
  userId: string;
  userName: string;
  enrollments: Enrollment[];
  loading?: boolean;
  error?: string | null;
  onRemove: (enrollmentId: string) => void;
  onViewProgress?: (courseId: string) => void;
  initiallyExpanded?: boolean;
}

export default function UserEnrollmentList({
  userId,
  userName,
  enrollments,
  loading = false,
  error = null,
  onRemove,
  onViewProgress,
  initiallyExpanded = false,
}: UserEnrollmentListProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const completedCount = enrollments.filter((e) => e.completedAt).length;
  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Header - Clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        disabled={loading}
      >
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-left">
              {userName}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                <strong>{enrollments.length}</strong> curso{enrollments.length !== 1 ? 's' : ''} inscrito{enrollments.length !== 1 ? 's' : ''}
              </span>
              <span>
                <strong>{completedCount}</strong> completado{completedCount !== 1 ? 's' : ''}
              </span>
              <span>
                <strong>{averageProgress}%</strong> progreso promedio
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Este usuario no tiene cursos asignados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <UserProgressCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onRemove={onRemove}
                  onViewProgress={onViewProgress}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
