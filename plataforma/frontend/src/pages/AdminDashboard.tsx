/**
 * Admin Dashboard - Power BI style analytics dashboard
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, Upload, Settings } from 'lucide-react';
import { useUiStore } from '../store/uiStore';
import KpiCardsRow from '../components/admin/KpiCardsRow';
import EnrollmentTrendsChart from '../components/admin/EnrollmentTrendsChart';
import UserDistributionChart from '../components/admin/UserDistributionChart';
import CourseCompletionChart from '../components/admin/CourseCompletionChart';
import TopCoursesTable from '../components/admin/TopCoursesTable';
import RecentActivityFeed from '../components/admin/RecentActivityFeed';
import dashboardAnalytics, {
  type PlatformStats,
  type EnrollmentTrend,
  type CourseStat,
  type UserDistribution,
  type ComparativeStats,
  type RecentActivity,
} from '../services/api/dashboard-analytics.service';

export const AdminDashboard = () => {
  const { addToast } = useUiStore();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [trends, setTrends] = useState<EnrollmentTrend[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
  const [userDist, setUserDist] = useState<UserDistribution[]>([]);
  const [comparative, setComparative] = useState<ComparativeStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity[]>([]);

  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingDist, setLoadingDist] = useState(true);
  const [loadingComparative, setLoadingComparative] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    dashboardAnalytics.getPlatformStats()
      .then(setStats)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingStats(false));

    dashboardAnalytics.getEnrollmentTrends(30)
      .then(setTrends)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingTrends(false));

    dashboardAnalytics.getCourseStats()
      .then(setCourseStats)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingCourses(false));

    dashboardAnalytics.getUserDistribution()
      .then(setUserDist)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingDist(false));

    dashboardAnalytics.getComparativeStats()
      .then(setComparative)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingComparative(false));

    dashboardAnalytics.getRecentActivity(10)
      .then(setActivity)
      .catch(() => addToast({ type: 'error', message: 'Error al cargar datos del dashboard' }))
      .finally(() => setLoadingActivity(false));
  }, []);

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Panel de Administracion</h1>
          <p className="text-white/40 text-sm mt-1">Vista general de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            Usuarios
          </Link>
          <Link
            to="/admin/courses"
            className="flex items-center gap-2 px-4 py-2 bg-[#FF5100] text-white rounded-lg hover:bg-[#FF5100]/90 transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            Cursos
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCardsRow
        stats={stats}
        comparative={comparative}
        isLoading={loadingStats || loadingComparative}
      />

      {/* Charts Row 1: Enrollment Trends + User Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EnrollmentTrendsChart data={trends} isLoading={loadingTrends} />
        </div>
        <div>
          <UserDistributionChart data={userDist} isLoading={loadingDist} />
        </div>
      </div>

      {/* Charts Row 2: Course Completion + Top Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CourseCompletionChart data={courseStats} isLoading={loadingCourses} />
        <TopCoursesTable data={courseStats} isLoading={loadingCourses} />
      </div>

      {/* Row 3: Recent Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentActivityFeed data={activity} isLoading={loadingActivity} />
        </div>
        <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Acciones Rapidas</h3>
          <div className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="p-2 bg-[#00A6FF]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#00A6FF]" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Gestionar Usuarios</p>
                <p className="text-white/40 text-xs">Roles, permisos y perfiles</p>
              </div>
            </Link>
            <Link
              to="/admin/courses"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="p-2 bg-[#FF5100]/10 rounded-lg">
                <BookOpen className="w-5 h-5 text-[#FF5100]" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Gestionar Cursos</p>
                <p className="text-white/40 text-xs">Crear, editar y publicar</p>
              </div>
            </Link>
            <Link
              to="/admin/courses/import"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="p-2 bg-[#8B5CF6]/10 rounded-lg">
                <Upload className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Importar Curso</p>
                <p className="text-white/40 text-xs">Desde archivo ZIP</p>
              </div>
            </Link>
            <Link
              to="/admin/training-profiles"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div className="p-2 bg-[#10B981]/10 rounded-lg">
                <Settings className="w-5 h-5 text-[#10B981]" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Perfiles de Formacion</p>
                <p className="text-white/40 text-xs">Rutas de aprendizaje</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
