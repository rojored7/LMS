/**
 * Recent Activity Component
 * Displays recent system activities and events
 */

import { Clock, UserPlus, BookOpen, CheckCircle, Award } from 'lucide-react';

interface Activity {
  id: string;
  type: 'enrollment' | 'completion' | 'registration' | 'certificate';
  user: string;
  description: string;
  timestamp: string;
}

interface RecentActivityProps {
  activities?: Activity[];
  isLoading?: boolean;
}

// Sample data
const sampleActivities: Activity[] = [
  {
    id: '1',
    type: 'enrollment',
    user: 'Juan Pérez',
    description: 'se inscribió en Fundamentos de Ciberseguridad',
    timestamp: 'Hace 5 minutos',
  },
  {
    id: '2',
    type: 'completion',
    user: 'María García',
    description: 'completó el módulo de Criptografía',
    timestamp: 'Hace 15 minutos',
  },
  {
    id: '3',
    type: 'registration',
    user: 'Carlos López',
    description: 'se registró en la plataforma',
    timestamp: 'Hace 1 hora',
  },
  {
    id: '4',
    type: 'certificate',
    user: 'Ana Martínez',
    description: 'obtuvo su certificado de Seguridad en Redes',
    timestamp: 'Hace 2 horas',
  },
  {
    id: '5',
    type: 'enrollment',
    user: 'Pedro Rodríguez',
    description: 'se inscribió en Ethical Hacking',
    timestamp: 'Hace 3 horas',
  },
];

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'enrollment':
      return BookOpen;
    case 'completion':
      return CheckCircle;
    case 'registration':
      return UserPlus;
    case 'certificate':
      return Award;
    default:
      return Clock;
  }
};

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'enrollment':
      return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
    case 'completion':
      return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400';
    case 'registration':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
    case 'certificate':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
};

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities = sampleActivities,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Actividad Reciente
        </h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">
            No hay actividad reciente
          </p>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.user}</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.description}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
