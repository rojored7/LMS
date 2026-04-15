import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';
import instructorService, { GradebookEntry } from '../services/api/instructor.service';

const InstructorGradebook: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [entries, setEntries] = useState<GradebookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUiStore();

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await instructorService.getGradebook(courseId);
        if (!cancelled) setEntries(data);
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Error al cargar calificaciones' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [courseId, addToast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A6FF]" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/instructor" className="text-white/50 hover:text-white transition-colors">
          &larr; Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-white">Calificaciones</h1>
      </div>

      <div className="bg-[#0F2035] rounded-xl border border-white/10 overflow-hidden">
        {entries.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No hay estudiantes con calificaciones en este curso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Progreso</th>
                  <th className="px-4 py-3 font-medium">Promedio Quizzes</th>
                  <th className="px-4 py-3 font-medium">Modulos Completados</th>
                  <th className="px-4 py-3 font-medium">Fecha Completado</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.userId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">{entry.name}</p>
                        <p className="text-white/50 text-sm">{entry.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A6FF] rounded-full"
                            style={{ width: `${entry.progress}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">{Math.round(entry.progress)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {entry.quizAvgScore !== null ? `${entry.quizAvgScore}%` : '-'}
                    </td>
                    <td className="px-4 py-3 text-white/70">{entry.modulesCompleted}</td>
                    <td className="px-4 py-3 text-white/70">
                      {entry.completedAt
                        ? new Date(entry.completedAt).toLocaleDateString('es')
                        : 'En progreso'}
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

export default InstructorGradebook;
