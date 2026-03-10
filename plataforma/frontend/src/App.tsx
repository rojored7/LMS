/**
 * Main App component with routing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Sidebar } from './components/layout/Sidebar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ToastContainer } from './components/common/Toast';
import {
  Home,
  Login,
  Register,
  Dashboard,
  CourseCatalog,
  CourseDetail,
  CourseLearning,
  AdminDashboard,
  Profile,
  NotFound,
  Forbidden,
  UsersList,
  UserProgressDetail,
  TrainingProfiles,
  ProjectSubmission,
  SubmissionsReview,
  PublicProfile,
  NotificationsPage,
} from './pages';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import QuizBuilder from './pages/QuizBuilder';
import CourseImportPage from './pages/CourseImportPage';
import CourseListPage from './pages/CourseListPage';
import CourseEditorPage from './pages/CourseEditorPage';
import CourseWizardPage from './pages/CourseWizardPage';
import { ROUTES } from './utils/constants';
import { UserRole } from './types';
import { useAuth } from './hooks/useAuth';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

/**
 * Layout wrapper for authenticated pages with sidebar
 */
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
};

/**
 * Layout wrapper for public pages
 */
const PublicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

/**
 * Dashboard wrapper that redirects ADMIN users to /admin
 */
const DashboardRedirect: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === UserRole.ADMIN) {
    return <Navigate to={ROUTES.ADMIN} replace />;
  }

  return <Dashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Header />

          <Routes>
            {/* Public Routes */}
            <Route
              path={ROUTES.HOME}
              element={
                <PublicLayout>
                  <Home />
                </PublicLayout>
              }
            />

            <Route path={ROUTES.LOGIN} element={<Login />} />

            <Route path={ROUTES.REGISTER} element={<Register />} />

            {/* HU-005: Password Reset Routes */}
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
            <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />

            <Route
              path={ROUTES.COURSES}
              element={
                <PublicLayout>
                  <CourseCatalog />
                </PublicLayout>
              }
            />

            <Route
              path="/courses/:id"
              element={
                <PublicLayout>
                  <CourseDetail />
                </PublicLayout>
              }
            />

            {/* Protected Routes - Require Authentication */}
            <Route
              path={ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <DashboardRedirect />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.PROFILE}
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Profile />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Course Learning Interface - Full screen layout */}
            <Route
              path="/courses/:courseId/learn"
              element={
                <ProtectedRoute>
                  <CourseLearning />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes - Require Admin Role */}
            <Route
              path={ROUTES.ADMIN}
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <DashboardLayout>
                    <UsersList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/users/:userId/progress"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <DashboardLayout>
                    <UserProgressDetail />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/training-profiles"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                  <DashboardLayout>
                    <TrainingProfiles />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Course Management Routes */}
            <Route
              path="/admin/courses"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
                  <DashboardLayout>
                    <CourseListPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/courses/import"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
                  <DashboardLayout>
                    <CourseImportPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/courses/create"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
                  <DashboardLayout>
                    <CourseWizardPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/courses/:id/edit"
              element={
                <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.INSTRUCTOR]}>
                  <DashboardLayout>
                    <CourseEditorPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Quiz Routes */}
            <Route
              path="/courses/:courseId/quizzes/create"
              element={
                <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
                  <DashboardLayout>
                    <QuizBuilder />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses/:courseId/quizzes/:quizId/edit"
              element={
                <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
                  <DashboardLayout>
                    <QuizBuilder />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Project Routes */}
            <Route
              path="/courses/:courseId/projects/:projectId/submit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ProjectSubmission />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/courses/:courseId/projects/:projectId/submissions"
              element={
                <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
                  <DashboardLayout>
                    <SubmissionsReview />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Public Profile */}
            <Route
              path="/profile/:userId"
              element={
                <PublicLayout>
                  <PublicProfile />
                </PublicLayout>
              }
            />

            {/* Notifications */}
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <NotificationsPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 403 Forbidden - HU-003: Sistema de Roles (RBAC) */}
            <Route path={ROUTES.FORBIDDEN} element={<Forbidden />} />

            {/* 404 Not Found */}
            <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
            <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
          </Routes>

          {/* Toast Notifications */}
          <ToastContainer />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
