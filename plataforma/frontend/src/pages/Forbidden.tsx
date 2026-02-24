/**
 * 403 Forbidden page
 * Página de acceso denegado cuando el usuario no tiene permisos
 *
 * HU-003: Sistema de Roles (RBAC)
 * AC6: Página de error 403 (Forbidden) con mensaje claro
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ROUTES, ROLE_LABELS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';

export const Forbidden: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Obtener la ruta desde la que fue redirigido
  const from = (location.state as any)?.from?.pathname || 'esta página';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* 403 Icon */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-red-600 dark:text-red-400">
            403
          </h1>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Acceso Denegado
        </h2>

        {isAuthenticated && user ? (
          <div className="space-y-3">
            <p className="text-gray-600 dark:text-gray-400">
              Lo sentimos, no tienes permisos para acceder a {from}.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Tu rol actual: <span className="font-semibold text-gray-700 dark:text-gray-300">{ROLE_LABELS[user.role]}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Si crees que esto es un error, contacta al administrador del sistema.
            </p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Debes iniciar sesión con una cuenta que tenga los permisos necesarios.
          </p>
        )}

        {/* Illustration */}
        <div className="my-12">
          <svg
            className="w-64 h-64 mx-auto text-red-200 dark:text-red-900"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={0.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {isAuthenticated ? (
            <>
              <Button variant="primary" onClick={() => navigate(ROUTES.DASHBOARD)}>
                Ir al Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Volver Atrás
              </Button>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => navigate(ROUTES.LOGIN)}>
                Iniciar Sesión
              </Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
                Ir al Inicio
              </Button>
            </>
          )}
        </div>

        {/* Additional Help */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Si necesitas acceso a esta funcionalidad, contacta a tu instructor o administrador
            del sistema para solicitar los permisos necesarios.
          </p>
        </div>
      </div>
    </div>
  );
};
