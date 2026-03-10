import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseDetail } from './CourseDetail';
import { renderWithProviders, createTestCourse, createTestModule, createTestUser } from '../tests/utils/test-utils';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock('../hooks/useCourses', () => ({
  useCourses: () => ({
    selectedCourse: mockSelectedCourse,
    isLoading: mockIsLoading,
    error: mockError,
    fetchCourseBySlug: mockFetchCourseBySlug,
    enrollInCourse: mockEnrollInCourse,
  }),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({
    courseProgress: mockCourseProgress,
    isEnrolled: mockIsEnrolled,
  }),
}));

// Mock useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ slug: mockSlug }),
    useNavigate: () => mockNavigate,
  };
});

let mockUser = null;
let mockIsAuthenticated = false;
let mockSelectedCourse = null;
let mockIsLoading = false;
let mockError = null;
let mockFetchCourseBySlug = vi.fn();
let mockEnrollInCourse = vi.fn();
let mockCourseProgress = null;
let mockIsEnrolled = false;
let mockSlug = 'test-course';
let mockNavigate = vi.fn();

describe('CourseDetail Page', () => {
  beforeEach(() => {
    mockUser = createTestUser();
    mockIsAuthenticated = true;
    mockSelectedCourse = null;
    mockIsLoading = false;
    mockError = null;
    mockFetchCourseBySlug = vi.fn();
    mockEnrollInCourse = vi.fn();
    mockCourseProgress = null;
    mockIsEnrolled = false;
    mockSlug = 'test-course';
    mockNavigate = vi.fn();
  });

  describe('Rendering', () => {
    it('should render course details when loaded', async () => {
      mockSelectedCourse = createTestCourse({
        title: 'Fundamentos de Ciberseguridad',
        description: 'Aprende los conceptos básicos de ciberseguridad',
        duration: 20,
        level: 'BEGINNER',
        modules: [
          createTestModule({ title: 'Introducción' }),
          createTestModule({ title: 'Conceptos Básicos' }),
        ],
      });

      renderWithProviders(<CourseDetail />);

      await waitFor(() => {
        expect(screen.getByText('Fundamentos de Ciberseguridad')).toBeInTheDocument();
        expect(screen.getByText('Aprende los conceptos básicos de ciberseguridad')).toBeInTheDocument();
        expect(screen.getByText('20 horas')).toBeInTheDocument();
        expect(screen.getByText('Principiante')).toBeInTheDocument();
      });
    });

    it('should show loading state while fetching course', () => {
      mockIsLoading = true;
      renderWithProviders(<CourseDetail />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/cargando curso/i)).toBeInTheDocument();
    });

    it('should show error state when course fetch fails', () => {
      mockError = 'Error al cargar el curso';
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/error al cargar el curso/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('should show 404 when course not found', () => {
      mockError = 'Curso no encontrado';
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/curso no encontrado/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /volver a cursos/i })).toBeInTheDocument();
    });
  });

  describe('Course Information', () => {
    beforeEach(() => {
      mockSelectedCourse = createTestCourse({
        title: 'Test Course',
        instructor: createTestUser({ firstName: 'Jane', lastName: 'Doe', role: 'INSTRUCTOR' }),
        enrollmentCount: 150,
        rating: 4.5,
        totalRatings: 25,
        prerequisites: ['JavaScript básico', 'HTML/CSS'],
        objectives: ['Objetivo 1', 'Objetivo 2', 'Objetivo 3'],
        targetAudience: 'Desarrolladores junior',
      });
    });

    it('should display instructor information', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText(/instructor/i)).toBeInTheDocument();
    });

    it('should display enrollment count', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText(/estudiantes inscritos/i)).toBeInTheDocument();
    });

    it('should display course rating', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('(25 valoraciones)')).toBeInTheDocument();
    });

    it('should display prerequisites', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/requisitos previos/i)).toBeInTheDocument();
      expect(screen.getByText('JavaScript básico')).toBeInTheDocument();
      expect(screen.getByText('HTML/CSS')).toBeInTheDocument();
    });

    it('should display course objectives', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/objetivos del curso/i)).toBeInTheDocument();
      expect(screen.getByText('Objetivo 1')).toBeInTheDocument();
      expect(screen.getByText('Objetivo 2')).toBeInTheDocument();
      expect(screen.getByText('Objetivo 3')).toBeInTheDocument();
    });

    it('should display target audience', () => {
      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/dirigido a/i)).toBeInTheDocument();
      expect(screen.getByText('Desarrolladores junior')).toBeInTheDocument();
    });
  });

  describe('Course Modules', () => {
    it('should display all course modules', () => {
      mockSelectedCourse = createTestCourse({
        modules: [
          createTestModule({
            title: 'Módulo 1: Introducción',
            description: 'Conceptos básicos',
            lessons: [
              { id: '1', title: 'Lección 1', duration: 15 },
              { id: '2', title: 'Lección 2', duration: 20 },
            ],
          }),
          createTestModule({
            title: 'Módulo 2: Avanzado',
            description: 'Conceptos avanzados',
            lessons: [
              { id: '3', title: 'Lección 3', duration: 30 },
            ],
            quizzes: [
              { id: 'q1', title: 'Quiz Final', questions: 10 },
            ],
          }),
        ],
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Módulo 1: Introducción')).toBeInTheDocument();
      expect(screen.getByText('Módulo 2: Avanzado')).toBeInTheDocument();
      expect(screen.getByText('Lección 1')).toBeInTheDocument();
      expect(screen.getByText('Lección 2')).toBeInTheDocument();
      expect(screen.getByText('Lección 3')).toBeInTheDocument();
      expect(screen.getByText('Quiz Final')).toBeInTheDocument();
    });

    it('should show module duration', () => {
      mockSelectedCourse = createTestCourse({
        modules: [
          createTestModule({
            lessons: [
              { duration: 15 },
              { duration: 20 },
              { duration: 10 },
            ],
          }),
        ],
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText(/45 minutos/i)).toBeInTheDocument();
    });

    it('should expand/collapse module content', async () => {
      const user = userEvent.setup();
      mockSelectedCourse = createTestCourse({
        modules: [
          createTestModule({
            title: 'Módulo Colapsable',
            lessons: [{ title: 'Lección Oculta' }],
          }),
        ],
      });

      renderWithProviders(<CourseDetail />);

      // Initially expanded
      expect(screen.getByText('Lección Oculta')).toBeInTheDocument();

      // Click to collapse
      const toggleButton = screen.getByRole('button', { name: /módulo colapsable/i });
      await user.click(toggleButton);

      // Should be hidden
      expect(screen.queryByText('Lección Oculta')).not.toBeInTheDocument();

      // Click to expand again
      await user.click(toggleButton);

      // Should be visible again
      expect(screen.getByText('Lección Oculta')).toBeInTheDocument();
    });

    it('should show module progress for enrolled users', () => {
      mockIsEnrolled = true;
      mockCourseProgress = {
        modules: {
          'module-1': { progress: 75, completed: false },
          'module-2': { progress: 100, completed: true },
        },
      };

      mockSelectedCourse = createTestCourse({
        modules: [
          createTestModule({ id: 'module-1', title: 'Módulo 1' }),
          createTestModule({ id: 'module-2', title: 'Módulo 2' }),
        ],
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByTestId('module-1-progress')).toHaveStyle({ width: '75%' });
      expect(screen.getByTestId('module-2-progress')).toHaveStyle({ width: '100%' });
    });
  });

  describe('Enrollment', () => {
    beforeEach(() => {
      mockSelectedCourse = createTestCourse({ title: 'Test Course' });
    });

    it('should show enroll button when not enrolled', () => {
      mockIsEnrolled = false;
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /inscribirse/i })).toBeInTheDocument();
    });

    it('should handle enrollment when clicking enroll button', async () => {
      const user = userEvent.setup();
      mockIsEnrolled = false;
      mockEnrollInCourse.mockResolvedValue({ success: true });

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /inscribirse/i });
      await user.click(enrollButton);

      await waitFor(() => {
        expect(mockEnrollInCourse).toHaveBeenCalledWith('test-course');
      });
    });

    it('should show continue button when already enrolled', () => {
      mockIsEnrolled = true;
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /continuar curso/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /inscribirse/i })).not.toBeInTheDocument();
    });

    it('should navigate to learning page when clicking continue', async () => {
      const user = userEvent.setup();
      mockIsEnrolled = true;

      renderWithProviders(<CourseDetail />);

      const continueButton = screen.getByRole('button', { name: /continuar curso/i });
      await user.click(continueButton);

      expect(mockNavigate).toHaveBeenCalledWith('/courses/test-course/learn');
    });

    it('should prompt login for unauthenticated users', () => {
      mockIsAuthenticated = false;
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /iniciar sesión para inscribirse/i })).toBeInTheDocument();
    });

    it('should show enrollment confirmation dialog', async () => {
      const user = userEvent.setup();
      mockIsEnrolled = false;

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /inscribirse/i });
      await user.click(enrollButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/¿confirmar inscripción?/i)).toBeInTheDocument();
      });
    });
  });

  describe('Reviews and Ratings', () => {
    it('should display course reviews', () => {
      mockSelectedCourse = createTestCourse({
        reviews: [
          {
            id: '1',
            userId: 'user1',
            userName: 'Alice Smith',
            rating: 5,
            comment: 'Excelente curso, muy completo',
            createdAt: '2024-01-15',
          },
          {
            id: '2',
            userId: 'user2',
            userName: 'Bob Johnson',
            rating: 4,
            comment: 'Buen contenido pero podría ser más práctico',
            createdAt: '2024-01-10',
          },
        ],
      });

      renderWithProviders(<CourseDetail />);

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Excelente curso, muy completo')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getByText('Buen contenido pero podría ser más práctico')).toBeInTheDocument();
    });

    it('should allow enrolled users to rate the course', async () => {
      const user = userEvent.setup();
      mockIsEnrolled = true;

      renderWithProviders(<CourseDetail />);

      const ratingButton = screen.getByRole('button', { name: /calificar curso/i });
      await user.click(ratingButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getAllByRole('radio')).toHaveLength(5); // 5 star rating
      });
    });

    it('should not allow non-enrolled users to rate', () => {
      mockIsEnrolled = false;
      renderWithProviders(<CourseDetail />);

      expect(screen.queryByRole('button', { name: /calificar curso/i })).not.toBeInTheDocument();
    });
  });

  describe('Social Features', () => {
    it('should show share buttons', () => {
      mockSelectedCourse = createTestCourse({ title: 'Shareable Course' });
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('button', { name: /compartir en twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compartir en linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copiar enlace/i })).toBeInTheDocument();
    });

    it('should copy course link to clipboard', async () => {
      const user = userEvent.setup();
      const mockClipboard = { writeText: vi.fn() };
      Object.assign(navigator, { clipboard: mockClipboard });

      mockSelectedCourse = createTestCourse({ slug: 'test-course' });
      renderWithProviders(<CourseDetail />);

      const copyButton = screen.getByRole('button', { name: /copiar enlace/i });
      await user.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/courses/test-course')
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      mockSelectedCourse = createTestCourse({
        title: 'Accessible Course',
        modules: [createTestModule({ title: 'Module 1' })],
      });

      renderWithProviders(<CourseDetail />);

      const h1 = screen.getByRole('heading', { level: 1, name: 'Accessible Course' });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', () => {
      mockSelectedCourse = createTestCourse();
      renderWithProviders(<CourseDetail />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Detalles del curso');
      expect(screen.getByRole('region', { name: /información del curso/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /contenido del curso/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      mockSelectedCourse = createTestCourse({
        modules: [createTestModule({ title: 'Keyboard Nav Module' })],
      });

      renderWithProviders(<CourseDetail />);

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('role', 'button');

      await user.keyboard('{Enter}');
      // Should trigger button action
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      mockIsEnrolled = false;

      renderWithProviders(<CourseDetail />);

      const enrollButton = screen.getByRole('button', { name: /inscribirse/i });
      await user.click(enrollButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should adapt layout for mobile devices', () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      mockSelectedCourse = createTestCourse();
      renderWithProviders(<CourseDetail />);

      const container = screen.getByTestId('course-detail-container');
      expect(container).toHaveClass('flex-col');
    });

    it('should show desktop layout on large screens', () => {
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      mockSelectedCourse = createTestCourse();
      renderWithProviders(<CourseDetail />);

      const container = screen.getByTestId('course-detail-container');
      expect(container).toHaveClass('grid-cols-3');
    });

    it('should hide sidebar on mobile', () => {
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      mockSelectedCourse = createTestCourse();
      renderWithProviders(<CourseDetail />);

      expect(screen.queryByTestId('course-sidebar')).not.toBeInTheDocument();
    });
  });
});