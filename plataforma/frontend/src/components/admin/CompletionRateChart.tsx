/**
 * Completion Rate Chart Component
 * Displays course completion rates using bar chart
 */

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface CompletionRateChartProps {
  data?: Array<{
    course: string;
    rate: number;
    enrolled: number;
    completed: number;
  }>;
  isLoading?: boolean;
}

// Sample data
const sampleData = [
  { course: 'Fundamentos', rate: 85, enrolled: 45, completed: 38 },
  { course: 'Redes', rate: 72, enrolled: 38, completed: 27 },
  { course: 'Criptografía', rate: 68, enrolled: 31, completed: 21 },
  { course: 'Pentesting', rate: 55, enrolled: 25, completed: 14 },
  { course: 'Forense', rate: 45, enrolled: 20, completed: 9 },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export const CompletionRateChart: React.FC<CompletionRateChartProps> = ({
  data = sampleData,
  isLoading
}) => {
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
        Tasa de Completación por Curso
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="horizontal">
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis type="number" domain={[0, 100]} unit="%" className="text-xs" />
          <YAxis dataKey="course" type="category" width={100} className="text-xs" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgb(31 41 55)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
            }}
            formatter={(value: number) => [`${value}%`, 'Completación']}
          />
          <Bar dataKey="rate" radius={[0, 8, 8, 0]}>
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">{'>'} 70%: Excelente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">{'<'} 60%: Requiere atención</span>
        </div>
      </div>
    </div>
  );
};
