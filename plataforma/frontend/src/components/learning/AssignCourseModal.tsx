/**
 * AssignCourseModal Component
 * Modal for admins to assign courses to users
 */

import { useState, useEffect } from 'react';
import { X, Search, BookOpen, Loader2 } from 'lucide-react';
import { getCourses } from '../../services/course.service';
import type { Course } from '../../types/course';

interface AssignCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (courseId: string) => Promise<void>;
  userName: string;
  userEmail: string;
  enrolledCourseIds?: string[];
}

export default function AssignCourseModal({
  isOpen,
  onClose,
  onAssign,
  userName,
  userEmail,
  enrolledCourseIds = [],
}: AssignCourseModalProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load courses when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCourses();
    } else {
      // Reset state when modal closes
      setSearchTerm('');
      setSelectedCourse(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, enrolledCourseIds]);

  // Filter courses based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchTerm, courses]);

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCourses();
      const allCourses: Course[] = (data as any).data || [];
      const available = allCourses.filter((c) => !enrolledCourseIds.includes(c.id));
      setCourses(available);
      setFilteredCourses(available);
    } catch (err) {
      setError('Error al cargar los cursos. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse) return;

    setAssigning(true);
    setError(null);
    try {
      await onAssign(selectedCourse.id);
      onClose();
    } catch (err: any) {
      setError(err?.error?.message || 'Error al asignar el curso. Por favor, intenta de nuevo.');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Asignar Curso</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Usuario: <span className="font-medium">{userName}</span> ({userEmail})
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              disabled={assigning}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar curso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={loading || assigning}
              />
            </div>
          </div>

          {/* Course List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button
                  onClick={loadCourses}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reintentar
                </button>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                {searchTerm ? 'No se encontraron cursos' : 'No hay cursos disponibles'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCourses.map((course) => (
                  <button
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    disabled={assigning}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedCourse?.id === course.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${assigning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                            {course.level}
                          </span>
                          <span>{course.duration} horas</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={assigning}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedCourse || assigning}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {assigning && <Loader2 className="w-4 h-4 animate-spin" />}
              {assigning ? 'Asignando...' : 'Asignar Curso'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
