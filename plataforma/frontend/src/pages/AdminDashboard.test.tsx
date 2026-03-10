import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminDashboard } from './AdminDashboard';
import { renderWithProviders, createTestUser } from '../tests/utils/test-utils';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

vi.mock('../hooks/useAdmin', () => ({
  useAdmin: () => ({
    stats: mockStats,
    users: mockUsers,
    courses: mockCourses,
    enrollments: mockEnrollments,
    isLoading: mockIsLoading,
    error: mockError,
    fetchStats: mockFetchStats,
    fetchUsers: mockFetchUsers,
    updateUser: mockUpdateUser,
    deleteUser: mockDeleteUser,
  }),
}));

let mockUser = createTestUser({ role: 'ADMIN' });
let mockStats = null;
let mockUsers = [];
let mockCourses = [];
let mockEnrollments = [];
let mockIsLoading = false;
let mockError = null;
let mockFetchStats = vi.fn();
let mockFetchUsers = vi.fn();
let mockUpdateUser = vi.fn();
let mockDeleteUser = vi.fn();

describe('AdminDashboard Page', () => {
  beforeEach(() => {
    mockUser = createTestUser({ role: 'ADMIN', firstName: 'Admin', lastName: 'User' });
    mockStats = {
      totalUsers: 1250,
      activeUsers: 980,
      totalCourses: 45,
      publishedCourses: 38,
      totalEnrollments: 3567,
      completedCourses: 892,
      averageProgress: 67.5,
      monthlyGrowth: 12.5,
    };
    mockUsers = [];
    mockCourses = [];
    mockEnrollments = [];
    mockIsLoading = false;
    mockError = null;
    mockFetchStats = vi.fn();
    mockFetchUsers = vi.fn();
    mockUpdateUser = vi.fn();
    mockDeleteUser = vi.fn();
  });

  describe('Rendering', () => {
    it('should render admin dashboard with all sections', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByRole('heading', { name: /panel de administración/i })).toBeInTheDocument();
      expect(screen.getByText(/estadísticas generales/i)).toBeInTheDocument();
      expect(screen.getByText(/gestión de usuarios/i)).toBeInTheDocument();
      expect(screen.getByText(/cursos y contenido/i)).toBeInTheDocument();
      expect(screen.getByText(/reportes/i)).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockIsLoading = true;
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText(/cargando panel/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockError = 'Error al cargar datos del panel';
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/error al cargar datos/i)).toBeInTheDocument();
    });

    it('should restrict access for non-admin users', () => {
      mockUser = createTestUser({ role: 'STUDENT' });
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText(/no tienes permisos/i)).toBeInTheDocument();
      expect(screen.queryByText(/panel de administración/i)).not.toBeInTheDocument();
    });
  });

  describe('Statistics Section', () => {
    it('should display all statistics cards', () => {
      renderWithProviders(<AdminDashboard />);

      // Users stats
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText(/usuarios totales/i)).toBeInTheDocument();
      expect(screen.getByText('980')).toBeInTheDocument();
      expect(screen.getByText(/usuarios activos/i)).toBeInTheDocument();

      // Course stats
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText(/cursos totales/i)).toBeInTheDocument();
      expect(screen.getByText('38')).toBeInTheDocument();
      expect(screen.getByText(/cursos publicados/i)).toBeInTheDocument();

      // Enrollment stats
      expect(screen.getByText('3,567')).toBeInTheDocument();
      expect(screen.getByText(/inscripciones/i)).toBeInTheDocument();
      expect(screen.getByText('892')).toBeInTheDocument();
      expect(screen.getByText(/completados/i)).toBeInTheDocument();

      // Progress stats
      expect(screen.getByText('67.5%')).toBeInTheDocument();
      expect(screen.getByText(/progreso promedio/i)).toBeInTheDocument();
      expect(screen.getByText('+12.5%')).toBeInTheDocument();
      expect(screen.getByText(/crecimiento mensual/i)).toBeInTheDocument();
    });

    it('should refresh statistics when clicking refresh button', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const refreshButton = screen.getByRole('button', { name: /actualizar estadísticas/i });
      await user.click(refreshButton);

      expect(mockFetchStats).toHaveBeenCalled();
    });

    it('should display charts for visual statistics', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByTestId('user-growth-chart')).toBeInTheDocument();
      expect(screen.getByTestId('enrollment-chart')).toBeInTheDocument();
      expect(screen.getByTestId('course-completion-chart')).toBeInTheDocument();
    });

    it('should allow exporting statistics', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const exportButton = screen.getByRole('button', { name: /exportar estadísticas/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/seleccionar formato/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /csv/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /pdf/i })).toBeInTheDocument();
      });
    });
  });

  describe('User Management Section', () => {
    beforeEach(() => {
      mockUsers = [
        createTestUser({
          id: '1',
          email: 'student1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'STUDENT',
          isActive: true,
          createdAt: '2024-01-15',
        }),
        createTestUser({
          id: '2',
          email: 'instructor@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'INSTRUCTOR',
          isActive: true,
          createdAt: '2024-01-10',
        }),
        createTestUser({
          id: '3',
          email: 'admin@example.com',
          firstName: 'Bob',
          lastName: 'Admin',
          role: 'ADMIN',
          isActive: false,
          createdAt: '2024-01-05',
        }),
      ];
    });

    it('should display users table with all users', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('student1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('instructor@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    it('should filter users by role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const roleFilter = screen.getByRole('combobox', { name: /filtrar por rol/i });
      await user.selectOptions(roleFilter, 'STUDENT');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Admin')).not.toBeInTheDocument();
    });

    it('should filter users by status', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const statusFilter = screen.getByRole('combobox', { name: /filtrar por estado/i });
      await user.selectOptions(statusFilter, 'inactive');

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      expect(screen.getByText('Bob Admin')).toBeInTheDocument();
    });

    it('should search users by name or email', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const searchInput = screen.getByPlaceholderText(/buscar usuarios/i);
      await user.type(searchInput, 'Jane');

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Bob Admin')).not.toBeInTheDocument();
    });

    it('should open user details modal when clicking on user', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const userRow = screen.getByText('John Doe').closest('tr');
      const detailsButton = within(userRow!).getByRole('button', { name: /ver detalles/i });
      await user.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/detalles del usuario/i)).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('student1@example.com')).toBeInTheDocument();
      });
    });

    it('should allow editing user role', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const userRow = screen.getByText('John Doe').closest('tr');
      const editButton = within(userRow!).getByRole('button', { name: /editar/i });
      await user.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const roleSelect = screen.getByRole('combobox', { name: /rol/i });
      await user.selectOptions(roleSelect, 'INSTRUCTOR');

      const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
      await user.click(saveButton);

      expect(mockUpdateUser).toHaveBeenCalledWith('1', { role: 'INSTRUCTOR' });
    });

    it('should allow activating/deactivating users', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const userRow = screen.getByText('John Doe').closest('tr');
      const toggleButton = within(userRow!).getByRole('switch', { name: /activar\/desactivar/i });
      await user.click(toggleButton);

      expect(mockUpdateUser).toHaveBeenCalledWith('1', { isActive: false });
    });

    it('should confirm before deleting user', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const userRow = screen.getByText('John Doe').closest('tr');
      const deleteButton = within(userRow!).getByRole('button', { name: /eliminar/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/¿confirmar eliminación?/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      expect(mockDeleteUser).toHaveBeenCalledWith('1');
    });

    it('should allow bulk actions on multiple users', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      // Select multiple users
      const checkboxes = screen.getAllByRole('checkbox', { name: /seleccionar usuario/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      // Bulk action button should appear
      expect(screen.getByRole('button', { name: /acciones masivas/i })).toBeInTheDocument();

      const bulkButton = screen.getByRole('button', { name: /acciones masivas/i });
      await user.click(bulkButton);

      await waitFor(() => {
        expect(screen.getByRole('menu')).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /activar seleccionados/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /desactivar seleccionados/i })).toBeInTheDocument();
        expect(screen.getByRole('menuitem', { name: /eliminar seleccionados/i })).toBeInTheDocument();
      });
    });

    it('should paginate users list', async () => {
      const user = userEvent.setup();

      // Mock more users for pagination
      mockUsers = Array.from({ length: 25 }, (_, i) =>
        createTestUser({ id: String(i), email: `user${i}@example.com` })
      );

      renderWithProviders(<AdminDashboard />);

      // Should show pagination controls
      expect(screen.getByRole('navigation', { name: /paginación/i })).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();

      // Click next page
      const nextButton = screen.getByRole('button', { name: /siguiente/i });
      await user.click(nextButton);

      expect(mockFetchUsers).toHaveBeenCalledWith({ page: 2 });
    });
  });

  describe('Course Management Section', () => {
    beforeEach(() => {
      mockCourses = [
        {
          id: '1',
          title: 'Fundamentos de Ciberseguridad',
          instructor: 'Jane Smith',
          published: true,
          enrollmentCount: 250,
          completionRate: 75,
        },
        {
          id: '2',
          title: 'Ethical Hacking',
          instructor: 'Bob Johnson',
          published: false,
          enrollmentCount: 0,
          completionRate: 0,
        },
      ];
    });

    it('should display courses overview', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText('Fundamentos de Ciberseguridad')).toBeInTheDocument();
      expect(screen.getByText('Ethical Hacking')).toBeInTheDocument();
      expect(screen.getByText('250 estudiantes')).toBeInTheDocument();
      expect(screen.getByText('75% completado')).toBeInTheDocument();
    });

    it('should allow publishing/unpublishing courses', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const courseRow = screen.getByText('Ethical Hacking').closest('tr');
      const publishButton = within(courseRow!).getByRole('button', { name: /publicar/i });
      await user.click(publishButton);

      expect(mockUpdateCourse).toHaveBeenCalledWith('2', { published: true });
    });

    it('should navigate to course editor', async () => {
      const user = userEvent.setup();
      const mockNavigate = vi.fn();
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      renderWithProviders(<AdminDashboard />);

      const editButton = screen.getByRole('button', { name: /editar curso/i });
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/courses/1/edit');
    });

    it('should create new course', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const createButton = screen.getByRole('button', { name: /crear nuevo curso/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/crear curso/i)).toBeInTheDocument();
      });

      // Fill form
      await user.type(screen.getByLabelText(/título/i), 'Nuevo Curso');
      await user.type(screen.getByLabelText(/descripción/i), 'Descripción del curso');
      await user.selectOptions(screen.getByLabelText(/instructor/i), 'instructor-id');

      const submitButton = screen.getByRole('button', { name: /crear/i });
      await user.click(submitButton);

      expect(mockCreateCourse).toHaveBeenCalledWith({
        title: 'Nuevo Curso',
        description: 'Descripción del curso',
        instructorId: 'instructor-id',
      });
    });
  });

  describe('Reports Section', () => {
    it('should display available reports', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByText(/reporte de usuarios/i)).toBeInTheDocument();
      expect(screen.getByText(/reporte de cursos/i)).toBeInTheDocument();
      expect(screen.getByText(/reporte de progreso/i)).toBeInTheDocument();
      expect(screen.getByText(/reporte financiero/i)).toBeInTheDocument();
    });

    it('should generate user report', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const generateButton = screen.getByRole('button', { name: /generar reporte de usuarios/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/configurar reporte/i)).toBeInTheDocument();
      });

      // Configure report
      await user.selectOptions(screen.getByLabelText(/período/i), 'last-month');
      await user.click(screen.getByRole('checkbox', { name: /incluir inactivos/i }));

      const downloadButton = screen.getByRole('button', { name: /descargar/i });
      await user.click(downloadButton);

      // Should trigger download
      expect(mockGenerateReport).toHaveBeenCalledWith({
        type: 'users',
        period: 'last-month',
        includeInactive: true,
      });
    });

    it('should schedule automatic reports', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const scheduleButton = screen.getByRole('button', { name: /programar reporte/i });
      await user.click(scheduleButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Configure schedule
      await user.selectOptions(screen.getByLabelText(/frecuencia/i), 'weekly');
      await user.selectOptions(screen.getByLabelText(/día/i), 'monday');
      await user.type(screen.getByLabelText(/email/i), 'admin@example.com');

      const saveButton = screen.getByRole('button', { name: /programar/i });
      await user.click(saveButton);

      expect(mockScheduleReport).toHaveBeenCalledWith({
        frequency: 'weekly',
        day: 'monday',
        email: 'admin@example.com',
      });
    });
  });

  describe('System Settings', () => {
    it('should display system configuration options', () => {
      renderWithProviders(<AdminDashboard />);

      const settingsTab = screen.getByRole('tab', { name: /configuración/i });
      userEvent.click(settingsTab);

      expect(screen.getByText(/configuración del sistema/i)).toBeInTheDocument();
      expect(screen.getByText(/mantenimiento/i)).toBeInTheDocument();
      expect(screen.getByText(/seguridad/i)).toBeInTheDocument();
      expect(screen.getByText(/integraciones/i)).toBeInTheDocument();
    });

    it('should toggle maintenance mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      const maintenanceToggle = screen.getByRole('switch', { name: /modo mantenimiento/i });
      await user.click(maintenanceToggle);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/¿activar modo mantenimiento?/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);

      expect(mockUpdateSystemSettings).toHaveBeenCalledWith({ maintenanceMode: true });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderWithProviders(<AdminDashboard />);

      const h1 = screen.getByRole('heading', { level: 1 });
      const h2Elements = screen.getAllByRole('heading', { level: 2 });

      expect(h1).toHaveTextContent(/panel de administración/i);
      expect(h2Elements.length).toBeGreaterThan(3);
    });

    it('should have proper ARIA labels for interactive elements', () => {
      renderWithProviders(<AdminDashboard />);

      expect(screen.getByRole('main')).toHaveAttribute('aria-label', 'Panel de administración');
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getAllByRole('tab').length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithProviders(<AdminDashboard />);

      // Tab through tabs
      await user.tab();
      expect(screen.getByRole('tab', { name: /estadísticas/i })).toHaveFocus();

      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /usuarios/i })).toHaveFocus();

      await user.keyboard('{Enter}');
      // Should switch to users tab
    });
  });
});