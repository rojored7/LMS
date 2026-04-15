import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import DataTable, { DataTableColumn } from '../components/common/DataTable';
import StatusBadge from '../components/courses/StatusBadge';
import CourseCard from '../components/courses/CourseCard';
import CourseActionMenu from '../components/courses/CourseActionMenu';
import useCourseManagement from '../hooks/useCourseManagement';
import { useUiStore } from '../store/uiStore';

const CourseListPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useUiStore();
  const {
    courses,
    totalCourses,
    currentPage,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    resetFilters,
    deleteCourse,
    duplicateCourse,
    publishCourse,
    unpublishCourse,
    exportCourse,
    refreshCourses,
    goToPage,
  } = useCourseManagement();

  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState('');

  // Level badge color mapping
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'ADVANCED':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'EXPERT':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Callbacks for child components
  const handleEdit = useCallback(
    (courseId: string) => {
      navigate(`/admin/courses/${courseId}/edit`);
    },
    [navigate]
  );

  const handleDuplicateInit = useCallback((course: any) => {
    setSelectedCourse(course);
    setDuplicateTitle(`${course.title} (Copia)`);
    setShowDuplicateModal(true);
  }, []);

  const handleDeleteInit = useCallback((course: any) => {
    setSelectedCourse(course);
    setShowDeleteModal(true);
  }, []);

  // Table columns definition for desktop
  const columns: DataTableColumn<any>[] = useMemo(
    () => [
      {
        key: 'thumbnail',
        header: '',
        accessor: (course) => (
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        ),
        width: '60px',
      },
      {
        key: 'title',
        header: 'Titulo',
        accessor: (course) => (
          <div className="max-w-[280px]">
            <Link
              to={`/admin/courses/${course.id}/edit`}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 block truncate"
            >
              {course.title}
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 break-words">
              {course.description}
            </p>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'level',
        header: 'Nivel',
        accessor: (course) => (
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getLevelBadgeClass(course.level)}`}
          >
            {course.level}
          </span>
        ),
        sortable: true,
        width: '90px',
      },
      {
        key: 'duration',
        header: 'Duracion',
        accessor: (course) => (
          <span className="text-gray-900 dark:text-gray-100">
            {Math.round(course.duration / 60)}h
          </span>
        ),
        sortable: true,
        width: '70px',
      },
      {
        key: 'modules',
        header: 'Mod.',
        accessor: (course) => (
          <span className="text-gray-900 dark:text-gray-100">{course.moduleCount || 0}</span>
        ),
        sortable: true,
        width: '60px',
      },
      {
        key: 'enrollments',
        header: 'Est.',
        accessor: (course) => (
          <span className="text-gray-900 dark:text-gray-100">{course.enrollmentCount || 0}</span>
        ),
        sortable: true,
        width: '60px',
      },
      {
        key: 'status',
        header: 'Estado',
        accessor: (course) => <StatusBadge isPublished={course.isPublished} />,
        sortable: true,
        width: '90px',
      },
      {
        key: 'actions',
        header: '',
        accessor: (course) => (
          <CourseActionMenu
            course={course}
            onEdit={handleEdit}
            onDuplicate={handleDuplicateInit}
            onExport={exportCourse}
            onPublish={publishCourse}
            onUnpublish={unpublishCourse}
            onDelete={handleDeleteInit}
          />
        ),
        width: '60px',
      },
    ],
    [
      navigate,
      handleEdit,
      handleDuplicateInit,
      handleDeleteInit,
      exportCourse,
      publishCourse,
      unpublishCourse,
    ]
  );

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      await deleteCourse(selectedCourse.id);
      setShowDeleteModal(false);
      setSelectedCourse(null);
    } catch (error) {
      // Error handled by UI
    }
  };

  // Handle duplicate confirmation
  const handleDuplicate = async () => {
    if (!selectedCourse) return;

    try {
      await duplicateCourse(selectedCourse.id, duplicateTitle);
      setShowDuplicateModal(false);
      setSelectedCourse(null);
      setDuplicateTitle('');
    } catch (error) {
      // Error handled by UI
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Gestion de Cursos
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {totalCourses} {totalCourses === 1 ? 'curso' : 'cursos'} en total
                </p>
              </div>

              {/* Desktop buttons */}
              <div className="hidden md:flex items-center space-x-3">
                <button
                  onClick={() => navigate('/admin')}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-sm"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                <Link
                  to="/admin/courses/import"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 text-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Importar</span>
                </Link>
                <Link
                  to="/admin/courses/create"
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 text-sm"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Crear Curso</span>
                </Link>
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {showMobileMenu ? (
                  <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>

            {/* Mobile menu dropdown */}
            {showMobileMenu && (
              <div className="md:hidden mt-4 space-y-2 pb-2">
                <button
                  onClick={() => {
                    navigate('/admin');
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Volver al Dashboard</span>
                </button>
                <Link
                  to="/admin/courses/import"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center space-x-2">
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Importar ZIP</span>
                  </div>
                </Link>
                <Link
                  to="/admin/courses/create"
                  onClick={() => setShowMobileMenu(false)}
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>Crear Curso</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 sm:mb-6 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search Bar - Full width on mobile */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar por titulo..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center space-x-2 min-h-[44px]"
            >
              <FunnelIcon className="w-5 h-5" />
              <span>Filtros</span>
              {(filters.status !== 'all' || filters.level) && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                  {[filters.status !== 'all', filters.level].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={filters.status || 'all'}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value as any, page: 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">Todos</option>
                    <option value="published">Publicados</option>
                    <option value="draft">Borradores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nivel
                  </label>
                  <select
                    value={filters.level || ''}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos</option>
                    <option value="BEGINNER">Principiante</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                    <option value="EXPERT">Experto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordenar por
                  </label>
                  <select
                    value={filters.sortBy || 'createdAt'}
                    onChange={(e) => setFilters({ ...filters, sortBy: e.target.value, page: 1 })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="createdAt">Fecha de creacion</option>
                    <option value="title">Titulo</option>
                    <option value="duration">Duracion</option>
                    <option value="level">Nivel</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px]"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={refreshCourses}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[44px]"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center mb-4">
            <p className="text-red-600 dark:text-red-400">Error al cargar los cursos: {error}</p>
            <button
              onClick={refreshCourses}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-center mt-4 text-gray-600 dark:text-gray-400">Cargando cursos...</p>
          </div>
        )}

        {/* Courses Display */}
        {!error && !isLoading && (
          <>
            {/* Mobile and Tablet: Card Layout */}
            <div className="block lg:hidden">
              {courses.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No se encontraron cursos</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      getLevelBadgeClass={getLevelBadgeClass}
                      onEdit={handleEdit}
                      onDuplicate={handleDuplicateInit}
                      onExport={exportCourse}
                      onPublish={publishCourse}
                      onUnpublish={unpublishCourse}
                      onDelete={handleDeleteInit}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: Table Layout */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              <DataTable
                data={courses}
                columns={columns}
                loading={false}
                rowKey={(course) => course.id}
                pageSize={filters.limit || 10}
                showPagination={false}
                emptyMessage="No se encontraron cursos"
              />
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && !error && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Mostrando pagina {currentPage} de {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px]"
              >
                Anterior
              </button>

              {/* Page numbers for desktop */}
              <div className="hidden sm:flex space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-2 rounded-lg min-w-[44px] min-h-[44px] ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px]"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Confirmar eliminacion
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Estas seguro de que deseas eliminar el curso "{selectedCourse.title}"? Esta accion no
              se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCourse(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 min-h-[44px]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Confirmation Modal */}
      {showDuplicateModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Duplicar curso
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Se creara una copia del curso "{selectedCourse.title}".
            </p>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Titulo del nuevo curso
              </label>
              <input
                type="text"
                value={duplicateTitle}
                onChange={(e) => setDuplicateTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Ingresa el titulo del curso duplicado"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSelectedCourse(null);
                  setDuplicateTitle('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleDuplicate}
                disabled={!duplicateTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Duplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseListPage;
