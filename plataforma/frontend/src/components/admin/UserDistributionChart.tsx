import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import type { UserDistribution } from '../../services/api/dashboard-analytics.service';

interface UserDistributionChartProps {
  data: UserDistribution[];
  isLoading: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#FF5100',
  INSTRUCTOR: '#00A6FF',
  STUDENT: '#166EB6',
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administradores',
  INSTRUCTOR: 'Instructores',
  STUDENT: 'Estudiantes',
};

export default function UserDistributionChart({ data, isLoading }: UserDistributionChartProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-40 mb-6" />
        <div className="h-64 bg-white/5 rounded" />
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const chartData = data.map((d) => ({
    name: ROLE_LABELS[d.role] || d.role,
    value: d.count,
    role: d.role,
  }));

  return (
    <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Distribucion por Rol</h3>
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-white/40">
          No hay datos de usuarios
        </div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                cursor="pointer"
                onClick={(entry) => {
                  if (entry?.role) navigate(`/admin/users?role=${entry.role}`);
                }}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.role} fill={ROLE_COLORS[entry.role] || '#666'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F2035',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Legend
                formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ marginBottom: '40px' }}>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{total}</p>
              <p className="text-white/40 text-xs">Total</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
