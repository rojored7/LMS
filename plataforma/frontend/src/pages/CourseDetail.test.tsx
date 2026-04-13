import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseDetail } from './CourseDetail';
import { renderWithProviders } from '../tests/utils/test-utils';
import { createMockCourse, createMockModule, createMockUser } from '../tests/utils/mock-data';

// Mock the hooks
const mockNavigate = vi.fn();
const mockUseCourse = vi.fn();
const mockUseAuth = vi.fn();
const mockUseEnrollCourse = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-course-id' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../hooks/useCourses', () => ({
  useCourse: () => mockUseCourse(),
  useEnrollCourse: () => mockUseEnrollCourse(),
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('CourseDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: createMockUser(),
    });

    mockUseCourse.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    mockUseEnrollCourse.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  describe('Loading State', () => {
    it('should show loading state while fetching course', () => {
      mockUseCourse.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/Cargando curso.../i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error state when course fetch fails', () => {
      mockUseCourse.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/Error al cargar el curso/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Volver al Catálogo/i })).toBeInTheDocument();
    });

    it('should navigate to courses catalog on error button click', async () => {
      const user = userEvent.setup();

      mockUseCourse.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      renderWithProviders(<CourseDetail />);

      const backButton = screen.getByRole('button', { name: /Volver al Catálogo/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/courses');
    });
  });

  describe('Course Display', () => {
    const mockCourse = createMockCourse({
      id: 'test-course-id',
      title: 'Test Course Title',
      description: 'Test course description',
      level: 'BEGINNER',
      duration: 120, // 2 hours
      price: 0,
      thumbnail: '/test-thumbnail.jpg',
      enrollmentCount: 150,
      rating: 4.5,
      isEnrolled: false,
      modules: [
        createMockModule({
          id: 'module-1',
          title: 'Introduction Module',
          description: 'Learn the basics',
          duration: 60,
          lessons: [
            { id: 'lesson-1', title: 'Lesson 1' },
            { id: 'lesson-2', title: 'Lesson 2' },
          ],
        }),
        createMockModule({
          id: 'module-2',
          title: 'Advanced Module',
          description: 'Deep dive into concepts',
          duration: 60,
          lessons: [
            { id: 'lesson-3', title: 'Lesson 3' },
          ],
        }),
      ],
      tags: ['security', 'beginner', 'web'],
    });

    beforeEach(() => {
      mockUseCourse.mockReturnValue({
        data: mockCourse,
        isLoading: false,
        error: null,
      });
    });

    it('should display course title and description', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('heading', { name: 'Test Course Title' })).toBeInTheDocument();
      expect(screen.getByText('Test course description')).toBeInTheDocument();
    });

    it('should display course level badge', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Principiante')).toBeInTheDocument();
    });

    it('should display course metadata', () => {
      renderWithProviders(<CourseDetail />);

      // Duration
      expect(screen.getByText(/2 horas/i)).toBeInTheDocument();

      // Enrollment count
      expect(screen.getByText(/150 estudiantes/i)).toBeInTheDocument();

      // Rating
      expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('should display course thumbnail when available', () => {
      renderWithProviders(<CourseDetail />);

      const thumbnail = screen.getByAltText('Test Course Title');
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', '/test-thumbnail.jpg');
    });

    it('should display course modules', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Contenido del Curso')).toBeInTheDocument();
      expect(screen.getByText(/Módulo 1: Introduction Module/i)).toBeInTheDocument();
      expect(screen.getByText(/Módulo 2: Advanced Module/i)).toBeInTheDocument();
      expect(screen.getByText('Learn the basics')).toBeInTheDocument();
      expect(screen.getByText('Deep dive into concepts')).toBeInTheDocument();
    });

    it('should display module duration and lesson count', () => {
      renderWithProviders(<CourseDetail />);

      // Each module shows duration and lesson count
      expect(screen.getByText(/1 hora • 2 lecciones/i)).toBeInTheDocument();
      expect(screen.getByText(/1 hora • 1 lecciones/i)).toBeInTheDocument();
    });

    it('should display course tags', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Etiquetas')).toBeInTheDocument();
      expect(screen.getByText('security')).toBeInTheDocument();
      expect(screen.getByText('beginner')).toBeInTheDocument();
      expect(screen.getByText('web')).toBeInTheDocument();
    });

    it('should display price as "Gratis" for free courses', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Gratis')).toBeInTheDocument();
    });

    it('should display price for paid courses', () => {
      const paidCourse = { ...mockCourse, price: 49.99 };
      mockUseCourse.mockReturnValue({
        data: paidCourse,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/\$49\.99/i)).toBeInTheDocument();
    });
  });

  describe('Enrollment', () => {
    const mockCourse = createMockCourse({
      id: 'test-course-id',
      isEnrolled: false,
    });

    beforeEach(() => {
      mockUseCourse.mockReturnValue({
        data: mockCourse,
        isLoading: false,
        error: null,
      });
    });

    it('should show "Inscribirse Ahora" button when not enrolled', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /Inscribirse Ahora/i })).toBeInTheDocument();
    });

    it('should handle enrollment when authenticated', async () => {
      const user = userEvent.setup();
      const mockMutate = vi.fn();

      mockUseEnrollCourse.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      });

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /Inscribirse Ahora/i });
      await user.click(enrollButton);

      expect(mockMutate).toHaveBeenCalledWith('test-course-id');
    });

    it('should redirect to login when enrolling without authentication', async () => {
      const user = userEvent.setup();

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
      });

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /Inscribirse Ahora/i });
      await user.click(enrollButton);

      expect(mockNavigate).toHaveBeenCalledWith(
        '/login',
        { state: { from: '/courses/test-course-id' } }
      );
    });

    it('should show loading state during enrollment', () => {
      mockUseEnrollCourse.mockReturnValue({
        mutate: vi.fn(),
        isPending: true,
      });

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /Inscribirse Ahora/i });
      expect(enrollButton).toHaveAttribute('disabled');
    });

    it('should show "Ir al Curso" button when already enrolled', () => {
      const enrolledCourse = { ...mockCourse, isEnrolled: true };
      mockUseCourse.mockReturnValue({
        data: enrolledCourse,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /Ir al Curso/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Inscribirse Ahora/i })).not.toBeInTheDocument();
    });

    it('should navigate to learning page when clicking "Ir al Curso"', async () => {
      const user = userEvent.setup();
      const enrolledCourse = { ...mockCourse, isEnrolled: true };

      mockUseCourse.mockReturnValue({
        data: enrolledCourse,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      const goToCourseButton = screen.getByRole('button', { name: /Ir al Curso/i });
      await user.click(goToCourseButton);

      expect(mockNavigate).toHaveBeenCalledWith('/courses/test-course-id/learn');
    });

    it('should show enrolled badge when enrolled', () => {
      const enrolledCourse = { ...mockCourse, isEnrolled: true };
      mockUseCourse.mockReturnValue({
        data: enrolledCourse,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Inscrito')).toBeInTheDocument();
    });
  });

  describe('Course without modules', () => {
    it('should not show modules section when course has no modules', () => {
      const courseWithoutModules = createMockCourse({
        modules: [],
      });

      mockUseCourse.mockReturnValue({
        data: courseWithoutModules,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.queryByText('Contenido del Curso')).not.toBeInTheDocument();
    });
  });

  describe('Course without tags', () => {
    it('should not show tags section when course has no tags', () => {
      const courseWithoutTags = createMockCourse({
        tags: [],
      });

      mockUseCourse.mockReturnValue({
        data: courseWithoutTags,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.queryByText('Etiquetas')).not.toBeInTheDocument();
    });
  });

  describe('Course without rating', () => {
    it('should show "Sin calificación" when course has no rating', () => {
      const courseWithoutRating = createMockCourse({
        rating: null,
      });

      mockUseCourse.mockReturnValue({
        data: courseWithoutRating,
        isLoading: false,
        error: null,
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Sin calificación')).toBeInTheDocument();
    });
  });
});