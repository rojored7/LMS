/**
 * Course Detail page
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { useCourse, useEnrollCourse } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { formatDuration, formatCurrency, formatDate } from '../utils/formatters';
import { ROUTES, COURSE_LEVEL_LABELS, COURSE_LEVEL_COLORS } from '../utils/constants';

export const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: course, isLoading, error } = useCourse(id!);
  const { mutate: enrollCourse, isPending: isEnrolling } = useEnrollCourse();

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: `/courses/${id}` } });
      return;
    }

    if (id) {
      enrollCourse(id);
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Cargando curso..." />;
  }

  if (error || !course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardBody>
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">
                Error al cargar el curso
              </p>
              <Button variant="outline" onClick={() => navigate(ROUTES.COURSES)}>
                Volver al Catálogo
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card>
            {/* Course Thumbnail */}
            {course.thumbnail && (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-64 object-cover rounded-t-lg"
              />
            )}

            <CardBody>
              {/* Title and Level */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <Badge className={COURSE_LEVEL_COLORS[course.level]}>
                    {COURSE_LEVEL_LABELS[course.level]}
                  </Badge>
                  {course.isEnrolled && (
                    <Badge variant="success">Inscrito</Badge>
                  )}
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h1>

                <p className="text-gray-600 dark:text-gray-400">
                  {course.description}
                </p>
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {formatDuration(course.duration)}
                </span>

                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  {course.enrollmentCount} estudiantes
                </span>

                <span className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {course.rating || 'Sin calificación'}
                </span>
              </div>

              {/* Course Modules */}
              {course.modules && course.modules.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Contenido del Curso
                  </h2>

                  <div className="space-y-2">
                    {course.modules.map((module, index) => (
                      <div
                        key={module.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                          Módulo {index + 1}: {module.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {module.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                          {formatDuration(module.duration)} •{' '}
                          {module.lessons?.length || 0} lecciones
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {course.tags && course.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Etiquetas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <Badge key={index} variant="default" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardBody>
              {/* Price */}
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {course.price === 0 ? 'Gratis' : formatCurrency(course.price)}
                </p>
              </div>

              {/* Enroll Button */}
              {course.isEnrolled ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mb-4"
                  onClick={() => navigate(ROUTES.DASHBOARD)}
                >
                  Ir al Curso
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mb-4"
                  onClick={handleEnroll}
                  isLoading={isEnrolling}
                >
                  Inscribirse Ahora
                </Button>
              )}

              {/* Course Info */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nivel
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {COURSE_LEVEL_LABELS[course.level]}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duración
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDuration(course.duration)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Última actualización
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(course.updatedAt)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
