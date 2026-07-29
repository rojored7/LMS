import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrainingProfileForm } from './TrainingProfileForm';

const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
const mockOnCancel = vi.fn();

const defaultProps = {
  onSubmit: mockOnSubmit,
  onCancel: mockOnCancel,
};

describe('TrainingProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  it('renderiza campos nombre, slug, descripcion, icono y color', () => {
    render(<TrainingProfileForm {...defaultProps} />);
    expect(screen.getByLabelText(/Nombre del Perfil/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Slug/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripcion/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Icono/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Color del Perfil/)).toBeInTheDocument();
  });

  it('NO renderiza checkboxes de cursos', () => {
    render(<TrainingProfileForm {...defaultProps} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('precarga nombre, slug, descripcion, icon y color al editar perfil existente', () => {
    const profile = {
      id: 'p1',
      name: 'Seguridad',
      slug: 'seguridad',
      description: 'Desc',
      icon: 'shield',
      color: '#ff0000',
      createdAt: '2026-01-01T00:00:00Z',
    };
    render(<TrainingProfileForm {...defaultProps} profile={profile} />);
    expect(screen.getByDisplayValue('Seguridad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('seguridad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Desc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('shield')).toBeInTheDocument();
  });

  it('llama onSubmit con icon y color', async () => {
    render(<TrainingProfileForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Nombre del Perfil/), { target: { value: 'Mi Perfil', name: 'name' } });
    fireEvent.change(screen.getByLabelText(/Descripcion/), { target: { value: 'Una descripcion', name: 'description' } });
    fireEvent.change(screen.getByLabelText(/Icono/), { target: { value: 'lock', name: 'icon' } });

    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Mi Perfil',
          description: 'Una descripcion',
          icon: 'lock',
        })
      );
    });
  });

  it('muestra errores de validacion si los campos requeridos estan vacios', async () => {
    render(<TrainingProfileForm {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));
    expect(await screen.findByText(/nombre es requerido/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('llama onCancel al pulsar Cancelar', () => {
    render(<TrainingProfileForm {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
