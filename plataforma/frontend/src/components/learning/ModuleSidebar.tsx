/**
 * ModuleSidebar Component
 * Displays course modules with lessons in a collapsible sidebar
 */

import { useState } from 'react';
import { Module } from '../../services/api/module.service';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  BookOpenIcon,
  BeakerIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

interface ModuleProgressInfo {
  moduleId: string;
  progress: number;
  lessons?: { total: number; completed: number };
  quizzes?: { total: number; passed: number };
  labs?: { total: number; passed: number };
}

interface ModuleSidebarProps {
  modules: Module[];
  moduleProgress?: ModuleProgressInfo[];
  currentModuleId?: string;
  currentLessonId?: string;
  currentQuizId?: string;
  currentLabId?: string;
  onModuleClick: (moduleId: string) => void;
  onLessonClick: (lessonId: string) => void;
  onQuizClick: (quizId: string) => void;
  onLabClick: (labId: string) => void;
}

export const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  modules,
  moduleProgress,
  currentModuleId,
  currentLessonId,
  currentQuizId,
  currentLabId,
  onModuleClick,
  onLessonClick,
  onQuizClick,
  onLabClick,
}) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id)) // Start with all modules expanded
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  return (
    <div className="h-full overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido del Curso</h2>
        <div className="space-y-2">
          {modules.map((module) => {
            const isExpanded = expandedModules.has(module.id);
            const progressEntry = moduleProgress?.find((p) => p.moduleId === module.id);
            const progress = progressEntry?.progress ?? 0;

            return (
              <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Module Header */}
                <div
                  className={`flex items-center bg-gray-50 hover:bg-gray-100 transition-colors ${
                    currentModuleId === module.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="p-3 hover:bg-gray-200 transition-colors"
                    title={isExpanded ? 'Contraer' : 'Expandir'}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>

                  {/* Module Title - Clickable to View Details */}
                  <button
                    onClick={() => onModuleClick(module.id)}
                    className="flex-1 min-w-0 text-left py-3 pr-4 hover:text-blue-600 transition-colors"
                    title="Ver información del módulo"
                  >
                    <p
                      className={`text-sm font-medium truncate ${
                        currentModuleId === module.id ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      {module.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">{progress}%</span>
                    </div>
                    {progressEntry &&
                    (progressEntry.quizzes?.total || progressEntry.labs?.total) ? (
                      <div className="flex items-center space-x-3 mt-1 text-xs text-gray-400">
                        {progressEntry.lessons && progressEntry.lessons.total > 0 && (
                          <span>
                            {progressEntry.lessons.completed}/{progressEntry.lessons.total}{' '}
                            lecciones
                          </span>
                        )}
                        {progressEntry.quizzes && progressEntry.quizzes.total > 0 && (
                          <span>
                            {progressEntry.quizzes.passed}/{progressEntry.quizzes.total} quizzes
                          </span>
                        )}
                        {progressEntry.labs && progressEntry.labs.total > 0 && (
                          <span>
                            {progressEntry.labs.passed}/{progressEntry.labs.total} labs
                          </span>
                        )}
                      </div>
                    ) : null}
                  </button>
                </div>

                {/* Module Content */}
                {isExpanded && (
                  <div className="bg-white">
                    {/* Lessons */}
                    {[...module.lessons]
                      .sort((a, b) => a.order - b.order)
                      .map((lesson) => {
                        const isActive = currentLessonId === lesson.id;
                        return (
                          <button
                            key={lesson.id}
                            onClick={() => onLessonClick(lesson.id)}
                            className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                              isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                            }`}
                          >
                            <BookOpenIcon
                              className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                            />
                            <span
                              className={`text-sm text-left flex-1 ${isActive ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                            >
                              {lesson.title}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-xs text-gray-400">
                                {lesson.estimatedTime} min
                              </span>
                              {lesson.isCompleted && (
                                <CheckCircleIcon
                                  className="h-4 w-4 text-green-500"
                                  title="Completado"
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}

                    {/* Quizzes */}
                    {module.quizzes.map((quiz) => {
                      const isActive = currentQuizId === quiz.id;
                      return (
                        <button
                          key={quiz.id}
                          onClick={() => onQuizClick(quiz.id)}
                          className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-purple-50 border-l-4 border-purple-600' : ''
                          }`}
                        >
                          <AcademicCapIcon
                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-400'}`}
                          />
                          <span
                            className={`text-sm text-left flex-1 ${isActive ? 'text-purple-600 font-medium' : 'text-gray-700'}`}
                          >
                            {quiz.title}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            {quiz.timeLimit && (
                              <span className="text-xs text-gray-400">{quiz.timeLimit} min</span>
                            )}
                            {quiz.isPassed && (
                              <CheckCircleIcon
                                className="h-4 w-4 text-green-500"
                                title="Aprobado"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* Labs */}
                    {module.labs.map((lab) => {
                      const isActive = currentLabId === lab.id;
                      return (
                        <button
                          key={lab.id}
                          onClick={() => onLabClick(lab.id)}
                          className={`w-full px-4 py-2 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                            isActive ? 'bg-green-50 border-l-4 border-green-600' : ''
                          }`}
                        >
                          <BeakerIcon
                            className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`}
                          />
                          <span
                            className={`text-sm text-left flex-1 ${isActive ? 'text-green-600 font-medium' : 'text-gray-700'}`}
                          >
                            {lab.title}
                          </span>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                              {lab.language}
                            </span>
                            {lab.isPassed && (
                              <CheckCircleIcon
                                className="h-4 w-4 text-green-500"
                                title="Aprobado"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
