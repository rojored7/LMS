import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { CourseStat } from '../../services/api/dashboard-analytics.service';

interface CourseCompletionChartProps {
  data: CourseStat[];
  isLoading: boolean;
}

function getBarColor(rate: number): string {
  if (rate >= 80) return '#10B981';
  if (rate >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function CourseCompletionChart({ data, isLoading }: CourseCompletionChartProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-48 mb-6" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  const chartData = data.slice(0, 8).map((c) => ({
    name: c.courseTitle.length > 25 ? c.courseTitle.slice(0, 25) + '...' : c.courseTitle,
    completionRate: c.completionRate,
    fullName: c.courseTitle,
  }));

  return (
    <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tasa de Completado por Curso</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/40">
          No hay datos de cursos
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number"
              domain={[0, 100]}
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
              width={150}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F2035',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [`${value}%`, 'Completado']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="completionRate" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.completionRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
