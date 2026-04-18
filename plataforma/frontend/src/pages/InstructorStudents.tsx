import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUiStore } from '../store/uiStore';
import instructorService, { CourseStudent } from '../services/api/instructor.service';

const InstructorStudents: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useUiStore();

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const data = await instructorService.getCourseStudents(courseId);
        if (!cancelled) setStudents(data);
      } catch {
        if (!cancelled) addToast({ type: 'error', message: 'Error al cargar estudiantes' });
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
        <h1 className="text-2xl font-bold text-white">Estudiantes del Curso</h1>
      </div>

      <div className="bg-[#0F2035] rounded-xl border border-white/10 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-8 text-center text-white/50">
            No hay estudiantes inscritos en este curso.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-white/50 text-sm border-b border-white/10">
                  <th className="px-4 py-3 font-medium">Estudiante</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Fecha inscripcion</th>
                  <th className="px-4 py-3 font-medium">Progreso</th>
                  <th className="px-4 py-3 font-medium">Ultima actividad</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <React.Fragment key={student.userId}>
                  <tr onClick={() => setExpandedStudent(expandedStudent === student.userId ? null : student.userId)} className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{student.name}</td>
                    <td className="px-4 py-3 text-white/70">{student.email}</td>
                    <td className="px-4 py-3 text-white/70">
                      {student.enrolledAt
                        ? new Date(student.enrolledAt).toLocaleDateString('es')
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#00A6FF] rounded-full"
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                        <span className="text-white/70 text-sm">
                          {Math.round(student.progress)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {student.lastLoginAt
                        ? new Date(student.lastLoginAt).toLocaleDateString('es')
                        : 'Sin actividad'}
                    </td>
                  </tr>
                  {expandedStudent === student.userId && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 bg-white/5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div><span className="text-white/40">Nombre:</span> <span className="text-white font-medium">{student.name}</span></div>
                          <div><span className="text-white/40">Email:</span> <span className="text-white/70">{student.email}</span></div>
                          <div><span className="text-white/40">Progreso:</span> <span className="text-[#00A6FF] font-medium">{Math.round(student.progress)}%</span></div>
                          <div><span className="text-white/40">Inscrito:</span> <span className="text-white/70">{student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString('es') : '-'}</span></div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorStudents;
