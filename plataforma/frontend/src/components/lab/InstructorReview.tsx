import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { useGradeSubmission } from '../../hooks/useLabs';
import type { LabSubmissionSummary } from '../../types/lab';

interface InstructorReviewProps {
  submissions: LabSubmissionSummary[];
  onGraded?: () => void;
}

interface GradeFormState {
  submissionId: string;
  passed: boolean;
  feedback: string;
  score: string;
}

export const InstructorReview: React.FC<InstructorReviewProps> = ({ submissions, onGraded }) => {
  const [active, setActive] = useState<GradeFormState | null>(null);
  const gradeSubmission = useGradeSubmission();

  const pending = submissions.filter((s) => s.passed === null);
  const graded = submissions.filter((s) => s.passed !== null);

  const openGradeForm = (sub: LabSubmissionSummary, passed: boolean) => {
    setActive({ submissionId: sub.id, passed, feedback: '', score: '' });
  };

  const handleGrade = async () => {
    if (!active) return;
    await gradeSubmission.mutateAsync({
      submissionId: active.submissionId,
      payload: {
        passed: active.passed,
        feedback: active.feedback || undefined,
        score: active.score ? parseInt(active.score, 10) : undefined,
      },
    });
    setActive(null);
    onGraded?.();
  };

  if (submissions.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No hay entregas todavia</div>;
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Pendientes de revision ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((sub) => (
              <div key={sub.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString('es-ES') : ''}
                    </p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {sub.responseText || <span className="italic text-gray-400">Sin texto</span>}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => openGradeForm(sub, true)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      <CheckCircleIcon className="h-4 w-4" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => openGradeForm(sub, false)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                    >
                      <XCircleIcon className="h-4 w-4" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Grade modal */}
      {active && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {active.passed ? 'Aprobar entrega' : 'Rechazar entrega'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback (opcional)
              </label>
              <textarea
                value={active.feedback}
                onChange={(e) => setActive({ ...active, feedback: e.target.value })}
                rows={3}
                placeholder="Escribe un comentario para el estudiante..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntaje (opcional)
              </label>
              <input
                type="number"
                value={active.score}
                onChange={(e) => setActive({ ...active, score: e.target.value })}
                min={0}
                max={100}
                placeholder="0-100"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleGrade}
                disabled={gradeSubmission.isPending}
                className={`flex-1 py-2 px-4 rounded text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                  active.passed ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {gradeSubmission.isPending ? 'Guardando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => setActive(null)}
                className="flex-1 py-2 px-4 rounded border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {graded.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Ya calificados ({graded.length})
          </h3>
          <div className="space-y-2">
            {graded.map((sub) => (
              <div
                key={sub.id}
                className={`border rounded-lg p-3 text-xs ${
                  sub.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-medium ${sub.passed ? 'text-green-700' : 'text-red-700'}`}>
                    {sub.passed ? 'Aprobado' : 'No aprobado'}
                    {sub.score != null && ` — ${sub.score} pts`}
                  </span>
                  <span className="text-gray-400">
                    {sub.gradedAt ? new Date(sub.gradedAt).toLocaleDateString('es-ES') : ''}
                  </span>
                </div>
                {sub.feedback && <p className="text-gray-600 italic">{sub.feedback}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
