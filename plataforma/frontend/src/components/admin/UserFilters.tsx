/**
 * User Filters Component
 * Filters for user list (role, search)
 */

import { Search, Filter } from 'lucide-react';
import { UserRole } from '../../types';

interface UserFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedRole: string;
  onRoleChange: (role: string) => void;
  totalCount: number;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedRole,
  onRoleChange,
  totalCount,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Role Filter */}
        <div className="sm:w-48">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <select
              value={selectedRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       appearance-none cursor-pointer"
            >
              <option value="">Todos los roles</option>
              <option value={UserRole.STUDENT}>Estudiantes</option>
              <option value={UserRole.INSTRUCTOR}>Instructores</option>
              <option value={UserRole.ADMIN}>Administradores</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        {totalCount === 0 ? (
          'No se encontraron usuarios'
        ) : (
          <>
            Mostrando <span className="font-semibold text-gray-900 dark:text-white">{totalCount}</span> usuario{totalCount !== 1 ? 's' : ''}
          </>
        )}
      </div>
    </div>
  );
};
