/**
 * QuizAttemptsHistory Component
 *
 * Displays history of quiz attempts with expandable details
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export interface QuizAttempt {
  id: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  answers: QuizAnswer[];
  submittedAt: string;
}

export interface QuizAnswer {
  questionId: string;
  questionText: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface QuizAttemptsHistoryProps {
  attempts: QuizAttempt[];
  className?: string;
}

export const QuizAttemptsHistory: React.FC<QuizAttemptsHistoryProps> = ({
  attempts,
  className = '',
}) => {
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  if (attempts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          No hay intentos previos para este quiz.
        </p>
      </div>
    );
  }

  const toggleExpand = (attemptId: string) => {
    setExpandedAttemptId(expandedAttemptId === attemptId ? null : attemptId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Historial de Intentos ({attempts.length})
      </h3>

      {attempts.map((attempt, index) => {
        const isExpanded = expandedAttemptId === attempt.id;
        const attemptNumber = attempts.length - index;

        return (
          <div
            key={attempt.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800"
          >
            {/* Attempt Summary */}
            <button
              onClick={() => toggleExpand(attempt.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Status Icon */}
                {attempt.passed ? (
                  <CheckCircleIcon className="w-8 h-8 text-green-600 dark:text-green-500 flex-shrink-0" />
                ) : (
                  <XCircleIcon className="w-8 h-8 text-red-600 dark:text-red-500 flex-shrink-0" />
                )}

                {/* Attempt Info */}
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      Intento #{attemptNumber}
                    </span>
                    <span
                      className={`
                        px-2 py-0.5 rounded-full text-xs font-medium
                        ${
                          attempt.passed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }
                      `}
                    >
                      {attempt.passed ? 'Aprobado' : 'Reprobado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Puntuación: {attempt.score}/{attempt.maxScore} ({attempt.percentage.toFixed(1)}%)
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDistanceToNow(new Date(attempt.submittedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expand Icon */}
              {isExpanded ? (
                <ChevronUpIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {/* Attempt Details (Expandable) */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Respuestas Detalladas
                </h4>

                <div className="space-y-3">
                  {attempt.answers.map((answer, answerIndex) => (
                    <div
                      key={answer.questionId}
                      className={`
                        p-3 rounded-lg border
                        ${
                          answer.isCorrect
                            ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                        }
                      `}
                    >
                      {/* Question */}
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {answerIndex + 1}.
                        </span>
                        <p className="text-sm text-gray-900 dark:text-white flex-1">
                          {answer.questionText}
                        </p>
                        {answer.isCorrect ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* Selected Answer */}
                      <div className="ml-6 space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Tu respuesta:</span>{' '}
                          <span
                            className={
                              answer.isCorrect
                                ? 'text-green-700 dark:text-green-400'
                                : 'text-red-700 dark:text-red-400'
                            }
                          >
                            {answer.selectedAnswer}
                          </span>
                        </p>

                        {/* Correct Answer (if wrong) */}
                        {!answer.isCorrect && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Respuesta correcta:</span>{' '}
                            <span className="text-green-700 dark:text-green-400">
                              {answer.correctAnswer}
                            </span>
                          </p>
                        )}

                        {/* Explanation */}
                        {answer.explanation && (
                          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                            <p className="text-xs text-blue-900 dark:text-blue-300">
                              💡 {answer.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
