/**
 * Header component with navigation and user menu
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useUiStore } from '../../store/uiStore';
import { Avatar } from '../common/Avatar';
import { Button } from '../common/Button';
import { NotificationBell } from '../gamification/NotificationBell';
import { cn } from '../../utils/cn';
import { ROUTES } from '../../utils/constants';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useUiStore();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Always call the hook (React rule), but pass a flag to disable polling
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications(!isAuthenticated ? false : true);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-itac-navy border-b border-white/10 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Hamburger Menu Button - Only show on mobile when authenticated */}
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-itac-text-light hover:bg-white/10 rounded-md transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Logo */}
          <Link
            to={ROUTES.HOME}
            className="flex items-center gap-2 text-xl font-bold text-itac-blue hover:text-itac-blue/80 transition-colors"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="hidden sm:inline text-itac-text-light">Plataforma Cursos</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to={ROUTES.COURSES}
              className="text-gray-300 hover:text-itac-text-light transition-colors text-sm font-medium tracking-wide"
            >
              Cursos
            </Link>
            {isAuthenticated && (
              <Link
                to={ROUTES.DASHBOARD}
                className="text-gray-300 hover:text-itac-text-light transition-colors text-sm font-medium tracking-wide"
              >
                Mi Dashboard
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user && (
              <NotificationBell
                notifications={notifications || []}
                unreadCount={unreadCount}
                onMarkAsRead={markAsRead}
                onMarkAllAsRead={markAllAsRead}
                onDismiss={deleteNotification}
              />
            )}

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="md" />
                  <span className="hidden sm:inline text-sm font-medium text-itac-text-light">
                    {user.firstName}
                  </span>
                  <svg
                    className={cn(
                      'w-4 h-4 text-white/50 transition-transform',
                      isUserMenuOpen && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-itac-navy-light rounded-xl shadow-lg py-1 z-20 border border-white/10">
                      <Link
                        to={ROUTES.PROFILE}
                        className="block px-4 py-2 text-sm text-itac-text-light hover:bg-white/10"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        to={ROUTES.DASHBOARD}
                        className="block px-4 py-2 text-sm text-itac-text-light hover:bg-white/10"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {user.role === 'ADMIN' && (
                        <Link
                          to={ROUTES.ADMIN}
                          className="block px-4 py-2 text-sm text-itac-text-light hover:bg-white/10"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Administración
                        </Link>
                      )}
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/10"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.LOGIN)} className="text-white hover:bg-white/10 hover:text-white">
                  Iniciar Sesión
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate(ROUTES.REGISTER)}>
                  Registrarse
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
