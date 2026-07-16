import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useTimeTracking, useLessonTimeStats } from '../../hooks/useAnalytics';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { LessonTimeBreakdown } from './LessonTimeBreakdown';
import { cn } from '../../utils/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatSeconds(s: number): string {
  if (s <= 0) return '0s';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

type SortKey = 'userName' | 'totalTimeSeconds' | 'lessonsCompleted';

interface ExpandedState {
  userId: string;
  courseId: string;
}

export const TimeTrackingTable: React.FC = () => {
  const { usersTime, isLoading } = useTimeTracking();
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('totalTimeSeconds');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedCourseForChart, setSelectedCourseForChart] = useState<string | null>(null);

  const { data: lessonStats = [] } = useLessonTimeStats(selectedCourseForChart ?? undefined);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortValue = (user: (typeof usersTime)[0], key: SortKey): string | number => {
    if (key === 'lessonsCompleted')
      return user.courseBreakdown.reduce((s, c) => s + c.lessonsCompleted, 0);
    return user[key];
  };

  const sorted = [...usersTime].sort((a, b) => {
    const av = getSortValue(a, sortKey);
    const bv = getSortValue(b, sortKey);
    if (av < bv) return sortDir === 'asc' ? -1 : 1;
    if (av > bv) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-blue-500">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const chartData = lessonStats.map((l) => ({
    name: l.lessonTitle.length > 18 ? l.lessonTitle.slice(0, 18) + '…' : l.lessonTitle,
    real: Math.round(l.avgRealTimeSeconds / 60),
    estimado: Math.round(l.estimatedTimeSeconds / 60),
  }));

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        Los tiempos se registran a partir del deploy de esta funcionalidad. Datos anteriores pueden
        mostrar 0s.
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {sorted.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            Sin datos de tiempo registrados aun.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort('userName')}
                >
                  Usuario <SortIcon k="userName" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort('totalTimeSeconds')}
                >
                  Tiempo total <SortIcon k="totalTimeSeconds" />
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                  onClick={() => handleSort('lessonsCompleted')}
                >
                  Lecciones <SortIcon k="lessonsCompleted" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((user) => {
                const totalLessons = user.courseBreakdown.reduce(
                  (s, c) => s + c.lessonsCompleted,
                  0
                );
                const isOpen = expanded?.userId === user.userId;

                return (
                  <React.Fragment key={user.userId}>
                    <tr
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                      onClick={() => {
                        if (isOpen) {
                          setExpanded(null);
                        } else {
                          const firstCourse = user.courseBreakdown[0];
                          setExpanded({
                            userId: user.userId,
                            courseId: firstCourse?.courseId ?? '',
                          });
                          if (firstCourse) setSelectedCourseForChart(firstCourse.courseId);
                        }
                      }}
                    >
                      <td className="px-4 py-3 text-gray-400">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {user.userName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{user.userEmail}</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-gray-900 dark:text-white">
                        {formatSeconds(user.totalTimeSeconds)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                        {totalLessons}
                      </td>
                    </tr>

                    {isOpen && (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                          {/* Course tabs */}
                          {user.courseBreakdown.length > 1 && (
                            <div className="flex gap-2 mb-3 flex-wrap">
                              {user.courseBreakdown.map((c) => (
                                <button
                                  key={c.courseId}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded({ userId: user.userId, courseId: c.courseId });
                                    setSelectedCourseForChart(c.courseId);
                                  }}
                                  className={cn(
                                    'px-3 py-1 text-xs rounded-full border transition-colors',
                                    expanded?.courseId === c.courseId
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : 'border-gray-300 text-gray-600 hover:border-blue-400'
                                  )}
                                >
                                  {c.courseTitle.length > 30
                                    ? c.courseTitle.slice(0, 30) + '…'
                                    : c.courseTitle}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Course summary */}
                          {(() => {
                            const course = user.courseBreakdown.find(
                              (c) => c.courseId === expanded?.courseId
                            );
                            if (!course) return null;
                            return (
                              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500">Tiempo en curso</p>
                                  <p className="font-bold text-gray-900 dark:text-white mt-1">
                                    {formatSeconds(course.timeSeconds)}
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500">Lecciones completadas</p>
                                  <p className="font-bold text-gray-900 dark:text-white mt-1">
                                    {course.lessonsCompleted}
                                  </p>
                                </div>
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200">
                                  <p className="text-xs text-gray-500">Prom por leccion</p>
                                  <p className="font-bold text-gray-900 dark:text-white mt-1">
                                    {formatSeconds(course.avgTimePerLessonSeconds)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Lesson breakdown */}
                          <div onClick={(e) => e.stopPropagation()}>
                            <LessonTimeBreakdown
                              userId={user.userId}
                              courseId={expanded?.courseId ?? ''}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Course-level lesson chart */}
      {selectedCourseForChart && chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Tiempo promedio por leccion (minutos) — todos los usuarios
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" unit="m" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                formatter={
                  ((v: number, name: string) => [
                    `${v}m`,
                    name === 'real' ? 'Promedio real' : 'Estimado',
                  ]) as any
                }
              />
              <Bar dataKey="estimado" fill="#E5E7EB" name="Estimado" radius={[0, 3, 3, 0]} />
              <Bar dataKey="real" fill="#3B82F6" name="Promedio real" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
