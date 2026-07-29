import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonTimeBreakdown } from './LessonTimeBreakdown';

vi.mock('../../hooks/useAnalytics', () => ({
  useUserCourseLessonTimes: vi.fn(),
}));

vi.mock('../common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

import { useUserCourseLessonTimes } from '../../hooks/useAnalytics';

const mockLessons = [
  {
    lessonId: 'l1',
    lessonTitle: 'Introduccion a Kali Linux',
    realTimeSeconds: 900,
    estimatedTimeSeconds: 600,
    ratio: 1.5,
    classification: 'deep_read' as const,
    completedAt: '2026-07-01T10:00:00Z',
  },
  {
    lessonId: 'l2',
    lessonTitle: 'Escaneo de puertos con Nmap',
    realTimeSeconds: 300,
    estimatedTimeSeconds: 600,
    ratio: 0.5,
    classification: 'skimming' as const,
    completedAt: '2026-07-02T10:00:00Z',
  },
  {
    lessonId: 'l3',
    lessonTitle: 'Explotacion con Metasploit',
    realTimeSeconds: 600,
    estimatedTimeSeconds: 600,
    ratio: 1.0,
    classification: 'on_track' as const,
    completedAt: '2026-07-03T10:00:00Z',
  },
];

describe('LessonTimeBreakdown', () => {
  beforeEach(() => {
    vi.mocked(useUserCourseLessonTimes).mockReturnValue({
      data: mockLessons,
      isLoading: false,
    } as ReturnType<typeof useUserCourseLessonTimes>);
  });

  describe('Rendering', () => {
    it('muestra spinner cuando isLoading es true', () => {
      vi.mocked(useUserCourseLessonTimes).mockReturnValue({
        data: [],
        isLoading: true,
      } as ReturnType<typeof useUserCourseLessonTimes>);
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('muestra mensaje vacio cuando no hay lecciones', () => {
      vi.mocked(useUserCourseLessonTimes).mockReturnValue({
        data: [],
        isLoading: false,
      } as ReturnType<typeof useUserCourseLessonTimes>);
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      expect(screen.getByText(/no hay lecciones completadas/i)).toBeInTheDocument();
    });

    it('por defecto muestra el toggle colapsado (la tabla no es visible)', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      // La tabla de lecciones debe estar oculta inicialmente
      expect(screen.queryByText('Introduccion a Kali Linux')).not.toBeInTheDocument();
    });

    it('el boton de toggle muestra el conteo de lecciones', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      expect(screen.getByText(/3 lecciones/i)).toBeInTheDocument();
    });
  });

  describe('Toggle colapsable', () => {
    it('click en toggle despliega la tabla de lecciones', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      expect(screen.getByText('Introduccion a Kali Linux')).toBeInTheDocument();
      expect(screen.getByText('Escaneo de puertos con Nmap')).toBeInTheDocument();
      expect(screen.getByText('Explotacion con Metasploit')).toBeInTheDocument();
    });

    it('click en toggle de nuevo colapsa la tabla', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);
      expect(screen.getByText('Introduccion a Kali Linux')).toBeInTheDocument();
      fireEvent.click(toggleButton);
      expect(screen.queryByText('Introduccion a Kali Linux')).not.toBeInTheDocument();
    });

    it('muestra badges de clasificacion cuando la tabla esta desplegada', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Detallado')).toBeInTheDocument();
      expect(screen.getByText('Rapido')).toBeInTheDocument();
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('muestra el tiempo total en el header del toggle', () => {
      render(<LessonTimeBreakdown userId="u1" courseId="c1" />);
      // Total: 900 + 300 + 600 = 1800s = 30m 0s
      expect(screen.getByText(/30m/i)).toBeInTheDocument();
    });
  });
});
