/**
 * Export Service
 * API client for data export functionality (admin only)
 */

import api from '../api';

const downloadCsv = (csvText: string, filename: string): void => {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const exportEnrollments = async (courseId?: string): Promise<void> => {
  const params = courseId ? `?course_id=${courseId}` : '';
  const response = await api.get(`/export/enrollments${params}`, { responseType: 'text' });
  const filename = courseId ? `inscripciones_${courseId}.csv` : 'inscripciones_todos.csv';
  downloadCsv(response as unknown as string, filename);
};

export const exportProgress = async (courseId: string): Promise<void> => {
  const response = await api.get(`/export/progress/${courseId}`, { responseType: 'text' });
  downloadCsv(response as unknown as string, `progreso_${courseId}.csv`);
};

export const exportCourseStats = async (): Promise<void> => {
  const response = await api.get('/export/courses/stats', { responseType: 'text' });
  downloadCsv(response as unknown as string, 'estadisticas_cursos.csv');
};

export default {
  exportEnrollments,
  exportProgress,
  exportCourseStats,
};
