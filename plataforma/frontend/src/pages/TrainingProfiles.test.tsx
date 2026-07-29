import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { TrainingProfiles } from './TrainingProfiles';

vi.mock('../hooks/useTrainingProfiles', () => ({
  useProfiles: () => mockUseProfiles(),
  useCreateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteProfile: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('../hooks/useCourses', () => ({
  useCourses: () => ({ data: { courses: [] } }),
}));

vi.mock('../components/admin/TrainingProfileForm', () => ({
  TrainingProfileForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="profile-form">
      <button onClick={onCancel}>Cancelar</button>
    </div>
  ),
}));

vi.mock('../components/admin/ProfileCoursesPanel', () => ({
  ProfileCoursesPanel: () => <div data-testid="courses-panel" />,
}));

const mockUseProfiles = vi.fn();

const mockProfile = {
  id: 'p1',
  name: 'Analista Cyber',
  slug: 'analista-cyber',
  description: 'Ruta de analista',
  color: '#3b82f6',
  createdAt: '2026-01-01T00:00:00Z',
  courses: [],
};

const createWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

describe('TrainingProfiles page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('muestra spinner mientras carga', () => {
    mockUseProfiles.mockReturnValue({ data: [], isLoading: true });
    render(<TrainingProfiles />, { wrapper: createWrapper() });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('muestra tarjetas de perfiles', () => {
    mockUseProfiles.mockReturnValue({ data: [mockProfile], isLoading: false });
    render(<TrainingProfiles />, { wrapper: createWrapper() });
    expect(screen.getByText('Analista Cyber')).toBeInTheDocument();
  });

  it('cada tarjeta tiene boton Gestionar cursos', () => {
    mockUseProfiles.mockReturnValue({ data: [mockProfile], isLoading: false });
    render(<TrainingProfiles />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: /Gestionar cursos/i })).toBeInTheDocument();
  });

  it('al pulsar Gestionar cursos abre el panel', () => {
    mockUseProfiles.mockReturnValue({ data: [mockProfile], isLoading: false });
    render(<TrainingProfiles />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /Gestionar cursos/i }));
    expect(screen.getByTestId('courses-panel')).toBeInTheDocument();
  });

  it('el formulario de crear NO tiene checkboxes', () => {
    mockUseProfiles.mockReturnValue({ data: [], isLoading: false });
    render(<TrainingProfiles />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole('button', { name: /Crear Perfil/i }));
    expect(screen.getByTestId('profile-form')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
