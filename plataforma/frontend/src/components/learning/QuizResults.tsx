/**
 * QuizResults Component
 * Displays quiz results with detailed feedback
 */

import { QuizResult } from '../../services/api/quiz.service';
import { CheckCircleIcon, XCircleIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface QuizResultsProps {
  result: QuizResult;
  onRetry?: () => void;
  onContinue?: () => void;
  canRetry?: boolean;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  onRetry,
  onContinue,
  canRetry = true,
}) => {
  const passedCount = result.results.filter((r) => r.isCorrect).length;
  const totalQuestions = result.results.length;
  const percentageCorrect = Math.round((passedCount / totalQuestions) * 100);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Results Header */}
      <div
        className={`px-6 py-8 text-center ${
          result.passed ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'
        }`}
      >
        <div className="flex justify-center mb-4">
          {result.passed ? (
            <TrophyIcon className="h-20 w-20 text-yellow-300" />
          ) : (
            <XCircleIcon className="h-20 w-20 text-white" />
          )}
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          {result.passed ? '¡Felicitaciones!' : 'No alcanzaste la nota mínima'}
        </h2>
        <p className="text-white text-lg">
          {result.passed
            ? 'Has aprobado este quiz exitosamente'
            : 'Sigue intentando, puedes hacerlo mejor'}
        </p>
      </div>

      {/* Score Summary */}
      <div className="px-6 py-6 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Tu puntuación</p>
            <p className={`text-3xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
              {result.score}%
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Puntuación mínima</p>
            <p className="text-3xl font-bold text-gray-900">{result.passingScore}%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-1">Preguntas correctas</p>
            <p className="text-3xl font-bold text-blue-600">
              {passedCount}/{totalQuestions}
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="px-6 py-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de respuestas</h3>
        <div className="space-y-3">
          {result.results.map((questionResult, index) => (
            <div
              key={questionResult.questionId}
              className={`p-4 rounded-lg border-2 ${
                questionResult.isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {questionResult.isCorrect ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Pregunta {index + 1} - {questionResult.isCorrect ? 'Correcta' : 'Incorrecta'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Puntos: {questionResult.points}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
        {canRetry && !result.passed ? (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        ) : (
          <div></div>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Continuar
        </button>
      </div>
    </div>
  );
};
