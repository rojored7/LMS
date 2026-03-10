/**
 * Express Type Extensions
 * Extiende los tipos de Express para incluir propiedades personalizadas
 */

import { UserRole } from '@prisma/client';

/**
 * Información del usuario autenticado
 * Esta interfaz representa los datos del usuario que se adjuntan al request después de la autenticación
 */
export interface AuthenticatedUser {
  id: string; // ID del usuario (alias de userId para compatibilidad)
  userId: string; // Cambiado de 'id' a 'userId' para consistencia con JWT payload
  email: string;
  name: string;
  role: UserRole;
  trainingProfileId?: string | null;
}

// Extender el namespace de Express
declare global {
  namespace Express {
    /**
     * Extiende la interfaz Request de Express
     * Agrega la propiedad 'user' que contiene información del usuario autenticado
     */
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Esto es necesario para que TypeScript trate este archivo como un módulo
export {};
