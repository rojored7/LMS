/**
 * User Row Component
 * Individual row in users table with actions
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Shield } from 'lucide-react';
import type { User } from '../../types';
import type { UserWithEnrollments } from '../../services/api/admin.service';
import { UserProgressCard } from './UserProgressCard';

interface UserRowProps {
  user: User;
  enrollmentData?: UserWithEnrollments;
  isExpanded: boolean;
  isLoading: boolean;
  onExpand: () => void;
  onAssignCourse: () => void;
  onRemoveEnrollment: (enrollmentId: string) => void;
  onDeleteUser: () => void;
  onChangeRole?: () => void;
}

export const UserRow: React.FC<UserRowProps> = ({
  user,
  enrollmentData,
  isExpanded,
  isLoading,
  onExpand,
  onAssignCourse,
  onRemoveEnrollment,
  onDeleteUser,
  onChangeRole,
}) => {
  const getInitials = (name: string, email: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'INSTRUCTOR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'STUDENT':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      INSTRUCTOR: 'Instructor',
      STUDENT: 'Estudiante',
    };
    return roles[role] || role;
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* User Info Row */}
      <div className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
        <button
          onClick={onExpand}
          className="flex items-center gap-4 flex-1 text-left"
        >
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || user.email}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.name || '', user.email)
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {user.name || user.email}
              </p>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getRoleBadgeColor(
                  user.role
                )}`}
              >
                {formatRole(user.role)}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            {enrollmentData && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {enrollmentData.enrollments.length} curso
                {enrollmentData.enrollments.length !== 1 ? 's' : ''} inscrito
                {enrollmentData.enrollments.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Expand Icon */}
          <div className="text-gray-400">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          {user.role === 'STUDENT' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignCourse();
              }}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors flex items-center gap-1"
              title="Asignar curso"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Asignar</span>
            </button>
          )}

          {onChangeRole && user.role !== 'ADMIN' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChangeRole();
              }}
              className="px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
              title="Cambiar rol"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUser();
            }}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            title="Eliminar usuario"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : enrollmentData && enrollmentData.enrollments.length > 0 ? (
            <div className="space-y-3">
              {enrollmentData.enrollments.map((enrollment) => (
                <UserProgressCard
                  key={enrollment.id}
                  enrollment={enrollment}
                  onRemove={() => onRemoveEnrollment(enrollment.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-gray-500 dark:text-gray-400">
              Sin cursos asignados
            </p>
          )}
        </div>
      )}
    </div>
  );
};
