import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProfiles } from '../hooks/useTrainingProfiles';
import { useEnrolledCourses } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { ROUTES, COURSE_LEVEL_LABELS, COURSE_LEVEL_COLORS } from '../utils/constants';
import type { TrainingProfile } from '../services/api/trainingProfile.service';

function ProfileCard({
  profile,
  enrollmentMap,
  isAssigned,
}: {
  profile: TrainingProfile;
  enrollmentMap: Map<string, { progress: number }>;
  isAssigned: boolean;
}) {
  const courses = useMemo(
    () => [...(profile.courses ?? [])].sort((a, b) => a.order - b.order),
    [profile.courses]
  );

  const completed = courses.filter((c) => (enrollmentMap.get(c.id)?.progress ?? 0) >= 100).length;
  const total = courses.length;

  return (
    <div
      data-testid="profile-card"
      className={`bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex flex-col gap-4 border-2 transition-colors ${
        isAssigned
          ? 'border-blue-500 dark:border-blue-400'
          : 'border-transparent'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {profile.icon && (
            <span className="text-3xl leading-none">{profile.icon}</span>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {profile.name}
            </h2>
            {total > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {completed} de {total} cursos completados
              </p>
            )}
          </div>
        </div>
        {isAssigned && (
          <Badge variant="info" size="sm">
            Tu Ruta
          </Badge>
        )}
      </div>

      {/* Description */}
      {profile.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {profile.description}
        </p>
      )}

      {/* Progress bar for assigned profile */}
      {isAssigned && total > 0 && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${Math.round((completed / total) * 100)}%` }}
          />
        </div>
      )}

      {/* Courses list */}
      {courses.length === 0 ? (
        <p className="text-sm text-gray-400 italic">Sin cursos asignados a esta ruta.</p>
      ) : (
        <ol className="space-y-2">
          {courses.map((course, idx) => {
            const enrollment = enrollmentMap.get(course.id);
            const progress = enrollment?.progress ?? null;
            const levelColor = COURSE_LEVEL_COLORS[course.level as keyof typeof COURSE_LEVEL_COLORS] ?? 'bg-gray-100 text-gray-700';
            const levelLabel = COURSE_LEVEL_LABELS[course.level as keyof typeof COURSE_LEVEL_LABELS] ?? course.level;

            return (
              <li
                key={course.id}
                className="flex flex-col gap-1.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                    {course.title}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${levelColor}`}>
                    {levelLabel}
                  </span>
                  {course.required && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                      Requerido
                    </span>
                  )}
                </div>

                {progress !== null ? (
                  <div className="flex items-center gap-2 pl-8">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-[#00A6FF] h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                      {progress}%
                    </span>
                  </div>
                ) : (
                  <div className="pl-8">
                    <Link
                      to={`${ROUTES.COURSES}/${course.slug || course.id}`}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Ver curso
                    </Link>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export function LearningPaths() {
  const { user } = useAuth();
  const { data: profiles, isLoading: isLoadingProfiles, error: errorProfiles } = useProfiles();
  const { data: enrolledCourses, isLoading: isLoadingEnrolled } = useEnrolledCourses();

  const enrollmentMap = useMemo(() => {
    return new Map((enrolledCourses ?? []).map((e) => [e.courseId, { progress: e.progress }]));
  }, [enrolledCourses]);

  const sortedProfiles = useMemo(() => {
    if (!profiles) return [];
    return [...profiles].sort((a, b) => {
      if (a.id === user?.trainingProfileId) return -1;
      if (b.id === user?.trainingProfileId) return 1;
      return 0;
    });
  }, [profiles, user?.trainingProfileId]);

  if (isLoadingProfiles || isLoadingEnrolled) {
    return <Loader fullScreen text="Cargando rutas de aprendizaje..." />;
  }

  if (errorProfiles) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No se pudieron cargar las rutas de aprendizaje.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="learning-paths-page">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Rutas de Aprendizaje
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Explora las rutas disponibles y sigue tu progreso en cada una.
        </p>
      </div>

      {/* Empty state */}
      {sortedProfiles.length === 0 && (
        <div className="text-center py-16">
          <svg
            className="mx-auto h-16 w-16 text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L16 4m0 13V4m0 0L10 7"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No hay rutas de aprendizaje disponibles.
          </p>
          <Link
            to={ROUTES.COURSES}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Explorar cursos
          </Link>
        </div>
      )}

      {/* Grid */}
      {sortedProfiles.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedProfiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              enrollmentMap={enrollmentMap}
              isAssigned={profile.id === user?.trainingProfileId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
