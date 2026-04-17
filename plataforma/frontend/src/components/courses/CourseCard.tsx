import React, { useState } from 'react';
import {
  PencilIcon,
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  EllipsisVerticalIcon,
} from '@heroicons/react/24/outline';
import StatusBadge from './StatusBadge';
import DifficultyScore from '../common/DifficultyScore';

interface CourseCardProps {
  course: any;
  getLevelBadgeClass: (level: string) => string;
  onEdit: (courseId: string) => void;
  onDuplicate: (course: any) => void;
  onExport: (courseId: string, filename: string) => Promise<void>;
  onPublish: (courseId: string) => Promise<void>;
  onUnpublish: (courseId: string) => Promise<void>;
  onDelete: (course: any) => void;
}

const CourseCard: React.FC<CourseCardProps> = ({
  course,
  getLevelBadgeClass,
  onEdit,
  onDuplicate,
  onExport,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      {/* Card Header with Thumbnail */}
      <div className="flex space-x-4 mb-3">
        <div className="flex-shrink-0 w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{course.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
            {course.description}
          </p>
        </div>

        {/* Mobile Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {showActions && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                <button
                  onClick={() => {
                    onEdit(course.id);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="dark:text-gray-200">Editar</span>
                </button>

                <button
                  onClick={() => {
                    onDuplicate(course);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="dark:text-gray-200">Duplicar</span>
                </button>

                <button
                  onClick={async () => {
                    await onExport(course.id, `${course.slug}.zip`);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="dark:text-gray-200">Exportar</span>
                </button>

                <div className="border-t border-gray-200 dark:border-gray-700" />

                {course.isPublished ? (
                  <button
                    onClick={async () => {
                      await onUnpublish(course.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <EyeSlashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="dark:text-gray-200">Despublicar</span>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await onPublish(course.id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="dark:text-gray-200">Publicar</span>
                  </button>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700" />

                <button
                  onClick={() => {
                    onDelete(course);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 text-red-600 dark:text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Card Footer with Badges and Stats */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <span
          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelBadgeClass(course.level)}`}
        >
          {course.level}
        </span>
        <StatusBadge isPublished={course.isPublished} />
        {course.score != null && <DifficultyScore score={course.score} size="sm" />}
        <span className="text-xs text-gray-500 dark:text-gray-400">{Math.round(course.duration / 60)}h</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {course.moduleCount || 0} modulos
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {course.enrollmentCount || 0} estudiantes
        </span>
      </div>
    </div>
  );
};

export default CourseCard;
