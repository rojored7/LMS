import { useState, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TrainingProfile } from '../../services/api/trainingProfile.service';
import {
  useAddCourseToProfile,
  useRemoveCourseFromProfile,
  useUpdateCourseInProfile,
  useReorderCourses,
} from '../../hooks/useTrainingProfiles';

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  level: string;
  order: number;
  required: boolean;
}

interface AvailableCourse {
  id: string;
  title: string;
  slug: string;
  level?: string;
}

interface SortableCourseItemProps {
  course: CourseItem;
  profileId: string;
}

function SortableCourseItem({ course, profileId }: SortableCourseItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: course.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const removeMutation = useRemoveCourseFromProfile();
  const updateMutation = useUpdateCourseInProfile();

  const handleToggleRequired = () => {
    updateMutation.mutate({
      profileId,
      courseId: course.id,
      data: { required: !course.required },
    });
  };

  const handleRemove = () => {
    removeMutation.mutate({ profileId, courseId: course.id });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="drag handle"
        className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
        </svg>
      </button>

      <span className="w-6 text-center text-xs font-mono text-gray-400">{course.order + 1}</span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{course.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{course.slug}</p>
      </div>

      {course.required && (
        <span
          data-testid="badge-obligatorio"
          className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full"
        >
          Obligatorio
        </span>
      )}

      <button
        type="button"
        onClick={handleToggleRequired}
        aria-label={course.required ? 'Marcar como opcional' : 'Marcar como obligatorio'}
        className={`w-8 h-5 rounded-full transition-colors ${
          course.required ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`block w-4 h-4 bg-white rounded-full shadow transform transition-transform mx-0.5 ${
            course.required ? 'translate-x-3' : 'translate-x-0'
          }`}
        />
      </button>

      <button
        type="button"
        onClick={handleRemove}
        aria-label="Eliminar curso del perfil"
        className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

interface ProfileCoursesPanelProps {
  profile: TrainingProfile;
  availableCourses: AvailableCourse[];
  onClose?: () => void;
}

export function ProfileCoursesPanel({ profile, availableCourses }: ProfileCoursesPanelProps) {
  const [search, setSearch] = useState('');

  const addMutation = useAddCourseToProfile();
  const reorderMutation = useReorderCourses();

  const sensors = useSensors(useSensor(PointerSensor));

  const assignedCourses: CourseItem[] = useMemo(() => {
    const courses = profile.courses || [];
    return [...courses].sort((a, b) => a.order - b.order);
  }, [profile.courses]);

  const assignedIds = useMemo(() => new Set(assignedCourses.map((c) => c.id)), [assignedCourses]);

  const filteredAvailable = useMemo(() => {
    const q = search.toLowerCase();
    return availableCourses.filter(
      (c) => !assignedIds.has(c.id) && c.title.toLowerCase().includes(q)
    );
  }, [availableCourses, assignedIds, search]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = assignedCourses.findIndex((c) => c.id === active.id);
    const newIndex = assignedCourses.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(assignedCourses, oldIndex, newIndex);
    reorderMutation.mutate({
      profileId: profile.id,
      courses: reordered.map((c, idx) => ({ courseId: c.id, order: idx })),
    });
  };

  const handleAdd = (courseId: string) => {
    const nextOrder = assignedCourses.length;
    addMutation.mutate({ profileId: profile.id, courseId, order: nextOrder });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left: assigned courses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Cursos en esta ruta ({assignedCourses.length})
        </h3>

        {assignedCourses.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            No hay cursos asignados
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={assignedCourses.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {assignedCourses.map((course) => (
                  <SortableCourseItem key={course.id} course={course} profileId={profile.id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Right: available courses */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Agregar cursos
        </h3>

        <input
          type="text"
          placeholder="Buscar cursos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          aria-label="Buscar cursos disponibles"
        />

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filteredAvailable.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
              {search ? 'No se encontraron cursos' : 'Todos los cursos ya estan asignados'}
            </p>
          ) : (
            filteredAvailable.map((course) => (
              <div
                key={course.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {course.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.slug}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAdd(course.id)}
                  aria-label={`Agregar ${course.title}`}
                  className="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  Agregar
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
