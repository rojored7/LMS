/**
 * Enrollment Chart Component
 * Displays enrollment trends over time using Recharts
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface EnrollmentChartProps {
  data?: Array<{
    date: string;
    enrollments: number;
    completions: number;
  }>;
  isLoading?: boolean;
}

// Sample data for demonstration
const sampleData = [
  { date: 'Ene', enrollments: 12, completions: 3 },
  { date: 'Feb', enrollments: 19, completions: 7 },
  { date: 'Mar', enrollments: 25, completions: 12 },
  { date: 'Abr', enrollments: 31, completions: 18 },
  { date: 'May', enrollments: 38, completions: 24 },
  { date: 'Jun', enrollments: 45, completions: 32 },
];

export const EnrollmentChart: React.FC<EnrollmentChartProps> = ({ data = sampleData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Tendencia de Inscripciones
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="date"
            className="text-xs text-gray-600 dark:text-gray-400"
          />
          <YAxis className="text-xs text-gray-600 dark:text-gray-400" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(31 41 55)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white'
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="enrollments"
            name="Inscripciones"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorEnrollments)"
          />
          <Area
            type="monotone"
            dataKey="completions"
            name="Completadas"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorCompletions)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
