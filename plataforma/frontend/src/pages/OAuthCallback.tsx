import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { ROUTES } from '../utils/constants';

const ERROR_MESSAGES: Record<string, string> = {
  oauth_denied: 'Autorizacion cancelada por el usuario.',
  oauth_invalid: 'Respuesta de autorizacion invalida.',
  oauth_state_invalid: 'Sesion de autorizacion expirada. Intente nuevamente.',
  oauth_state_mismatch: 'Error de seguridad en la autorizacion.',
  oauth_provider_unsupported: 'Proveedor de autenticacion no soportado.',
  oauth_failed: 'Error al autenticar con el proveedor externo.',
};

export const OAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { hydrateUser } = useAuth();
  const toast = useToast();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      hydrateUser()
        .then(() => {
          toast.success('Sesion iniciada correctamente');
          navigate(ROUTES.DASHBOARD, { replace: true });
        })
        .catch(() => {
          toast.error('Error al cargar el perfil de usuario.');
          navigate(ROUTES.LOGIN, { replace: true });
        })
        .finally(() => setProcessing(false));
    } else {
      const errorKey = error || 'oauth_failed';
      const message = ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.oauth_failed;
      toast.error(message);
      setProcessing(false);
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!processing) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Procesando autenticacion...</p>
      </div>
    </div>
  );
};
