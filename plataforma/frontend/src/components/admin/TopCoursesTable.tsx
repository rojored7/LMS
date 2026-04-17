import { useNavigate } from 'react-router-dom';
import type { CourseStat } from '../../services/api/dashboard-analytics.service';

interface TopCoursesTableProps {
  data: CourseStat[];
  isLoading: boolean;
}

export default function TopCoursesTable({ data, isLoading }: TopCoursesTableProps) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6 animate-pulse">
        <div className="h-5 bg-white/10 rounded w-32 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.enrollmentCount - a.enrollmentCount).slice(0, 10);

  return (
    <div className="bg-[#0F2035] rounded-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Top Cursos</h3>
      {sorted.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/40">
          No hay cursos disponibles
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-white/40 text-xs uppercase border-b border-white/10">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Curso</th>
                <th className="pb-3 font-medium text-right">Inscritos</th>
                <th className="pb-3 font-medium">Progreso</th>
                <th className="pb-3 font-medium text-right">Completado</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((course, i) => (
                <tr
                  key={course.courseId}
                  onClick={() => navigate(`/admin/courses/${course.courseId}/edit`)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="py-3 text-white/40 text-sm">{i + 1}</td>
                  <td className="py-3 text-white font-medium text-sm max-w-[200px] truncate">
                    {course.courseTitle}
                  </td>
                  <td className="py-3 text-white/70 text-sm text-right">{course.enrollmentCount}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#00A6FF] rounded-full"
                          style={{ width: `${course.averageProgress}%` }}
                        />
                      </div>
                      <span className="text-white/50 text-xs">{course.averageProgress}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-white/70 text-sm text-right">{course.completionRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
