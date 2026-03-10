/**
 * Users Table Component
 * Complete users management table with filters and pagination
 */

import { useState, useEffect, useMemo } from 'react';
import type { User } from '../../types';
import type { UserWithEnrollments } from '../../services/api/admin.service';
import { UserFilters } from './UserFilters';
import { UserRow } from './UserRow';
import { Loader } from '../common/Loader';

interface UsersTableProps {
  users: User[];
  usersWithEnrollments: Map<string, UserWithEnrollments>;
  expandedUserId: string | null;
  loadingEnrollments: Set<string>;
  isLoading: boolean;
  onUserExpand: (userId: string) => void;
  onAssignCourse: (userId: string, userName: string, userEmail: string) => void;
  onRemoveEnrollment: (enrollmentId: string) => void;
  onDeleteUser: (userId: string) => void;
  onChangeRole?: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  usersWithEnrollments,
  expandedUserId,
  loadingEnrollments,
  isLoading,
  onUserExpand,
  onAssignCourse,
  onRemoveEnrollment,
  onDeleteUser,
  onChangeRole,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (selectedRole && user.role !== selectedRole) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesName = user.name?.toLowerCase().includes(search);
        const matchesEmail = user.email.toLowerCase().includes(search);
        return matchesName || matchesEmail;
      }

      return true;
    });
  }, [users, searchTerm, selectedRole]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRole]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div>
      {/* Filters */}
      <UserFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        totalCount={filteredUsers.length}
      />

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} encontrado
            {filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-6">
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || selectedRole
                  ? 'No se encontraron usuarios con los filtros aplicados'
                  : 'No hay usuarios registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  enrollmentData={usersWithEnrollments.get(user.id)}
                  isExpanded={expandedUserId === user.id}
                  isLoading={loadingEnrollments.has(user.id)}
                  onExpand={() => onUserExpand(user.id)}
                  onAssignCourse={() => onAssignCourse(user.id, user.name || user.email, user.email)}
                  onRemoveEnrollment={onRemoveEnrollment}
                  onDeleteUser={() => onDeleteUser(user.id)}
                  onChangeRole={onChangeRole ? () => onChangeRole(user.id) : undefined}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600
                           bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300
                           hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
