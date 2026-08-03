import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { ProfileCoursesPanel } from './ProfileCoursesPanel';

vi.mock('../../hooks/useTrainingProfiles', () => ({
  useAddCourseToProfile: () => ({ mutate: mockAddCourse }),
  useRemoveCourseFromProfile: () => ({ mutate: mockRemoveCourse }),
  useUpdateCourseInProfile: () => ({ mutate: mockUpdateCourse }),
  useReorderCourses: () => ({ mutate: mockReorder }),
}));

const mockAddCourse = vi.fn();
const mockRemoveCourse = vi.fn();
const mockUpdateCourse = vi.fn();
const mockReorder = vi.fn();

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

const mockProfile = {
  id: 'p1',
  name: 'Test Profile',
  slug: 'test-profile',
  description: 'Desc',
  createdAt: '2026-01-01T00:00:00Z',
  courses: [
    {
      id: 'c1',
      title: 'Intro Hacking',
      slug: 'intro-hacking',
      level: 'beginner',
      order: 0,
      required: false,
    },
    {
      id: 'c2',
      title: 'Pentesting Avanzado',
      slug: 'pentesting',
      level: 'advanced',
      order: 1,
      required: true,
    },
  ],
};

const availableCourses = [
  { id: 'c1', title: 'Intro Hacking', slug: 'intro-hacking' },
  { id: 'c2', title: 'Pentesting Avanzado', slug: 'pentesting' },
  { id: 'c3', title: 'Forense Digital', slug: 'forense', level: 'intermediate' },
];

describe('ProfileCoursesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra cursos asignados con su orden', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText('Intro Hacking')).toBeInTheDocument();
    expect(screen.getByText('Pentesting Avanzado')).toBeInTheDocument();
  });

  it('muestra badge Obligatorio para cursos con required=true', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getAllByTestId('badge-obligatorio')).toHaveLength(1);
  });

  it('muestra cursos disponibles que no estan asignados', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    expect(screen.getByText('Forense Digital')).toBeInTheDocument();
    // c1 y c2 ya estan asignados, no deben aparecer en la lista de disponibles
    const agregar = screen.getAllByRole('button', { name: /Agregar/i });
    expect(agregar).toHaveLength(1);
  });

  it('filtra cursos disponibles por busqueda', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    fireEvent.change(screen.getByLabelText(/Buscar cursos disponibles/), {
      target: { value: 'forense' },
    });
    expect(screen.getByText('Forense Digital')).toBeInTheDocument();
  });

  it('click Agregar llama la mutacion de agregar', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    fireEvent.click(screen.getByRole('button', { name: /Agregar Forense Digital/i }));
    expect(mockAddCourse).toHaveBeenCalledWith({
      profileId: 'p1',
      courseId: 'c3',
      order: 2,
    });
  });

  it('click eliminar llama la mutacion de eliminar', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar curso del perfil/i });
    fireEvent.click(deleteButtons[0]);
    expect(mockRemoveCourse).toHaveBeenCalledWith({ profileId: 'p1', courseId: 'c1' });
  });

  it('toggle required llama la mutacion de actualizacion', () => {
    render(<ProfileCoursesPanel profile={mockProfile} availableCourses={availableCourses} />, {
      wrapper: createWrapper(),
    });
    const toggles = screen.getAllByRole('button', { name: /Marcar como/ });
    fireEvent.click(toggles[0]);
    expect(mockUpdateCourse).toHaveBeenCalledWith({
      profileId: 'p1',
      courseId: 'c1',
      data: { required: true },
    });
  });
});
