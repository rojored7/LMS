/**
 * Course Catalog page
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Loader } from '../components/common/Loader';
import { useCourses } from '../hooks/useCourses';
import { formatDuration, formatCurrency } from '../utils/formatters';
import { ROUTES, COURSE_LEVEL_LABELS, COURSE_LEVEL_COLORS } from '../utils/constants';

export const CourseCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');

  const {
    data: coursesData,
    isLoading,
    error,
  } = useCourses({
    page: 1,
    limit: 12,
  });

  const courses = coursesData?.data || [];

  // Filter courses by search and level
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      searchQuery === '' ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLevel = selectedLevel === '' || course.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  if (isLoading) {
    return <Loader fullScreen text="Cargando cursos..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading text-gray-900 mb-2">
          Catálogo de Cursos
        </h1>
        <p className="text-gray-600">
          Explora nuestra colección de cursos profesionales
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Buscar cursos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>

        <select
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="input w-full md:w-48"
        >
          <option value="">Todos los niveles</option>
          <option value="BEGINNER">Principiante</option>
          <option value="INTERMEDIATE">Intermedio</option>
          <option value="ADVANCED">Avanzado</option>
          <option value="EXPERT">Experto</option>
        </select>
      </div>

      {/* Course Grid */}
      {error ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-red-600">Error al cargar los cursos</p>
            </div>
          </CardBody>
        </Card>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card
              key={course.id}
              className="hover:shadow-lg hover:border-itac-blue/30 transition-shadow cursor-pointer"
              onClick={() => navigate(`${ROUTES.COURSES}/${course.id}`)}
            >
              <CardBody>
                {/* Thumbnail */}
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                )}

                {/* Course Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {course.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                    <span className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
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
                  </div>

                  {/* Level and Price */}
                  <div className="flex items-center justify-between">
                    <Badge className={COURSE_LEVEL_COLORS[course.level]} size="sm">
                      {COURSE_LEVEL_LABELS[course.level]}
                    </Badge>
                    <span className="text-lg font-bold text-itac-orange">
                      {course.price === 0 ? 'Gratis' : formatCurrency(course.price)}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  variant={course.isEnrolled ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`${ROUTES.COURSES}/${course.id}`);
                  }}
                >
                  {course.isEnrolled ? 'Continuar' : 'Ver Detalles'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody>
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
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron cursos
              </h3>
              <p className="text-gray-600">
                Intenta ajustar tus filtros de búsqueda
              </p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
