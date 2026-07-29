import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimeTrackingTable } from './TimeTrackingTable';

// Mock hooks
vi.mock('../../hooks/useAnalytics', () => ({
  useTimeTracking: vi.fn(),
  useLessonTimeStats: vi.fn(),
}));

// Mock child components
vi.mock('./LessonTimeBreakdown', () => ({
  LessonTimeBreakdown: () => <div data-testid="lesson-breakdown" />,
}));

vi.mock('../common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

// Capture ResponsiveContainer height prop
let capturedChartHeight: number | undefined;
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ height, children }: { height?: number; children: React.ReactNode }) => {
      capturedChartHeight = height;
      return <div data-testid="responsive-container">{children}</div>;
    },
  };
});

import { useTimeTracking, useLessonTimeStats } from '../../hooks/useAnalytics';

const mockUsersTime = [
  {
    userId: 'u1',
    userName: 'Ana Lopez',
    userEmail: 'ana@test.com',
    totalTimeSeconds: 3600,
    courseBreakdown: [
      {
        courseId: 'c1',
        courseTitle: 'Hacking Etico',
        timeSeconds: 3600,
        lessonsCompleted: 5,
        avgTimePerLessonSeconds: 720,
      },
    ],
  },
  {
    userId: 'u2',
    userName: 'Carlos Ruiz',
    userEmail: 'carlos@test.com',
    totalTimeSeconds: 1800,
    courseBreakdown: [
      {
        courseId: 'c2',
        courseTitle: 'Pentesting',
        timeSeconds: 1800,
        lessonsCompleted: 3,
        avgTimePerLessonSeconds: 600,
      },
    ],
  },
];

describe('TimeTrackingTable', () => {
  beforeEach(() => {
    capturedChartHeight = undefined;
    vi.mocked(useTimeTracking).mockReturnValue({
      usersTime: mockUsersTime,
      isLoading: false,
    } as ReturnType<typeof useTimeTracking>);
    vi.mocked(useLessonTimeStats).mockReturnValue({
      data: [],
      isLoading: false,
    } as ReturnType<typeof useLessonTimeStats>);
  });

  describe('Rendering', () => {
    it('muestra spinner cuando isLoading es true', () => {
      vi.mocked(useTimeTracking).mockReturnValue({
        usersTime: [],
        isLoading: true,
      } as ReturnType<typeof useTimeTracking>);
      render(<TimeTrackingTable />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('muestra mensaje vacio cuando no hay datos', () => {
      vi.mocked(useTimeTracking).mockReturnValue({
        usersTime: [],
        isLoading: false,
      } as ReturnType<typeof useTimeTracking>);
      render(<TimeTrackingTable />);
      expect(screen.getByText(/sin datos de tiempo/i)).toBeInTheDocument();
    });

    it('renderiza una fila por usuario', () => {
      render(<TimeTrackingTable />);
      expect(screen.getByText('Ana Lopez')).toBeInTheDocument();
      expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    });

    it('muestra el email del usuario', () => {
      render(<TimeTrackingTable />);
      expect(screen.getByText('ana@test.com')).toBeInTheDocument();
    });
  });

  describe('Compactacion', () => {
    it('el chart tiene height 160 (compacto)', () => {
      vi.mocked(useLessonTimeStats).mockReturnValue({
        data: [
          {
            lessonId: 'l1',
            lessonTitle: 'Intro',
            avgRealTimeSeconds: 300,
            estimatedTimeSeconds: 600,
          },
        ],
        isLoading: false,
      } as ReturnType<typeof useLessonTimeStats>);
      render(<TimeTrackingTable />);
      // Expandir el primer usuario para activar el chart
      fireEvent.click(screen.getByText('Ana Lopez'));
      expect(capturedChartHeight).toBe(160);
    });
  });

  describe('Interaccion', () => {
    it('expande el panel de lecciones al hacer click en un usuario', () => {
      render(<TimeTrackingTable />);
      expect(screen.queryByTestId('lesson-breakdown')).not.toBeInTheDocument();
      fireEvent.click(screen.getByText('Ana Lopez'));
      expect(screen.getByTestId('lesson-breakdown')).toBeInTheDocument();
    });

    it('colapsa el panel al hacer doble click en el mismo usuario', () => {
      render(<TimeTrackingTable />);
      fireEvent.click(screen.getByText('Ana Lopez'));
      expect(screen.getByTestId('lesson-breakdown')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Ana Lopez'));
      expect(screen.queryByTestId('lesson-breakdown')).not.toBeInTheDocument();
    });

    it('muestra los headers de ordenacion', () => {
      render(<TimeTrackingTable />);
      expect(screen.getByText(/usuario/i)).toBeInTheDocument();
      expect(screen.getByText(/tiempo total/i)).toBeInTheDocument();
    });
  });
});
