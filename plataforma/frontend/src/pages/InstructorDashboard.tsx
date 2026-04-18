import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';
import instructorService, {
  InstructorDashboardStats,
  InstructorCourse,
} from '../services/api/instructor.service';

const InstructorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InstructorDashboardStats | null>(null);
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUiStore();

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [dashStats, dashCourses] = await Promise.all([
          instructorService.getInstructorDashboard(),
          instructorService.getInstructorCourses(),
        ]);
        if (!cancelled) {
          setStats(dashStats);
          setCourses(dashCourses);
        }
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Error al cargar datos del instructor' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A6FF]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Panel del Instructor</h1>
        <div className="flex items-center gap-3">
          <Link
            to="/instructor/analytics"
            className="px-4 py-2 bg-[#166EB6] text-white rounded-lg hover:bg-[#166EB6]/90 transition-colors font-medium"
          >
            Analytics
          </Link>
          <Link
            to="/admin/courses/create"
            className="px-4 py-2 bg-[#FF5100] text-white rounded-lg hover:bg-[#FF5100]/90 transition-colors font-medium"
          >
            Crear Curso
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mis Cursos" value={stats?.totalCourses ?? 0} onClick={() => navigate('/admin/courses')} />
        <StatCard label="Total Estudiantes" value={stats?.totalStudents ?? 0} onClick={() => document.getElementById('courses-table')?.scrollIntoView({behavior: 'smooth'})} />
        <StatCard label="Progreso Promedio" value={`${stats?.avgProgress ?? 0}%`} onClick={() => navigate('/instructor/analytics')} />
        <StatCard label="Submissions Pendientes" value={stats?.pendingSubmissions ?? 0} onClick={() => navigate('/admin/courses')} />
      </div>

      {/* Courses Table */}
      <div id="courses-table" className="bg-[#0F2035] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Mis Cursos</h2>
        </div>
        {courses.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No tienes cursos creados. Crea tu primer curso para comenzar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Curso</th>
                  <th className="px-4 py-3 font-medium">Inscritos</th>
                  <th className="px-4 py-3 font-medium">Progreso</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} onClick={() => navigate(`/instructor/courses/${course.id}/students`)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{course.title}</td>
                    <td className="px-4 py-3 text-white/70">{course.enrollmentCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A6FF] rounded-full"
                            style={{ width: `${course.avgProgress}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{course.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          course.isPublished
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        {course.isPublished ? 'Publicado' : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/instructor/courses/${course.id}/students`}
                          className="text-[#00A6FF] hover:underline text-sm"
                        >
                          Estudiantes
                        </Link>
                        <Link
                          to={`/instructor/courses/${course.id}/gradebook`}
                          className="text-[#00A6FF] hover:underline text-sm"
                        >
                          Notas
                        </Link>
                        <Link
                          to={`/admin/courses/${course.id}/edit`}
                          className="text-white/50 hover:text-white text-sm"
                        >
                          Editar
                        </Link>
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

function StatCard({ label, value, onClick }: { label: string; value: string | number; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#0F2035] rounded-xl border border-white/10 p-4 ${onClick ? 'cursor-pointer hover:scale-[1.03] hover:border-[#00A6FF]/30 hover:shadow-lg transition-all' : ''}`}
    >
      <p className="text-white/50 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}

export default InstructorDashboard;
