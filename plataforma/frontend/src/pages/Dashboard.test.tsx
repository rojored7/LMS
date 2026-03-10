import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dashboard } from './Dashboard';
import { renderWithProviders, createTestUser, createTestCourse } from '../tests/utils/test-utils';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

vi.mock('../hooks/useCourses', () => ({
  useEnrolledCourses: () => ({
    data: mockEnrolledCourses,
    isLoading: mockIsLoading,
    error: mockError,
    refetch: vi.fn(),
  }),
  useCourses: () => ({
    data: [],
    isLoading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({
    courseProgress: mockCourseProgress,
    recentActivity: mockRecentActivity,
    stats: mockStats,
    isLoading: false,
  }),
}));

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    markAsRead: vi.fn(),
  }),
}));

let mockUser = createTestUser();
let mockEnrolledCourses = [];
let mockIsLoading = false;
let mockError = null;
let mockCourseProgress = {};
let mockRecentActivity = [];
let mockStats = null;
let mockNotifications = [];
let mockUnreadCount = 0;

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockUser = createTestUser({ firstName: 'John', lastName: 'Doe' });
    mockEnrolledCourses = [];
    mockIsLoading = false;
    mockError = null;
    mockCourseProgress = {};
    mockRecentActivity = [];
    mockStats = {
      completedCourses: 2,
      totalHours: 45,
      averageScore: 85,
      currentStreak: 7,
    };
    mockNotifications = [];
    mockUnreadCount = 0;
  });

  describe('Rendering', () => {
    it('should render welcome message with user name', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('heading', { name: /bienvenido, john/i })).toBeInTheDocument();
    });

    it('should render main dashboard sections', () => {
      renderWithProviders(<Dashboard />);

      // Check for main sections
      expect(screen.getByText(/mis cursos/i)).toBeInTheDocument();
      expect(screen.getByText(/progreso general/i)).toBeInTheDocument();
      expect(screen.getByText(/actividad reciente/i)).toBeInTheDocument();
      expect(screen.getByText(/estadísticas/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockIsLoading = true;
      renderWithProviders(<Dashboard />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/cargando cursos/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockError = 'Error al cargar los cursos';
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/error al cargar los cursos/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
    });

    it('should show empty state when no courses enrolled', () => {
      mockEnrolledCourses = [];
      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/no tienes cursos inscritos/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /explorar cursos/i })).toBeInTheDocument();
    });
  });

  describe('Enrolled Courses Section', () => {
    it('should display enrolled courses cards', () => {
      mockEnrolledCourses = [
        createTestCourse({
          id: '1',
          title: 'Fundamentos de Ciberseguridad',
          progress: 65
        }),
        createTestCourse({
          id: '2',
          title: 'Ethical Hacking',
          progress: 30
        }),
      ];
      mockCourseProgress = {
        '1': { progress: 65, lastAccessed: new Date().toISOString() },
        '2': { progress: 30, lastAccessed: new Date().toISOString() },
      };

      renderWithProviders(<Dashboard />);

      expect(screen.getByText('Fundamentos de Ciberseguridad')).toBeInTheDocument();
      expect(screen.getByText('Ethical Hacking')).toBeInTheDocument();
      expect(screen.getByText('65%')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('should navigate to course detail when clicking course card', async () => {
      const user = userEvent.setup();
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'Test Course', slug: 'test-course' }),
      ];

      renderWithProviders(<Dashboard />);

      const courseCard = screen.getByText('Test Course').closest('a');
      expect(courseCard).toHaveAttribute('href', '/courses/test-course');
    });

    it('should show continue learning button for courses in progress', () => {
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'Course in Progress' }),
      ];
      mockCourseProgress = {
        '1': { progress: 50, lastModule: 'module-2' },
      };

      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('button', { name: /continuar/i })).toBeInTheDocument();
    });

    it('should show certificate button for completed courses', () => {
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'Completed Course' }),
      ];
      mockCourseProgress = {
        '1': { progress: 100, certificateId: 'cert-123' },
      };

      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('button', { name: /ver certificado/i })).toBeInTheDocument();
    });

    it('should filter courses by search term', async () => {
      const user = userEvent.setup();
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'JavaScript Basics' }),
        createTestCourse({ id: '2', title: 'Python Advanced' }),
        createTestCourse({ id: '3', title: 'React Development' }),
      ];

      renderWithProviders(<Dashboard />);

      const searchInput = screen.getByPlaceholderText(/buscar cursos/i);
      await user.type(searchInput, 'Python');

      expect(screen.getByText('Python Advanced')).toBeInTheDocument();
      expect(screen.queryByText('JavaScript Basics')).not.toBeInTheDocument();
      expect(screen.queryByText('React Development')).not.toBeInTheDocument();
    });

    it('should filter courses by status', async () => {
      const user = userEvent.setup();
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'In Progress Course' }),
        createTestCourse({ id: '2', title: 'Completed Course' }),
        createTestCourse({ id: '3', title: 'Not Started Course' }),
      ];
      mockCourseProgress = {
        '1': { progress: 50 },
        '2': { progress: 100 },
        '3': { progress: 0 },
      };

      renderWithProviders(<Dashboard />);

      const statusFilter = screen.getByRole('combobox', { name: /filtrar por estado/i });
      await user.selectOptions(statusFilter, 'completed');

      expect(screen.getByText('Completed Course')).toBeInTheDocument();
      expect(screen.queryByText('In Progress Course')).not.toBeInTheDocument();
      expect(screen.queryByText('Not Started Course')).not.toBeInTheDocument();
    });

    it('should sort courses by different criteria', async () => {
      const user = userEvent.setup();
      mockEnrolledCourses = [
        createTestCourse({ id: '1', title: 'Course A', enrolledAt: '2024-01-01' }),
        createTestCourse({ id: '2', title: 'Course B', enrolledAt: '2024-02-01' }),
        createTestCourse({ id: '3', title: 'Course C', enrolledAt: '2024-03-01' }),
      ];
      mockCourseProgress = {
        '1': { progress: 30, lastAccessed: '2024-03-15' },
        '2': { progress: 70, lastAccessed: '2024-03-10' },
        '3': { progress: 50, lastAccessed: '2024-03-20' },
      };

      renderWithProviders(<Dashboard />);

      const sortSelect = screen.getByRole('combobox', { name: /ordenar por/i });

      // Sort by progress
      await user.selectOptions(sortSelect, 'progress');
      const courseCards = screen.getAllByTestId('course-card');
      expect(courseCards[0]).toHaveTextContent('Course B'); // 70%
      expect(courseCards[1]).toHaveTextContent('Course C'); // 50%
      expect(courseCards[2]).toHaveTextContent('Course A'); // 30%
    });
  });

  describe('Progress Section', () => {
    it('should display overall progress stats', () => {
      mockStats = {
        completedCourses: 3,
        totalHours: 120,
        averageScore: 92,
        currentStreak: 15,
      };

      renderWithProviders(<Dashboard />);

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/cursos completados/i)).toBeInTheDocument();
      expect(screen.getByText('120')).toBeInTheDocument();
      expect(screen.getByText(/horas de aprendizaje/i)).toBeInTheDocument();
      expect(screen.getByText('92%')).toBeInTheDocument();
      expect(screen.getByText(/puntuación promedio/i)).toBeInTheDocument();
      expect(screen.getByText('15 días')).toBeInTheDocument();
      expect(screen.getByText(/racha actual/i)).toBeInTheDocument();
    });

    it('should display weekly progress chart', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByTestId('weekly-progress-chart')).toBeInTheDocument();
      expect(screen.getByText(/progreso semanal/i)).toBeInTheDocument();
    });

    it('should display skill radar chart', () => {
      mockStats = {
        skills: {
          'Redes': 85,
          'Criptografía': 70,
          'Web Security': 90,
          'Sistemas': 75,
          'Forensics': 60,
        }
      };

      renderWithProviders(<Dashboard />);

      expect(screen.getByTestId('skills-radar-chart')).toBeInTheDocument();
      expect(screen.getByText(/habilidades/i)).toBeInTheDocument();
    });
  });

  describe('Recent Activity Section', () => {
    it('should display recent activities', () => {
      mockRecentActivity = [
        {
          id: '1',
          type: 'lesson_completed',
          title: 'Completaste la lección: Introducción a SQL Injection',
          timestamp: new Date().toISOString(),
          courseId: '1',
        },
        {
          id: '2',
          type: 'quiz_passed',
          title: 'Aprobaste el quiz: Fundamentos de Redes',
          timestamp: new Date().toISOString(),
          courseId: '2',
          score: 95,
        },
        {
          id: '3',
          type: 'badge_earned',
          title: 'Ganaste la insignia: Novato en Ciberseguridad',
          timestamp: new Date().toISOString(),
        },
      ];

      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/introducción a sql injection/i)).toBeInTheDocument();
      expect(screen.getByText(/fundamentos de redes/i)).toBeInTheDocument();
      expect(screen.getByText(/novato en ciberseguridad/i)).toBeInTheDocument();
    });

    it('should show empty state when no recent activity', () => {
      mockRecentActivity = [];
      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/no hay actividad reciente/i)).toBeInTheDocument();
      expect(screen.getByText(/comienza un curso para ver tu progreso/i)).toBeInTheDocument();
    });

    it('should limit displayed activities to 5 most recent', () => {
      mockRecentActivity = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        type: 'lesson_completed',
        title: `Activity ${i + 1}`,
        timestamp: new Date().toISOString(),
      }));

      renderWithProviders(<Dashboard />);

      const activities = screen.getAllByTestId('activity-item');
      expect(activities).toHaveLength(5);
    });

    it('should navigate to activity detail when clicking', async () => {
      const user = userEvent.setup();
      mockRecentActivity = [
        {
          id: '1',
          type: 'lesson_completed',
          title: 'Lección completada',
          courseId: 'course-1',
          moduleId: 'module-1',
          lessonId: 'lesson-1',
        },
      ];

      renderWithProviders(<Dashboard />);

      const activityItem = screen.getByText(/lección completada/i).closest('a');
      expect(activityItem).toHaveAttribute('href', expect.stringContaining('course-1'));
    });
  });

  describe('Notifications Section', () => {
    it('should display notification badge with unread count', () => {
      mockUnreadCount = 5;
      renderWithProviders(<Dashboard />);

      const badge = screen.getByTestId('notification-badge');
      expect(badge).toHaveTextContent('5');
    });

    it('should display recent notifications', () => {
      mockNotifications = [
        {
          id: '1',
          title: 'Nuevo curso disponible',
          message: 'Se ha agregado el curso de Pentesting Avanzado',
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Fecha límite próxima',
          message: 'El proyecto final vence en 3 días',
          type: 'warning',
          read: false,
          createdAt: new Date().toISOString(),
        },
      ];

      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/nuevo curso disponible/i)).toBeInTheDocument();
      expect(screen.getByText(/fecha límite próxima/i)).toBeInTheDocument();
    });

    it('should mark notification as read when clicking', async () => {
      const user = userEvent.setup();
      const mockMarkAsRead = vi.fn();
      vi.mocked(useNotifications).mockReturnValue({
        notifications: [
          {
            id: '1',
            title: 'Test Notification',
            read: false,
          },
        ],
        unreadCount: 1,
        markAsRead: mockMarkAsRead,
      });

      renderWithProviders(<Dashboard />);

      const notification = screen.getByText('Test Notification');
      await user.click(notification);

      expect(mockMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('should navigate to notifications page when clicking view all', () => {
      mockNotifications = [{ id: '1', title: 'Test' }];
      renderWithProviders(<Dashboard />);

      const viewAllLink = screen.getByRole('link', { name: /ver todas/i });
      expect(viewAllLink).toHaveAttribute('href', '/notifications');
    });
  });

  describe('Quick Actions', () => {
    it('should display quick action buttons', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('link', { name: /explorar cursos/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /mi perfil/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /certificados/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /configuración/i })).toBeInTheDocument();
    });

    it('should navigate to correct routes', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('link', { name: /explorar cursos/i }))
        .toHaveAttribute('href', '/courses');
      expect(screen.getByRole('link', { name: /mi perfil/i }))
        .toHaveAttribute('href', '/profile');
      expect(screen.getByRole('link', { name: /certificados/i }))
        .toHaveAttribute('href', '/certificates');
      expect(screen.getByRole('link', { name: /configuración/i }))
        .toHaveAttribute('href', '/settings');
    });
  });

  describe('Responsive Design', () => {
    it('should show mobile-optimized layout on small screens', () => {
      // Mock window size
      window.innerWidth = 375;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<Dashboard />);

      // Check for mobile-specific classes
      const mainContainer = screen.getByTestId('dashboard-container');
      expect(mainContainer).toHaveClass('flex-col');
    });

    it('should show desktop layout on large screens', () => {
      // Mock window size
      window.innerWidth = 1920;
      window.dispatchEvent(new Event('resize'));

      renderWithProviders(<Dashboard />);

      // Check for desktop-specific classes
      const mainContainer = screen.getByTestId('dashboard-container');
      expect(mainContainer).toHaveClass('grid-cols-3');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<Dashboard />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toBeInTheDocument();
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA labels', () => {
      renderWithProviders(<Dashboard />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Dashboard principal');
      expect(screen.getByRole('region', { name: /mis cursos/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /progreso/i })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);

      // Tab through interactive elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('placeholder', expect.stringContaining('buscar'));

      await user.tab();
      expect(document.activeElement?.tagName).toBe('SELECT');

      // Continue tabbing through course cards and buttons
      await user.tab();
      await user.tab();
      expect(document.activeElement?.tagName).toBe('A');
    });
  });
});