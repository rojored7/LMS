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

interface CourseActionMenuProps {
  course: any;
  onEdit: (courseId: string) => void;
  onDuplicate: (course: any) => void;
  onExport: (courseId: string, filename: string) => Promise<void>;
  onPublish: (courseId: string) => Promise<void>;
  onUnpublish: (courseId: string) => Promise<void>;
  onDelete: (course: any) => void;
}

const CourseActionMenu: React.FC<CourseActionMenuProps> = ({
  course,
  onEdit,
  onDuplicate,
  onExport,
  onPublish,
  onUnpublish,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <EllipsisVerticalIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <PencilIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="dark:text-gray-200">Editar</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(course);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="dark:text-gray-200">Duplicar</span>
            </button>

            <button
              onClick={async (e) => {
                e.stopPropagation();
                await onExport(course.id, `${course.slug}.zip`);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="dark:text-gray-200">Exportar</span>
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            {course.isPublished ? (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await onUnpublish(course.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <EyeSlashIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="dark:text-gray-200">Despublicar</span>
              </button>
            ) : (
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  await onPublish(course.id);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <EyeIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="dark:text-gray-200">Publicar</span>
              </button>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(course);
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2 text-red-600 dark:text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CourseActionMenu;
