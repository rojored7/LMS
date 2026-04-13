import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Mock auth store
export const mockAuthStore = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  setUser: vi.fn(),
  setTokens: vi.fn(),
  clearAuth: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

// Mock course store
export const mockCourseStore = {
  courses: [],
  selectedCourse: null,
  enrolledCourses: [],
  isLoading: false,
  error: null,
  fetchCourses: vi.fn(),
  fetchCourseById: vi.fn(),
  fetchEnrolledCourses: vi.fn(),
  enrollInCourse: vi.fn(),
  setSelectedCourse: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
};

// Mock UI store
export const mockUiStore = {
  theme: 'light',
  sidebarOpen: false,
  toasts: [],
  toastCounter: 0,
  toggleTheme: vi.fn(),
  toggleSidebar: vi.fn(),
  setSidebarOpen: vi.fn(),
  addToast: vi.fn(),
  removeToast: vi.fn(),
};

// Re-export from mock-data for backward compatibility
export {
  createMockUser as createTestUser,
  createMockAdmin as createAdminUser,
  createMockInstructor as createInstructorUser,
  createMockCourse as createTestCourse,
  createMockModule as createTestModule,
  createMockLesson as createTestLesson,
  createMockQuiz as createTestQuiz,
  createMockQuestion as createTestQuestion,
  createMockEnrollment as createTestEnrollment,
  createMockProgress as createTestProgress,
  createMockCertificate as createTestCertificate,
  createMockBadge as createTestBadge,
  createMockNotification as createTestNotification,
  createMockTrainingProfile as createTestTrainingProfile,
} from './mock-data';

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
});

// Mock API error
export const mockApiError = (message = 'API Error', status = 400) => ({
  response: {
    data: { message },
    status,
    statusText: 'Bad Request',
  },
  message,
});

// Wrapper providers
interface WrapperOptions {
  initialEntries?: string[];
  authState?: any;
  queryClient?: QueryClient;
}

export function createWrapper(options: WrapperOptions = {}) {
  const {
    initialEntries = ['/'],
    authState = mockAuthStore,
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
  } = options;

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {children}
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authState?: any;
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const {
    initialEntries,
    authState,
    queryClient,
    ...renderOptions
  } = options;

  const Wrapper = createWrapper({ initialEntries, authState, queryClient });

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

// Wait for async operations
export const waitForLoadingToFinish = () =>
  new Promise((resolve) => setTimeout(resolve, 0));

// Mock localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
  };
};

// Mock window methods
export const mockWindow = () => {
  const originalLocation = window.location;
  const originalAlert = window.alert;
  const originalConfirm = window.confirm;

  beforeAll(() => {
    delete (window as any).location;
    window.location = { ...originalLocation, href: '', reload: vi.fn() };
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  afterAll(() => {
    window.location = originalLocation;
    window.alert = originalAlert;
    window.confirm = originalConfirm;
  });
};

// Mock fetch
export const mockFetch = (response: any) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      headers: new Headers(),
      status: 200,
      statusText: 'OK',
    } as Response)
  );
};

// Assert functions
export const expectToBeCalledWithAuth = (fn: any, token: string) => {
  expect(fn).toHaveBeenCalledWith(
    expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: `Bearer ${token}`,
      }),
    })
  );
};

// Mock timers helpers
export const useFakeTimers = () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  return {
    advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms),
    runAllTimers: () => vi.runAllTimers(),
    runOnlyPendingTimers: () => vi.runOnlyPendingTimers(),
  };
};

// Re-export testing library utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';