/**
 * Analytics Dashboard Page
 * HU-038: Comprehensive analytics with charts and metrics
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Award,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAnalytics } from '../hooks/useAnalytics';
import { exportEnrollments, exportCourseStats } from '../services/api/export.service';
import { cn } from '../utils/cn';
import { TimeTrackingTable } from '../components/admin/TimeTrackingTable';

import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'time'>('overview');

  const {
    stats,
    enrollmentTrends,
    courseStats,
    userActivity,
    userDistribution,
    recentActivity,
    comparativeStats,
    isLoading,
    refetch,
  } = useAnalytics(days);

  const metrics: MetricCard[] = [
    {
      title: t('analytics.totalUsers', 'Total usuarios'),
      value: stats?.total_users ?? '-',
      change: comparativeStats?.changes?.new_users_pct ?? 0,
      changeLabel: 'vs periodo anterior',
      icon: <Users className="w-5 h-5" />,
      color: 'blue',
    },
    {
      title: t('analytics.activeCourses', 'Cursos publicados'),
      value: stats?.total_courses ?? '-',
      change: 0,
      changeLabel: '',
      icon: <BookOpen className="w-5 h-5" />,
      color: 'green',
    },
    {
      title: t('analytics.completionRate', 'Tasa de completacion'),
      value: stats?.completion_rate != null ? `${stats.completion_rate.toFixed(1)}%` : '-',
      change: 0,
      changeLabel: '',
      icon: <Award className="w-5 h-5" />,
      color: 'yellow',
    },
    {
      title: t('analytics.totalEnrollments', 'Inscripciones'),
      value: stats?.total_enrollments ?? '-',
      change: comparativeStats?.changes?.enrollments_pct ?? 0,
      changeLabel: 'vs periodo anterior',
      icon: <Activity className="w-5 h-5" />,
      color: 'purple',
    },
  ];

  const userGrowthData = (Array.isArray(userActivity) ? userActivity : [])
    .filter((p) => p != null && p.date != null)
    .map((p) => ({
      date: (p.date as string).slice(0, 10),
      nuevos: p.new_users ?? 0,
      activos: p.active_users ?? 0,
    }));

  const coursePopularityData = (Array.isArray(courseStats) ? courseStats : [])
    .filter((c) => c != null)
    .slice(0, 5)
    .map((c) => {
      const t = c.title ?? '';
      return {
        name: t.length > 20 ? t.slice(0, 20) + '...' : t,
        inscritos: c.enrollments ?? 0,
        completados: c.completions ?? 0,
      };
    });

  const enrollmentChartData = (Array.isArray(enrollmentTrends) ? enrollmentTrends : [])
    .filter((p) => p != null && p.date != null)
    .map((p) => ({
      date: (p.date as string).slice(0, 10),
      inscripciones: p.count ?? 0,
    }));

  const distributionData = (Array.isArray(userDistribution) ? userDistribution : [])
    .filter((d) => d != null)
    .map((d, i) => ({
      name: d.role ?? '',
      value: d.count ?? 0,
      color: COLORS[i % COLORS.length],
    }));

  const handleExport = async (type: 'enrollments' | 'courses') => {
    setIsExporting(true);
    try {
      if (type === 'enrollments') {
        await exportEnrollments();
      } else {
        await exportCourseStats();
      }
    } finally {
      setIsExporting(false);
    }
  };

  const dateRangeOptions = [
    { label: 'Ultimos 7 dias', days: 7 },
    { label: 'Ultimos 30 dias', days: 30 },
    { label: 'Ultimos 90 dias', days: 90 },
    { label: 'Ultimo ano', days: 365 },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('analytics.title', 'Analytics Dashboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('analytics.subtitle', 'Track performance and insights across your platform')}
          </p>
        </div>

        {activeTab === 'overview' && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
            >
              {dateRangeOptions.map((option) => (
                <option key={option.days} value={option.days}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Refresh Button */}
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>

            {/* Export Dropdown */}
            <div className="relative group">
              <Button variant="primary" size="sm" disabled={isExporting}>
                <Download className="w-4 h-4 mr-2" />
                {t('common.export', 'Exportar')}
              </Button>
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 invisible group-hover:visible z-10">
                <button
                  onClick={() => handleExport('enrollments')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Inscripciones CSV
                </button>
                <button
                  onClick={() => handleExport('courses')}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Estadisticas cursos CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'time'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          )}
        >
          Tiempo por usuario
        </button>
      </div>

      {/* Time tracking tab */}
      {activeTab === 'time' && <TimeTrackingTable />}

      {/* Overview tab */}
      {activeTab === 'overview' && isLoading && (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      )}

      {activeTab === 'overview' && !isLoading && (<>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                  {metric.value}
                </p>
                <div className="flex items-center mt-2">
                  {metric.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                  )}
                  <span
                    className={cn(
                      'text-sm font-medium',
                      metric.change > 0 ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {Math.abs(metric.change)}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    {metric.changeLabel}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'p-3 rounded-lg',
                  `bg-${metric.color}-100 dark:bg-${metric.color}-900/30`
                )}
              >
                {metric.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.userGrowth', 'User Growth')}
            </h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="nuevos"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="activos"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Course Popularity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.coursePopularity', 'Course Popularity')}
            </h3>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={coursePopularityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#9CA3AF"
                width={130}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="inscritos" fill="#3B82F6" />
              <Bar dataKey="completados" fill="#10B981" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Weekly Engagement */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.weeklyEngagement', 'Weekly Engagement')}
            </h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={enrollmentChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="inscripciones" stroke="#3B82F6" strokeWidth={2} />
            </RechartsLineChart>
          </ResponsiveContainer>
        </Card>

        {/* Device Usage Pie Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('analytics.deviceUsage', 'Device Usage')}
            </h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('analytics.recentActivity', 'Actividad reciente')}
        </h3>
        <div className="space-y-3">
          {(recentActivity ?? []).length === 0 && (
            <p className="text-sm text-gray-500">Sin actividad reciente.</p>
          )}
          {(recentActivity ?? []).map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{item.user_name}</span>
                  {' — '}
                  {item.action}
                  {' — '}
                  {item.course_title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </>)}
    </div>
  );
};

export default AnalyticsDashboard;
