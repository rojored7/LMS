/**
 * LessonContent Component
 * Displays lesson content with completion tracking
 */

import { useState, useEffect } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { LessonDetail } from '../../services/api/lesson.service';
import { useCompleteLesson } from '../../hooks/useLessons';
import { ClockIcon, CheckCircleIcon, PlayIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface LessonContentProps {
  lesson: LessonDetail;
  courseId?: string;
}

export const LessonContent: React.FC<LessonContentProps> = ({ lesson, courseId }) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const completeLesson = useCompleteLesson();

  const isCompleted = lesson.userProgress?.completed || false;

  // Track time spent on lesson
  useEffect(() => {
    setStartTime(Date.now());
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lesson.id]);

  const handleComplete = () => {
    completeLesson.mutate({
      lessonId: lesson.id,
      courseId: courseId || lesson.module?.courseId || '',
      timeSpent,
    });
  };

  // Get icon for lesson type
  const getLessonIcon = () => {
    switch (lesson.type) {
      case 'VIDEO':
        return <PlayIcon className="h-6 w-6" />;
      case 'CODE_LAB':
        return <CodeBracketIcon className="h-6 w-6" />;
      case 'INTERACTIVE':
        return <CheckCircleIcon className="h-6 w-6" />;
      default:
        return <CheckCircleIcon className="h-6 w-6" />;
    }
  };

  // Format time to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white">
      {/* Lesson Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">{getLessonIcon()}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
              {lesson.description && <p className="mt-1 text-gray-600">{lesson.description}</p>}
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{lesson.estimatedTime} minutos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="px-2 py-1 bg-gray-200 rounded text-xs font-medium">
                    {lesson.type}
                  </span>
                </div>
                {isCompleted && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <CheckCircleSolidIcon className="h-4 w-4" />
                    <span>Completado</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson Content */}
      <div className="px-6 py-8">
        <MarkdownRenderer content={lesson.content} />
      </div>

      {/* Lesson Footer - Complete Button */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>Tiempo en esta lección: {formatTime(timeSpent)}</span>
          </div>

          {!isCompleted ? (
            <button
              onClick={handleComplete}
              disabled={completeLesson.isPending}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {completeLesson.isPending ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  <span>Marcar como completado</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-6 py-2 bg-green-100 text-green-700 rounded-lg">
              <CheckCircleSolidIcon className="h-5 w-5" />
              <span className="font-medium">Lección completada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
