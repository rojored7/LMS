/**
 * ModuleOverview Component
 * Displays complete module information including description, progress, and content list
 */

import { Module } from '../../types/course';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface ModuleOverviewProps {
  module: Module;
  onContentClick: (contentId: string, type: 'lesson' | 'quiz' | 'lab') => void;
}

export const ModuleOverview = ({ module, onContentClick }: ModuleOverviewProps) => {
  // Calculate content statistics
  const totalLessons = module.lessons.length;
  const completedLessons = module.lessons.filter((l) => l.isCompleted).length;
  const totalQuizzes = module.quizzes.length;
  const passedQuizzes = module.quizzes.filter((q) => q.isPassed).length;
  const totalLabs = module.labs.length;
  const passedLabs = module.labs.filter((l) => l.isPassed).length;

  const totalItems = totalLessons + totalQuizzes + totalLabs;
  const completedItems = completedLessons + passedQuizzes + passedLabs;

  // Find next pending item
  const nextLesson = module.lessons.find((l) => !l.isCompleted);
  const nextQuiz = !nextLesson && totalQuizzes > 0 && module.quizzes.find((q) => !q.isPassed);
  const nextLab = !nextLesson && !nextQuiz && totalLabs > 0 && module.labs.find((l) => !l.isPassed);

  const handleContinue = () => {
    if (nextLesson) {
      onContentClick(nextLesson.id, 'lesson');
    } else if (nextQuiz) {
      onContentClick(nextQuiz.id, 'quiz');
    } else if (nextLab) {
      onContentClick(nextLab.id, 'lab');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Module Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {module.title}
        </h1>

        <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
          {module.description}
        </p>

        {/* Module Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <ClockIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duración estimada</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {module.duration} min
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <ChartBarIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Progreso</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {module.userProgress || 0}%
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <CheckCircleIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completado</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {completedItems}/{totalItems}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progreso del módulo</span>
            <span>{module.userProgress || 0}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${module.userProgress || 0}%` }}
            />
          </div>
        </div>

        {/* Continue Button */}
        {(nextLesson || nextQuiz || nextLab) && (
          <button
            onClick={handleContinue}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <span>
              {nextLesson && 'Continuar con la siguiente lección'}
              {nextQuiz && 'Tomar evaluación'}
              {nextLab && 'Comenzar laboratorio'}
            </span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        )}

        {completedItems === totalItems && totalItems > 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-lg font-semibold text-green-800 dark:text-green-200">
              ¡Módulo completado!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Has completado todo el contenido de este módulo
            </p>
          </div>
        )}
      </div>

      {/* Content Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Contenido del módulo
        </h2>

        <div className="space-y-6">
          {/* Lessons Section */}
          {totalLessons > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lecciones ({completedLessons}/{totalLessons})
                </h3>
              </div>
              <div className="space-y-2">
                {module.lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => onContentClick(lesson.id, 'lesson')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-sm font-semibold">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {lesson.estimatedTime} min
                      </span>
                    </div>
                    {lesson.isCompleted && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Section */}
          {totalQuizzes > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <ClipboardDocumentCheckIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Evaluaciones ({passedQuizzes}/{totalQuizzes})
                </h3>
              </div>
              <div className="space-y-2">
                {module.quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => onContentClick(quiz.id, 'quiz')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quiz.title}
                      </p>
                      {quiz.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {quiz.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Puntuación mínima: {quiz.passingScore}%</span>
                        {quiz.timeLimit && <span>Tiempo: {quiz.timeLimit} min</span>}
                        <span>Intentos: {quiz.attempts}</span>
                      </div>
                    </div>
                    {quiz.isPassed && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Labs Section */}
          {totalLabs > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <BeakerIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Laboratorios ({passedLabs}/{totalLabs})
                </h3>
              </div>
              <div className="space-y-2">
                {module.labs.map((lab) => (
                  <button
                    key={lab.id}
                    onClick={() => onContentClick(lab.id, 'lab')}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {lab.title}
                      </p>
                      {lab.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {lab.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {lab.language}
                        </span>
                      </div>
                    </div>
                    {lab.isPassed && (
                      <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
