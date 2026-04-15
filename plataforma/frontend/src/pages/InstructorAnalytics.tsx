import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';
import instructorService, {
  InstructorAnalytics as AnalyticsData,
} from '../services/api/instructor.service';

const InstructorAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUiStore();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await instructorService.getInstructorAnalytics();
        if (!cancelled) setAnalytics(data);
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Error al cargar analytics' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A6FF]" />
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/instructor" className="text-white/50 hover:text-white transition-colors">
          &larr; Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0F2035] rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Total Inscripciones</p>
          <p className="text-2xl font-bold text-white mt-1">{analytics.totalEnrollments}</p>
        </div>
        <div className="bg-[#0F2035] rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Cursos Completados</p>
          <p className="text-2xl font-bold text-white mt-1">{analytics.completedEnrollments}</p>
        </div>
        <div className="bg-[#0F2035] rounded-xl border border-white/10 p-4">
          <p className="text-white/50 text-sm">Tasa de Completado</p>
          <p className="text-2xl font-bold text-white mt-1">{analytics.completionRate}%</p>
        </div>
      </div>

      {/* Per-Course Stats */}
      <div className="bg-[#0F2035] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Estadisticas por Curso</h2>
        </div>
        {analytics.courseStats.length === 0 ? (
          <div className="p-8 text-center text-white/50">No hay datos disponibles.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Curso</th>
                  <th className="px-4 py-3 font-medium">Inscripciones</th>
                  <th className="px-4 py-3 font-medium">Progreso Promedio</th>
                </tr>
              </thead>
              <tbody>
                {analytics.courseStats.map((cs) => (
                  <tr key={cs.courseId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-white font-medium">{cs.title}</td>
                    <td className="px-4 py-3 text-white/70">{cs.enrollments}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A6FF] rounded-full"
                            style={{ width: `${cs.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{cs.avgProgress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorAnalytics;
