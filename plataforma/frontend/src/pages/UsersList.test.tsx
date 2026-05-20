/**
 * UsersList Page Tests
 * Tests for the admin user management page with course assignment functionality
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { UsersList } from './UsersList';
import { renderWithProviders } from '../tests/utils/test-utils';
import { server } from '../tests/mocks/server';

const API_URL = 'http://localhost:4000/api';

const mockStudentUser = {
  id: 'student-1',
  name: 'Estudiante Test',
  email: 'student@test.com',
  role: 'STUDENT',
  avatar: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const mockAdminUser = {
  id: 'admin-1',
  name: 'Admin Test',
  email: 'admin@test.com',
  role: 'ADMIN',
  avatar: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const mockInstructorUser = {
  id: 'instructor-1',
  name: 'Instructor Test',
  email: 'instructor@test.com',
  role: 'INSTRUCTOR',
  avatar: null,
  createdAt: '2026-01-01T00:00:00Z',
};

const allMockUsers = [mockStudentUser, mockAdminUser, mockInstructorUser];

const mockCoursesResponse = {
  success: true,
  data: [
    {
      id: 'course-1',
      title: 'Ciberseguridad Basica',
      slug: 'ciber-basica',
      description: 'Curso de ciberseguridad basica',
      level: 'BEGINNER',
      duration: 10,
      thumbnail: null,
      isPublished: true,
      author: 'Test Author',
      price: 0,
      score: 1,
    },
  ],
  meta: { total: 1, page: 1, limit: 10 },
};

function setupUsersHandler(users = allMockUsers) {
  server.use(
    http.get(`${API_URL}/users`, () =>
      HttpResponse.json({
        success: true,
        data: users,
      })
    )
  );
}

describe('UsersList Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the page with data-testid', () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);
      expect(screen.getByTestId('userslist')).toBeInTheDocument();
    });

    it('should display users after loading', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
        expect(screen.getByText('Admin Test')).toBeInTheDocument();
        expect(screen.getByText('Instructor Test')).toBeInTheDocument();
      });
    });

    it('should show stats section', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Total Usuarios')).toBeInTheDocument();
      });
    });
  });

  describe('Course Assignment', () => {
    it('should render assign button only for student users', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
      });

      const assignButtons = screen.getAllByTitle('Asignar curso');
      expect(assignButtons).toHaveLength(1);
    });

    it('should not render assign button for admin users', async () => {
      setupUsersHandler([mockAdminUser]);
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Admin Test')).toBeInTheDocument();
      });

      expect(screen.queryByTitle('Asignar curso')).not.toBeInTheDocument();
    });

    it('should set selectedUser state when assign button is clicked', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
      });

      const assignButton = screen.getByTitle('Asignar curso');
      fireEvent.click(assignButton);

      // Modal renders (even if courses are loading)
      await waitFor(() => {
        expect(screen.getByText('Asignar Curso')).toBeInTheDocument();
      });
    });
  });

  describe('Search and Filter', () => {
    it('should filter users by search term', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/buscar por nombre o email/i);
      fireEvent.change(searchInput, { target: { value: 'admin' } });

      await waitFor(() => {
        expect(screen.getByText('Admin Test')).toBeInTheDocument();
        expect(screen.queryByText('Estudiante Test')).not.toBeInTheDocument();
      });
    });

    it('should filter users by role', async () => {
      setupUsersHandler();
      renderWithProviders(<UsersList />);

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Todos los roles');
      fireEvent.change(roleSelect, { target: { value: 'STUDENT' } });

      await waitFor(() => {
        expect(screen.getByText('Estudiante Test')).toBeInTheDocument();
        expect(screen.queryByText('Admin Test')).not.toBeInTheDocument();
      });
    });
  });
});
