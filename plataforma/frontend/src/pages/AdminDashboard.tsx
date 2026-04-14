/**
 * Admin Dashboard page
 * Shows user management with enrollment tracking and course assignment
 */

import { useState, useEffect } from 'react';
import { Users, BookOpen, GraduationCap, TrendingUp, Plus, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import userService from '../services/user.service';
import adminService, {
  type UserWithEnrollments,
  type DashboardStats,
} from '../services/api/admin.service';
import UserEnrollmentList from '../components/learning/UserEnrollmentList';
import AssignCourseModal from '../components/learning/AssignCourseModal';
import type { User } from '../types';

export const AdminDashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();

  // State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithEnrollments, setUsersWithEnrollments] = useState<
    Map<string, UserWithEnrollments>
  >(new Map());
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    userId?: string;
    userName?: string;
    userEmail?: string;
  }>({ isOpen: false });

  // Loading states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadingEnrollments, setLoadingEnrollments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const envelope = await userService.getUsers({ page: 1, limit: 500 });
      // Axios interceptor unwraps to {success, data: [...users], meta: {...}}
      const usersData = (envelope as any).data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err: any) {
      toast.error('Error al cargar usuarios');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadUserEnrollments = async (userId: string) => {
    if (usersWithEnrollments.has(userId)) {
      return; // Already loaded
    }

    setLoadingEnrollments((prev) => new Set(prev).add(userId));
    try {
      const data = await adminService.getUserEnrollments(userId);
      setUsersWithEnrollments((prev) => new Map(prev).set(userId, data));
    } catch (err: any) {
      toast.error('Error al cargar inscripciones del usuario');
    } finally {
      setLoadingEnrollments((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleUserExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
      await loadUserEnrollments(userId);
    }
  };

  const handleAssignCourse = async (userId: string, courseId: string) => {
    try {
      await adminService.assignCourseToUser(userId, courseId);
      toast.success('Curso asignado exitosamente');

      // Reload enrollments for this user
      setUsersWithEnrollments((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      await loadUserEnrollments(userId);
      await loadStats();
    } catch (err: any) {
      if (err?.error?.message?.includes('ya inscrito')) {
        toast.info('El usuario ya está inscrito en este curso');
      } else {
        toast.error(err?.error?.message || 'Error al asignar curso');
      }
      throw err;
    }
  };

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    if (!confirm('¿Retirar este curso del usuario?')) return;

    try {
      await adminService.removeEnrollment(enrollmentId);
      toast.success('Curso retirado exitosamente');

      // Reload data
      if (expandedUserId) {
        setUsersWithEnrollments((prev) => {
          const next = new Map(prev);
          next.delete(expandedUserId);
          return next;
        });
        await loadUserEnrollments(expandedUserId);
      }
      await loadStats();
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al retirar curso');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return;

    try {
      await userService.deleteUser(userId);
      toast.success('Usuario eliminado correctamente');
      loadUsers();
      loadStats();
      setUsersWithEnrollments((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    } catch (err: any) {
      toast.error(err?.error?.message || 'Error al eliminar usuario');
    }
  };

  // Filter only students for enrollment management
  const students = users.filter((u) => u.role === 'STUDENT');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-gray-900 dark:text-white mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gestión de usuarios, cursos y progreso del sistema
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/courses')}
          className="flex items-center gap-2 px-4 py-2 bg-itac-orange text-white rounded-lg hover:bg-itac-orange-hover transition-colors"
        >
          <Settings className="w-5 h-5" />
          Gestionar Cursos
        </button>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-itac-navy-light rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-itac-card-blue rounded-lg">
                <Users className="w-6 h-6 text-itac-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.users.byRole.STUDENT} estudiantes
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-itac-navy-light rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-itac-card-orange rounded-lg">
                <BookOpen className="w-6 h-6 text-itac-orange" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.courses.published}
                </p>
                <p className="text-xs text-gray-500 mt-1">de {stats.courses.total} totales</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-itac-navy-light rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-itac-card-blue rounded-lg">
                <GraduationCap className="w-6 h-6 text-itac-blue" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Inscripciones</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.enrollments.total}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.enrollments.completed} completadas
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-itac-navy-light rounded-lg shadow p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-itac-card-orange rounded-lg">
                <TrendingUp className="w-6 h-6 text-itac-orange" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Progreso Promedio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.systemHealth.averageProgress}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.systemHealth.activeUsers} usuarios activos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Management */}
      <div className="bg-white dark:bg-itac-navy-light rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-white/10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Gestión de Estudiantes
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {students.length} estudiantes registrados
          </p>
        </div>

        <div className="p-6">
          {isLoadingUsers ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-itac-blue" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              No hay estudiantes registrados
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((user) => {
                const userEnrollments = usersWithEnrollments.get(user.id);
                const isExpanded = expandedUserId === user.id;
                const isLoading = loadingEnrollments.has(user.id);

                return (
                  <div
                    key={user.id}
                    className="border border-gray-200 dark:border-white/10 rounded-lg"
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => handleUserExpand(user.id)}
                          className="flex items-center gap-4 flex-1 text-left hover:opacity-80 transition-opacity"
                        >
                          <div className="w-10 h-10 rounded-full bg-itac-blue-mid flex items-center justify-center text-white font-semibold">
                            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {user.name || user.email}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            loadUserEnrollments(user.id).then(() => {
                              setModalState({
                                isOpen: true,
                                userId: user.id,
                                userName: user.name || user.email,
                                userEmail: user.email,
                              });
                            });
                          }}
                          className="px-3 py-1.5 text-sm font-medium text-itac-blue hover:bg-itac-card-blue rounded-md transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Asignar Curso
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {isExpanded && userEnrollments && (
                      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-itac-navy-dark/50">
                        {userEnrollments.enrollments.length === 0 ? (
                          <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                            Sin cursos asignados
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {userEnrollments.enrollments.map((enrollment) => (
                              <div
                                key={enrollment.id}
                                className="bg-white dark:bg-itac-navy-light rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {enrollment.course.title}
                                    </h4>
                                    <div className="mt-2">
                                      <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">
                                          Progreso
                                        </span>
                                        <span className="font-semibold">
                                          {enrollment.progress}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-gray-200 dark:bg-itac-navy-dark rounded-full h-2">
                                        <div
                                          className="bg-itac-blue h-2 rounded-full transition-all"
                                          style={{ width: `${enrollment.progress}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveEnrollment(enrollment.id)}
                                    className="ml-4 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                                  >
                                    Retirar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Course Modal */}
      <AssignCourseModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
        onAssign={(courseId) => handleAssignCourse(modalState.userId!, courseId)}
        userName={modalState.userName || ''}
        userEmail={modalState.userEmail || ''}
        enrolledCourseIds={
          modalState.userId
            ? (usersWithEnrollments.get(modalState.userId)?.enrollments || [])
                .map((e: any) => e.courseId || e.course?.id)
                .filter(Boolean)
            : []
        }
      />
    </div>
  );
};
