/**
 * Student Dashboard page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import { useEnrolledCourses } from '../hooks/useCourses';
import { formatDate, formatPercentage } from '../utils/formatters';
import { ROUTES, COURSE_LEVEL_LABELS, COURSE_LEVEL_COLORS } from '../utils/constants';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: enrolledCourses, isLoading, error, refetch } = useEnrolledCourses();

  if (isLoading) {
    return <Loader fullScreen text="Cargando dashboard..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">
          Bienvenido, {user?.firstName}
        </h1>
        <p className="text-gray-600">Continúa tu aprendizaje donde lo dejaste</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card
          className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
          onClick={() => navigate(ROUTES.COURSES)}
        >
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#00A6FF]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cursos Inscritos</p>
                <p className="text-2xl font-bold text-gray-900">{enrolledCourses?.length || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#FF5100]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cursos Completados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrolledCourses?.filter((e) => e.progress === 100).length || 0}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <svg
                  className="w-8 h-8 text-[#166EB6]"
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
              </div>
              <div>
                <p className="text-sm text-gray-600">Horas de Estudio</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card
          className="cursor-pointer hover:scale-[1.02] hover:shadow-lg transition-all"
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Puntos XP</p>
                <p className="text-2xl font-bold text-gray-900">{user?.xp || 0}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Enrolled Courses Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Mis Cursos</h2>
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.COURSES)}>
              Explorar Más Cursos
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar los cursos</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          ) : enrolledCourses && enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment) => (
                <Card key={enrollment.id} variant="outlined">
                  <CardBody>
                    {/* Course Thumbnail */}
                    {enrollment.course?.thumbnail && (
                      <img
                        src={enrollment.course.thumbnail}
                        alt={enrollment.course?.title || ''}
                        className="w-full h-40 object-cover rounded-md mb-4"
                      />
                    )}

                    {/* Course Info */}
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {enrollment.course?.title || 'Curso'}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {enrollment.course?.description || ''}
                      </p>

                      {/* Level Badge */}
                      {enrollment.course?.level && (
                        <Badge
                          className={COURSE_LEVEL_COLORS[enrollment.course.level] || ''}
                          size="sm"
                        >
                          {COURSE_LEVEL_LABELS[enrollment.course.level] || enrollment.course.level}
                        </Badge>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600">Progreso</span>
                        <span className="text-sm font-medium text-gray-900">
                          {enrollment.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#00A6FF] h-2 rounded-full"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const targetId =
                          enrollment.course?.slug || enrollment.course?.id || enrollment.courseId;
                        navigate(`${ROUTES.COURSES}/${targetId}`);
                      }}
                    >
                      Continuar Curso
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos inscritos</h3>
              <p className="text-gray-600 mb-4">
                Explora nuestro catálogo y comienza tu aprendizaje
              </p>
              <Button variant="primary" onClick={() => navigate(ROUTES.COURSES)}>
                Explorar Cursos
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
