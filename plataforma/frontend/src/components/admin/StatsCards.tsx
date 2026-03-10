/**
 * Admin Stats Cards Component
 * Displays dashboard statistics in card format
 */

import { Users, BookOpen, GraduationCap, TrendingUp, Award, Activity } from 'lucide-react';
import type { DashboardStats } from '../../services/api/admin.service';

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Usuarios',
      value: stats.users.total,
      subtitle: `${stats.users.byRole.STUDENT} estudiantes`,
      icon: Users,
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Cursos',
      value: stats.courses.published,
      subtitle: `de ${stats.courses.total} totales`,
      icon: BookOpen,
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Inscripciones',
      value: stats.enrollments.total,
      subtitle: `${stats.enrollments.completed} completadas`,
      icon: GraduationCap,
      bgColor: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Progreso Promedio',
      value: `${stats.systemHealth.averageProgress}%`,
      subtitle: `${stats.systemHealth.activeUsers} usuarios activos`,
      icon: TrendingUp,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 ${card.bgColor} rounded-lg`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                {card.subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{card.subtitle}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
