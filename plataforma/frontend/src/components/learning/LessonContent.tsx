/**
 * LessonContent Component
 * Displays lesson content with completion tracking, optional video embed, and attachments
 */

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MarkdownRenderer } from './MarkdownRenderer';
import VideoEmbed from '../common/VideoEmbed';
import { LessonDetail, getAttachments } from '../../services/api/lesson.service';
import { useCompleteLesson } from '../../hooks/useLessons';
import {
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  CodeBracketIcon,
  PaperClipIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

interface LessonContentProps {
  lesson: LessonDetail;
  courseId?: string;
}

export const LessonContent: React.FC<LessonContentProps> = ({ lesson, courseId }) => {
  const lessonStartRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);
  const isHiddenRef = useRef<boolean>(false);
  const [displayTime, setDisplayTime] = useState(0);
  const completeLesson = useCompleteLesson();

  const { data: attachments = [] } = useQuery({
    queryKey: ['attachments', lesson.id],
    queryFn: () => getAttachments(lesson.id),
    staleTime: 5 * 60 * 1000,
  });

  const isCompleted = lesson.userProgress?.completed || false;

  // Track time spent on lesson - uses refs to avoid stale closure bug
  useEffect(() => {
    lessonStartRef.current = Date.now();
    accumulatedRef.current = 0;
    isHiddenRef.current = false;
    setDisplayTime(0);

    const interval = setInterval(() => {
      if (!isHiddenRef.current) {
        const elapsed = Math.floor((Date.now() - lessonStartRef.current) / 1000);
        setDisplayTime(accumulatedRef.current + elapsed);
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHiddenRef.current = true;
        accumulatedRef.current += Math.floor((Date.now() - lessonStartRef.current) / 1000);
      } else {
        isHiddenRef.current = false;
        lessonStartRef.current = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lesson.id]);

  const handleComplete = () => {
    const finalTime = isHiddenRef.current
      ? accumulatedRef.current
      : accumulatedRef.current + Math.floor((Date.now() - lessonStartRef.current) / 1000);

    completeLesson.mutate({
      lessonId: lesson.id,
      courseId: courseId || lesson.module?.courseId || '',
      timeSpent: finalTime,
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
    <div className="bg-white" data-testid="lesson-content">
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

      {/* Video embed (si la leccion tiene video_url) */}
      {lesson.videoUrl && (
        <div className="px-6 pt-6">
          <VideoEmbed url={lesson.videoUrl} title={lesson.title} />
        </div>
      )}

      {/* Lesson Content */}
      <div className="px-6 py-8">
        <MarkdownRenderer content={lesson.content} />
      </div>

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-6 pb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3 text-gray-700 font-medium">
              <PaperClipIcon className="h-5 w-5" />
              <span>Materiales adjuntos ({attachments.length})</span>
            </div>
            <ul className="space-y-2">
              {attachments.map((att) => (
                <li
                  key={att.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <PaperClipIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-800 truncate">{att.originalFilename}</span>
                    {att.description && (
                      <span className="text-xs text-gray-500 truncate hidden sm:block">
                        — {att.description}
                      </span>
                    )}
                  </div>
                  <a
                    href={att.downloadUrl}
                    download={att.originalFilename}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1 text-blue-600 hover:text-blue-800 shrink-0"
                    title="Descargar"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Lesson Footer - Complete Button */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>Tiempo en esta lección: {formatTime(displayTime)}</span>
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
