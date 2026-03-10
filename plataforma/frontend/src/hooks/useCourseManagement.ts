import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import courseManagementService, {
  CourseFilters,
  CourseListResponse,
  CourseCreateData,
  CourseUpdateData,
} from '../services/api/courseManagement.service';
import { useUiStore } from '../store/uiStore';
import { useNavigate } from 'react-router-dom';

export interface UseCourseManagementReturn {
  // Data
  courses: any[];
  totalCourses: number;
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;

  // Filters
  filters: CourseFilters;
  setFilters: (filters: CourseFilters) => void;
  resetFilters: () => void;

  // Actions
  createCourse: (data: CourseCreateData) => Promise<any>;
  updateCourse: (id: string, data: CourseUpdateData) => Promise<any>;
  deleteCourse: (id: string) => Promise<void>;
  duplicateCourse: (id: string, newTitle?: string) => Promise<any>;
  publishCourse: (id: string) => Promise<void>;
  unpublishCourse: (id: string) => Promise<void>;
  exportCourse: (id: string, filename?: string) => Promise<void>;

  // Utilities
  refreshCourses: () => void;
  goToPage: (page: number) => void;
}

const defaultFilters: CourseFilters = {
  search: '',
  level: undefined,
  status: 'all',
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export const useCourseManagement = (): UseCourseManagementReturn => {
  const [filters, setFiltersState] = useState<CourseFilters>(defaultFilters);
  const queryClient = useQueryClient();
  const { addToast } = useUiStore();
  const navigate = useNavigate();

  // Fetch courses query
  const {
    data: coursesData,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery<CourseListResponse>({
    queryKey: ['courses', filters],
    queryFn: () => courseManagementService.getCourses(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // Create course mutation
  const createMutation = useMutation({
    mutationFn: (data: CourseCreateData) => courseManagementService.createCourse(data),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast({
        title: 'Curso creado',
        message: `El curso "${course.title}" ha sido creado exitosamente`,
        type: 'success',
        duration: 3000,
      });
      navigate(`/admin/courses/${course.id}/edit`);
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al crear el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Update course mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CourseUpdateData }) =>
      courseManagementService.updateCourse(id, data),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', course.id] });
      addToast({
        title: 'Curso actualizado',
        message: `El curso "${course.title}" ha sido actualizado`,
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al actualizar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Delete course mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => courseManagementService.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast({
        title: 'Curso eliminado',
        message: 'El curso ha sido eliminado exitosamente',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al eliminar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Duplicate course mutation
  const duplicateMutation = useMutation({
    mutationFn: ({ id, newTitle }: { id: string; newTitle?: string }) =>
      courseManagementService.duplicateCourse(id, newTitle),
    onSuccess: (course) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast({
        title: 'Curso duplicado',
        message: `Se ha creado una copia del curso como "${course.title}"`,
        type: 'success',
        duration: 3000,
      });
      navigate(`/admin/courses/${course.id}/edit`);
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al duplicar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Publish course mutation
  const publishMutation = useMutation({
    mutationFn: (id: string) => courseManagementService.publishCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast({
        title: 'Curso publicado',
        message: 'El curso ha sido publicado y ahora está disponible para los estudiantes',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al publicar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Unpublish course mutation
  const unpublishMutation = useMutation({
    mutationFn: (id: string) => courseManagementService.unpublishCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      addToast({
        title: 'Curso despublicado',
        message: 'El curso ya no está disponible para los estudiantes',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      addToast({
        title: 'Error al despublicar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  // Export course function
  const exportCourse = useCallback(async (id: string, filename?: string) => {
    try {
      const blob = await courseManagementService.exportCourse(id);
      const defaultFilename = filename || `curso-${id}-${Date.now()}.zip`;
      courseManagementService.downloadExport(blob, defaultFilename);

      addToast({
        title: 'Curso exportado',
        message: 'El curso ha sido exportado exitosamente',
        type: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      addToast({
        title: 'Error al exportar el curso',
        message: error.response?.data?.message || error.message,
        type: 'error',
        duration: 5000,
      });
    }
  }, [addToast]);

  // Filter actions
  const setFilters = useCallback((newFilters: CourseFilters) => {
    setFiltersState(prevFilters => ({ ...prevFilters, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, []);

  const goToPage = useCallback((page: number) => {
    setFiltersState(prevFilters => ({ ...prevFilters, page }));
  }, []);

  const refreshCourses = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    // Data
    courses: coursesData?.courses || [],
    totalCourses: coursesData?.total || 0,
    currentPage: coursesData?.page || 1,
    totalPages: coursesData?.totalPages || 1,
    isLoading,
    error: fetchError?.message || null,

    // Filters
    filters,
    setFilters,
    resetFilters,

    // Actions
    createCourse: createMutation.mutateAsync,
    updateCourse: (id: string, data: CourseUpdateData) =>
      updateMutation.mutateAsync({ id, data }),
    deleteCourse: deleteMutation.mutateAsync,
    duplicateCourse: (id: string, newTitle?: string) =>
      duplicateMutation.mutateAsync({ id, newTitle }),
    publishCourse: publishMutation.mutateAsync,
    unpublishCourse: unpublishMutation.mutateAsync,
    exportCourse,

    // Utilities
    refreshCourses,
    goToPage,
  };
};

export default useCourseManagement;