import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EnrollmentTrend } from '../../services/api/dashboard-analytics.service';

interface EnrollmentTrendsChartProps {
  data: EnrollmentTrend[];
  isLoading: boolean;
}

export default function EnrollmentTrendsChart({ data, isLoading }: EnrollmentTrendsChartProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-48 mb-6" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Tendencia de Inscripciones</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/40">
          No hay datos de inscripciones
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A6FF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00A6FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getDate()}/${d.getMonth() + 1}`;
              }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.3)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F2035',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelFormatter={(v) => `Fecha: ${v}`}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#00A6FF"
              strokeWidth={2}
              fill="url(#enrollGradient)"
              name="Inscripciones"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
