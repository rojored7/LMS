import React from 'react';
import { useUserCourseLessonTimes } from '../../hooks/useAnalytics';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { cn } from '../../utils/cn';

interface LessonTimeBreakdownProps {
  userId: string;
  courseId: string;
}

function formatSeconds(s: number): string {
  if (s <= 0) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

const classificationConfig = {
  skimming: { label: 'Rapido', className: 'bg-yellow-100 text-yellow-800' },
  on_track: { label: 'Normal', className: 'bg-green-100 text-green-800' },
  deep_read: { label: 'Detallado', className: 'bg-blue-100 text-blue-800' },
};

export const LessonTimeBreakdown: React.FC<LessonTimeBreakdownProps> = ({ userId, courseId }) => {
  const { data: lessons = [], isLoading } = useUserCourseLessonTimes(userId, courseId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-3 text-center">
        No hay lecciones completadas en este curso.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200">
            <th className="pb-2 pr-4">Leccion</th>
            <th className="pb-2 pr-4 text-right">Tiempo real</th>
            <th className="pb-2 pr-4 text-right">Tiempo estimado</th>
            <th className="pb-2 pr-4 text-center">Ratio</th>
            <th className="pb-2">Patron</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lessons.map((lesson) => {
            const config = classificationConfig[lesson.classification] ?? classificationConfig.on_track;
            const ratioPercent = Math.round(lesson.ratio * 100);
            const barWidth = Math.min(ratioPercent, 200);
            return (
              <tr key={lesson.lessonId} className="hover:bg-gray-50">
                <td className="py-2 pr-4 max-w-xs">
                  <span className="truncate block" title={lesson.lessonTitle}>
                    {lesson.lessonTitle}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right font-mono">
                  {formatSeconds(lesson.realTimeSeconds)}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-gray-500">
                  {lesson.estimatedTimeSeconds > 0 ? formatSeconds(lesson.estimatedTimeSeconds) : '-'}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          lesson.classification === 'deep_read' ? 'bg-blue-400' :
                          lesson.classification === 'skimming' ? 'bg-yellow-400' : 'bg-green-400'
                        )}
                        style={{ width: `${Math.min(barWidth / 2, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 w-10 text-right">{ratioPercent}%</span>
                  </div>
                </td>
                <td className="py-2">
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', config.className)}>
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
