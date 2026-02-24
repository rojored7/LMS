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
  AdminDashboard,
  Profile,
  NotFound,
  Forbidden,
} from './pages';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { ROUTES } from './utils/constants';
import { UserRole } from './types';

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
                    <Dashboard />
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
