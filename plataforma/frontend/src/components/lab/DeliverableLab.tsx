import { useState } from 'react';
import { PaperAirplaneIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { MarkdownRenderer } from '../learning/MarkdownRenderer';
import { useSubmitDeliverable, useLabSubmissions } from '../../hooks/useLabs';
import type { Lab } from '../../types/lab';

interface DeliverableLabProps {
  lab: Lab;
}

export const DeliverableLab: React.FC<DeliverableLabProps> = ({ lab }) => {
  const [responseText, setResponseText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitDeliverable = useSubmitDeliverable();
  const { data: submissions } = useLabSubmissions(lab.id);

  const lastSubmission = submissions?.[0] ?? null;
  const isPending = lastSubmission && lastSubmission.passed === null;
  const isPassed = lastSubmission?.passed === true;
  const isFailed = lastSubmission?.passed === false;

  const handleSubmit = async () => {
    if (!responseText.trim()) return;
    await submitDeliverable.mutateAsync({ labId: lab.id, responseText });
    setSubmitted(true);
    setResponseText('');
  };

  return (
    <div className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">{lab.title}</h2>
        <p className="text-sm text-indigo-200 mt-0.5">Lab de entrega — revisado por instructor</p>
      </div>

      {/* Description */}
      {lab.description && (
        <div className="px-6 py-4 border-b border-gray-200 prose prose-sm max-w-none">
          <MarkdownRenderer content={lab.description} />
        </div>
      )}

      {/* Instructions */}
      {lab.responseInstructions && (
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h3 className="text-sm font-semibold text-indigo-900 mb-2">Instrucciones de entrega</h3>
          <div className="prose prose-sm max-w-none text-indigo-800">
            <MarkdownRenderer content={lab.responseInstructions} />
          </div>
        </div>
      )}

      {/* Status banner */}
      {isPassed && (
        <div className="px-6 py-3 bg-green-50 border-b border-green-200 flex items-center gap-2 text-green-800 text-sm">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <div>
            <span className="font-medium">Lab aprobado</span>
            {lastSubmission?.score != null && (
              <span className="ml-2 text-green-600">Puntaje: {lastSubmission.score}</span>
            )}
            {lastSubmission?.feedback && (
              <p className="mt-1 text-green-700">{lastSubmission.feedback}</p>
            )}
          </div>
        </div>
      )}

      {isFailed && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 text-sm text-red-800">
          <span className="font-medium">Entrega no aprobada.</span>
          {lastSubmission?.feedback && <p className="mt-1">{lastSubmission.feedback}</p>}
          <p className="mt-1 text-red-600">Puedes volver a entregar.</p>
        </div>
      )}

      {(submitted || isPending) && !isPassed && !isFailed && (
        <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-amber-800 text-sm">
          <ClockIcon className="h-5 w-5 flex-shrink-0" />
          <span>Entrega enviada. Pendiente de revision por el instructor.</span>
        </div>
      )}

      {/* Response area */}
      <div className="px-6 py-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tu respuesta</label>
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            rows={10}
            placeholder="Escribe tu respuesta aqui..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm resize-y"
          />
          <p className="mt-1 text-xs text-gray-500 text-right">{responseText.length} caracteres</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitDeliverable.isPending || !responseText.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {submitDeliverable.isPending ? (
            <>
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Enviando...
            </>
          ) : (
            <>
              <PaperAirplaneIcon className="h-5 w-5" />
              Enviar entrega
            </>
          )}
        </button>
      </div>

      {/* Previous submissions */}
      {submissions && submissions.length > 0 && (
        <div className="px-6 pb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Entregas anteriores</h3>
          <div className="space-y-2">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className={`text-xs rounded border p-3 ${
                  sub.passed === true
                    ? 'bg-green-50 border-green-200'
                    : sub.passed === false
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`font-medium ${
                      sub.passed === true
                        ? 'text-green-700'
                        : sub.passed === false
                          ? 'text-red-700'
                          : 'text-gray-600'
                    }`}
                  >
                    {sub.passed === true
                      ? 'Aprobado'
                      : sub.passed === false
                        ? 'No aprobado'
                        : 'Pendiente revision'}
                    {sub.score != null && ` — ${sub.score} pts`}
                  </span>
                  <span className="text-gray-400">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('es-ES') : ''}
                  </span>
                </div>
                {sub.responseText && (
                  <p className="text-gray-600 line-clamp-2">{sub.responseText}</p>
                )}
                {sub.feedback && (
                  <p className="mt-1 text-gray-700 italic">Feedback: {sub.feedback}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
