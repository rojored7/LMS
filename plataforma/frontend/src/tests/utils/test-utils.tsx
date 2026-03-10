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

// Create test user objects
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'STUDENT',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createAdminUser = () => createTestUser({
  id: 'admin-user-id',
  email: 'admin@example.com',
  role: 'ADMIN',
  firstName: 'Admin',
  lastName: 'User',
});

export const createInstructorUser = () => createTestUser({
  id: 'instructor-user-id',
  email: 'instructor@example.com',
  role: 'INSTRUCTOR',
  firstName: 'Instructor',
  lastName: 'User',
});

// Create test course objects
export const createTestCourse = (overrides = {}) => ({
  id: 'test-course-id',
  title: 'Test Course',
  slug: 'test-course',
  description: 'This is a test course',
  objectives: ['Learn testing', 'Write good tests'],
  duration: 10,
  level: 'BEGINNER',
  published: true,
  thumbnail: '/images/course-thumb.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  instructor: createInstructorUser(),
  modules: [],
  enrollmentCount: 0,
  ...overrides,
});

// Create test module objects
export const createTestModule = (overrides = {}) => ({
  id: 'test-module-id',
  title: 'Test Module',
  description: 'Module for testing',
  order: 1,
  courseId: 'test-course-id',
  lessons: [],
  quizzes: [],
  labs: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Create test quiz objects
export const createTestQuiz = (overrides = {}) => ({
  id: 'test-quiz-id',
  title: 'Test Quiz',
  description: 'Quiz for testing',
  moduleId: 'test-module-id',
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      text: 'What is React?',
      type: 'MULTIPLE_CHOICE',
      options: [
        { id: 'o1', text: 'A library', isCorrect: true },
        { id: 'o2', text: 'A framework', isCorrect: false },
        { id: 'o3', text: 'A language', isCorrect: false },
        { id: 'o4', text: 'A database', isCorrect: false },
      ],
      points: 10,
    },
  ],
  timeLimit: 30,
  attempts: 3,
  ...overrides,
});

// Create test enrollment
export const createTestEnrollment = (overrides = {}) => ({
  id: 'test-enrollment-id',
  userId: 'test-user-id',
  courseId: 'test-course-id',
  enrolledAt: new Date().toISOString(),
  completedAt: null,
  progress: 0,
  status: 'ACTIVE',
  ...overrides,
});

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